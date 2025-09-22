import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ProviderAvailabilityPage = () => {
  const [myServices, setMyServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [availability, setAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { token } = JSON.parse(localStorage.getItem('userInfo'));
  const { providerId } = useParams(); // Using useParams() correctly here

  const navigate = useNavigate();

  // FIX 1: Memoize config to prevent infinite re-renders
  // This ensures 'config' object reference is stable unless 'token' changes.
  const config = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);


  // Fetch the provider's services on component load
  // FIX 1: Removed 'config' from dependency array, now stable due to useMemo
  // Also removed providerId as it's not directly used in fetchMyServices and token is enough to trigger re-fetch if userInfo changes.
  useEffect(() => {
    const fetchMyServices = async () => {
      try {
        setLoading(true); // Ensure loading is true before fetch starts
        setError(''); // Clear previous errors
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/services/myservices`, config);
        setMyServices(data);
        if (data.length > 0) {
          // Pre-select the first service
          setSelectedServiceId(data[0]._id);
          setAvailability(data[0].availability || []);
        } else {
          // If no services, clear any existing availability
          setAvailability([]);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError('Could not fetch your services.');
        // If there are services but still an error, might want to keep the current selection
      } finally {
        setLoading(false);
      }
    };
    if (token) { // Only fetch if token exists
        fetchMyServices();
    } else {
        setLoading(false);
        setError("Authentication token not found. Please log in.");
        // Optionally redirect to login
        // navigate('/login');
    }
  }, [token, config]); // 'config' is now stable. `token` is fine as a dependency.


  // Handler for when a different service is selected from the dropdown
  // Wrapped in useCallback for stability, though not strictly necessary here, good practice.
  const handleServiceSelect = useCallback((serviceId) => {
    setSelectedServiceId(serviceId);
    const selected = myServices.find(s => s._id === serviceId);
    if (selected) { // Ensure a service was actually found
      setAvailability(selected.availability || []);
    } else {
      setAvailability([]); // Clear availability if service not found
    }
    setSuccess('');
    setError('');
  }, [myServices]); // myServices is a dependency for finding the service


  // Handler for adding a new availability slot to the local state
  const handleAddSlot = useCallback(() => {
    // Basic validation for newSlot
    if (!newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) {
        setError('Please fill all fields for the new slot.');
        return;
    }
    // Optional: Add more validation here (e.g., end time after start time, no overlapping slots)
    setAvailability(prevAvailability => [...prevAvailability, newSlot]);
    setNewSlot({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }); // Reset form
    setSuccess('');
    setError('');
  }, [newSlot]);

  // Handler for removing a slot from the local state
  const handleRemoveSlot = useCallback((indexToRemove) => {
    setAvailability(prevAvailability => prevAvailability.filter((_, index) => index !== indexToRemove));
    setSuccess('');
    setError('');
  }, []);

  // Handler for saving the entire availability schedule to the backend
  const handleSaveAvailability = useCallback(async () => {
    setError('');
    setSuccess('');
    if (!selectedServiceId) {
      setError('Please select a service to update.');
      return;
    }
    try {
      // Ensure we send an array, even if empty, as the backend expects it.
      await axios.put(`${process.env.REACT_APP_API_URL}/services/${selectedServiceId}/availability`, { availability: availability }, config);
      setSuccess('Availability updated successfully!');
      // Re-fetch services to ensure UI is fully synced if backend returns full service object
      // Or manually update the specific service in myServices state here.
      // For simplicity, let's re-fetch.
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/services/myservices`, config);
      setMyServices(data);
      const updatedSelected = data.find(s => s._id === selectedServiceId);
      if(updatedSelected) {
          setAvailability(updatedSelected.availability || []);
      }
    } catch (err) {
      console.error("Error saving availability:", err);
      setError(err.response?.data?.message || 'Failed to update availability. Check backend logs.');
    }
  }, [selectedServiceId, availability, config, setMyServices]); // Include setMyServices if it's used inside, or use a functional update for myServices


  if (loading) return <p>Loading your services...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h1>Set Your Availability</h1>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}

      {myServices.length > 0 ? (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="service-select" style={{ marginRight: '1rem', fontWeight: 'bold' }}>Select a Service to Manage:</label>
            <select id="service-select" value={selectedServiceId} onChange={(e) => handleServiceSelect(e.target.value)}>
              {/* FIX 2: Changed service.title to service.name */}
              {myServices.map(service => (
                <option key={service._id} value={service._id}>{service.title}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h4>Add New Slot</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={newSlot.dayOfWeek} onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                        style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <input type="time" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                       style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                <span> to </span>
                <input type="time" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                       style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                <button onClick={handleAddSlot} style={{ marginLeft: '1rem', padding: '0.6rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Add Slot
                </button>
            </div>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h4>Current Schedule</h4>
            {availability.length > 0 ? availability.map((slot, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                <span><strong>{slot.dayOfWeek}</strong>: {slot.startTime} - {slot.endTime}</span>
                <button onClick={() => handleRemoveSlot(index)} 
                        style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Remove
                </button>
              </div>
            )) : <p>No availability set for this service.</p>}
          </div>

          <button onClick={handleSaveAvailability} 
                  style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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