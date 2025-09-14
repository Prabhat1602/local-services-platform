import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>✅ Payment Successful!</h2>
      <p>Your booking has been confirmed.</p>
      <p>The provider has been notified.</p>
      <Link to="/my-bookings">
        <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}>
          View My Bookings
        </button>
      </Link>
    </div>
  );
};

export default PaymentSuccessPage;