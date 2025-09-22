const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Service',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // The user who made the booking
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // The provider of the service
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
   hasBeenReviewed: { // This flag MUST be on the Booking model
      type: Boolean,
      default: false, // Default to false for each new booking
    },
    bookingDate: { type: Date, required: true },   // e.g., 2023-10-27T00:00:00.000Z
  timeSlot: { type: String, required: true }, 
   isDisputed: {
    type: Boolean,
    default: false,
  },
  disputeReason: {
    type: String,
  },
    isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);