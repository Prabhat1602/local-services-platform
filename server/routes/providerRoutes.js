const express = require('express');
const router = express.Router();
const { getProviderStats,getProviderTransactions } = require('../controllers/providerController');
const { protect, provider } = require('../middleware/authMiddleware');

// Protect this route to ensure only logged-in providers can access it
router.route('/stats').get(protect, provider, getProviderStats);
router.route('/transactions').get(protect, provider, getProviderTransactions);
module.exports = router;