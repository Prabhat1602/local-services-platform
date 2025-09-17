const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and attach it to the request object
      req.user = await User.findById(decoded.id).select('-password');
      next();
    }catch (error) {
      console.error(error); // Add some logging here for better debugging
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else { // Added else block for clarity if token is not in header
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

 

// Middleware to check if the user is a provider
const provider = (req, res, next) => {
  if (req.user && req.user.role === 'provider') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a provider' });
  }
};

const admin = (req, res, next) => { // This function is defined
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

// --- THIS IS THE CRITICAL FIX ---
module.exports = { protect, provider, admin }; // <<< Add 'admin' here