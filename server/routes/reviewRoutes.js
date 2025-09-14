const express = require('express');
const router = express.Router();
const { createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Any logged-in user can create a review (logic is in the controller)
router.route('/').post(protect, createReview);

module.exports = router;