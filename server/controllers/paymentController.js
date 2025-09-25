const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');
const sendEmail = require('../utils/emailService'); // Import the service
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
      success_url: `https://local-services-platform.vercel.app/my-bookings`, // Redirect to bookings page on success
      cancel_url: `https://local-services-platform.vercel.app/my-bookings`,  // Redirect to bookings page on cancel
      metadata: {
        bookingId: booking._id.toString(),
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

exports.handleStripeWebhook = async (req, res) => {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        try {
            // --- FIX FOR DUPLICATE TRANSACTION ERROR ---
            const existingTransaction = await Transaction.findOne({ stripePaymentId: session.payment_intent });
            if (existingTransaction) {
                console.log('Webhook received for an already processed transaction.');
                return res.json({ received: true }); // Acknowledge the event to prevent retries
            }
            // --- END FIX ---

            const booking = await Booking.findById(bookingId).populate('service user provider');
            
            if (booking && !booking.isPaid) {
                booking.isPaid = true;
                booking.paidAt = new Date();
                booking.status = 'Confirmed';
                await booking.save();

                const provider = await User.findById(booking.provider._id);
                if(provider) {
                    provider.earnings = (provider.earnings || 0) + booking.service.price;
                    await provider.save();
                }

                await Transaction.create({
                    booking: bookingId,
                    user: booking.user._id,
                    provider: booking.provider._id,
                    amount: booking.service.price,
                    stripePaymentId: session.payment_intent,
                });

                // --- FIX FOR NOTIFICATION VALIDATION ERROR ---
                // Create a notification for the user
                await Notification.create({
                    recipient: booking.user._id,
                    type: 'payment_success',
                    message: `Your payment for "${booking.service.title}" was successful!`,
                    link: '/my-bookings'
                });
                // Create a notification for the provider
                await Notification.create({
                    recipient: booking.provider._id,
                    type: 'new_booking',
                    message: `A new booking for your service "${booking.service.title}" has been paid for.`,
                    link: '/dashboard'
                });
                // --- END FIX ---
            }
        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }

    res.json({ received: true });
};
