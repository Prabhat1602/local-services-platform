const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const { storage } = require('../config/cloudinary'); // Import our cloudinary storage config
const upload = multer({ storage }); // Initialize multer with our storage config

const {
  createService,
  getServices,
  getServiceById, 
   setServiceAvailability,
    getMyServices,// Import the new function
} = require('../controllers/serviceController');
const { protect, provider } = require('../middleware/authMiddleware');

// GET /api/services (public route)
// POST /api/services (private route for providers)
router.route('/')
  .get(getServices)
  .post(protect, provider, upload.single('image'), createService);

router.route('/myservices').get(protect, provider, getMyServices);
router.route('/').get(getServices).post(protect, provider, createService);
router.route('/:id').get(getServiceById);
router.route('/:id/availability').put(protect, provider, setServiceAvailability);
module.exports = router;