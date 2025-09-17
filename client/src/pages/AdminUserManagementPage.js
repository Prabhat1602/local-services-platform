// client/src/pages/AdminUserManagementPage.js (Updated with correct API call)
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(''); // Clear previous errors
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, config);
        setUsers(data);
      } catch (err) {
        console.error("Frontend User Management Fetch Error:", err);
        setError(err.response?.data?.message || 'Failed to fetch users. Check console for details.');
      } finally {
        setLoading(false);
      }
    };

    if (token && userInfo?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
      setError("Unauthorized: Admin access required or not logged in.");
    }
  }, [token, userInfo?.role,config]);

  // ... (handleProviderStatusUpdate and handleDeleteUser functions remain the same)
  const handleProviderStatusUpdate = async (providerId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this provider?`)) {
      return;
    }
    try {
      setSuccess('');
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${providerId}/status`, { status: newStatus }, config);
      setSuccess(`Provider status updated to ${newStatus}.`);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === providerId ? { ...user, providerStatus: newStatus } : user
        )
      );
    } catch (err) {
      console.error("Frontend Provider Status Update Error:", err);
      setError(err.response?.data?.message || 'Failed to update provider status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      setSuccess('');
      await axios.delete(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, config);
      setSuccess(`User deleted successfully.`);
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    } catch (err) {
      console.error("Frontend Delete User Error:", err);
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  if (loading) return <p>Loading user data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const pendingProviders = users.filter(user => user.role === 'provider' && user.providerStatus === 'Pending');
  const allUsersAndProviders = users.filter(user => user.role !== 'admin');

  return (
    <div className="admin-user-management-container">
      <h1>User Management</h1>
      {success && <p style={{ color: 'green', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px' }}>{success}</p>}

      {/* Pending Provider Approvals Section */}
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
                    <button onClick={() => handleProviderStatusUpdate(provider._id, 'Approved')} className="btn btn-approve">Approve</button>
                    <button onClick={() => handleProviderStatusUpdate(provider._id, 'Rejected')} className="btn btn-reject">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending provider requests.</p>
        )}
      </div>

      {/* All Users and Providers Section */}
      <div className="admin-section mt-5">
        <h2>All Users and Providers ({allUsersAndProviders.length})</h2>
        {allUsersAndProviders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Provider Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsersAndProviders.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.role === 'provider' ? user.providerStatus : 'N/A'}</td>
                  <td>
                    {user.role !== 'admin' && (
                        <button onClick={() => handleDeleteUser(user._id)} className="btn btn-danger">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No other users or providers found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagementPage;