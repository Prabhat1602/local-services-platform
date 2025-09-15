// server/controllers/adminController.js
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction'); // Ensure Transaction model is defined and imported

// @desc    Get all users (excluding password)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: 'Server Error: Failed to fetch all users' });
  }
};

// @desc    Get platform statistics for admin dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => { // Renamed to getAdminStats and using exports
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Calculate total revenue from completed and paid bookings
    const pipeline = [
      { $match: { status: 'Completed', isPaid: true } }, // Match completed and paid bookings
      { $lookup: {
          from: 'services', // The name of the collection for services (must match your model's collection name)
          localField: 'service', // Field in Booking model
          foreignField: '_id',   // Field in Service model
          as: 'serviceDetails'
      }},
      { $unwind: '$serviceDetails' }, // Deconstructs the serviceDetails array field from the input documents to output a document for each element.
      { $group: {
          _id: null, // Group all documents into one
          totalRevenue: { $sum: '$serviceDetails.price' } // Sum the price from serviceDetails
      }}
    ];
    const revenueResult = await Booking.aggregate(pipeline);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const reviewStats = await Review.aggregate([
      { $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
      }}
    ]);
    const averageRating = reviewStats.length > 0 ? reviewStats[0].averageRating.toFixed(1) : 0;

    res.json({
      totalUsers,
      totalServices,
      totalBookings,
      totalRevenue,
      averageRating,
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({ message: 'Server Error: Failed to fetch admin statistics' });
  }
};


// @desc    Update provider status (Approved/Rejected)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateProviderStatus = async (req, res) => { // Using exports
    try {
        const { id } = req.params;
        const { status } = req.body; // Expects 'Approved' or 'Rejected'

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'provider') {
            return res.status(400).json({ message: 'User is not a provider' });
        }

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid provider status provided.' });
        }

        user.providerStatus = status;
        await user.save();

        res.json({ message: `Provider ${user.name} status updated to ${status}` });

    } catch (error) {
        console.error('Error in updateProviderStatus:', error);
        res.status(500).json({ message: 'Server Error: Failed to update provider status' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => { // Using exports
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves or other admins accidentally
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete an admin user.' });
        }

        await user.deleteOne(); // Use deleteOne() or remove() depending on Mongoose version

        res.json({ message: 'User removed' });

    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ message: 'Server Error: Failed to delete user' });
    }
};


// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'title')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    res.status(500).json({ message: 'Server Error: Failed to fetch bookings' });
  }
};

// @desc    Resolve a disputed booking
// @route   PUT /api/admin/bookings/:id/resolve
// @access  Private/Admin
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
        console.error('Error in resolveDispute:', error);
        res.status(500).json({ message: 'Server Error: Failed to resolve dispute' });
    }
};


// @desc    Get all reviews on the platform
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name')
      .populate('service', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error in getAllReviews:', error);
    res.status(500).json({ message: 'Server Error: Failed to fetch reviews' });
  }
};

// @desc    Toggle a review's visibility
// @route   PUT /api/admin/reviews/:id/toggle-visibility
// @access  Private/Admin
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
    console.error('Error in toggleReviewVisibility:', error);
    res.status(500).json({ message: 'Server Error: Failed to toggle review visibility' });
  }
};


// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'name')
      .populate('provider', 'name')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    res.status(500).json({ message: 'Server Error: Failed to fetch transactions' });
  }
};

// Removed `module.exports = { ... }` because we are using `exports.functionName` for each function.
// This makes all declared `exports.functionName` directly available for import.