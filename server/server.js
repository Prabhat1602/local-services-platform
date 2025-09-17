// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken'); // <<< ADDED for Socket.IO Auth
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


// const app = express(); // <--- THIS LINE MUST BE HERE, BEFORE ANY app.use/get/post
// // 6. Enable JSON body parsing for Express
// app.use(express.json());
// // 5. Configure CORS for Express
// app.use(cors({
//   origin: process.env.CLIENT_URL,
//   credentials: true,
// }));


// // CORS Configuration
// const corsOptions = {
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// // Mount All API Routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/provider', providerRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/users', userRoutes);

// // Import Cron Jobs
// const startReminderJobs = require('./cron/reminderJobs');
// // Stripe webhook must be before express.json()
// app.use('/api/payments/webhook', paymentRoutes);
// // Initialize App






// const server = http.createServer(app); // Use http to create server for Express and Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL, // Ensure this matches your frontend URL
//     methods: ["GET", "POST"]
//   },
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

//   if (socket.user) { // Only if auth middleware worked
//     console.log('Authenticated Socket.IO user ID:', socket.user.id);
//     socket.join(socket.user.id); // Join a user-specific room
//     console.log(`Socket ${socket.id} joined user room ${socket.user.id}`);
//   } else {
//       console.warn('Socket connected without user authentication data (this should not happen if middleware is working).');
//   }

//   socket.on('joinConversation', (conversationId) => {
//     console.log(`Socket ${socket.id} joining conversation room: ${conversationId}`);
//     socket.join(conversationId);
//   });

//   socket.on('sendMessage', async (messageData) => {
//     console.log('Received message from socket:', messageData);
//     // TODO: Save to DB before emitting in production
//     io.to(messageData.conversationId).emit('receiveMessage', messageData);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected from Socket.IO:', socket.id);
//   });
// });

// console.log('Socket.IO server initialized.'); // Confirmation log
// // --- Socket.IO Setup (END) ---





// // Database Connection & Server Start
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅ MongoDB connected successfully');
//     startReminderJobs();
//     const PORT = process.env.PORT || 5001;
//     server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
//   })
//   .catch(err => console.error('❌ MongoDB connection error:', err));
const express = require('express');
const http = require('http'); // ADDED for Socket.IO
const { Server } = require('socket.io'); // ADDED for Socket.IO
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // ADDED for Socket.IO Auth

// Load environment variables
dotenv.config();

// Import Models
const Message = require('./models/Message');
const Notification = require('./models/Notification');

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
// This order is crucial if Stripe webhooks send raw bodies.
app.use('/api/payments/webhook', paymentRoutes); // MOVED THIS HERE

app.use(express.json()); // Enable JSON body parsing for Express

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Use this for both Express and Socket.IO
  optionsSuccessStatus: 200,
  credentials: true, // IMPORTANT: Ensure this is here for cookies/auth headers
};
app.use(cors(corsOptions)); // Apply CORS middleware

// Mount All API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes); // NOTE: This payment route is distinct from the webhook
app.use('/api/provider', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);


// Import Cron Jobs
const startReminderJobs = require('./cron/reminderJobs');

// --- Socket.IO Setup (START) ---
const server = http.createServer(app); // Create HTTP server using the Express app
const io = new Server(server, { // Pass the HTTP server to Socket.IO
  cors: corsOptions, // Use the same CORS options for Socket.IO for consistency
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

  // If authentication middleware worked, socket.user should be available
  if (socket.user) {
    console.log('Authenticated Socket.IO user ID:', socket.user.id);
    socket.join(socket.user.id); // Join a user-specific room for private messaging
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

    // In a real app, you would typically save the message to your database first.
    // Example:
    /*
    try {
      const savedMessage = await Message.create({
        conversation: messageData.conversationId,
        sender: messageData.sender,
        text: messageData.text,
      });
      // Then emit the saved message (with its DB-generated ID and timestamp)
      io.to(messageData.conversationId).emit('receiveMessage', savedMessage);
    } catch (dbError) {
      console.error('Error saving message to DB:', dbError);
      // Optionally emit an error back to the sender
      socket.emit('messageError', 'Failed to send message: DB error.');
    }
    */
    // For now, directly emit the received data
    io.to(messageData.conversationId).emit('receiveMessage', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from Socket.IO:', socket.id);
  });
});

console.log('Socket.IO server initialized.'); // Confirmation log
// --- Socket.IO Setup (END) ---


// Database Connection & Server Start (remains at the bottom, using 'server.listen')
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    startReminderJobs();
    const PORT = process.env.PORT || 5001; // Use the same PORT for HTTP/Socket.IO server
    server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`)); // Listen on the HTTP server
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));