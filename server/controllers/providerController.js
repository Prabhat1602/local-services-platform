const Booking = require('../models/Booking');

// @desc    Get earnings and stats for the logged-in provider
// @route   GET /api/provider/stats
exports.getProviderStats = async (req, res) => {
  try {
    const providerId = req.user._id;

    // Find all completed bookings for this provider
    const completedBookings = await Booking.find({
      provider: providerId,
      status: 'Completed',
    }).populate('service', 'price');

    // Calculate total revenue
    const totalRevenue = completedBookings.reduce((acc, booking) => {
      return acc + (booking.service?.price || 0);
    }, 0);
    
    // You can add a platform fee calculation here if you want
    // const platformFee = totalRevenue * 0.10; // Example: 10% fee
    // const netEarnings = totalRevenue - platformFee;

    const stats = {
      totalBookings: await Booking.countDocuments({ provider: providerId }),
      completedBookings: completedBookings.length,
      totalRevenue: totalRevenue,
      // netEarnings: netEarnings, // Uncomment if you add a fee
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};