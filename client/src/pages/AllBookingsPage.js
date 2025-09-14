import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAllBookings = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/admin/bookings', config);
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const handleResolveDispute = async (bookingId) => {
    if (window.confirm('Are you sure you want to mark this dispute as resolved?')) {
        try {
            await axios.put(`http://localhost:5001/api/admin/bookings/${bookingId}/resolve`, {}, config);
            fetchAllBookings(); // Refresh the list
        } catch (error) {
            setError('Failed to resolve dispute.');
        }
    }
  };

  if (loading) return <p>Loading all bookings...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Platform Activity: All Bookings</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd', background: '#f7f7f7' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Service</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>User</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Provider</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} style={{ background: booking.isDisputed ? '#fff0f0' : 'white', borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>{booking.service?.title || 'N/A'}</td>
              <td style={{ padding: '0.5rem' }}>{booking.user?.name || 'N/A'}</td>
              <td style={{ padding: '0.5rem' }}>{booking.provider?.name || 'N/A'}</td>
              <td style={{ padding: '0.5rem' }}>{new Date(booking.bookingDate).toLocaleDateString()}</td>
              <td style={{ padding: '0.5rem' }}>
                <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
                {booking.isDisputed && <span style={{ color: 'red', marginLeft: '0.5rem' }}>Disputed</span>}
              </td>
              <td style={{ padding: '0.5rem' }}>
                {booking.isDisputed && (
                    <button onClick={() => handleResolveDispute(booking._id)} className="btn-approve">Resolve Dispute</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllBookingsPage;