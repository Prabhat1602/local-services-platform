// client/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// === ALL IMPORTS SHOULD BE AT THE TOP ===
// Components
import Navbar from './components/Navbar'; // <--- Ensure Navbar is imported
// REMOVE: import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute'; // Corrected path if it's nested

// Pages - Public
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import SupportPage from './pages/SupportPage';

// Pages - Private (User/Provider)
import CreateServicePage from './pages/CreateServicePage';
import ProviderDashboardPage from './pages/ProviderDashboardPage';
import ProviderAvailabilityPage from './pages/ProviderAvailabilityPage';
import UserBookingsPage from './pages/UserBookingsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import ProviderEarningsPage from './pages/ProviderEarningsPage';
import UserTransactionsPage from './pages/UserTransactionsPage';
import ProviderTransactionsPage from './pages/ProviderTransactionsPage';

// Pages - Admin Specific
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import AdminTransactionsPage from './pages/AdminTransactionsPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';


function App() {
  return (
    <>
      <Navbar /> {/* <--- RENDER NAVBAR HERE */}
      <main style={{ padding: '1.5rem' }}> {/* You might need to adjust this padding if Navbar is fixed */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Private Routes - Only accessible when logged in (User/Provider) */}
          <Route element={<PrivateRoute />}>
            <Route path="/create-service" element={<CreateServicePage />} />
            <Route path="/dashboard" element={<ProviderDashboardPage />} />
            <Route path="/my-bookings" element={<UserBookingsPage />} />
            <Route path="/availability" element={<ProviderAvailabilityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/earnings" element={<ProviderEarningsPage />} />
            <Route path="/provider/transactions" element={<ProviderTransactionsPage />} />
            <Route path="/transactions" element={<UserTransactionsPage />} />
          </Route>

          {/* Admin Routes - Only accessible by Admin users */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
          </Route>

          {/* Fallback for unknown routes */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </main>
      {/* <Footer /> */}
    </>
  );
}

export default App;