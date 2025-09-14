import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...your_publishable_key_here...');

// Helper component for the Rescheduling UI
const RescheduleForm = ({ booking, onRescheduleSuccess, onCancel }) => {
  const [selectedDate, setSelectedDate] = useState(new Date(booking.bookingDate));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [service, setService] = useState(null);
  const { token } = JSON.parse(localStorage.getItem('userInfo'));

  const formatDate = (date) => new Date(date).toISOString().split('T')[0];

  useEffect(() => {
    const fetchServiceDetails = async () => {
      const { data } = await axios.get(`http://localhost:5001/api/services/${booking.service._id}`);
      setService(data);
    };
    fetchServiceDetails();
  }, [booking.service._id]);

  useEffect(() => {
    if (!service) return;
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = service.availability.find(a => a.dayOfWeek === dayOfWeek);
    let slots = [];
    if (schedule) {
      let current = parseInt(schedule.startTime.split(':')[0]);
      const end = parseInt(schedule.endTime.split(':')[0]);
      while (current < end) {
        slots.push(`${String(current).padStart(2, '0')}:00`);
        current++;
      }
    }
    setAvailableSlots(slots);
    
    const fetchBookedSlots = async () => {
      const { data: booked } = await axios.get(`http://localhost:5001/api/bookings/booked-slots/${service._id}?date=${formatDate(selectedDate)}`);
      setBookedSlots(booked);
    };
    fetchBookedSlots();
  }, [service, selectedDate]);

  const handleRescheduleSubmit = async (timeSlot) => {
    if (window.confirm(`Reschedule for ${new Date(selectedDate).toLocaleDateString()} at ${timeSlot}?`)) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(`http://localhost:5001/api/bookings/${booking._id}/reschedule`, { bookingDate: formatDate(selectedDate), timeSlot }, config);
        onRescheduleSuccess();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to reschedule.');
      }
    }
  };

  return (
    <div className="reschedule-form">
      <h4>Select a New Date & Time</h4>
      <input type="date" value={formatDate(selectedDate)} onChange={(e) => setSelectedDate(e.target.value)} min={formatDate(new Date())} />
      <div className="time-slots">
        {availableSlots.length > 0 ? availableSlots.map(slot => {
          const isBooked = bookedSlots.includes(slot);
          return <button key={slot} disabled={isBooked} onClick={() => handleRescheduleSubmit(slot)}>{isBooked ? 'Booked' : slot}</button>;
        }) : <p>No slots available for this day.</p>}
      </div>
      <button onClick={onCancel} className="btn-secondary">Close</button>
    </div>
  );
};

// Main Page Component
const UserBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewFormFor, setShowReviewFormFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [showDisputeFormFor, setShowDisputeFormFor] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchUserBookings = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5001/api/bookings/myuserbookings', config);
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.token) {
      fetchUserBookings();
    }
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`http://localhost:5001/api/bookings/${bookingId}/status`, { status: 'Cancelled' }, config);
        fetchUserBookings();
      } catch (err) {
        setError('Failed to cancel booking.');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to permanently delete this booking?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5001/api/bookings/${bookingId}`, config);
        fetchUserBookings();
      } catch (err) {
        setError('Failed to delete booking.');
      }
    }
  };

  const handlePayment = async (bookingId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: session } = await axios.post('http://localhost:5001/api/payments/create-checkout-session', { bookingId }, config);
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (err) {
      setError('Payment initiation failed. Please try again.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const bookingToReview = bookings.find(b => b._id === showReviewFormFor);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('http://localhost:5001/api/reviews', { serviceId: bookingToReview.service._id, rating, comment }, config);
      setShowReviewFormFor(null);
      fetchUserBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    const bookingToDispute = bookings.find(b => b._id === showDisputeFormFor);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`http://localhost:5001/api/bookings/${bookingToDispute._id}/dispute`, { reason: disputeReason }, config);
      setShowDisputeFormFor(null);
      setDisputeReason('');
      fetchUserBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit dispute.');
    }
  };

  if (loading) return <p>Loading your appointments...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="bookings-container">
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <p>You have not made any bookings yet.</p>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const bookingDate = new Date(booking.bookingDate);
            const isOldBooking = booking.status === 'Completed' || booking.status === 'Cancelled';
            const canCancel = !isOldBooking && booking.status !== 'Pending';
            const canReview = booking.status === 'Completed' && !booking.hasBeenReviewed;
            const canReschedule = !isOldBooking;
            const canPay = booking.status === 'Pending';
            const canDispute = booking.status !== 'Pending' && !booking.isDisputed;

            return (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-header">
                  <h3>{booking.service.title}</h3>
                  <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.isPaid ? 'Paid & Confirmed' : booking.status}</span>
                </div>
                <div className="booking-card-body">
                  <p><strong>Provider:</strong> {booking.provider.name}</p>
                  <p><strong>Date:</strong> {bookingDate.toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {booking.timeSlot}</p>
                </div>
                <div className="booking-card-actions">
                  {canPay && <button onClick={() => handlePayment(booking._id)} className="btn btn-pay">Pay Now</button>}
                  {canCancel && <button onClick={() => handleCancelBooking(booking._id)} className="btn btn-cancel">Cancel</button>}
                  {canReschedule && <button onClick={() => setRescheduleBookingId(booking._id)} className="btn btn-reschedule">Reschedule</button>}
                  {canReview && <button onClick={() => setShowReviewFormFor(booking._id)} className="btn btn-review">Leave a Review</button>}
                  {canDispute && <button onClick={() => setShowDisputeFormFor(booking._id)} className="btn-dispute">Report a Problem</button>}
                  {isOldBooking && <button onClick={() => handleDeleteBooking(booking._id)} className="btn btn-delete">Delete</button>}
                </div>

                {booking.isDisputed && <p className="dispute-filed-message">A dispute has been filed for this booking.</p>}
                
                {rescheduleBookingId === booking._id && <RescheduleForm booking={booking} onRescheduleSuccess={() => { setRescheduleBookingId(null); fetchUserBookings(); }} onCancel={() => setRescheduleBookingId(null)} />}
                
                {showReviewFormFor === booking._id && (
                  <form onSubmit={handleReviewSubmit} className="review-form">
                    <h4>Write a Review</h4>
                    <div className="form-group"><label>Rating:</label><select value={rating} onChange={(e) => setRating(Number(e.target.value))}><option value={5}>5 - Excellent</option><option value={4}>4 - Very Good</option><option value={3}>3 - Good</option><option value={2}>2 - Fair</option><option value={1}>1 - Poor</option></select></div>
                    <div className="form-group"><label>Comment:</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." required /></div>
                    <div className="form-actions"><button type="submit" className="btn btn-submit">Submit Review</button><button type="button" onClick={() => setShowReviewFormFor(null)} className="btn btn-secondary">Close</button></div>
                  </form>
                )}
                
                {showDisputeFormFor === booking._id && (
                  <form onSubmit={handleDisputeSubmit} className="review-form">
                    <h4>Report an Issue</h4>
                    <div className="form-group"><label>Reason:</label><textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Please describe the issue..." required /></div>
                    <div className="form-actions"><button type="submit" className="btn btn-submit">Submit Dispute</button><button type="button" onClick={() => setShowDisputeFormFor(null)} className="btn btn-secondary">Cancel</button></div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserBookingsPage;