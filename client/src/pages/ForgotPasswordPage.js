// client/src/pages/ForgotPasswordPage.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/forgotpassword`,
        { email },
        config
      );
      setMessage(data.message || 'Password reset email sent. Please check your inbox.');
      setEmail(''); // Clear email input
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset email.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h1>Forgot Password</h1>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      {loading && <p>Sending email...</p>}
      <form onSubmit={submitHandler}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Request Reset Link
        </button>
      </form>
      <div className="back-to-login">
        <button className="btn btn-secondary" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;