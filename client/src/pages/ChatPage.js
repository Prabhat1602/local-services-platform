import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// The import for ChatPage.css should NOT be here if styles are in index.css

const ChatPage = () => {
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
  useEffect(() => {
    if (!token || !userInfo || !userId) {
      console.log("ChatPage: User not authenticated or user ID missing, redirecting to login.");
      navigate('/login');
    }
  }, [token, userInfo, userId, navigate]);

  // --- EFFECT 3: Fetch all conversations ---
  useEffect(() => {
    if (!token || !userId) {
      setLoadingConversations(false);
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
  }, [token, userId, navigate, config]);

  // --- NEW EFFECT: Auto-select first conversation OR load messages for existing selected one ---
  useEffect(() => {
    if (!token || !userId || loadingConversations) return; // Wait for auth and conversations to load

    if (!selectedConversation && conversations.length > 0) {
      console.log("ChatPage: Auto-selecting first conversation.");
      selectConversation(conversations[0]);
    }
    else if (selectedConversation && messages.length === 0 && socketConnected) {
      const fetchMessagesForSelected = async () => {
             try {
                if (messages.length > 0) return; // Prevent re-fetching if messages have just been set by selectConversation

                console.log(`ChatPage: Fetching messages for pre-selected conversation ${selectedConversation._id}.`);
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${selectedConversation._id}`, config());
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
        };
        fetchMessagesForSelected();
    }
  }, [conversations, selectedConversation, socketConnected, token, userId, navigate, config, loadingConversations, messages.length]);


  // --- EFFECT 4: Socket connection and message listener ---
  useEffect(() => {
    if (!token || !userId || !SOCKET_SERVER_URL) {
        setSocketConnected(false);
        if (!SOCKET_SERVER_URL) {
          console.error("ChatPage: SOCKET_SERVER_URL is empty, cannot connect Socket.IO.");
          setError("Chat connection URL not configured.");
        } else {
          console.log("ChatPage: Skipping Socket.IO connection. User not authenticated or ID missing.");
        }
        return;
    }

    if (socketRef.current && socketRef.current.connected) {
        console.log("ChatPage: Existing socket is connected, skipping new connection.");
        return;
    }
    if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }

    console.log("ChatPage: Attempting Socket.IO connection to:", SOCKET_SERVER_URL);
    const socket = io(SOCKET_SERVER_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      secure: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('ChatPage: Socket.IO Connected:', socket.id);
      setSocketConnected(true);
      if (userId) {
          socket.emit('joinConversation', userId);
          console.log(`ChatPage: Joined user room ${userId} on connect.`);
      }
    });

    socket.on('connect_error', (err) => {
        console.error('ChatPage: Socket.IO Connection Error:', err.message, err.data);
        setError('Failed to connect to chat server. Check network and backend logs.');
        setSocketConnected(false);
        if (err.message.includes('Authentication error')) {
            navigate('/login');
        }
    });

    socket.on('disconnect', (reason) => {
      console.log('ChatPage: Socket.IO Disconnected. Reason:', reason);
      setSocketConnected(false);
    });

    socket.on('receiveMessage', (message) => {
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
  }, [token, SOCKET_SERVER_URL, userId, navigate]);

  // --- EFFECT 5: Scroll to bottom of messages ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  if (!token || !userInfo || !userId) {
    return (
      <p className="text-center text-red-500 mt-10">
        You are not logged in. Redirecting to login...
      </p>
    );
  }

  const selectConversation = async (convo) => {
    if (!convo || selectedConversation?._id === convo._id) return;

    if (socketRef.current?.connected) {
        if (selectedConversation) {
            socketRef.current.emit('leaveConversation', selectedConversation._id);
            console.log(`ChatPage: Leaving conversation room ${selectedConversation._id}`);
        }
        socketRef.current.emit('joinConversation', convo._id);
        console.log(`ChatPage: Joining conversation room ${convo._id}`);
    } else {
        console.warn('ChatPage: Socket not connected when trying to join conversation. Messages might not be real-time.');
    }

    setSelectedConversation(convo);
    setMessages([]);

    try {
        console.log(`ChatPage: Fetching messages for conversation ${convo._id}.`);
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
  };

  const sendMessage = async (e) => {
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

  if (loadingConversations) {
    return <p className="text-center mt-10">Loading conversations...</p>;
  }

  if (error) {
    return <p className="text-center mt-10" style={{ color: 'red' }}>Error: {error}</p>;
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
                className={`conversation-tab ${selectedConversation?._id === convo._id ? 'selected' : ''}`}
                onClick={() => selectConversation(convo)}
            >
                <div>
                    <span>
                        {convo.participants.find(p => p._id !== userId)?.name || 'Unknown User'}
                    </span>
                </div>
            </div>
            ))
        ) : (
            <p>No conversations found.</p>
        )}
      </div>
      <div className="chat-main">
        {!socketConnected && <p className="chat-status-message connecting">Connecting to chat server...</p>}
        {selectedConversation ? (
          // This fragment `( <> ... </> )` is crucial when returning multiple sibling elements conditionally
          <>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg._id} className={`message ${msg.sender === userId ? 'sent' : 'received'}`}>
                    <p>{msg.text}</p>
                    <small style={{ fontSize: '0.75rem', opacity: '0.75', display: 'block' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="chat-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-form-input" // Changed to more specific class to avoid conflicts
                disabled={!socketConnected}
              />
              <button
                type="submit"
                className="chat-form-button" // Changed to more specific class to avoid conflicts
                disabled={!newMessage.trim() || !socketConnected}
              >
                Send
              </button>
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