// import React, { useState, useEffect, useRef } from 'react';
// import io from 'socket.io-client';
// import axios from 'axios';

// const ChatPage = () => {
//   const [conversations, setConversations] = useState([]);
//   const [selectedConversation, setSelectedConversation] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const socketRef = useRef();
//   const messagesEndRef = useRef(null);

//   const userInfo = JSON.parse(localStorage.getItem('userInfo'));
//   const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

//   // Fetch all conversations
//   useEffect(() => {
//     const fetchConversations = async () => {
//       const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/conversations`, config);
//       setConversations(data);
//     };
//     fetchConversations();
//   }, []);

//   // Socket connection and message listener
//   useEffect(() => {
//     socketRef.current = io(`${process.env.REACT_APP_API_URL}`);
//     socketRef.current.on('receiveMessage', (message) => {
//       // Only add the message if it belongs to the currently selected conversation
//       if (message.conversationId === selectedConversation?._id) {
//         setMessages((prev) => [...prev, message]);
//       }
//     });

//     return () => socketRef.current.disconnect();
//   }, [selectedConversation]);
  
//   // Scroll to bottom of messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Handle selecting a conversation
//   const selectConversation = async (convo) => {
//     setSelectedConversation(convo);
//     // Join the socket room for this conversation
//     socketRef.current.emit('joinConversation', convo._id);
//     // Fetch its messages
//     const { data } = await await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${convo._id}`, config);
//     setMessages(data);
//   };

// const sendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     // Find the other participant's ID
//     const receiver = selectedConversation.participants.find(p => p._id !== userInfo._id);

//     const messageData = {
//       conversationId: selectedConversation._id,
//       sender: userInfo._id,
//       text: newMessage,
//       receiverId: receiver._id, // Add the receiver's ID
//     };
//     socketRef.current.emit('sendMessage', messageData);
//     setNewMessage('');
//   };

//   return (
//     <div className="chat-container">
//       <div className="chat-sidebar">
//         <h2>Conversations</h2>
//         {conversations.map((convo) => (
//           <div key={convo._id} className="conversation-tab" onClick={() => selectConversation(convo)}>
//             {convo.participants.find(p => p._id !== userInfo._id).name}
//           </div>
//         ))}
//       </div>
//       <div className="chat-main">
//         {selectedConversation ? (
//           <>
//             <div className="chat-messages">
//               {messages.map((msg) => (
//                 <div key={msg._id} className={`message ${msg.sender === userInfo._id ? 'sent' : 'received'}`}>
//                   {msg.text}
//                 </div>
//               ))}
//               <div ref={messagesEndRef} />
//             </div>
//             <form onSubmit={sendMessage} className="chat-form">
//               <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
//               <button type="submit">Send</button>
//             </form>
//           </>
//         ) : (
//           <div className="no-chat-selected">Select a conversation to start chatting.</div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatPage;

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
  // Ensure userInfo and token exist before trying to use them
  if (!userInfo || !userInfo.token) {
    // Redirect to login or show an error if not logged in
    // For now, returning null to prevent further errors
    return <p>Please log in to access chat.</p>;
  }
  const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

  // --- Crucial Fix: Define the Socket.IO server URL correctly ---
  // The REACT_APP_API_URL often includes '/api', which Socket.IO does not need.
  // It should be the base URL of your backend, e.g., 'https://local-services-api.onrender.com'
  const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL.replace('/api', '');

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/conversations`, config);
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        // Handle error, e.g., set an error state
      }
    };
    fetchConversations();
  }, [userInfo.token]); // Added userInfo.token to dependency array

  // Socket connection and message listener
  useEffect(() => {
    console.log("Connecting Socket.IO to:", SOCKET_SERVER_URL); // Debugging line
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket.IO Connected:', socketRef.current.id);
      // If a conversation is already selected when socket connects, join it
      if (selectedConversation) {
        socketRef.current.emit('joinConversation', selectedConversation._id);
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO Connection Error:', err.message); // Crucial debugging
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
      console.log('Disconnecting Socket.IO'); // Debugging line
      socketRef.current.disconnect();
    };
  }, [SOCKET_SERVER_URL]); // Depend on SOCKET_SERVER_URL to ensure re-connection if it changes

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle selecting a conversation
  const selectConversation = async (convo) => {
    setSelectedConversation(convo);
    // Ensure socket is connected before emitting
    if (socketRef.current.connected) {
        socketRef.current.emit('joinConversation', convo._id);
    } else {
        console.warn('Socket not connected when trying to join conversation. Retrying...');
        // You might want to handle reconnection logic here or retry joining after connect event
    }
    
    try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/chat/messages/${convo._id}`, config);
        setMessages(data);
    } catch (error) {
        console.error("Error fetching messages for conversation:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const receiver = selectedConversation.participants.find(p => p._id !== userInfo._id);
    if (!receiver) {
        console.error("Receiver not found in conversation participants.");
        return;
    }

    const messageData = {
      conversationId: selectedConversation._id,
      sender: userInfo._id,
      text: newMessage,
      receiverId: receiver._id,
    };

    if (socketRef.current.connected) {
        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
        // Optimistically add message to UI
        setMessages((prev) => [...prev, {
            _id: Date.now(), // Temporary ID
            conversationId: selectedConversation._id,
            sender: userInfo._id,
            text: newMessage,
            createdAt: new Date().toISOString()
        }]);
    } else {
        console.error("Socket not connected. Message not sent.");
        // Implement retry logic or inform user
    }
  };

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