const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { // The user who receives the notification
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: { // A URL to navigate to when the notification is clicked
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);