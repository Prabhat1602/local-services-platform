import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Effect 1: Get the user's geolocation once when the component loads.
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error: ", error);
        // Silently fail if user denies location access or it's unavailable.
      }
    );
  }, []); // Empty dependency array means this runs only once.

  // Effect 2: Fetch services whenever the search term or user location changes.
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        // Build the URL with the search term
        let url = `http://localhost:5001/api/services?search=${searchTerm}`;
        
        // If we have the user's location, add it to the URL
        if (userLocation) {
          url += `&lat=${userLocation.lat}&lon=${userLocation.lon}`;
        }
        
        const { data } = await axios.get(url);
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [searchTerm, userLocation]); // This hook re-runs if either value changes.

  return (
    <div>
      <h1>{userInfo ? `Welcome, ${userInfo.name}!` : 'Welcome to Local Services'}</h1>

      {/* --- SEARCH BAR --- */}
      <div style={{ margin: '2rem 0' }}>
        <input
          type="text"
          placeholder="Search for services by title or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>

      <h2>Available Services</h2>
      {loading ? (
        <p>Loading...</p>
      ) : services.length === 0 ? (
        <p>No services found matching your search.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {services.map((service) => (
            <Link key={service._id} to={`/service/${service._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '5px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ marginTop: 0 }}>{service.title}</h3>
                <div>
                  <span>⭐ {service.averageRating ? service.averageRating.toFixed(1) : '0.0'}</span>
                  <span style={{ marginLeft: '0.5rem' }}>({service.numReviews || 0} reviews)</span>
                </div>
                <p><strong>Category:</strong> {service.category}</p>
                <p><strong>Price:</strong> ${service.price}</p>
                <p style={{ marginTop: 'auto' }}>
                  <strong>Provider:</strong> {service.provider.name} {service.distance && `(${service.distance} away)`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;