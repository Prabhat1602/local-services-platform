// client/src/pages/ProviderEarningsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ProviderEarningsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const userId = userInfo?._id; // Keeping userId, though it might not be strictly needed for this particular API call

  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]); // config only changes if token changes

  useEffect(() => {
    // Only proceed if we have a token (user is logged in and potentially a provider)
    if (!token) {
      setLoading(false);
      setError('Please log in to view earnings.'); // More general message
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        // Use the memoized config function to get the headers
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/provider/stats`, config());
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch earnings data:", err.response?.data?.message || err.message);
        setError('Failed to fetch earnings data. ' + (err.response?.data?.message || err.message)); // Include backend message if available
        if (err.response && err.response.status === 403) { // Specifically for 403 Forbidden
            setError('Access Denied. You must be a provider to view this page.');
        } else if (err.response && err.response.status === 401) { // Specifically for 401 Unauthorized
            setError('Authentication required. Please log in.');
            // navigate('/login'); // Uncomment if you import useNavigate
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

  // --- FIX: Dependency array only includes token and config (which itself depends on token) ---
  // userInfo object itself is removed to prevent constant re-renders
  // userId is also removed as it's not directly used in the API call's dependencies.
  }, [token, config]); // Now, this effect only re-runs if `token` or `config` (which relies on token) changes.

  if (loading) return <p>Loading earnings data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p>No earnings data available. Are you registered as a provider?</p>;

  return (
    <div className="earnings-container">
      <h1>My Earnings & Stats</h1>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Bookings</h4>
            <p>{stats.totalBookings}</p>
          </div>
          <div className="stat-card">
            <h4>Completed Bookings</h4>
            <p>{stats.completedBookings}</p>
          </div>
          <div className="stat-card">
            <h4>Total Revenue</h4>
            <p>${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderEarningsPage;