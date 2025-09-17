import React, { useState, useEffect, useCallback } from 'react'; // Add useCallback here
import axios from 'axios';

const ProviderDashboardPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
 
   const token = userInfo?.token;
  const userId = userInfo?._id;
  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/mybookings`, config);
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  },[config, userId]);

 useEffect(() => {
  fetchBookings();
}, [fetchBookings]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}/status`, { status: newStatus }, config);
      fetchBookings(); // Refresh the bookings list after updating
    } catch (err) {
      setError('Failed to update booking status.');
    }
  };

  if (loading) return <p>Loading your bookings...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Provider Dashboard</h1>
      <h2>Your Bookings</h2>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((booking) => (
            <div key={booking._id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '5px' }}>
              <h4>Service: {booking.service.title}</h4>
              <p>Booked by: {booking.user.name} ({booking.user.email})</p>
              <p>Appointment: <strong>{new Date(booking.bookingDate).toLocaleDateString()}</strong> at <strong>{booking.timeSlot}</strong></p>
              <p>Status: <strong>{booking.status}</strong></p>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                {booking.status === 'Pending' && (
                  <>
                    <button onClick={() => handleStatusUpdate(booking._id, 'Confirmed')} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '0.5rem', cursor: 'pointer' }}>Confirm</button>
                    <button onClick={() => handleStatusUpdate(booking._id, 'Cancelled')} style={{ background: '#c0392b', color: 'white', border: 'none', padding: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                  </>
                )}
                
                {/* --- THIS IS THE NEW BUTTON --- */}
                {booking.status === 'Confirmed' && (
                    <button onClick={() => handleStatusUpdate(booking._id, 'Completed')} style={{ background: '#3498db', color: 'white', border: 'none', padding: '0.5rem', cursor: 'pointer' }}>Mark as Completed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderDashboardPage;