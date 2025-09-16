// export default AdminDashboardPage;
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
        // --- FIX 1 & 2: Provide complete and correct API endpoints for stats and users ---
        // Assuming your backend has routes like:
        // GET /api/admin/stats for dashboard statistics
        // GET /api/admin/users for all users (including providers)
              // --- CORRECTED API ENDPOINTS ---
        const [statsResponse, usersResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, config), // Correct endpoint for stats
          axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, config)  // Correct endpoint for all users
        ]);
        // --- END CORRECTED API ENDPOINTS ---

        setStats(statsResponse.data);
        setUsers(usersResponse.data); // Assuming usersData.data is an array of user objects
      } catch (err) {
        // More robust error handling to get specific message from backend
        setError(err.response?.data?.message || 'Failed to fetch dashboard data. Check backend logs.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchData();
    } else {
        // If no token, user is not logged in or not an admin, handle accordingly
        setLoading(false);
        setError("You are not authorized to view this page. Please log in as an administrator.");
    }
  }, [token]); // token is a dependency, so if it changes (e.g., user logs out), useEffect re-runs

  const handleStatusUpdate = async (providerId, newStatus) => {
    try {
      setSuccess('');
      // --- FIX 3: Correct API endpoint for updating provider status ---
      // Assuming your backend route is something like PUT /api/admin/users/:providerId/status
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${providerId}/status`, { status: newStatus }, config);
      setSuccess(`Provider status updated to ${newStatus}.`);
      // Update the user's status in the local state to reflect the change instantly
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === providerId ? { ...user, providerStatus: newStatus } : user
        )
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update provider status.');
    }
  };

  // --- ADDED: Basic authorization check for admin role ---
  if (!userInfo || userInfo.role !== 'admin') {
    return <p style={{ color: 'red' }}>Access Denied: You must be logged in as an administrator.</p>;
  }

  if (loading) return <p>Loading data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // Filter users to get only pending providers
  // --- IMPORTANT: Ensure your backend populates 'providerStatus' on user documents for providers ---
  const pendingProviders = users.filter(user => user.role === 'provider' && user.providerStatus === 'Pending');

  return (
    <div className="admin-dashboard-container"> {/* Added a container div for potential styling */}
      <h1>Admin Dashboard</h1>
      {success && <p style={{ color: 'green', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px' }}>{success}</p>}
      
      {/* Stats Report Section */}
      {stats ? ( // Check if stats is not null before rendering
        <div className="stats-grid">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
          <StatCard title="Total Services" value={stats.totalServices} icon="🛠️" />
          <StatCard title="Total Bookings" value={stats.totalBookings} icon="📅" />
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}`} icon="💰" /> {/* Added check for totalRevenue */}
          <StatCard title="Average Rating" value={`⭐ ${stats.averageRating || 'N/A'}`} icon="🌟" /> {/* Added check for averageRating */}
        </div>
      ) : (
        <p>No statistics available.</p>
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
                    {/* Make sure providerStatus is what you expect from backend */}
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

      {/* You might want a section for all users/providers, not just pending ones */}
      {/* Example:
      <div className="admin-section">
        <h2>All Users and Providers ({users.length})</h2>
        <table className="admin-table">
            // ... table header and rows for all users ...
        </table>
      </div>
      */}
    </div>
  );
};

export default AdminDashboardPage;