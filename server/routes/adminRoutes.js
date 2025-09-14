const express = require('express');
const router = express.Router();
const { getAllUsers, deleteService } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/users').get(protect, admin, getAllUsers);
router.route('/services/:id').delete(protect, admin, deleteService);

module.exports = router;