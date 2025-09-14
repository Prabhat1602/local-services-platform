const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleStripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/create-checkout-session').post(protect, createCheckoutSession);

// Stripe webhook endpoint needs to be a raw body, so we define it separately
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;