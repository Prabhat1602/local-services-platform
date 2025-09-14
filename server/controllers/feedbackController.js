const Feedback = require('../models/Feedback');

// @desc    Create new feedback
// @route   POST /api/feedback
exports.createFeedback = async (req, res) => {
  const { subject, message, type } = req.body;
  try {
    const feedback = new Feedback({
      user: req.user._id,
      subject,
      message,
      type,
    });
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully. We will get back to you shortly.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all feedback (Admin only)
// @route   GET /api/admin/feedback
exports.getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({}).populate('user', 'name email').sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};