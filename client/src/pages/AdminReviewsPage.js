// client/src/pages/AdminReviewsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;

  // --- FIX: Memoize config using useCallback ---
  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]); // config only changes if the 'token' changes

  const fetchReviews = useCallback(async () => {
    // If no token, prevent fetch and show error
    if (!token) {
        setLoading(false);
        setError("Authentication required. Please log in.");
        return;
    }

    try {
      setLoading(true);
      setError('');
      // --- FIX: Call config as a function ---
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/admin/reviews`, config());
      setReviews(data);
    } catch (err) {
      console.error("Frontend Reviews Fetch Error:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch reviews.');
       if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            setError('Unauthorized. Please ensure you are logged in as an administrator.');
            // navigate('/login'); // If you import useNavigate
        }
    } finally {
      setLoading(false);
    }
  // --- Dependency array for fetchReviews now only needs config (which itself depends on token) ---
  }, [config, token]); // Add token here directly as well, for clarity and robustness

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]); // This is now correct, as fetchReviews is only re-created when its own dependencies change.

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    // If no token, prevent action
    if (!token) {
        setError("Authentication required to perform this action.");
        return;
    }
    try {
      setSuccess('');
      // --- FIX: Call config as a function ---
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/reviews/${reviewId}/toggle-visibility`, {}, config());
      setSuccess(`Review visibility toggled.`);
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId ? { ...review, isVisible: !currentVisibility } : review
        )
      );
      // Optional: Re-fetch reviews to ensure UI is fully up-to-date, or rely on local state update
      // fetchReviews();
    } catch (err) {
      console.error("Frontend Toggle Review Visibility Error:", err.response?.data?.message || err.message);
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