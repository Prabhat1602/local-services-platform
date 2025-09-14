import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role is 'user'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('https://local-services-api.onrender.com/api/auth/register', { name, email, password, role });
      localStorage.setItem('userInfo', JSON.stringify(data));
      // Force a page refresh to update the navbar correctly
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '0.5rem' }} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.5rem' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.5rem' }} />
        <div>
          <label style={{ marginRight: '1rem' }}>I am a:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '0.5rem' }}>
            <option value="user">User (looking for services)</option>
            <option value="provider">Service Provider</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '0.75rem', background: '#2980b9', color: 'white', border: 'none', cursor: 'pointer' }}>Register</button>
      </form>
    </div>
  );
};

export default RegisterPage;