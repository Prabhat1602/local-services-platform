// client/src/pages/ProviderEarningsPage.js
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback for memoizing config
import axios from 'axios';

const ProviderEarningsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- FIX 1: Define userInfo FIRST ---
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  // --- FIX 2: Then define token and userId ---
  const token = userInfo?.token;
  const userId = userInfo?._id;

  // --- FIX 3: Memoize config using useCallback to prevent unnecessary re-renders/fetches ---
  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]); // Dependency array: config only changes if token changes

  useEffect(() => {
    // Ensure both userInfo and token are available
    if (!userInfo || !token) {
      setLoading(false); // No user info, so stop loading
      setError('Please log in as a provider to view earnings.');
      return;
    }

    const fetchStats = async () => {
      setLoading(true); // Ensure loading is true when starting fetch
      setError('');      // Clear any previous errors
      try {
        // Use the memoized config function to get the headers
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/provider/stats`, config()); // Call config as a function
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch earnings data:", err.response?.data?.message || err.message);
        setError('Failed to fetch earnings data. Please try again.');
        // Optionally, if it's a 401/403, redirect to login
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            setError('Unauthorized. Please ensure you are logged in as a provider.');
            // navigate('/login'); // If you import useNavigate
        }
      } finally {
        setLoading(false);
      }
    };

    // --- FIX 4: Only fetch if we have a token ---
    fetchStats(); // Call fetchStats directly, no need for if (userInfo?.token) here.
                  // The checks for userInfo/token are now inside fetchStats or at the top of useEffect.

  }, [token, userId, userInfo, config]); // Dependencies for useEffect

  // --- Render based on state ---
  if (loading) return <p>Loading earnings data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p>No earnings data available. Are you registered as a provider?</p>; // Handle case where stats might be null after loading

  return (
    <div className="earnings-container">
      <h1>My Earnings & Stats (v2)</h1>
      {stats && ( // This check is redundant due to the previous `if (!stats) return` but harmless
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
            <p>${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}</p> {/* Handle undefined totalRevenue */}
          </div>
          {/* You could add a 'Net Earnings' card here if you implement a platform fee */}
        </div>
      )}
      {/* You could add a detailed list of transactions/bookings below */}
    </div>
  );
};

export default ProviderEarningsPage;