// backend/controllers/reviewController.js

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/NotificationModel'); // Assuming your Notification model is here

// @desc    Create a new review
// @route   POST /api/reviews
exports.createReview = async (req, res) => {
  // IMPORTANT: The frontend must send 'bookingId' along with serviceId, rating, and comment
  const { serviceId, bookingId, rating, comment } = req.body;
  const user = req.user._id;

  try {
    // 1. Find the specific booking that this review is for
    //    Ensure it's for the current user and is completed
    const booking = await Booking.findOne({
      _id: bookingId,      // Match the specific booking ID
      user: user,          // Ensure it belongs to the current user
      service: serviceId,  // Ensure it's for the correct service
      status: 'Completed', // Ensure the booking is completed
    }).populate('provider', 'name'); // Populate provider for notification recipient

    if (!booking) {
      return res.status(403).json({ message: 'Booking not found or not eligible for review (must be completed by you).' });
    }

    // 2. Check if THIS SPECIFIC BOOKING has already been reviewed
    //    We use the 'hasBeenReviewed' flag on the booking itself
    if (booking.hasBeenReviewed) {
      return res.status(400).json({ message: 'This specific booking has already been reviewed.' });
    }

    // 3. Create the new review
    const review = new Review({
      service: serviceId,
      booking: bookingId, // Store the booking ID with the review
      user: user,
      rating,
      comment,
    });

    await review.save();

    // 4. Update the Booking document to mark it as reviewed
    booking.hasBeenReviewed = true;
    booking.review = review._id; // Link the review to the booking (if you have this field)
    await booking.save();

    // 5. Update the Service's average rating and number of reviews
    const service = await Service.findById(serviceId);
    if (service) { // Ensure service exists
      const reviews = await Review.find({ service: serviceId });
      const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
      service.averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;
      service.numReviews = reviews.length;
      await service.save();
    }

    // 6. Create a notification for the provider (critical for preventing crashes!)
    //    Wrap in try...catch to prevent email/notification errors from crashing main process
    try {
        await Notification.create({
            recipient: booking.provider._id, // Using the populated provider ID
            type: 'newReview',
            message: `You received a ${rating}-star review for your service "${service.title}".`,
            link: `/provider/reviews/${review._id}`, // Link to the new review or booking
        });
        console.log("Notification created for provider.");
    } catch (notificationError) {
        console.error("Error creating notification for provider:", notificationError);
        // Do NOT return or throw here, let the review creation process complete
    }


    res.status(201).json({ message: 'Review added successfully', review }); // Return the review for client-side updates if needed
  } catch (error) {
    console.error("Error in createReview:", error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};


// const Review = require('../models/Review');
// const Booking = require('../models/Booking');
// const Service = require('../models/Service');

// // @desc    Create a new review
// // @route   POST /api/reviews
// exports.createReview = async (req, res) => {
//   const { serviceId, rating, comment } = req.body;

//   try {
//     // 1. Check if the user has a completed booking for this service
//     const completedBooking = await Booking.findOne({
//       service: serviceId,
//       user: req.user._id,
//       status: 'Completed',
//     });

//     if (!completedBooking) {
//       return res.status(403).json({ message: 'You can only review services with a completed booking.' });
//     }

//     // 2. Check if the user has already reviewed this service
//     const alreadyReviewed = await Review.findOne({
//       service: serviceId,
//       user: req.user._id,
//     });

//     if (alreadyReviewed) {
//       return res.status(400).json({ message: 'You have already reviewed this service.' });
//     }

//     // 3. Create the new review
//     const review = new Review({
//       service: serviceId,
//       user: req.user._id,
//       rating,
//       comment,
//     });

//     await review.save();

//     // 4. (Optional but recommended) Update the average rating on the Service model
//     const service = await Service.findById(serviceId);
//     // This is a simplified average calculation. A real-world app might handle this more robustly.
//     const reviews = await Review.find({ service: serviceId });
//     const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
//     service.averageRating = totalRating / reviews.length;
//     service.numReviews = reviews.length;
//     await service.save();


//     res.status(201).json({ message: 'Review added successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error: ' + error.message });
//   }
// };