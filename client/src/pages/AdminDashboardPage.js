import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper component for displaying stats. It needs to be defined in the file.
const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Combined useEffect to fetch all necessary data at once
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch stats and users at the same time
        const [statsData, usersData] = await Promise.all([
          axios.get('https://local-services-api.onrender.com', config),
          axios.get('https://local-services-api.onrender.com', config)
        ]);
        setStats(statsData.data);
        setUsers(usersData.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleStatusUpdate = async (providerId, newStatus) => {
    try {
      setSuccess('');
      await axios.put(`https://local-services-api.onrender.com/api/admin/providers/${providerId}/status`, { status: newStatus }, config);
      setSuccess(`Provider status updated to ${newStatus}.`);
      // Update the user's status in the local state to reflect the change instantly
      setUsers(users.map(user => user._id === providerId ? { ...user, providerStatus: newStatus } : user));
    } catch (error) {
      setError('Failed to update provider status.');
    }
  };

  if (loading) return <p>Loading data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // Filter users to get only pending providers
  const pendingProviders = users.filter(user => user.role === 'provider' && user.providerStatus === 'Pending');

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      
      {/* Stats Report Section */}
      {stats && (
        <div className="stats-grid">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
          <StatCard title="Total Services" value={stats.totalServices} icon="🛠️" />
          <StatCard title="Total Bookings" value={stats.totalBookings} icon="📅" />
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon="💰" />
          <StatCard title="Average Rating" value={`⭐ ${stats.averageRating}`} icon="🌟" />
        </div>
      )}
      
      {/* Section for Pending Providers */}
      <div className="admin-section">
        <h2>Pending Provider Approvals ({pendingProviders.length})</h2>
        {pendingProviders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingProviders.map(provider => (
                <tr key={provider._id}>
                  <td>{provider.name}</td>
                  <td>{provider.email}</td>
                  <td>
                    <button onClick={() => handleStatusUpdate(provider._id, 'Approved')} className="btn btn-approve">Approve</button>
                    <button onClick={() => handleStatusUpdate(provider._id, 'Rejected')} className="btn btn-reject">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending provider requests.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;