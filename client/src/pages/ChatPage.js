import React, { useState, useEffect, useRef } from 'react';
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

  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '';


  // --- EFFECT 1: Handle Authentication/Authorization & Redirection ---
  // This hook should ONLY handle the redirection.
  useEffect(() => {
    if (!token || !userInfo) {
      console.log("User not authenticated, redirecting to login.");
      navigate('/login');
    }
  }, [token, userInfo, navigate]);


  // --- IMPORTANT: ONLY PROCEED WITH RENDERING THE MAIN CHAT UI IF AUTHENTICATED ---
  // If not authenticated, we simply render nothing (or a loading state)
  // because the useEffect above will redirect.
  if (!token || !userInfo) {
    return null; // Don't render anything if not authenticated, let the redirect happen
  }


  // --- EFFECT 2: Fetch all conversations (This was Line 49 error) ---
  useEffect(() => {
    const fetchConversations = async () => {
      // No need for `if (!token) return;` here anymore, as the early return above handles unauthenticated state
      try {
        setLoadingConversations(true);
        setError('');
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
  }, [token]); // config is stable if token is stable, so only token needed if config doesn't change otherwise


  // --- EFFECT 3: Socket connection and message listener (This was Line 68 error) ---
  useEffect(() => {
    // If not authenticated, do not connect socket. The `if (!token || !userInfo)` block above will prevent rendering
    // or the previous useEffect will redirect, making this check less critical, but good for safety.
    if (!SOCKET_SERVER_URL) {
      console.error("SOCKET_SERVER_URL is empty, cannot connect Socket.IO.");
      setError("Chat connection URL not configured.");
      return;
    }

    console.log("Attempting Socket.IO connection to:", SOCKET_SERVER_URL);
    socketRef.current = io(SOCKET_SERVER_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'] // Explicitly use websockets first
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.IO Connected:', socketRef.current.id);
      setSocketConnected(true);
      if (selectedConversation) {
        socketRef.current.emit('joinConversation', selectedConversation._id);
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO Connection Error:', err.message);
        setError('Failed to connect to chat server. Check network and backend logs.');
        setSocketConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO Disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('receiveMessage', (message) => {
      console.log('Received message:', message);
      if (message.conversationId === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting Socket.IO');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, SOCKET_SERVER_URL, selectedConversation?._id]); // Add selectedConversation?._id for re-joining when convo changes

  // --- EFFECT 4: Scroll to bottom of messages (This was Line 116 error - now moved) ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // --- Helper function to select a conversation ---
  const selectConversation = async (convo) => {
    setSelectedConversation(convo);
    if (socketRef.current?.connected) {
        socketRef.current.emit('joinConversation', convo._id);
    } else {
        console.warn('Socket not connected when trying to join conversation. This might be okay if it connects shortly.');
    }

    try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${convo._id}`, config);
        setMessages(data);
        setError('');
    } catch (error) {
        console.error("Error fetching messages for conversation:", error);
        setError(error.response?.data?.message || "Failed to fetch messages for this conversation.");
        setMessages([]);
    }
  };

  // --- Helper function to send a message ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

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

    if (socketRef.current?.connected) {
        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
        setMessages((prev) => [...prev, {
            _id: Date.now(), // Temporary ID
            conversationId: selectedConversation._id,
            sender: userInfo._id,
            text: messageData.text,
            createdAt: new Date().toISOString()
        }]);
    } else {
        console.error("Socket not connected. Message not sent.");
        setError("Chat server not connected. Message not sent.");
    }
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
        {!socketConnected && <p style={{ color: 'orange' }}>Connecting to chat server...</p>} {/* Indicate connection status */}
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
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={!socketConnected} />
              <button type="submit" disabled={!socketConnected}>Send</button>
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