const express = require('express');
const router = express.Router();
const { getAllUsers, deleteService , updateProviderStatus,
      getAllBookings, // Import new function
  resolveDispute, // Import new function
    getAllReviews,            // Import new function
  toggleReviewVisibility,
   getStats,
    getAllTransactions, 
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { getAllFeedback } = require('../controllers/feedbackController');
router.route('/users').get(protect, admin, getAllUsers);
router.route('/services/:id').delete(protect, admin, deleteService);
router.route('/providers/:id/status').put(protect, admin, updateProviderStatus);
router.route('/bookings').get(protect, admin, getAllBookings);
router.route('/bookings/:id/resolve').put(protect, admin, resolveDispute);
// Add routes for moderating reviews
router.route('/reviews').get(protect, admin, getAllReviews);
router.route('/reviews/:id/toggle-visibility').put(protect, admin, toggleReviewVisibility);
router.route('/stats').get(protect, admin, getStats);
router.route('/transactions').get(protect, admin, getAllTransactions);
router.route('/feedback').get(protect, admin, getAllFeedback);
module.exports = router;