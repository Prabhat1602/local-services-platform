// client/src/components/AdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Check if user is logged in AND has the 'admin' role
  if (userInfo && userInfo.token && userInfo.role === 'admin') {
    return <Outlet />; // Render child routes if authorized
  } else {
    // Redirect to login if not authorized as admin
    return <Navigate to="/login?message=Unauthorized: Admin access required" replace />;
  }
};

export default AdminRoute;