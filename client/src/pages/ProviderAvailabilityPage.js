import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProviderAvailabilityPage = () => {
  const [myServices, setMyServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [availability, setAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { token } = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch the provider's services on component load
  useEffect(() => {
    const fetchMyServices = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/services/myservices`, config);
        setMyServices(data);
        if (data.length > 0) {
          // Pre-select the first service
          setSelectedServiceId(data[0]._id);
          setAvailability(data[0].availability || []);
        }
      } catch (err) {
        setError('Could not fetch your services.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyServices();
  }, []);

  // Handler for when a different service is selected from the dropdown
  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    const selected = myServices.find(s => s._id === serviceId);
    setAvailability(selected.availability || []);
    setSuccess('');
    setError('');
  };

  // Handler for adding a new availability slot to the local state
  const handleAddSlot = () => {
    setAvailability([...availability, newSlot]);
  };

  // Handler for removing a slot from the local state
  const handleRemoveSlot = (indexToRemove) => {
    setAvailability(availability.filter((_, index) => index !== indexToRemove));
  };

  // Handler for saving the entire availability schedule to the backend
  const handleSaveAvailability = async () => {
    setError('');
    setSuccess('');
    if (!selectedServiceId) {
      setError('Please select a service to update.');
      return;
    }
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/services/${selectedServiceId}/availability`, { availability }, config);
      setSuccess('Availability updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability.');
    }
  };

  if (loading) return <p>Loading your services...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h1>Set Your Availability</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      {myServices.length > 0 ? (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="service-select" style={{ marginRight: '1rem', fontWeight: 'bold' }}>Select a Service to Manage:</label>
            <select id="service-select" value={selectedServiceId} onChange={(e) => handleServiceSelect(e.target.value)}>
              {myServices.map(service => (
                <option key={service._id} value={service._id}>{service.title}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem', border: '1px solid #ccc', padding: '1rem' }}>
            <h4>Add New Slot</h4>
            <select value={newSlot.dayOfWeek} onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <input type="time" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} />
            <span> to </span>
            <input type="time" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} />
            <button onClick={handleAddSlot} style={{ marginLeft: '1rem' }}>Add Slot</button>
          </div>

          <div>
            <h4>Current Schedule</h4>
            {availability.length > 0 ? availability.map((slot, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                <span><strong>{slot.dayOfWeek}</strong>: {slot.startTime} - {slot.endTime}</span>
                <button onClick={() => handleRemoveSlot(index)} style={{ background: '#e74c3c', color: 'white', border: 'none' }}>Remove</button>
              </div>
            )) : <p>No availability set for this service.</p>}
          </div>

          <button onClick={handleSaveAvailability} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#27ae60', color: 'white', border: 'none' }}>
            Save Availability
          </button>
        </>
      ) : (
        <p>You have not created any services yet. Please post a service first.</p>
      )}
    </div>
  );
};

export default ProviderAvailabilityPage;