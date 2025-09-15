import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js'; // Import Stripe
// A simple helper to format dates as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];
const stripePromise = loadStripe('pk_test_51S5Pyn3WVAC5yOJa8dWVgJpXvJWSKR3U2i9ASf6ijxegh4fxYv6pTOOaDey4L0cqsHMnXBcJ6Cf4SbAMoMQHpdkx00gNp9Wkfs');
const ServiceDetailPage = () => {
  const [service, setService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Fetch service details and booked slots
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: serviceData } = await axios.get(`${process.env.REACT_APP_API_URL}/services/${id}`);
        setService(serviceData);
      } catch (err) {
        setError('Could not fetch service details.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  // Generate available slots when the service or date changes
  useEffect(() => {
    if (!service) return;

    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = service.availability.find(a => a.dayOfWeek === dayOfWeek);

    let slots = [];
    if (schedule) {
      // Basic hourly slot generation
      let current = parseInt(schedule.startTime.split(':')[0]);
      const end = parseInt(schedule.endTime.split(':')[0]);
      while (current < end) {
        slots.push(`${String(current).padStart(2, '0')}:00`);
        current++;
      }
    }
    setAvailableSlots(slots);
    
    // Fetch slots that are already booked for the selected date
    const fetchBookedSlots = async () => {
        try {
            const { data: booked } = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/booked-slots/${id}?date=${formatDate(selectedDate)}`);
            setBookedSlots(booked);
        } catch (err) {
            console.error("Could not fetch booked slots");
        }
    }
    fetchBookedSlots();

  }, [service, selectedDate, id]);

   const handleBooking = async (timeSlot) => {
    if (!userInfo) return navigate('/login');
    
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      // Step 1: Create a 'Pending' booking
      await axios.post('${process.env.REACT_APP_API_URL}/bookings', {
        serviceId: id,
        bookingDate: formatDate(selectedDate),
        timeSlot,
      }, config);
      
      setBookingSuccess(`✅ Booking request sent! Please complete payment.`);
      // Step 2: Redirect user to their bookings page to pay
      navigate('/my-bookings');

    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    }
  };

  if (loading) return <p>Loading details...</p>;
  if (error && !service) return <p style={{ color: 'red' }}>{error}</p>;


const handleStartChat = async () => {
  // If the user isn't logged in, don't proceed.
  if (!userInfo) {
    navigate('/login');
    return;
  }
  
  try {
    // FIX: Define the 'config' object with the token here.
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    // Now 'config' is defined and can be used in the axios call.
    await axios.post('${process.env.REACT_APP_API_URL}/chat/conversations', { receiverId: service.provider._id }, config);
    navigate('/chat');
  } catch (error) {
    console.error("Failed to start conversation", error);
    // You could set an error state here to show a message to the user.
  }
};

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      {/* ... Service details ... */}
       <img src={service.image} alt={service.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }} />
      <hr style={{ margin: '2rem 0' }} />
      <h3>Book an Appointment</h3>
      <input
        type="date"
        value={formatDate(selectedDate)}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
        min={formatDate(new Date())} // User cannot select past dates
        style={{ padding: '0.5rem', fontSize: '1rem' }}
      />
      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {availableSlots.length > 0 ? (
          availableSlots.map(slot => {
            const isBooked = bookedSlots.includes(slot);
            return (
              <button key={slot} disabled={isBooked} onClick={() => handleBooking(slot)} style={{ /* ... */ }}>
                {isBooked ? 'Booked' : slot}
              </button>
            );
          })
        ) : (
          <p>No available slots for this day.</p>
        )}
      </div>
       <div>
        {/* ... all other details ... */}
        {userInfo && userInfo._id !== service.provider._id && (
            <button onClick={handleStartChat} style={{ marginLeft: '1rem' }}>Message Provider</button>
        )}
       </div>

      {bookingSuccess && <p style={{ color: 'green', marginTop: '1rem' }}>{bookingSuccess}</p>}
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

export default ServiceDetailPage;