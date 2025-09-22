const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Service',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
    booking: { // <--- ADD THIS FIELD
      type: mongoose.Schema.Types.ObjectId,
      required: true, // A review must be for a specific booking
      ref: 'Booking',
    },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
   isVisible: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);