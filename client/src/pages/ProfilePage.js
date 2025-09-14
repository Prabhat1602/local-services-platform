import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfilePage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
 const [location, setLocation] = useState(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

  useEffect(() => {
    setName(userInfo.name);
    setEmail(userInfo.email);
  }, [userInfo.name, userInfo.email]);
 const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        setMessage('Location captured! Click "Update Profile" to save.');
      },
      () => {
        setMessage('Could not get location. Please enable location services in your browser.');
      }
    );
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (password && password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
      try {
        const updateData = { name };
        if (password) {
            updateData.password = password;
        }
        if (location) {
            updateData.location = location;
        }
        await axios.put('http://localhost:5001/api/users/profile', updateData, config);
        setMessage('Profile updated successfully!');
    } catch (error) {
        setMessage('Failed to update profile.');
    }
  };
 



  return (
    <div className="profile-container">
      <div className="profile-form-wrapper">
        <h2>My Profile</h2>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} disabled />
          </div>
          <p>Update Password</p>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" placeholder="Leave blank to keep the same" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" placeholder="Leave blank to keep the same" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
             <div className="form-group">
            <button type="button" onClick={handleGetLocation}>Set My Current Location</button>
        </div>
          <button type="submit" className="btn-submit">Update Profile</button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;