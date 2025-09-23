const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification'); // For Mailgun/email utility
const crypto = require('crypto'); // For password reset token
const asyncHandler = require('express-async-handler'); // If you use this for error handling
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




// Assuming you have an email utility function or integrate Mailgun directly here

// Utility function to send email (adjust as per your Mailgun integration)
const sendEmail = async (options) => {
    // This is a placeholder. You need to integrate your Mailgun logic here.
    // Example using Mailgun SDK (install 'mailgun.js' and 'form-data')
    // const formData = require('form-data');
    // const Mailgun = require('mailgun.js');
    // const mailgun = new Mailgun(formData);
    // const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
    
    // try {
    //     await mg.messages.create(process.env.MAILGUN_DOMAIN, {
    //         from: options.from,
    //         to: options.to,
    //         subject: options.subject,
    //         html: options.html,
    //     });
    //     console.log('Email sent successfully!');
    // } catch (error) {
    //     console.error('Error sending email:', error);
    //     throw new Error('Failed to send email.');
    // }
    console.log(`Sending email to ${options.to} with subject ${options.subject}`);
    console.log(`Email content: ${options.html}`);
    // For now, you can just log. Later replace with actual Mailgun code.
};


// @desc    Request Password Reset (send reset email)
// @route   POST /api/users/forgotpassword
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User with that email not found.');
  }

  // Get reset token from user model
  const resetToken = user.getResetPasswordToken(); // This updates user model
  await user.save({ validateBeforeSave: false }); // Save user with new token and expiry

  // Create reset URL
  // Frontend URL for password reset page
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password:</p>
    <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
    <p>This link will expire in 15 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  try {
    await sendEmail({
      to: user.email,
      from: process.env.EMAIL_FROM, // e.g., 'noreply@yourdomain.com'
      subject: 'Password Reset Request',
      html: message,
    });

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Error sending reset email:', error);
    res.status(500);
    throw new Error('Email could not be sent. Please try again later.');
  }
});


// @desc    Reset User Password
// @route   PUT /api/users/resetpassword/:resetToken
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token from URL parameter
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token.');
  }

  if (req.body.password !== req.body.confirmPassword) {
      res.status(400);
      throw new Error('Passwords do not match.');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save(); // pre('save') hook will hash the new password

  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

// ... your existing loginUser, registerUser, etc. functions