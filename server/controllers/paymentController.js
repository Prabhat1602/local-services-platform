const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/Notification');

// @desc    Create a stripe checkout session
// @route   POST /api/payments/create-checkout-session
exports.createCheckoutSession = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate('service');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to pay for this booking' });
    }

    const service = booking.service;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service.title,
              description: `Booking for ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.timeSlot}`,
            },
            unit_amount: service.price * 100, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/my-bookings`, // Redirect to bookings page on success
      cancel_url: `http://localhost:3000/my-bookings`,  // Redirect to bookings page on cancel
      metadata: {
        bookingId: booking._id.toString(),
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Update booking status after successful payment (called by Stripe Webhook)
// This is an example of a webhook handler. In production, you'd need a more robust setup.
exports.handleStripeWebhook = async (req, res) => {
    const event = req.body;

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        // Find the booking and update its status
        const booking = await Booking.findById(bookingId);
        if (booking) {
            booking.status = 'Confirmed'; // Or you could add a 'paid' boolean field
            await booking.save();

            // Create a notification for the user
            await Notification.create({
                user: booking.user,
                message: `Your payment for "${booking.service.title}" was successful!`,
                link: '/my-bookings'
            });
            // Create a notification for the provider
            await Notification.create({
                user: booking.provider,
                message: `A booking for your service "${booking.service.title}" has been paid for.`,
                link: '/dashboard'
            });
        }
    }

    res.json({ received: true });
};