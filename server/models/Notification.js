// server/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: { // Who triggered the notification (e.g., sender of a message)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Not all notifications have a direct sender
  },
  type: { // e.g., 'new_message', 'booking_update', 'review_pending'
    type: String,
    required: true,
  },
  message: { // User-friendly message to display
    type: String,
    required: true,
  },
  link: { // Optional: URL to navigate to when clicking the notification
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  // If notification is chat-related, store conversationId
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  // You can add other fields specific to your app's needs
  // Example: bookingId, reviewId, etc.
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);




