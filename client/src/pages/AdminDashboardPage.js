
// client/src/pages/AdminDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// No need to import a specific CSS file if all styles are in index.css

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
            {stats.averageRating != null && typeof stats.averageRating === 'number' ? (
              <StatCard title="Average Rating" value={`⭐ ${stats.averageRating.toFixed(1)}`} icon="🌟" />
            ) : (
              <StatCard title="Average Rating" value="N/A" icon="🌟" />
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


// // client/src/pages/AdminDashboardPage.js

// import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // Added useNavigate

// // Helper component for displaying stats
// const StatCard = ({ title, value, icon }) => (
//   <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
//     <div className="text-3xl text-blue-600">{icon}</div> {/* Styling for icon */}
//     <div>
//       <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
//       <p className="text-xl font-bold text-gray-800">{value}</p>
//     </div>
//   </div>
// );

// const AdminDashboardPage = () => {
//   const [users, setUsers] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [feedbackList, setFeedbackList] = useState([]); // ADDED: State for feedback
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const navigate = useNavigate(); // Initialize navigate

//   const userInfo = JSON.parse(localStorage.getItem('userInfo'));
//   const token = userInfo?.token;
//   const isAdmin = userInfo?.role === 'admin';

//   // Memoize config to prevent re-creation on every render if token doesn't change
//   const config = useCallback(() => ({
//     headers: { Authorization: `Bearer ${token}` }
//   }), [token]);

//   // Combined useEffect to fetch all necessary data at once
//   useEffect(() => {
//     if (!token || !isAdmin) { // Check both token and isAdmin upfront
//       setLoading(false);
//       setError("You are not authorized to view this page. Please log in as an administrator.");
//       navigate('/login'); // Redirect to login if not authorized
//       return;
//     }

//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(''); // Clear previous errors

//         // --- FETCH ADMIN STATS, USERS, AND FEEDBACK ---
//         const [statsResponse, usersResponse, feedbackResponse] = await Promise.all([
//           axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, config()), // Use memoized config
//           axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, config()),  // Use memoized config
//           axios.get(`${process.env.REACT_APP_API_URL}/admin/feedback`, config()) // ADDED: Fetch feedback
//         ]);

//         setStats(statsResponse.data);
//         setUsers(usersResponse.data);
//         setFeedbackList(feedbackResponse.data); // Set feedback state

//       } catch (err) {
//         console.error("AdminDashboard: Error fetching data:", err.response?.data?.message || err.message);
//         setError(err.response?.data?.message || 'Failed to fetch dashboard data. Check backend logs.');
//         if (err.response?.status === 401 || err.response?.status === 403) {
//             navigate('/login'); // Redirect on specific auth errors
//         }
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchData(); // Call fetchData directly now that auth check is upfront
//   }, [token, isAdmin, navigate, config]); // Add navigate and config to dependencies

//   const handleStatusUpdate = async (providerId, newStatus) => {
//     try {
//       setSuccess('');
//       // --- Correct API endpoint for updating provider status ---
//       await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${providerId}/status`, { status: newStatus }, config()); // Use memoized config
//       setSuccess(`Provider status updated to ${newStatus}.`);
//       setUsers(prevUsers => 
//         prevUsers.map(user => 
//           user._id === providerId ? { ...user, providerStatus: newStatus } : user
//         )
//       );
//     } catch (error) {
//       console.error("AdminDashboard: Error updating provider status:", error.response?.data?.message || error.message);
//       setError(error.response?.data?.message || 'Failed to update provider status.');
//     }
//   };

//   // --- RENDERING LOGIC ---
//   if (loading) return <p className="text-center text-lg mt-8">Loading dashboard data...</p>;
//   if (error) return <p className="text-center text-lg mt-8 text-red-600">{error}</p>;

//   // Filter users to get only pending providers
//   const pendingProviders = users.filter(user => user.role === 'provider' && user.providerStatus === 'Pending');

//   return (
//     <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
//       {success && (
//         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
//           <span className="block sm:inline">{success}</span>
//         </div>
//       )}
//       {error && ( // Display persistent error message here as well
//          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
//           <span className="block sm:inline">{error}</span>
//         </div>
//       )}
      
//       {/* Stats Report Section */}
//       <section className="mb-8">
//         <h2 className="text-2xl font-semibold text-gray-800 mb-4">Platform Statistics</h2>
//         {stats ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <StatCard title="Total Users" value={stats.totalUsers || 0} icon="👥" />
//             <StatCard title="Total Services" value={stats.totalServices || 0} icon="🛠️" />
//             <StatCard title="Total Bookings" value={stats.totalBookings || 0} icon="📅" />
//             <StatCard title="Total Revenue" value={`$${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}`} icon="💰" />
//             {/* If you have average rating data */}
//             {stats.averageRating != null && typeof stats.averageRating === 'number' ? (
//   <StatCard title="Average Rating" value={`⭐ ${stats.averageRating.toFixed(1)}`} icon="🌟" />
// ) : (
//   <StatCard title="Average Rating" value="N/A" icon="🌟" /> // Or a default like "0.0"
// )}
//           </div>
//         ) : (
//           <p className="text-gray-600">No statistics available.</p>
//         )}
//       </section>
      
//       {/* Section for Pending Providers */}
//       <section className="mb-8">
//         <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pending Provider Approvals ({pendingProviders.length})</h2>
//         {pendingProviders.length > 0 ? (
//           <div className="bg-white shadow-md rounded-lg overflow-hidden">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {pendingProviders.map(provider => (
//                   <tr key={provider._id}>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.name}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.email}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       <button 
//                         onClick={() => handleStatusUpdate(provider._id, 'Approved')} 
//                         className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2 transition-colors duration-200"
//                       >
//                         Approve
//                       </button>
//                       <button 
//                         onClick={() => handleStatusUpdate(provider._id, 'Rejected')} 
//                         className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
//                       >
//                         Reject
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p className="text-gray-600">No pending provider requests.</p>
//         )}
//       </section>

//       {/* ADDED: Section for Recent Feedback/Support Tickets */}
//       <section className="mb-8">
//         <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Feedback/Support</h2>
//         {feedbackList.length > 0 ? (
//             <div className="bg-white shadow-md rounded-lg overflow-hidden">
//                 <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                             {/* Add action buttons for feedback, e.g., 'View Detail', 'Mark Resolved' */}
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                         {feedbackList.map(feedback => (
//                             <tr key={feedback._id}>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{feedback.user ? feedback.user.name : 'Guest'}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feedback.subject}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">{feedback.message}</td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(feedback.createdAt).toLocaleDateString()}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         ) : (
//             <p className="text-gray-600">No recent feedback or support tickets.</p>
//         )}
//       </section>

//       {/* You might want other sections here, e.g., for All Users, All Services, All Bookings */}
//       {/* These could also be separate Admin sub-pages linked from AdminDashboard or Navbar */}
//     </div>
//   );
// };

// export default AdminDashboardPage;