// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Import the whole module
const { protect, admin } = require('../middleware/authMiddleware');

// Protect all admin routes with 'protect' (logged in) and 'admin' (admin role) middleware
router.route('/stats').get(protect, admin, adminController.getAdminStats);
router.route('/users').get(protect, admin, adminController.getAllUsers);
router.route('/users/:id/status').put(protect, admin, adminController.updateProviderStatus);
router.route('/users/:id').delete(protect, admin, adminController.deleteUser);

// Add routes for other admin functions
router.route('/bookings').get(protect, admin, adminController.getAllBookings);
router.route('/bookings/:id/resolve').put(protect, admin, adminController.resolveDispute);
router.route('/reviews').get(protect, admin, adminController.getAllReviews);
router.route('/reviews/:id/toggle-visibility').put(protect, admin, adminController.toggleReviewVisibility);
router.route('/transactions').get(protect, admin, adminController.getAllTransactions);

// You might have a separate route for deleting services if needed
// router.route('/services/:id').delete(protect, admin, adminController.deleteService);

module.exports = router;