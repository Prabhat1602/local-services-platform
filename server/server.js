const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

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

// Import Cron Jobs
const startReminderJobs = require('./cron/reminderJobs');

// Initialize App
const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Stripe webhook must be before express.json()
app.use('/api/payments/webhook', paymentRoutes);

// Body Parser Middleware
app.use(express.json());

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

const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CLIENT_URL, // Your frontend URL
        methods: ["GET", "POST"]
    }
})

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  const createAndEmitNotification = async (userId, message, link) => {
    // ... notification logic ...
  };
 console.log('Socket.IO server initialized.'); // Add this log
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('sendMessage', async (data) => {
    const { conversationId, sender, text, receiverId } = data;
    const message = new Message({ conversationId, sender, text });
    await message.save();
    io.to(conversationId).emit('receiveMessage', message);
    await createAndEmitNotification(receiverId, `You have a new message.`, `/chat`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    startReminderJobs();
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));