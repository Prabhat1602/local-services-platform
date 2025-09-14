const User = require('../models/User');
const Transaction = require('../models/Transaction');
// @desc    Get user profile
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
  // req.user is available from our 'protect' middleware
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    // ... (password update logic)

    // Add this logic to update location
    if (req.body.location) {
      user.location = {
        type: 'Point',
        coordinates: [req.body.location.lng, req.body.location.lat],
      };
    }

    const updatedUser = await user.save();
    res.json({ /* ... updated user details ... */ });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
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