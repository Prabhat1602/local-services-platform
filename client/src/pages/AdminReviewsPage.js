// client/src/pages/AdminReviewsPage.js
import React, { useState, useEffect ,useCallback} from 'react';
import axios from 'axios';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/admin/reviews`, config);
      setReviews(data);
    } catch (err) {
      console.error("Frontend Reviews Fetch Error:", err);
      setError(err.response?.data?.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
  fetchReviews();
}, [fetchReviews]); 

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    try {
      setSuccess('');
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/reviews/${reviewId}/toggle-visibility`, {}, config);
      setSuccess(`Review visibility toggled.`);
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId ? { ...review, isVisible: !currentVisibility } : review
        )
      );
    } catch (err) {
      console.error("Frontend Toggle Review Visibility Error:", err);
      setError(err.response?.data?.message || 'Failed to toggle review visibility.');
    }
  };

  if (loading) return <p>Loading reviews...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="admin-reviews-container">
      <h1>Review Management</h1>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {reviews.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>User</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review._id}>
                <td>{review.service?.title || 'N/A'}</td>
                <td>{review.user?.name || 'N/A'}</td>
                <td>{review.rating}</td>
                <td>{review.comment}</td>
                <td>{review.isVisible ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    onClick={() => handleToggleVisibility(review._id, review.isVisible)}
                    className={`btn ${review.isVisible ? 'btn-danger' : 'btn-success'}`}
                  >
                    {review.isVisible ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No reviews found.</p>
      )}
    </div>
  );
};

export default AdminReviewsPage;