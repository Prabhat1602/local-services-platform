import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProviderEarningsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/provider/stats', config);
        setStats(data);
      } catch (err) {
        setError('Failed to fetch earnings data.');
      } finally {
        setLoading(false);
      }
    };
    if (userInfo?.token) {
      fetchStats();
    }
  }, [userInfo?.token]);

  if (loading) return <p>Loading earnings data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

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
            <p>${stats.totalRevenue.toFixed(2)}</p>
          </div>
          {/* You could add a 'Net Earnings' card here if you implement a platform fee */}
        </div>
      )}
      {/* You could add a detailed list of transactions/bookings below */}
    </div>
  );
};

export default ProviderEarningsPage;