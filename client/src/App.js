import React from 'react';
import { Routes, Route } from 'react-router-dom';

// === ALL IMPORTS SHOULD BE AT THE TOP ===
// Components
import Navbar from './components/Navbar';
import Header from './components/Header'; // Assuming this is your main navigation now
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute'; // AdminRoute should be for specific pages, not nesting
// import ProviderRoute from './components/ProviderRoute'; // If you have a separate one, import it

// Pages - Public
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import SupportPage from './pages/SupportPage'; // This should likely be public or private, not admin-only

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
import AdminUserManagementPage from './pages/AdminUserManagementPage'; // Moved to top
import AdminReviewsPage from './pages/AdminReviewsPage'; // Assuming this is for toggling reviews
import AdminTransactionsPage from './pages/AdminTransactionsPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
// import AllBookingsPage from './pages/AllBookingsPage'; // Is this different from AdminDashboard or a specific view?
// import AllReviewsPage from './pages/AllReviewsPage'; // Is this different from AdminReviewsPage?


function App() {
  return (
    <>
      <Header /> {/* Using Header as the main navigation, as per previous discussion */}
      <main style={{ padding: '1.5rem' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/support" element={<SupportPage />} /> {/* Support page is often public or general private */}


          {/* Private Routes - Only accessible when logged in (User/Provider) */}
          <Route element={<PrivateRoute />}>
            <Route path="/create-service" element={<CreateServicePage />} />
            <Route path="/dashboard" element={<ProviderDashboardPage />} /> {/* Assuming this is provider dashboard */}
            <Route path="/my-bookings" element={<UserBookingsPage />} />
            <Route path="/availability" element={<ProviderAvailabilityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/earnings" element={<ProviderEarningsPage />} />
            <Route path="/provider/transactions" element={<ProviderTransactionsPage />} />
            <Route path="/transactions" element={<UserTransactionsPage />} />
          </Route>


          {/* Admin Routes - Only accessible by Admin users */}
          {/* Each admin route should be a direct child of the AdminRoute element.
             AdminRoute component should handle the redirect if not admin. */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} /> {/* For toggling/managing reviews */}
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            {/* If AllBookingsPage/AllReviewsPage are distinct, add them here: */}
            {/* <Route path="/admin/all-bookings" element={<AllBookingsPage />} /> */}
            {/* <Route path="/admin/all-reviews" element={<AllReviewsPage />} /> */}
            {/* <Route path="admin/services" element={<AdminServiceManagementPage />} /> */}
          </Route>

          {/* Fallback for unknown routes */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </main>
      {/* <Footer /> */} {/* If you have a Footer component */}
    </>
  );
}

export default App;