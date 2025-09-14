const cron = require('node-cron');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const startReminderJobs = () => {
  // This cron job runs every day at 9:00 AM server time
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily reminder job...');
    
    // Calculate the date range for "tomorrow"
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Set time to the start and end of the day for an accurate query
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    try {
      const upcomingBookings = await Booking.find({
        bookingDate: { $gte: startOfTomorrow, $lte: endOfTomorrow },
        status: 'Confirmed', // Only remind for confirmed bookings
      }).populate('service user provider');

      console.log(`Found ${upcomingBookings.length} upcoming bookings for tomorrow.`);

      for (const booking of upcomingBookings) {
        // Create notification for the user
        await Notification.create({
          user: booking.user._id,
          message: `Reminder: Your booking for "${booking.service.title}" is tomorrow at ${booking.timeSlot}.`,
          link: '/my-bookings',
        });

        // Create notification for the provider
        await Notification.create({
          user: booking.provider._id,
          message: `Reminder: You have a booking with ${booking.user.name} for "${booking.service.title}" tomorrow at ${booking.timeSlot}.`,
          link: '/dashboard',
        });
      }
    } catch (error) {
      console.error('Error running reminder job:', error);
    }
  });
};

module.exports = startReminderJobs;