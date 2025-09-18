const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Import Models
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const Conversation = require('./models/Conversation'); // ADDED: Import Conversation model
const User = require('./models/User'); // ADDED: Import User model for populating sender

// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const providerRoutes = require('./routes/providerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express App
const app = express();

// Stripe webhook must be before express.json()
app.use('/api/payments/webhook', paymentRoutes);

app.use(express.json()); // Enable JSON body parsing for Express

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

// Mount All API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);

// Import Cron Jobs
const startReminderJobs = require('./cron/reminderJobs');

// --- Socket.IO Setup (START) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
});

// --- Socket.IO Middleware for Authentication ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.warn('Socket.IO Auth: No token provided from client, rejecting connection.');
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user info to socket
    console.log(`Socket.IO Auth: User ${decoded.id} authenticated.`);
    next();
  } catch (error) {
    console.warn('Socket.IO Auth: Invalid token, rejecting connection.', error.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});


// --- Socket.IO Connection Handler ---
io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO:', socket.id);

  if (socket.user) {
    console.log('Authenticated Socket.IO user ID:', socket.user.id);
    socket.join(socket.user.id); // Join a user-specific room for private messaging and notifications
    console.log(`Socket ${socket.id} joined user room ${socket.user.id}`);
  } else {
    console.warn('Socket connected without user authentication data (this should not happen if middleware is working).');
  }

  socket.on('joinConversation', (conversationId) => {
    console.log(`Socket ${socket.id} joining conversation room: ${conversationId}`);
    socket.join(conversationId);
  });

  socket.on('sendMessage', async (messageData) => {
    console.log('Received message from socket:', messageData);

    try {
      // Security check: Ensure the sender ID from the client matches the authenticated socket user ID
      if (socket.user.id !== messageData.sender) {
        console.warn(`Attempted message spoofing: socket.user.id (${socket.user.id}) != messageData.sender (${messageData.sender})`);
        socket.emit('messageError', 'Unauthorized message sender.');
        return;
      }

      // 1. Create and save the new message to the database
      const newMessage = await Message.create({
        conversationId: messageData.conversationId,
        sender: messageData.sender, // This is the userId from the client
        text: messageData.text,
      });

      // 2. Populate the sender field to include user's name and other details if needed
      // This is crucial so the frontend receives the sender's actual data, not just their ID.
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'name profilePicture') // Assuming User model has 'name' and 'profilePicture'
        .lean(); // Convert to plain JS object

      if (!populatedMessage) {
        console.error('Failed to populate message after saving:', newMessage._id);
        socket.emit('messageError', 'Failed to process message.');
        return;
      }

      console.log('Saved and populated message:', populatedMessage);

      // 3. Emit the saved and populated message to all clients in that conversation room
      io.to(messageData.conversationId).emit('receiveMessage', populatedMessage);
      console.log(`Broadcasted message to room ${messageData.conversationId}`);

      // Optional: Update the lastMessage field in the Conversation document
      // This is good for displaying the last message in the conversation sidebar
      await Conversation.findByIdAndUpdate(messageData.conversationId, {
          lastMessage: {
              sender: messageData.sender, // Store just the ID here
              text: messageData.text,
              createdAt: newMessage.createdAt,
          },
          updatedAt: Date.now(),
      });

      // Optional: Emit a notification to the recipient if they are not in the active chat room
      const conversation = await Conversation.findById(messageData.conversationId).populate('participants');
      if (conversation) {
          conversation.participants.forEach(participant => {
              // Check if the participant is NOT the sender and is NOT actively in the conversation room
              // (Checking if they are in the room is complex and often handled on the client or by presence tracking)
              // For simplicity, emit to their personal user room. Client decides how to show it.
              if (participant._id.toString() !== messageData.sender.toString()) {
                  io.to(participant._id.toString()).emit('newNotification', {
                      type: 'new_message',
                      conversationId: messageData.conversationId,
                      sender: { // Send simplified sender info
                        _id: populatedMessage.sender._id,
                        name: populatedMessage.sender.name
                      },
                      text: populatedMessage.text,
                      message: `New message from ${populatedMessage.sender.name || 'Unknown'}`,
                  });
                  console.log(`Sent notification to user ${participant._id}`);
              }
          });
      }

    } catch (dbError) {
      console.error('Error saving message to DB or broadcasting:', dbError);
      socket.emit('messageError', 'Failed to send message: Server error.');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from Socket.IO:', socket.id);
    // You might want to remove them from rooms they've joined here if necessary
  });
});

console.log('Socket.IO server initialized.');
// --- Socket.IO Setup (END) ---


// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    startReminderJobs();
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
// const express = require('express');
// const http = require('http'); // ADDED for Socket.IO
// const { Server } = require('socket.io'); // ADDED for Socket.IO
// const dotenv = require('dotenv');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken'); // ADDED for Socket.IO Auth

// // Load environment variables
// dotenv.config();

// // Import Models
// const Message = require('./models/Message');
// const Notification = require('./models/Notification');

// // Import Routes
// const adminRoutes = require('./routes/adminRoutes');
// const authRoutes = require('./routes/authRoutes');
// const bookingRoutes = require('./routes/bookingRoutes');
// const chatRoutes = require('./routes/chatRoutes');
// const feedbackRoutes = require('./routes/feedbackRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const providerRoutes = require('./routes/providerRoutes');
// const reviewRoutes = require('./routes/reviewRoutes');
// const serviceRoutes = require('./routes/serviceRoutes');
// const userRoutes = require('./routes/userRoutes');

// // Initialize Express App
// const app = express();

// // Stripe webhook must be before express.json()
// // This order is crucial if Stripe webhooks send raw bodies.
// app.use('/api/payments/webhook', paymentRoutes); // MOVED THIS HERE

// app.use(express.json()); // Enable JSON body parsing for Express

// // CORS Configuration
// const corsOptions = {
//   origin: process.env.CLIENT_URL || 'http://localhost:3000', // Use this for both Express and Socket.IO
//   optionsSuccessStatus: 200,
//   credentials: true, // IMPORTANT: Ensure this is here for cookies/auth headers
// };
// app.use(cors(corsOptions)); // Apply CORS middleware

// // Mount All API Routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/payments', paymentRoutes); // NOTE: This payment route is distinct from the webhook
// app.use('/api/provider', providerRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/users', userRoutes);


// // Import Cron Jobs
// const startReminderJobs = require('./cron/reminderJobs');

// // --- Socket.IO Setup (START) ---
// const server = http.createServer(app); // Create HTTP server using the Express app
// const io = new Server(server, { // Pass the HTTP server to Socket.IO
//   cors: corsOptions, // Use the same CORS options for Socket.IO for consistency
//   pingTimeout: 60000,
// });

// // --- Socket.IO Middleware for Authentication ---
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     console.warn('Socket.IO Auth: No token provided from client, rejecting connection.');
//     return next(new Error('Authentication error: No token provided'));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     socket.user = decoded; // Attach user info to socket
//     console.log(`Socket.IO Auth: User ${decoded.id} authenticated.`);
//     next();
//   } catch (error) {
//     console.warn('Socket.IO Auth: Invalid token, rejecting connection.', error.message);
//     return next(new Error('Authentication error: Invalid token'));
//   }
// });


// // --- Socket.IO Connection Handler ---
// io.on('connection', (socket) => {
//   console.log('A user connected via Socket.IO:', socket.id);

//   // If authentication middleware worked, socket.user should be available
//   if (socket.user) {
//     console.log('Authenticated Socket.IO user ID:', socket.user.id);
//     socket.join(socket.user.id); // Join a user-specific room for private messaging
//     console.log(`Socket ${socket.id} joined user room ${socket.user.id}`);
//   } else {
//     console.warn('Socket connected without user authentication data (this should not happen if middleware is working).');
//   }

//   socket.on('joinConversation', (conversationId) => {
//     console.log(`Socket ${socket.id} joining conversation room: ${conversationId}`);
//     socket.join(conversationId);
//   });

//   socket.on('sendMessage', async (messageData) => {
//     console.log('Received message from socket:', messageData);

//     // In a real app, you would typically save the message to your database first.
//     // Example:
//     /*
//     try {
//       const savedMessage = await Message.create({
//         conversation: messageData.conversationId,
//         sender: messageData.sender,
//         text: messageData.text,
//       });
//       // Then emit the saved message (with its DB-generated ID and timestamp)
//       io.to(messageData.conversationId).emit('receiveMessage', savedMessage);
//     } catch (dbError) {
//       console.error('Error saving message to DB:', dbError);
//       // Optionally emit an error back to the sender
//       socket.emit('messageError', 'Failed to send message: DB error.');
//     }
//     */
//     // For now, directly emit the received data
//     io.to(messageData.conversationId).emit('receiveMessage', messageData);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected from Socket.IO:', socket.id);
//   });
// });

// console.log('Socket.IO server initialized.'); // Confirmation log
// // --- Socket.IO Setup (END) ---


// // Database Connection & Server Start (remains at the bottom, using 'server.listen')
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅ MongoDB connected successfully');
//     startReminderJobs();
//     const PORT = process.env.PORT || 5001; // Use the same PORT for HTTP/Socket.IO server
//     server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`)); // Listen on the HTTP server
//   })
//   .catch(err => console.error('❌ MongoDB connection error:', err));