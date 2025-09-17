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
    {/* Consolidate or separate your admin links clearly */}
    <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Admin Dashboard</Link>
    {/* If User Management is a separate section on the dashboard, you don't need a separate Navbar link */}
    <Link to="/admin/bookings" style={{ color: 'white', textDecoration: 'none' }}>Platform Activity</Link>
    <Link to="/admin/reviews" style={{ color: 'white', textDecoration: 'none' }}>Reviews</Link>
    <Link to="/admin/transactions" style={{color: 'white', textDecoration: 'none'}}>Transactions</Link>
    <Link to="/admin/feedback" style={{color: 'white', textDecoration: 'none'}}>Feedback</Link>
  </>
)}
{userInfo.role!=='admin' &&  <Link to="/support" style={{color: 'white', textDecoration: 'none'}}>Support </Link>}
            {userInfo.role === 'provider' && (
              <>
                  <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
    <Link to="/earnings" style={{ color: 'white', textDecoration: 'none' }}>Earnings</Link>
                <Link to="/availability" style={{ color: 'white', textDecoration: 'none' }}>Set Availability</Link>
                <Link to="/create-service" style={{ color: 'white', textDecoration: 'none' }}>Post a Service</Link>
                 <Link to="/provider/transactions" style={{color: 'white', textDecoration: 'none'}}>Transactions</Link>
              </>
            )}

            {userInfo.role === 'user' && (
              <>
              <Link to="/my-bookings" style={{ color: 'white', textDecoration: 'none' }}>My Bookings</Link>
               <Link to="/transactions" style={{ color: 'white', textDecoration: 'none' }}>My Transactions</Link>
               </>
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