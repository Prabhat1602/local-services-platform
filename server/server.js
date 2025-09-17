// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const mongoose = require('mongoose');

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

// // Import Cron Jobs
// const startReminderJobs = require('./cron/reminderJobs');

// // Initialize App
// const app = express();
// const server = http.createServer(app);

// // CORS Configuration
// const corsOptions = {
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// // Stripe webhook must be before express.json()
// app.use('/api/payments/webhook', paymentRoutes);

// // Body Parser Middleware
// app.use(express.json());

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

// const io = require('socket.io')(server, {
//     cors: {
//         origin: process.env.CLIENT_URL, // Your frontend URL
//         methods: ["GET", "POST"]
//     }
// })

// // Socket.IO Connection Logic
// io.on('connection', (socket) => {
//   console.log('🔌 A user connected:', socket.id);

//   const createAndEmitNotification = async (userId, message, link) => {
//     // ... notification logic ...
//   };
//  console.log('Socket.IO server initialized.'); // Add this log
//   socket.on('joinConversation', (conversationId) => {
//     socket.join(conversationId);
//   });

//   socket.on('sendMessage', async (data) => {
//     const { conversationId, sender, text, receiverId } = data;
//     const message = new Message({ conversationId, sender, text });
//     await message.save();
//     io.to(conversationId).emit('receiveMessage', message);
//     await createAndEmitNotification(receiverId, `You have a new message.`, `/chat`);
//   });

//   socket.on('disconnect', () => {
//     console.log('🔌 User disconnected:', socket.id);
//   });
// });

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
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Assuming you have chat routes
const reviewRoutes = require('./routes/reviewRoutes'); // Assuming you have review routes
const transactionRoutes = require('./routes/transactionRoutes'); // Assuming you have transaction routes
const adminRoutes = require('./routes/adminRoutes'); // Admin routes
const availabilityRoutes = require('./routes/availabilityRoutes');

const http = require('http'); // Import http for socket.io
const { Server } = require('socket.io'); // Import Server from socket.io

const path = require('path');
const cors = require('cors');

dotenv.config();

connectDB();

const app = express();

// --- CORS Configuration (Important for both REST and Socket.IO) ---
app.use(cors({
  origin: process.env.CLIENT_URL, // Ensure this matches your frontend URL
  credentials: true,
}));

app.use(express.json()); // To parse JSON body

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes); // Chat REST API routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/availability', availabilityRoutes);


// --- Deployment Check (Serve Frontend) ---
// Not directly relevant to the current Socket.IO issue, but good to keep in mind
// This block might cause issues if your frontend is deployed separately (e.g., Vercel)
// It's generally better to let Vercel handle serving the frontend
// and Render handle serving only the backend API.
/*
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}
*/

// --- Socket.IO Setup ---
const server = http.createServer(app); // Create HTTP server using the Express app
const io = new Server(server, { // Pass the HTTP server to Socket.IO
  cors: {
    origin: process.env.CLIENT_URL, // Frontend URL for CORS
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
});

// --- Socket.IO Middleware for Authentication ---
// You mentioned you don't have socketAuth middleware, but your frontend sends a token.
// So, we NEED to implement this here or your connections will be unauthenticated
// and your backend `io.on('connection')` might not have user info.
const jwt = require('jsonwebtoken'); // Need jwt for token verification

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
    // Join a user-specific room for private messaging
    socket.join(socket.user.id);
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

    // TODO: In a real app, you would save this message to your database first
    // before emitting. This prevents messages from being lost if the DB write fails.
    // const newMessage = await Message.create(messageData);
    // io.to(messageData.conversationId).emit('receiveMessage', newMessage);

    // For now, directly emit the received data
    io.to(messageData.conversationId).emit('receiveMessage', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from Socket.IO:', socket.id);
  });
});

console.log('Socket.IO server initialized.'); // Confirmation log

const PORT = process.env.PORT || 5000;

// Listen on the HTTP server, not the Express app directly
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));