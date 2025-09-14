const Service = require('../models/Service');
const geolib = require('geolib');
// @desc    Create a new service
// @route   POST /api/services
// ... (imports and existing functions)

exports.createService = async (req, res) => {
  const { title, category, description, price } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image for the service.' });
  }

  try {
    const service = new Service({
      title,
      category,
      description,
      price,
      provider: req.user._id,
      image: req.file.path, // Get the image URL from multer/cloudinary
    });

    const createdService = await service.save();
    res.status(201).json(createdService);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all services (or search by keyword)
// @route   GET /api/services

exports.getServices = async (req, res) => {
  try {
    // FIX: Define 'keyword' before using it.
    const keyword = req.query.search
      ? {
          $or: [
            { title: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    let services = await Service.find({ ...keyword })
      .populate('provider', 'name email location')
      .lean();

    if (req.query.lat && req.query.lon) {
      const userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon),
      };

      services = services.map(service => {
        if (service.provider.location?.coordinates.length === 2) {
          const providerLocation = {
            latitude: service.provider.location.coordinates[1],
            longitude: service.provider.location.coordinates[0],
          };
          const distanceInMeters = geolib.getDistance(userLocation, providerLocation);
          const distanceInKm = (distanceInMeters / 1000).toFixed(1);
          return { ...service, distance: `${distanceInKm} km` };
        }
        return { ...service, distance: 'N/A' };
      });
    }
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
    



// @desc    Get services for the logged-in provider
// @route   GET /api/services/myservices
exports.getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Set availability for a service
// @route   PUT /api/services/:id/availability
exports.setServiceAvailability = async (req, res) => {
  const { availability } = req.body;
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    service.availability = availability;
    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get a single service by ID
// @route   GET /api/services/:id
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('provider', 'name email');
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};