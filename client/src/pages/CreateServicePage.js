import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateServicePage = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { token } = JSON.parse(localStorage.getItem('userInfo'));

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      await axios.post('http://localhost:5001/api/services', { title, category, description, price }, config);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2>Create a New Service</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Service Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '0.5rem' }} />
        <input type="text" placeholder="Category (e.g., Plumbing, Tutoring)" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: '0.5rem' }} />
        <textarea placeholder="Detailed Description" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ padding: '0.5rem', minHeight: '100px' }} />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ padding: '0.5rem' }} />
        <button type="submit" style={{ padding: '0.75rem', background: '#2980b9', color: 'white', border: 'none', cursor: 'pointer' }}>Create Service</button>
      </form>
    </div>
  );
};

export default CreateServicePage;