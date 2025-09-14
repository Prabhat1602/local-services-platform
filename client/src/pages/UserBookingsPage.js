// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// // Helper component for the rescheduling form. Keeping it in the same file for simplicity.
// const RescheduleForm = ({ booking, onRescheduleSuccess, onCancel }) => {
//   const [selectedDate, setSelectedDate] = useState(new Date(booking.bookingDate));
//   const [availableSlots, setAvailableSlots] = useState([]);
//   const [bookedSlots, setBookedSlots] = useState([]);
//   const [service, setService] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const { token } = JSON.parse(localStorage.getItem('userInfo'));

//   const formatDate = (date) => new Date(date).toISOString().split('T')[0];

//   useEffect(() => {
//     // Fetch the service details to get its availability schedule
//     const fetchServiceDetails = async () => {
//       try {
//         const { data } = await axios.get(`http://localhost:5001/api/services/${booking.service._id}`);
//         setService(data);
//       } catch (error) {
//         console.error("Failed to fetch service details for rescheduling", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchServiceDetails();
//   }, [booking.service._id]);

//   useEffect(() => {
//     if (!service) return;

//     // Logic to generate slots based on provider's availability
//     const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
//     const schedule = service.availability.find(a => a.dayOfWeek === dayOfWeek);
//     let slots = [];
//     if (schedule) {
//       let current = parseInt(schedule.startTime.split(':')[0]);
//       const end = parseInt(schedule.endTime.split(':')[0]);
//       while (current < end) {
//         slots.push(`${String(current).padStart(2, '0')}:00`);
//         current++;
//       }
//     }
//     setAvailableSlots(slots);
    
//     // Fetch slots that are already booked for the new selected date
//     const fetchBookedSlots = async () => {
//         const { data: booked } = await axios.get(`http://localhost:5001/api/bookings/booked-slots/${service._id}?date=${formatDate(selectedDate)}`);
//         setBookedSlots(booked);
//     };
//     fetchBookedSlots();
//   }, [service, selectedDate]);

//   const handleRescheduleSubmit = async (timeSlot) => {
//     if (window.confirm(`Are you sure you want to reschedule for ${new Date(selectedDate).toLocaleDateString()} at ${timeSlot}?`)) {
//         try {
//             const config = { headers: { Authorization: `Bearer ${token}` } };
//             await axios.put(`http://localhost:5001/api/bookings/${booking._id}/reschedule`, {
//                 bookingDate: formatDate(selectedDate),
//                 timeSlot,
//             }, config);
//             onRescheduleSuccess();
//         } catch (error) {
//             alert(error.response?.data?.message || 'Failed to reschedule.');
//         }
//     }
//   };

//   if(loading) return <p>Loading availability...</p>;

//   return (
//     <div className="reschedule-form">
//       <h4>Select a New Date & Time</h4>
//       <input type="date" value={formatDate(selectedDate)} onChange={(e) => setSelectedDate(e.target.value)} min={formatDate(new Date())} />
//       <div className="time-slots">
//         {availableSlots.length > 0 ? availableSlots.map(slot => {
//           const isBooked = bookedSlots.includes(slot);
//           return <button key={slot} disabled={isBooked} onClick={() => handleRescheduleSubmit(slot)}>{isBooked ? 'Booked' : slot}</button>;
//         }) : <p>No slots available for this day.</p>}
//       </div>
//       <button onClick={onCancel} className="btn-secondary">Close</button>
//     </div>
//   );
// };


// // Main Page Component
// const UserBookingsPage = () => {
//   // All hooks are now correctly at the top level
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [showReviewFormFor, setShowReviewFormFor] = useState(null);
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState('');
//   const [rescheduleBookingId, setRescheduleBookingId] = useState(null);

//   const userInfo = JSON.parse(localStorage.getItem('userInfo'));

//   const fetchUserBookings = async () => {
//     try {
//       const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
//       const { data } = await axios.get('http://localhost:5001/api/bookings/myuserbookings', config);
//       setBookings(data);
//     } catch (err) {
//       setError('Failed to fetch your bookings.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (userInfo?.token) {
//         fetchUserBookings();
//     }
//   }, [userInfo?.token]);

//   const handleCancelBooking = async (bookingId) => {
//     if (window.confirm('Are you sure you want to cancel this booking?')) {
//       try {
//         const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
//         await axios.put(`http://localhost:5001/api/bookings/${bookingId}/status`, { status: 'Cancelled' }, config);
//         fetchUserBookings();
//       } catch (err) {
//         setError('Failed to cancel booking.');
//       }
//     }
//   };

//   const handleReviewSubmit = async (e) => {
//     e.preventDefault();
//     const bookingToReview = bookings.find(b => b._id === showReviewFormFor);
//     try {
//       const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
//       await axios.post('http://localhost:5001/api/reviews', { serviceId: bookingToReview.service._id, rating, comment }, config);
//       setShowReviewFormFor(null);
//       fetchUserBookings();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to submit review.');
//     }
//   };

//   const handlePayment = async (bookingId) => {
//     try {
//         const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
//         // 1. Call your backend to create a checkout session for THIS booking
//         const { data: session } = await axios.post(
//             'http://localhost:5001/api/payments/create-checkout-session',
//             { bookingId },
//             config
//         );
          
//         // 2. Redirect to Stripe Checkout
//         const stripe = await stripePromise;
//         await stripe.redirectToCheckout({
//           sessionId: session.id,
//         });

//     } catch (err) {
//         setError('Payment initiation failed. Please try again.');
//     }
//   };

//   if (loading) return <p>Loading your appointments...</p>;
//   if (error) return <p style={{ color: 'red' }}>{error}</p>;

//   return (
//     <div className="bookings-container">
//       <h1>My Bookings</h1>
//       {bookings.length === 0 ? (
//         <p>You have not made any bookings yet.</p>
//       ) : (
//         <div className="bookings-list">
//           {bookings.map((booking) => {
//             const bookingDate = new Date(booking.bookingDate);
//             const canCancel = booking.status !== 'Cancelled' && booking.status !== 'Completed';
//             const canReview = booking.status === 'Completed' && !booking.hasBeenReviewed;
//             const canReschedule = booking.status !== 'Cancelled' && booking.status !== 'Completed';

//             return (
//               <div key={booking._id} className="booking-card">
//                 <div className="booking-card-header">
//                   <h3>{booking.service.title}</h3>
//                   <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
//                 </div>
//                 <div className="booking-card-body">
//                   <p><strong>Provider:</strong> {booking.provider.name}</p>
//                   <p><strong>Date:</strong> {bookingDate.toLocaleDateString()}</p>
//                   <p><strong>Time:</strong> {booking.timeSlot}</p>
//                 </div>
//                 <div className="booking-card-actions">
//                   {canCancel && <button onClick={() => handleCancelBooking(booking._id)} className="btn btn-cancel">Cancel Booking</button>}
//                   {canReschedule && <button onClick={() => setRescheduleBookingId(booking._id)} className="btn btn-reschedule">Reschedule</button>}
//                   {canReview && <button onClick={() => setShowReviewFormFor(booking._id)} className="btn btn-review">Leave a Review</button>}
//                      {canPay && (
//                     <button onClick={() => handlePayment(booking._id)} className="btn btn-pay">
//                         Pay Now
//                     </button>
//                 )}
//                 </div>

//                 {rescheduleBookingId === booking._id && (
//                   <RescheduleForm booking={booking} onRescheduleSuccess={() => { setRescheduleBookingId(null); fetchUserBookings(); }} onCancel={() => setRescheduleBookingId(null)} />
//                 )}

//                 {showReviewFormFor === booking._id && (
//                   <form onSubmit={handleReviewSubmit} className="review-form">
//                     <h4>Write a Review</h4>
//                     <div className="form-group"><label>Rating:</label><select value={rating} onChange={(e) => setRating(Number(e.target.value))}><option value={5}>5 - Excellent</option><option value={4}>4 - Very Good</option><option value={3}>3 - Good</option><option value={2}>2 - Fair</option><option value={1}>1 - Poor</option></select></div>
//                     <div className="form-group"><label>Comment:</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." required /></div>
//                     <div className="form-actions"><button type="submit" className="btn btn-submit">Submit Review</button><button type="button" onClick={() => setShowReviewFormFor(null)} className="btn btn-secondary">Close</button></div>
//                   </form>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserBookingsPage;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

// FIX #1: Define 'stripePromise' at the top level of the file
const stripePromise = loadStripe('pk_test_51S5PPw46ZM3BU7keGRRCzVUfuXeKAQmEPZeIIA0EuTTT4PHIXIe8FJaQqmWtTY4wTrV0SWwEcDlJzmZHlO0idRAI00JX5THwJI');

const UserBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewFormFor, setShowReviewFormFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);

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
    // By keeping the dependency array empty, this runs once every time the component mounts,
    // which includes when you return from the Stripe payment page.
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
    const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5001/api/bookings/${bookingId}`, config);
        fetchUserBookings(); // Refresh the list after deleting
      } catch (err) {
        setError('Failed to delete booking.');
      }
    }
  };
  const handlePayment = async (bookingId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: session } = await axios.post(
        'http://localhost:5001/api/payments/create-checkout-session',
        { bookingId },
        config
      );
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({
        sessionId: session.id,
      });
    } catch (err) {
      setError('Payment initiation failed. Please try again.');
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
            const canCancel = booking.status !== 'Cancelled' && booking.status !== 'Completed';
            const canReview = booking.status === 'Completed' && !booking.hasBeenReviewed;
            const canReschedule = booking.status !== 'Cancelled' && booking.status !== 'Completed';
              const isOldBooking = booking.status === 'Completed' || booking.status === 'Cancelled';
            // FIX #2: Define 'canPay' here inside the map function
            const canPay = booking.status === 'Pending';

            return (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-header">
                  <h3>{booking.service.title}</h3>
                  <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                </div>
                <div className="booking-card-body">
                  <p><strong>Provider:</strong> {booking.provider.name}</p>
                  <p><strong>Date:</strong> {bookingDate.toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {booking.timeSlot}</p>
                </div>
                <div className="booking-card-actions">
                  {canPay && <button onClick={() => handlePayment(booking._id)} className="btn btn-pay">Pay Now</button>}
                  {canCancel && <button onClick={() => handleCancelBooking(booking._id)} className="btn btn-cancel">Cancel Booking</button>}
                  {canReschedule && <button onClick={() => setRescheduleBookingId(booking._id)} className="btn btn-reschedule">Reschedule</button>}
                  {canReview && <button onClick={() => setShowReviewFormFor(booking._id)} className="btn btn-review">Leave a Review</button>}
                  {isOldBooking && (
                <button onClick={() => handleDeleteBooking(booking._id)} className="btn btn-delete">
                  Delete
                </button>
              )}
                </div>

                {/* Reschedule and Review forms would go here */}
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserBookingsPage;