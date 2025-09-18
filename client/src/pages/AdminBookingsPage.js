import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;

  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    if (!token || userInfo?.role !== 'admin') {
      setLoading(false);
      setError("Unauthorized access.");
      return;
    }

    const fetchBookings = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/admin/bookings`, config());
        setBookings(data);
      } catch (err) {
        console.error("Admin Bookings Fetch Error:", err.response?.data?.message || err.message);
        setError('Failed to fetch bookings.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token, userInfo?.role, config]); // Add userInfo.role to dependencies for robustness

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="admin-bookings-container">
      <h1>All Bookings</h1>
      {bookings.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Provider</th>
              <th>Service</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id}>
                <td>{booking._id}</td>
                <td>{booking.user?.name || 'N/A'}</td>
                <td>{booking.provider?.name || 'N/A'}</td>
                <td>{booking.service?.title || 'N/A'}</td>
                <td>{booking.status}</td>
                <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No bookings found.</p>
      )}
    </div>
  );
};

export default AdminBookingsPage;