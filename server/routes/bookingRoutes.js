const express = require('express');
const router = express.Router();
const {
  createBooking,
  getProviderBookings,
  updateBookingStatus,
  getUserBookings,
  getBookedSlots,
    rescheduleBooking,
      deleteBooking,
} = require('../controllers/bookingController');
const { protect, provider } = require('../middleware/authMiddleware'); // We still need 'provider' for other routes

// Any logged-in user can create a booking
router.route('/').post(protect, createBooking);

// A logged-in user can get their own bookings
router.route('/myuserbookings').get(protect, getUserBookings);

// Routes for providers to manage their bookings
router.route('/mybookings').get(protect, provider, getProviderBookings);

// --- THIS IS THE FIX ---
// The user who booked OR the provider can update the status.
// We remove the 'provider' middleware here. The logic is now inside the controller.
router.route('/:id/status').put(protect, updateBookingStatus);
// --- END OF FIX ---

// Route to get booked slots for a service on a specific date
router.route('/booked-slots/:serviceId').get(getBookedSlots);
router.route('/:id/reschedule').put(protect, rescheduleBooking);
router.route('/:id').delete(protect, deleteBooking);
module.exports = router;