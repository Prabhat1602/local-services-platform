const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a service
// @route   DELETE /api/admin/services/:id
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      await service.deleteOne();
      res.json({ message: 'Service removed' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// ... (imports and existing functions)

// @desc    Update a provider's status (approve/reject)
// @route   PUT /api/admin/providers/:id/status
exports.updateProviderStatus = async (req, res) => {
  const { status } = req.body; // Expecting 'Approved' or 'Rejected'

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const provider = await User.findById(req.params.id);
    if (provider && provider.role === 'provider') {
      provider.providerStatus = status;
      await provider.save();
      // Here you could also create a notification for the provider
      res.json({ message: `Provider has been ${status}.` });
    } else {
      res.status(404).json({ message: 'Provider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'title')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Resolve a disputed booking
// @route   PUT /api/admin/bookings/:id/resolve
exports.resolveDispute = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (booking) {
            booking.isDisputed = false;
            // Optionally, the admin can force a status change, e.g., to 'Completed' or 'Cancelled'
            // booking.status = 'Completed'; 
            await booking.save();
            res.json({ message: 'Dispute resolved.' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all reviews on the platform
// @route   GET /api/admin/reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name')
      .populate('service', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle a review's visibility
// @route   PUT /api/admin/reviews/:id/toggle-visibility
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (review) {
      review.isVisible = !review.isVisible; // Flip the boolean value
      await review.save();
      res.json({ message: `Review visibility set to ${review.isVisible}` });
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// /server/controllers/adminController.js

// ... (keep all other imports and functions)

// @desc    Get platform statistics for reports
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // --- THIS IS THE FIX ---
    // We calculate revenue from bookings that are marked as paid.
    const totalRevenue = await Booking.aggregate([
      { $match: { isPaid: true } }, // Change from status: 'Completed' to isPaid: true
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceDetails' } },
      { $unwind: '$serviceDetails' },
      { $group: { _id: null, total: { $sum: '$serviceDetails.price' } } }
    ]);
    // --- END FIX ---

    const averageRating = await Review.aggregate([
        { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.json({
      totalUsers,
      totalServices,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageRating: averageRating[0]?.avg.toFixed(2) || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};