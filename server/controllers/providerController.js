const Booking = require('../models/Booking');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');
// @desc    Get earnings and stats for the logged-in provider
// @route   GET /api/provider/stats
exports.getProviderStats = async (req, res) => {
  try {
    const providerId = req.user._id;

    // We need the User model to find the provider
    const provider = await User.findById(providerId);
    if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
    }

    const stats = {
      totalBookings: await Booking.countDocuments({ provider: providerId }),
      completedBookings: await Booking.countDocuments({ provider: providerId, status: 'Completed' }),
      totalRevenue: provider.earnings || 0,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};
exports.getProviderTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ provider: req.user._id })
      .populate({
          path: 'booking',
          populate: { path: 'service', select: 'title' }
      })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};