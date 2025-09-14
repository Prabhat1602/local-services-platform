import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await axios.get('http://localhost:5001/api/chat/conversations', config);
      setConversations(data);
    };
    fetchConversations();
  }, []);

  // Socket connection and message listener
  useEffect(() => {
    socketRef.current = io('http://localhost:5001');
    socketRef.current.on('receiveMessage', (message) => {
      // Only add the message if it belongs to the currently selected conversation
      if (message.conversationId === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => socketRef.current.disconnect();
  }, [selectedConversation]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle selecting a conversation
  const selectConversation = async (convo) => {
    setSelectedConversation(convo);
    // Join the socket room for this conversation
    socketRef.current.emit('joinConversation', convo._id);
    // Fetch its messages
    const { data } = await await axios.get(`http://localhost:5001/api/chat/messages/${convo._id}`, config);
    setMessages(data);
  };

const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Find the other participant's ID
    const receiver = selectedConversation.participants.find(p => p._id !== userInfo._id);

    const messageData = {
      conversationId: selectedConversation._id,
      sender: userInfo._id,
      text: newMessage,
      receiverId: receiver._id, // Add the receiver's ID
    };
    socketRef.current.emit('sendMessage', messageData);
    setNewMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h2>Conversations</h2>
        {conversations.map((convo) => (
          <div key={convo._id} className="conversation-tab" onClick={() => selectConversation(convo)}>
            {convo.participants.find(p => p._id !== userInfo._id).name}
          </div>
        ))}
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