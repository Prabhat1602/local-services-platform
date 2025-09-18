import React, { useState, useEffect, useCallback } from 'react'; // ADDED useCallback
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ADDED useNavigate for redirect

const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // Initialize navigate

  // --- FIX 1: Safely get userInfo and token ---
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const isAdmin = userInfo?.role === 'admin'; // Also check if user is admin

  // --- FIX 2: Memoize config object using useCallback ---
  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]); // config only changes if the token changes

  const fetchAllBookings = useCallback(async () => {
    // --- FIX 3: Check for token and admin role before making API call ---
    if (!token || !isAdmin) {
      setLoading(false);
      setError('Unauthorized: You must be logged in as an administrator to view this page.');
      navigate('/login'); // Redirect to login if not authorized
      return;
    }

    try {
      setLoading(true); // Ensure loading is true when starting fetch
      setError('');      // Clear any previous errors
      // --- FIX 4: Call config as a function ---
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/admin/bookings`, config());
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch all bookings:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch bookings. Please try again.');
       if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            setError('Unauthorized. Please ensure you are logged in as an administrator.');
            navigate('/login'); // Redirect to login if auth fails
        }
    } finally {
      setLoading(false);
    }
  // --- FIX 5: Dependencies for useCallback for fetchAllBookings ---
  // It depends on config (which depends on token), token itself, and isAdmin
  }, [config, token, isAdmin, navigate]);

  useEffect(() => {
    fetchAllBookings();
  // --- FIX 6: useEffect depends on fetchAllBookings (which is now memoized) ---
  }, [fetchAllBookings]);

  const handleResolveDispute = async (bookingId) => {
    // --- FIX 7: Check token and admin role before action ---
    if (!token || !isAdmin) {
      setError('Unauthorized: You must be logged in as an administrator to perform this action.');
      return;
    }

    if (window.confirm('Are you sure you want to mark this dispute as resolved?')) {
        try {
            setError(''); // Clear previous errors
            // --- FIX 8: Call config as a function ---
            await axios.put(`${process.env.REACT_APP_API_URL}/admin/bookings/${bookingId}/resolve`, {}, config());
            fetchAllBookings(); // Refresh the list
        } catch (err) { // Changed 'error' to 'err' for consistency
            console.error("Failed to resolve dispute:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to resolve dispute.');
        }
    }
  };

  // --- Render based on state ---
  if (loading) return <p>Loading all bookings...</p>;
  // Display error message prominently
  if (error) return <p style={{ color: 'red', padding: '1rem', background: '#ffe0e0', border: '1px solid red', borderRadius: '4px' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}> {/* Added a div with padding for better spacing */}
      <h1>Platform Activity: All Bookings</h1>
      {bookings.length === 0 ? ( // Display message if no bookings are found
        <p>No bookings found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
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
      )}
    </div>
  );
};

export default AllBookingsPage;