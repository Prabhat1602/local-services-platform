// server/controllers/notificationController.js
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler'); // If you use this, otherwise remove
const User = require('../models/User'); // For populating sender details

// @desc    Get notifications for authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'name profilePicture') // Populate sender info
    .sort({ createdAt: -1 }); // Newest first

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

  res.json({ notifications, unreadCount });
});

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id }, // Ensure user owns notification
    { isRead: true },
    { new: true } // Return the updated document
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found or not authorized.');
  }

  res.json({ message: 'Notification marked as read', notification });
});

// @desc    Mark all notifications for authenticated user as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: 'All notifications marked as read' });
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};


