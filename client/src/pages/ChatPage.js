import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  // --- ALL HOOKS AT TOP-LEVEL, UNCONDITIONAL ---
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false); // Track socket connection status

  const socketRef = useRef(null); // Initialize with null
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Retrieve userInfo consistently
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const userId = userInfo?._id; // Get userId for sender checks

  // Memoize config to prevent re-creation on every render if token doesn't change
  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // --- CRITICAL CORRECTION FOR SOCKET_SERVER_URL ---
  // Ensure this correctly points to your Render backend's root URL (e.g., https://your-backend.onrender.com)
  // It should NOT include '/api'
  const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '') // Remove /api to get base URL
    : 'http://localhost:5001'; // Fallback for local dev, ensure this matches server port

  // Log the URL to verify in console
  useEffect(() => {
    console.log("ChatPage: SOCKET_SERVER_URL set to:", SOCKET_SERVER_URL);
  }, [SOCKET_SERVER_URL]);


  // --- EFFECT 1: Handle Authentication/Authorization & Redirection ---
  useEffect(() => {
    if (!token || !userInfo || !userId) { // Also check for userId
      console.log("ChatPage: User not authenticated or user ID missing, redirecting to login.");
      navigate('/login');
    }
  }, [token, userInfo, userId, navigate]); // Add userId to dependencies


  // --- IMPORTANT: ONLY PROCEED WITH RENDERING THE MAIN CHAT UI IF AUTHENTICATED ---
  // If not authenticated, we simply render nothing (or a loading state)
  // because the useEffect above will redirect.
  if (!token || !userInfo || !userId) {
    return null; // Don't render anything if not authenticated, let the redirect happen
  }


  // --- EFFECT 2: Fetch all conversations ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        setError('');
        // Use the memoized config
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/conversations`, config());
        setConversations(data);
      } catch (error) {
        console.error("ChatPage: Error fetching conversations:", error.response?.data?.message || error.message);
        setError(error.response?.data?.message || "Failed to fetch conversations.");
        if (error.response?.status === 401) {
            navigate('/login'); // Redirect on 401 for conversations API as well
        }
      } finally {
        setLoadingConversations(false);
      }
    };
    // Only fetch if authenticated
    if (token) {
        fetchConversations();
    }
  }, [token, navigate, config]); // Add config to dependencies, navigate for potential redirect


  // --- EFFECT 3: Socket connection and message listener ---
  useEffect(() => {
    if (!token) return; // Ensure token exists before attempting socket connection
    if (!SOCKET_SERVER_URL) {
      console.error("ChatPage: SOCKET_SERVER_URL is empty, cannot connect Socket.IO.");
      setError("Chat connection URL not configured.");
      return;
    }

    console.log("ChatPage: Attempting Socket.IO connection to:", SOCKET_SERVER_URL);
    // Explicitly disconnect any existing socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'], // Explicitly use websockets first
      secure: true, // Force HTTPS/WSS if your server URL uses HTTPS
    });

    socketRef.current.on('connect', () => {
      console.log('ChatPage: Socket.IO Connected:', socketRef.current.id);
      setSocketConnected(true);
      // Join own user room immediately upon connect
      if (userId) {
          socketRef.current.emit('joinConversation', userId);
          console.log(`ChatPage: Joined user room ${userId} on connect.`);
      }

      // If a conversation is already selected, join its room
      if (selectedConversation) {
        socketRef.current.emit('joinConversation', selectedConversation._id);
        console.log(`ChatPage: Joined conversation room ${selectedConversation._id} on connect.`);
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('ChatPage: Socket.IO Connection Error:', err.message, err.data); // err.data might have more info
        setError('Failed to connect to chat server. Check network and backend logs.');
        setSocketConnected(false);
        // If connection fails due to auth, redirect to login
        if (err.message.includes('Authentication error')) {
            navigate('/login');
        }
    });

    socketRef.current.on('disconnect', (reason) => { // reason provides disconnect cause
      console.log('ChatPage: Socket.IO Disconnected. Reason:', reason);
      setSocketConnected(false);
      // Optionally handle specific disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Maybe try to reconnect or show a more specific message
      }
    });

    socketRef.current.on('receiveMessage', (message) => {
      console.log('ChatPage: Received message:', message);
      // Ensure message.conversation matches selectedConversation._id
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
      } else if (!selectedConversation) {
          // If no convo selected, log but don't add.
          console.log('ChatPage: Received message for unselected conversation.');
      } else if (message.conversation !== selectedConversation._id) {
          console.log(`ChatPage: Received message for different conversation (${message.conversation}) than selected (${selectedConversation._id}).`);
          // OPTIONAL: Trigger a notification for the other conversation
      }
    });

    // Clean up on component unmount or dependency change
    return () => {
      if (socketRef.current) {
        console.log('ChatPage: Disconnecting Socket.IO clean up.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // Dependencies: token for auth, SOCKET_SERVER_URL for connection target, userId for initial join.
    // selectedConversation should NOT be in this dependency array. Instead, handle joining conversation rooms
    // explicitly when selectedConversation changes or on socket reconnect.
  }, [token, SOCKET_SERVER_URL, userId, navigate]);


  // --- EFFECT 4: Scroll to bottom of messages ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // --- Helper function to select a conversation ---
  const selectConversation = async (convo) => {
    // Only update if it's a new conversation
    if (selectedConversation?._id !== convo._id) {
        setSelectedConversation(convo);
        setMessages([]); // Clear messages when selecting new conversation

        if (socketRef.current?.connected) {
            // Leave previous conversation room if any
            if (selectedConversation) {
                socketRef.current.emit('leaveConversation', selectedConversation._id); // Assuming you add this to backend
                console.log(`ChatPage: Leaving conversation room ${selectedConversation._id}`);
            }
            socketRef.current.emit('joinConversation', convo._id);
            console.log(`ChatPage: Joining conversation room ${convo._id}`);
        } else {
            console.warn('ChatPage: Socket not connected when trying to join conversation. This might be okay if it connects shortly.');
        }

        try {
            // Use the memoized config
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${convo._id}`, config());
            setMessages(data);
            setError('');
        } catch (error) {
            console.error("ChatPage: Error fetching messages for conversation:", error.response?.data?.message || error.message);
            setError(error.response?.data?.message || "Failed to fetch messages for this conversation.");
            setMessages([]);
            if (error.response?.status === 401) {
                navigate('/login'); // Redirect on 401 for messages API as well
            }
        }
    }
  };

  // --- Helper function to send a message ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    if (!socketRef.current?.connected) {
        console.error("ChatPage: Socket not connected. Message not sent.");
        setError("Chat server not connected. Message not sent.");
        return;
    }

    const receiver = selectedConversation.participants.find(p => p._id !== userId); // Use userId
    if (!receiver) {
        console.error("ChatPage: Receiver not found in conversation participants.");
        setError("Error: Could not find conversation receiver.");
        return;
    }

    const messageData = {
      conversationId: selectedConversation._id,
      sender: userId, // Use userId
      text: newMessage,
      // receiverId: receiver._id, // Not strictly needed for `sendMessage` emit to a room
      createdAt: new Date().toISOString(), // Add timestamp here
    };

    socketRef.current.emit('sendMessage', messageData);
    setNewMessage('');
    // Optimistic UI update: add message immediately
    setMessages((prev) => [...prev, {
        _id: `temp-${Date.now()}-${Math.random()}`, // Unique temporary ID
        conversation: selectedConversation._id, // 'conversation' to match backend model
        sender: userId,
        text: messageData.text,
        createdAt: messageData.createdAt // Use the same timestamp
    }]);

    // Optional: Save message to DB via REST API if you want to ensure persistence
    // This is good practice for production, but can be done asynchronously after emitting.
    /*
    try {
        await axios.post(`${process.env.REACT_APP_API_URL}/chat/messages`, messageData, config());
    } catch (dbError) {
        console.error("ChatPage: Error saving message to DB via REST:", dbError);
        // Handle gracefully, maybe revert optimistic update or notify user
    }
    */
  };

  // --- Conditional Rendering for Loading/Error states (after all hooks) ---
  if (loadingConversations) {
    return <p>Loading conversations...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  // --- Main Chat UI ---
  return (
    <div className="flex h-[80vh] bg-gray-100 rounded-lg shadow-lg overflow-hidden">
      <div className="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto"> {/* Sidebar */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Conversations</h2>
        {conversations.length > 0 ? (
            conversations.map((convo) => (
            <div
                key={convo._id}
                className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 ${selectedConversation?._id === convo._id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50'}`}
                onClick={() => selectConversation(convo)}
            >
                {/* Display other participant's name (and potentially avatar) */}
                <div className="flex-grow">
                    <span className="font-medium">
                        {convo.participants.find(p => p._id !== userId)?.name || 'Unknown User'}
                    </span>
                    {/* <p className="text-sm text-gray-500">Last message snippet...</p> */}
                </div>
            </div>
            ))
        ) : (
            <p className="text-gray-500">No conversations found.</p>
        )}
      </div>
      <div className="flex-1 flex flex-col bg-gray-50"> {/* Main Chat Area */}
        {!socketConnected && <p className="p-2 text-center text-orange-600 bg-orange-50">Connecting to chat server...</p>}
        {selectedConversation ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto space-y-3"> {/* Messages */}
              {messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs ${msg.sender === userId ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}>
                    <p>{msg.text}</p>
                    <span className="block text-xs mt-1 opacity-75">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg p-3 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!socketConnected}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newMessage.trim() || !socketConnected}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;