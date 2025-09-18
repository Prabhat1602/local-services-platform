
// client/src/pages/AdminDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



// Helper component for displaying stats - UPDATED TO USE NEW CLASSES
const StatCard = ({ title, value, icon }) => (
  <div className="card-section stat-card-item"> {/* Combined card-section with stat-card-item */}
    <div className="icon">{icon}</div> {/* Class for icon */}
    <div className="info"> {/* Class for text info */}
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const isAdmin = userInfo?.role === 'admin';

  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    if (!token || !isAdmin) {
      setLoading(false);
      setError("You are not authorized to view this page. Please log in as an administrator.");
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsResponse, usersResponse, feedbackResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, config()),
          axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, config()),
          axios.get(`${process.env.REACT_APP_API_URL}/admin/feedback`, config())
        ]);

        setStats(statsResponse.data);
        setUsers(usersResponse.data);
        setFeedbackList(feedbackResponse.data);

      } catch (err) {
        console.error("AdminDashboard: Error fetching data:", err.response?.data?.message || err.message);
        setError(err.response?.data?.message || 'Failed to fetch dashboard data. Check backend logs.');
        if (err.response?.status === 401 || err.response?.status === 403) {
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, isAdmin, navigate, config]);

  const handleStatusUpdate = async (providerId, newStatus) => {
    try {
      setSuccess('');
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${providerId}/status`, { status: newStatus }, config());
      setSuccess(`Provider status updated to ${newStatus}.`);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === providerId ? { ...user, providerStatus: newStatus } : user
        )
      );
    } catch (error) {
      console.error("AdminDashboard: Error updating provider status:", error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Failed to update provider status.');
    }
  };

  if (loading) return <p className="text-center text-lg mt-8">Loading dashboard data...</p>;
  if (error) return <p className="text-center text-lg mt-8 text-red-600">{error}</p>;

  const pendingProviders = users.filter(user => user.role === 'provider' && user.providerStatus === 'Pending');

  return (
    <div className="admin-dashboard-container"> {/* Main container class */}
      <h1>Admin Dashboard</h1> {/* Title is centered by CSS */}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}
      {error && (
         <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      
      {/* Stats Report Section */}
      <section className="card-section"> {/* Common card styling for the section */}
        <h2>Platform Statistics</h2>
        {stats ? (
          <div className="stats-grid"> {/* Apply grid here */}
            <StatCard title="Total Users" value={stats.totalUsers || 0} icon="👥" />
            <StatCard title="Total Services" value={stats.totalServices || 0} icon="🛠️" />
            <StatCard title="Total Bookings" value={stats.totalBookings || 0} icon="📅" />
            <StatCard title="Total Revenue" value={`$${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}`} icon="💰" />
           {/* Average Rating StatCard */}
            {stats.averageRating !== undefined && stats.averageRating !== null && Number.isFinite(stats.averageRating) ? (
              <StatCard title="Average Rating" value={`⭐ ${stats.averageRating.toFixed(1)}`} icon="⭐" />
            ) : (
              // If it's explicitly 'N/A' from backend or not a finite number
              <StatCard title="Average Rating" value={stats.averageRating === "N/A" ? "N/A" : "No ratings yet"} icon="⭐" />
            )}
          </div>
        ) : (
          <p style={{ color: '#757575' }}>No statistics available.</p>
        )}
      </section>
      
      {/* Section for Pending Providers */}
      <section className="card-section"> {/* Common card styling for the section */}
        <h2>Pending Provider Approvals ({pendingProviders.length})</h2>
        {pendingProviders.length > 0 ? (
          <div className="admin-table-responsive"> {/* Responsive wrapper for table */}
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
                      <button 
                        onClick={() => handleStatusUpdate(provider._id, 'Approved')} 
                        className="btn btn-approve"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(provider._id, 'Rejected')} 
                        className="btn btn-reject"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#757575' }}>No pending provider requests.</p>
        )}
      </section>

      {/* Section for Recent Feedback/Support Tickets */}
      <section className="card-section"> {/* Common card styling for the section */}
        <h2>Recent Feedback/Support</h2>
        {feedbackList.length > 0 ? (
            <div className="admin-table-responsive"> {/* Responsive wrapper for table */}
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Sender</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbackList.map(feedback => (
                            <tr key={feedback._id}>
                                <td>{feedback.user ? feedback.user.name : 'Guest'}</td>
                                <td>{feedback.subject}</td>
                                <td className="feedback-message-cell">{feedback.message}</td> {/* Apply truncation class */}
                                <td>{new Date(feedback.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p style={{ color: '#757575' }}>No recent feedback or support tickets.</p>
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;


