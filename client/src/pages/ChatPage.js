import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const ChatPage = () => {
  // --- ALL HOOKS AT TOP-LEVEL, UNCONDITIONAL ---
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true); // New loading state
  const [error, setError] = useState(''); // New error state

  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  // Get user info directly from localStorage. This is NOT a hook.
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token; // Use optional chaining for safety

  // Define config for axios requests. It relies on `token`.
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- Socket.IO SERVER URL ---
  // The REACT_APP_API_URL often includes '/api', which Socket.IO does not need.
  // It should be the base URL of your backend, e.g., 'https://local-services-api.onrender.com'
  const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '';

  // --- EFFECT 1: Handle Authentication/Authorization & Redirection ---
  // This needs to run first to ensure the user is logged in
  useEffect(() => {
    if (!token || !userInfo) {
      // If not logged in or token is missing, redirect to login
      navigate('/login');
      // Set an error message if you have a global notification system
      // Or simply show a message on the login page after redirect
    }
  }, [token, userInfo, navigate]); // Dependencies: token, userInfo, navigate

  // --- EARLY RETURN: If not authorized (after the check above) ---
  // This return comes AFTER all hooks but BEFORE rendering the main UI
  if (!token || !userInfo) {
    return null; // Or a simple loading spinner, as the redirect will happen shortly
  }

  // --- EFFECT 2: Fetch all conversations ---
  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) return; // Ensure token exists before fetching
      try {
        setLoadingConversations(true);
        setError(''); // Clear previous errors
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/conversations`, config);
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError(error.response?.data?.message || "Failed to fetch conversations.");
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchConversations();
  }, [token]); // Dependency: token. config could also be a dependency if it's dynamic

  // --- EFFECT 3: Socket connection and message listener ---
  useEffect(() => {
    // Only connect if we have a token and the URL is valid
    if (!token || !SOCKET_SERVER_URL) {
      console.warn("Skipping Socket.IO connection: Token or Socket URL missing.");
      return;
    }

    console.log("Attempting Socket.IO connection to:", SOCKET_SERVER_URL); // Debugging line
    socketRef.current = io(SOCKET_SERVER_URL, {
      auth: { token: token } // Pass token for authentication
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.IO Connected:', socketRef.current.id);
      // If a conversation is already selected when socket connects, join it
      if (selectedConversation) {
        socketRef.current.emit('joinConversation', selectedConversation._id);
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO Connection Error:', err.message); // Crucial debugging
        setError('Failed to connect to chat server.');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO Disconnected');
    });

    socketRef.current.on('receiveMessage', (message) => {
      console.log('Received message:', message); // Debugging line
      // Only add the message if it belongs to the currently selected conversation
      if (message.conversationId === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Cleanup function: disconnect socket when component unmounts or dependencies change
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting Socket.IO'); // Debugging line
        socketRef.current.disconnect();
        socketRef.current = null; // Clear the ref
      }
    };
  }, [token, SOCKET_SERVER_URL, selectedConversation?._id]); // Dependencies: token, URL, and selected conversation ID for re-joining

  // --- EFFECT 4: Scroll to bottom of messages ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // --- Helper function to select a conversation ---
  const selectConversation = async (convo) => {
    setSelectedConversation(convo);
    // Emit join event only if socket is connected
    if (socketRef.current?.connected) {
        socketRef.current.emit('joinConversation', convo._id);
    } else {
        console.warn('Socket not connected when trying to join conversation. This might be okay if it connects shortly.');
    }

    // Fetch messages for the newly selected conversation
    try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${convo._id}`, config);
        setMessages(data);
        setError(''); // Clear any previous message fetch errors
    } catch (error) {
        console.error("Error fetching messages for conversation:", error);
        setError(error.response?.data?.message || "Failed to fetch messages for this conversation.");
        setMessages([]); // Clear messages on error
    }
  };

  // --- Helper function to send a message ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return; // Prevent sending empty messages or without convo

    const receiver = selectedConversation.participants.find(p => p._id !== userInfo._id);
    if (!receiver) {
        console.error("Receiver not found in conversation participants.");
        setError("Error: Could not find conversation receiver.");
        return;
    }

    const messageData = {
      conversationId: selectedConversation._id,
      sender: userInfo._id,
      text: newMessage,
      receiverId: receiver._id,
    };

    if (socketRef.current?.connected) { // Check if socket is actually connected
        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
        // Optimistically add message to UI
        setMessages((prev) => [...prev, {
            _id: Date.now(), // Temporary ID for immediate display
            conversationId: selectedConversation._id,
            sender: userInfo._id,
            text: messageData.text, // Use messageData.text for consistency
            createdAt: new Date().toISOString()
        }]);
    } else {
        console.error("Socket not connected. Message not sent.");
        setError("Chat server not connected. Message not sent.");
        // Optionally, queue message for sending when socket connects or inform user
    }
  };

  // --- Conditional Rendering ---
  if (loadingConversations) {
    return <p>Loading conversations...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h2>Conversations</h2>
        {conversations.length > 0 ? (
            conversations.map((convo) => (
            <div
                key={convo._id}
                className={`conversation-tab ${selectedConversation?._id === convo._id ? 'active' : ''}`}
                onClick={() => selectConversation(convo)}
            >
                {/* Display other participant's name */}
                {convo.participants.find(p => p._id !== userInfo._id)?.name || 'Unknown User'}
            </div>
            ))
        ) : (
            <p>No conversations found.</p>
        )}
      </div>
      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg._id} className={`message ${msg.sender === userInfo._id ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="chat-form">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;