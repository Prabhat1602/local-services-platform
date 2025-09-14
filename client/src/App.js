import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CreateServicePage from './pages/CreateServicePage'; // Import the new page
import ServiceDetailPage from './pages/ServiceDetailPage';
import ProviderDashboardPage from './pages/ProviderDashboardPage'; 
import ProviderAvailabilityPage from './pages/ProviderAvailabilityPage';
import UserBookingsPage from './pages/UserBookingsPage';
import ProfilePage from './pages/ProfilePage'; // Import ProfilePage
import ChatPage from './pages/ChatPage';  
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminRoute from './components/AdminRoute';
import AdminDashboardPage from './pages/AdminDashboardPage'
import AllBookingsPage from './pages/AllBookingsPage';
import AllReviewsPage from './pages/AllReviewsPage';
import ProviderEarningsPage from './pages/ProviderEarningsPage';
function App() {
  return (
    <>
      <Navbar />
      <main style={{ padding: '1.5rem' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
         <Route path="/service/:id" element={<ServiceDetailPage />} /> 
           <Route path="/payment-success" element={<PaymentSuccessPage />} />
          {/* Private Routes - Only accessible when logged in */}
          <Route element={<PrivateRoute />}>
            <Route path="/create-service" element={<CreateServicePage />} />
            <Route path="/dashboard" element={<ProviderDashboardPage />} />
             <Route path="/my-bookings" element={<UserBookingsPage />} /> 
            <Route path="/availability" element={<ProviderAvailabilityPage />} />
              <Route path="/profile" element={<ProfilePage />} /> {/* Add profile route */}
            <Route path="/chat" element={<ChatPage />} /> 
             <Route path="/earnings" element={<ProviderEarningsPage />} />
             <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> 
              <Route path="/admin/bookings" element={<AllBookingsPage />} /> {/* Add this route */}
                <Route path="/admin/reviews" element={<AllReviewsPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;