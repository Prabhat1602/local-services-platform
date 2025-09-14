const express = require('express');
const router = express.Router();
const { createFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createFeedback);

module.exports = router;