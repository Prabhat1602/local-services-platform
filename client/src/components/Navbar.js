import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Notifications from './Notifications';
const Navbar = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
    window.location.reload(); // Force a refresh to ensure navbar updates
  };

  return (
    <nav style={{ background: '#2c3e50', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
        LocalServices
      </Link>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {userInfo ? (
          <>
            {/* --- MOVED PROFILE & CHAT LINKS HERE --- */}
             <Notifications />
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
            <Link to="/chat" style={{ color: 'white', textDecoration: 'none' }}>Chat</Link>
           {userInfo && userInfo.role === 'admin' && (
             <>
  <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}> Admin Panel</Link>
      <Link to="/admin/dashboard" style={{ /*...*/ }}>User Management</Link>
    <Link to="/admin/bookings" style={{ color: 'white', textDecoration: 'none' }}>Platform Activity</Link>
      <Link to="/admin/reviews" style={{ color: 'white', textDecoration: 'none' }}>Reviews</Link>
           </>
)}
            {userInfo.role === 'provider' && (
              <>
                  <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
    <Link to="/earnings" style={{ color: 'white', textDecoration: 'none' }}>Earnings</Link>
                <Link to="/availability" style={{ color: 'white', textDecoration: 'none' }}>Set Availability</Link>
                <Link to="/create-service" style={{ color: 'white', textDecoration: 'none' }}>Post a Service</Link>
              </>
            )}

            {userInfo.role === 'user' && (
              <Link to="/my-bookings" style={{ color: 'white', textDecoration: 'none' }}>My Bookings</Link>
            )}
            
            <span style={{ color: '#ecf0f1' }}>Hi, {userInfo.name}!</span>
            <button onClick={logoutHandler} style={{ background: '#c03B2b', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;