import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAllReviews = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/admin/reviews', config);
      setReviews(data);
    } catch (err) {
      setError('Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const handleVisibilityToggle = async (reviewId) => {
    try {
      await axios.put(`http://localhost:5001/api/admin/reviews/${reviewId}/toggle-visibility`, {}, config);
      // Refresh the list to show the new status
      setReviews(reviews.map(review => 
        review._id === reviewId ? { ...review, isVisible: !review.isVisible } : review
      ));
    } catch (error) {
      setError('Failed to update review visibility.');
    }
  };

  if (loading) return <p>Loading all reviews...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Review Moderation</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd', background: '#f7f7f7' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Service</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>User</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Rating</th>
            <th style={{ padding: '0.5rem', textAlign: 'left', width: '40%' }}>Comment</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>{review.service?.title || 'N/A'}</td>
              <td style={{ padding: '0.5rem' }}>{review.user?.name || 'N/A'}</td>
              <td style={{ padding: '0.5rem' }}>{'⭐'.repeat(review.rating)}</td>
              <td style={{ padding: '0.5rem' }}>{review.comment}</td>
              <td style={{ padding: '0.5rem', color: review.isVisible ? 'green' : 'red' }}>
                {review.isVisible ? 'Visible' : 'Hidden'}
              </td>
              <td style={{ padding: '0.5rem' }}>
                <button onClick={() => handleVisibilityToggle(review._id)} className={review.isVisible ? 'btn-reject' : 'btn-approve'}>
                  {review.isVisible ? 'Hide' : 'Show'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllReviewsPage;