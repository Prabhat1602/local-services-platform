const express = require('express');
const router = express.Router();
const { getProviderStats } = require('../controllers/providerController');
const { protect, provider } = require('../middleware/authMiddleware');

// Protect this route to ensure only logged-in providers can access it
router.route('/stats').get(protect, provider, getProviderStats);

module.exports = router;