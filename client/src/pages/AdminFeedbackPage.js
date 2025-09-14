import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminFeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('https://local-services-api.onrender.com/api/admin/feedback', config);
        setFeedback(data);
      } catch (error) {
        console.error("Failed to fetch feedback", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [userInfo.token]);

  if (loading) return <p>Loading feedback...</p>;

  return (
    <div className="admin-feedback-container">
      <h1>User Feedback & Support Tickets</h1>
      {feedback.map((item) => (
        <div key={item._id} className="feedback-card">
          <div className="feedback-header">
            <h3>{item.subject}</h3>
            <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
          </div>
          <div className="feedback-body">
            <p>{item.message}</p>
          </div>
          <div className="feedback-footer">
            <span><strong>From:</strong> {item.user.name} ({item.user.email})</span>
            <span><strong>Type:</strong> {item.type}</span>
            <small>Submitted: {new Date(item.createdAt).toLocaleString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminFeedbackPage;