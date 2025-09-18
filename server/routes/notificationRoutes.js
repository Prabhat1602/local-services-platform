// const express = require('express');
// const router = express.Router();
// const { getNotifications, markAsRead } = require('../controllers/notificationController');
// const { protect } = require('../middleware/authMiddleware');

// router.route('/').get(protect, getNotifications);
// router.route('/read').put(protect, markAsRead);

// module.exports = router;
// server/routes/notificationRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.route('/')
  .get(protect, getNotifications); // Get all notifications for the authenticated user

router.route('/:id/read')
  .put(protect, markNotificationAsRead); // Mark a specific notification as read

router.route('/read-all')
  .put(protect, markAllNotificationsAsRead); // Mark all notifications as read

module.exports = router;