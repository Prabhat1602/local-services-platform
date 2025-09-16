// client/src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  // Get user info directly from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
    window.location.reload();
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <Link className="navbar-brand" to="/">YourApp</Link>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ml-auto">
            {userInfo ? (
              <>
                {userInfo.role === 'admin' && (
                  <li className="nav-item dropdown">
                    <Link className="nav-link dropdown-toggle" to="#" id="adminDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Admin
                    </Link>
                    <div className="dropdown-menu" aria-labelledby="adminDropdown">
                      <Link className="dropdown-item" to="/admin/dashboard">Dashboard</Link>
                      <Link className="dropdown-item" to="/admin/users">User Management</Link>
                      <Link className="dropdown-item" to="/admin/reviews">Review Management</Link>
                      <Link className="dropdown-item" to="/admin/transactions">Transaction Management</Link>
                      {/* <Link className="dropdown-item" to="/admin/feedback">Feedback Management</Link> */}
                    </div>
                  </li>
                )}

                {/* Other user-specific links */}
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Profile</Link>
                </li>
                {/* --- ADDED LOGOUT BUTTON HERE --- */}
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link btn btn-link">Logout</button>
                </li>
                {/* --- END ADDED LOGOUT BUTTON --- */}
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;