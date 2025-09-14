const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile ,getUserTransactions } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

  router.route('/transactions').get(protect, getUserTransactions);
module.exports = router;