import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  // --- ALL HOOKS MUST BE AT THE TOP-LEVEL, UNCONDITIONAL ---
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const userId = userInfo?._id;

  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:5001';

  // --- EFFECT 1: Log SOCKET_SERVER_URL ---
  useEffect(() => {
    console.log("ChatPage: SOCKET_SERVER_URL set to:", SOCKET_SERVER_URL);
  }, [SOCKET_SERVER_URL]);

  // --- EFFECT 2: Handle Authentication/Authorization & Redirection ---
  // This useEffect will run unconditionally. The redirect logic is fine here.
  useEffect(() => {
    if (!token || !userInfo || !userId) {
      console.log("ChatPage: User not authenticated or user ID missing, redirecting to login.");
      navigate('/login');
    }
  }, [token, userInfo, userId, navigate]);

  // --- EFFECT 3: Fetch all conversations ---
  // This useEffect must also be unconditional.
  useEffect(() => {
    // Only fetch if authenticated (check inside the effect)
    if (!token || !userId) { // Ensure token and userId exist before fetching
      setLoadingConversations(false); // Stop loading if not authenticated to prevent infinite spinner
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        setError('');
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/conversations`, config());
        setConversations(data);
      } catch (error) {
        console.error("ChatPage: Error fetching conversations:", error.response?.data?.message || error.message);
        setError(error.response?.data?.message || "Failed to fetch conversations.");
        if (error.response?.status === 401) {
            navigate('/login');
        }
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchConversations();
  }, [token, userId, navigate, config]); // Add userId to dependencies

  // --- EFFECT 4: Socket connection and message listener ---
  // This useEffect must also be unconditional.
  useEffect(() => {
    if (!token || !userId) { // Ensure token and userId exist before attempting socket connection
        setSocketConnected(false); // Ensure socket is marked disconnected if not authenticated
        return;
    }
    if (!SOCKET_SERVER_URL) {
      console.error("ChatPage: SOCKET_SERVER_URL is empty, cannot connect Socket.IO.");
      setError("Chat connection URL not configured.");
      setSocketConnected(false);
      return;
    }

    console.log("ChatPage: Attempting Socket.IO connection to:", SOCKET_SERVER_URL);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      secure: true,
    });

    socketRef.current.on('connect', () => {
      console.log('ChatPage: Socket.IO Connected:', socketRef.current.id);
      setSocketConnected(true);
      if (userId) {
          socketRef.current.emit('joinConversation', userId);
          console.log(`ChatPage: Joined user room ${userId} on connect.`);
      }
      if (selectedConversation) {
        socketRef.current.emit('joinConversation', selectedConversation._id);
        console.log(`ChatPage: Joined conversation room ${selectedConversation._id} on connect.`);
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('ChatPage: Socket.IO Connection Error:', err.message, err.data);
        setError('Failed to connect to chat server. Check network and backend logs.');
        setSocketConnected(false);
        if (err.message.includes('Authentication error')) {
            navigate('/login');
        }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('ChatPage: Socket.IO Disconnected. Reason:', reason);
      setSocketConnected(false);
    });

    socketRef.current.on('receiveMessage', (message) => {
      console.log('ChatPage: Received message:', message);
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
      } else if (!selectedConversation) {
          console.log('ChatPage: Received message for unselected conversation.');
      } else if (message.conversation !== selectedConversation._id) {
          console.log(`ChatPage: Received message for different conversation (${message.conversation}) than selected (${selectedConversation._id}).`);
      }
    });

    return () => {
      if (socketRef.current) {
        console.log('ChatPage: Disconnecting Socket.IO clean up.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, SOCKET_SERVER_URL, userId, navigate, selectedConversation]); // selectedConversation needs to be here to join/leave rooms correctly

  // --- EFFECT 5: Scroll to bottom of messages ---
  // This useEffect must also be unconditional.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // --- Now, conditional rendering can happen AFTER all hooks have been called ---
  if (!token || !userInfo || !userId) {
    return (
      <p className="text-center text-red-500 mt-10">
        You are not logged in. Redirecting to login...
      </p>
    ); // This is the early return for rendering
  }

  // --- Helper function to select a conversation ---
  const selectConversation = async (convo) => {
    // ... (rest of this function remains the same)
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
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${convo._id}`, config());
            setMessages(data);
            setError('');
        } catch (error) {
            console.error("ChatPage: Error fetching messages for conversation:", error.response?.data?.message || error.message);
            setError(error.response?.data?.message || "Failed to fetch messages for this conversation.");
            setMessages([]);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    }
  };

  // --- Helper function to send a message ---
  const sendMessage = async (e) => {
    // ... (rest of this function remains the same)
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    if (!socketRef.current?.connected) {
        console.error("ChatPage: Socket not connected. Message not sent.");
        setError("Chat server not connected. Message not sent.");
        return;
    }

    const receiver = selectedConversation.participants.find(p => p._id !== userId);
    if (!receiver) {
        console.error("ChatPage: Receiver not found in conversation participants.");
        setError("Error: Could not find conversation receiver.");
        return;
    }

    const messageData = {
      conversationId: selectedConversation._id,
      sender: userId,
      text: newMessage,
      createdAt: new Date().toISOString(),
    };

    socketRef.current.emit('sendMessage', messageData);
    setNewMessage('');
    setMessages((prev) => [...prev, {
        _id: `temp-${Date.now()}-${Math.random()}`,
        conversation: selectedConversation._id,
        sender: userId,
        text: messageData.text,
        createdAt: messageData.createdAt
    }]);
  };

  // --- Conditional Rendering for Loading/Error states (after all hooks and early returns) ---
  if (loadingConversations) {
    return <p className="text-center mt-10">Loading conversations...</p>;
  }

  if (error) {
    return <p className="text-center mt-10" style={{ color: 'red' }}>Error: {error}</p>;
  }

  // --- Main Chat UI ---
  return (
    // ... (rest of your JSX) ...
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