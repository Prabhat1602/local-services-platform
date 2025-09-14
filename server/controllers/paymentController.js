const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        const booking = await Booking.findById(bookingId).populate('service user');
        
        if (booking) {
            booking.isPaid = true;
            booking.paidAt = new Date();
            booking.status = 'Confirmed';
            await booking.save();

            // --- THIS IS THE FIX ---
            // Find the provider and update their earnings total
            const provider = await User.findById(booking.service.provider);
            if(provider) {
                // Add the price of the service to the provider's current earnings
                provider.earnings = (provider.earnings || 0) + booking.service.price;
                await provider.save();
            }
            // --- END FIX ---
                 await Transaction.create({
                booking: bookingId,
                user: booking.user._id,
                provider: booking.provider._id,
                amount: booking.service.price,
                stripePaymentId: session.payment_intent,
            });
            // Create notifications (this part is the same as before)
            await Notification.create({
                user: booking.user._id,
                message: `Your payment for "${booking.service.title}" was successful!`,
                link: '/my-bookings'
            });
            await Notification.create({
                user: booking.provider,
                message: `A new booking for "${booking.service.title}" has been paid for.`,
                link: '/dashboard'
            });
             }
    }

    res.json({ received: true });
};