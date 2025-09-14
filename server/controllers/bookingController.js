const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/Review'); // Ensure this is imported
// @desc    Create a new booking
// @route   POST /api/bookings
// REWRITE createBooking to handle slots
exports.createBooking = async (req, res) => {
  const { serviceId, bookingDate, timeSlot } = req.body;

  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the slot is already booked
    const existingBooking = await Booking.findOne({ service: serviceId, bookingDate, timeSlot, status: { $ne: 'Cancelled' } });
    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is no longer available.' });
    }

    const booking = new Booking({
      service: serviceId,
      user: req.user._id,
      provider: service.provider,
      bookingDate,
      timeSlot,
      status: 'Pending', // The booking starts as 'Pending'
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};


// @desc    Get all bookings for the logged-in provider
// @route   GET /api/bookings/mybookings
exports.getProviderBookings = async (req, res) => {
  try {
    // Find bookings where the provider field matches the logged-in user's ID
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('service', 'title price') // Get service title and price
      .populate('user', 'name email');   // Get the user's name and email

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};



// ... (imports)


// ... (keep the other controller functions)

// @desc    Get all bookings for the logged-in USER
// @route   GET /api/bookings/myuserbookings
exports.getUserBookings = async (req, res) => {
  try {
    // Get all of the user's bookings
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service', 'title price')
      .populate('provider', 'name email')
          .sort({ createdAt: -1 }) // <-- ADD THIS LINE
      .lean(); // .lean() makes the data plain objects, easier to modify
      
    // For each booking, check if a review exists
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const review = await Review.findOne({
          service: booking.service._id,
          user: req.user._id,
        });
        return {
          ...booking,
          hasBeenReviewed: !!review, // Add true/false flag
        };
      })
    );

    res.json(bookingsWithReviewStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};


// @desc    Update booking status (e.g., confirm or cancel)
// @route   PUT /api/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // --- LOGIC UPDATE ---
    // Allow EITHER the provider OR the user who made the booking to update it
    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isUser = booking.user.toString() === req.user._id.toString();

    // A user can only cancel their own booking
    if (isUser && status !== 'Cancelled') {
      return res.status(401).json({ message: 'User can only cancel bookings' });
    }

    if (!isProvider && !isUser) {
       return res.status(401).json({ message: 'User not authorized to update this booking' });
    }
    // --- END LOGIC UPDATE ---

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};
exports.getBookedSlots = async (req, res) => {
  const { date } = req.query; // Expect date in YYYY-MM-DD format
  try {
    const bookings = await Booking.find({
      service: req.params.serviceId,
      bookingDate: new Date(date),
    });
    const bookedSlots = bookings.map(b => b.timeSlot);
    res.json(bookedSlots);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// ... (imports and existing functions)

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


// @desc    Reschedule a booking
// @route   PUT /api/bookings/:id/reschedule
exports.rescheduleBooking = async (req, res) => {
  const { bookingDate, timeSlot } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 1. Authorization Check: Ensure the user rescheduling is the one who made the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // 2. Availability Check: Ensure the new slot isn't already taken
    const existingBooking = await Booking.findOne({
      service: booking.service,
      bookingDate: new Date(bookingDate),
      timeSlot: timeSlot,
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is no longer available.' });
    }

    // 3. Update the booking
    booking.bookingDate = new Date(bookingDate);
    booking.timeSlot = timeSlot;
    // Optionally reset status if it was confirmed, to require provider re-confirmation
    booking.status = 'Pending'; 

    const updatedBooking = await booking.save();
    res.json(updatedBooking);

  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};
// ... (keep all existing functions)

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure the user deleting the booking is the one who made it
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await booking.deleteOne();

    res.json({ message: 'Booking removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};