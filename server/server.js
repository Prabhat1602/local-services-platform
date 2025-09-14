const express = require('express');
const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import socket.io
const dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Example
const paymentController = require('./controllers/paymentController');
const cors = require('cors');
const mongoose = require('mongoose');
const paymentRoutes = require('./routes/paymentRoutes');
// Route files
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
 // Import user routes
const Message = require('./models/Message'); // Import the Message model
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Import chat routes
const Notification = require('./models/Notification');
const notificationRoutes = require('./routes/notificationRoutes')
const startReminderJobs = require('./cron/reminderJobs'); 
const providerRoutes = require('./routes/providerRoutes');

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app
const io = new Server(server, { // Attach socket.io to the HTTP server
  cors: {
    origin: 'http://localhost:3000', // Allow connections from our frontend
    methods: ['GET', 'POST'],
  },
});
app.use('/api/payments/webhook', paymentRoutes);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // General JSON parser
// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Start the cron jobs after the DB is connected
    startReminderJobs();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
// Mount Routers
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes); // Mount user routes
app.use('/api/chat', chatRoutes); // Mount chat routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes); 
// Socket.IO Connection Logic
// --- UPDATED Socket.IO LOGIC ---
io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  // Helper function to create and send a notification
  const createAndEmitNotification = async (userId, message, link) => {
    try {
      const notification = new Notification({ user: userId, message, link });
      await notification.save();
      // Send the notification only to the specific user's room
      io.to(userId).emit('newNotification', notification);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('sendMessage', async (data) => {
    const { conversationId, sender, text, receiverId } = data;
    
    // Save the message to the database
    const message = new Message({ conversationId, sender, text });
    await message.save();

    // Broadcast the message to everyone in the conversation room
    io.to(conversationId).emit('receiveMessage', message);

    // --- ADDED NOTIFICATION LOGIC ---
    // Create a notification for the receiver
    await createAndEmitNotification(
      receiverId,
      `You have a new message from a user.`, // In a real app, you'd fetch the sender's name
      `/chat` // Link to the chat page
    );
    // --- END NOTIFICATION LOGIC ---
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });


  // Example: Listen for a booking creation event to send a notification
  socket.on('newBooking', async ({ providerId, userId }) => {
    // You would add .emit('newBooking') in your frontend booking handler
    await createAndEmitNotification(providerId, 'You have a new booking request!', '/dashboard');
  });
});
// --- END UPDATE ---

const PORT = process.env.PORT || 5001;
// Start the server using server.listen() instead of app.listen()
server.listen(PORT, () => console.log(`🚀 Server (with chat) is running on port ${PORT}`));