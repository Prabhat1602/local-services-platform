import React, { useState } from 'react';
import axios from 'axios';

const SupportPage = () => {
  const [type, setType] = useState('Support Request');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post('http://localhost:5001/api/feedback', { type, subject, message }, config);
      setSuccess(data.message);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div className="support-container">
      <h1>Contact Support & Feedback</h1>
      <form onSubmit={handleSubmit} className="support-form">
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div className="form-group">
          <label>Type of Inquiry</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Support Request</option>
            <option>Feedback</option>
            <option>Suggestion</option>
            <option>Bug Report</option>
          </select>
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Please describe your issue or suggestion in detail..."></textarea>
        </div>
        <button type="submit" className="btn-submit">Submit</button>
      </form>
    </div>
  );
};

export default SupportPage;