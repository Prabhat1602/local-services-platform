const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile ,getUserTransactions, forgotPassword,resetPassword, } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');


router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

  router.route('/transactions').get(protect, getUserTransactions);
module.exports = router;