import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateServicePage = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null); // State for the image file
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!image) {
      setError('Please select an image for your service.');
      setLoading(false);
      return;
    }

    // Use FormData to handle file uploads
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('image', image); // Key 'image' must match the backend

    try {
      const { token } = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/services`, formData, config);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <h2>Create a New Service</h2>
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleSubmit} className="service-form">
          <div className="form-group">
            <label htmlFor="title">Service Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Expert Plumbing Repairs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              placeholder="e.g., Home Repair, Tutoring"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe the service you offer in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($)</label>
            <input
              id="price"
              type="number"
              placeholder="e.g., 50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Service Image</label>
            <input
              id="image"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
          </div>
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Service'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateServicePage;