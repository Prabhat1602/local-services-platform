// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
// Check this import carefully:
const { protect, admin } = require('../middleware/authMiddleware'); // <<< THIS LINE


// If you have a separate feedback controller, import it here:
const feedbackController = require('../controllers/feedbackController');


// Protect ALL admin routes with 'protect' (logged in) and 'admin' (admin role) middleware
// Use adminController.functionName for clarity and consistency

router.route('/stats').get(protect, admin, adminController.getAdminStats); // Approx line 22
router.route('/users').get(protect, admin, adminController.getAllUsers);
router.route('/users/:id/status').put(protect, admin, adminController.updateProviderStatus);
router.route('/users/:id').delete(protect, admin, adminController.deleteUser); // For deleting users

router.route('/bookings').get(protect, admin, adminController.getAllBookings);
router.route('/bookings/:id/resolve').put(protect, admin, adminController.resolveDispute);

router.route('/reviews').get(protect, admin, adminController.getAllReviews);
router.route('/reviews/:id/toggle-visibility').put(protect, admin, adminController.toggleReviewVisibility);

router.route('/transactions').get(protect, admin, adminController.getAllTransactions);


// If you have a separate delete service function in adminController:
// router.route('/services/:id').delete(protect, admin, adminController.deleteService);

// If you have a separate feedback controller and route:
 router.route('/feedback').get(protect, admin, feedbackController.getAllFeedback);


module.exports = router;

