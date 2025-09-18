import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Retrieve userInfo directly from localStorage in the component body
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const userId = userInfo?._id;

  // IMPORTANT: Memoize SOCKET_SERVER_URL too, or derive it outside of effects
  // Ensure this correctly points to your Render backend's root URL (e.g., https://your-backend.onrender.com)
  // It should NOT include '/api'
  const backendBaseUrl = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:5001';

  // Log the URL to verify in console
  useEffect(() => {
    console.log("Notifications: SOCKET_SERVER_URL set to:", backendBaseUrl);
  }, [backendBaseUrl]); // Depend only on backendBaseUrl

  // Memoize config for API calls, its dependencies are fine
  const apiConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // --- Effect 1: Socket.IO Connection and Event Listeners ---
  useEffect(() => {
    // Only proceed if authenticated and we have a target URL
    if (!token || !userId || !backendBaseUrl) {
      console.log("Notifications: Skipping Socket.IO connection. User not authenticated, ID missing, or backend URL empty.");
      // Optional: if this component should only render for logged in users, return null from render function
      return;
    }

    console.log("Notifications: Attempting Socket.IO connection to:", backendBaseUrl);

    // Ensure only one socket instance exists.
    // If a connection already exists, and its state is not 'connecting' or 'connected',
    // disconnect it before creating a new one.
    // This part is critical for preventing multiple connections
    if (socketRef.current && socketRef.current.connected) {
        console.log("Notifications: Existing socket is connected, skipping new connection.");
        return; // Do not attempt to reconnect if already connected
    }
    // If a socket exists but is disconnected, ensure it's properly cleaned up
    if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }


    const socket = io(backendBaseUrl, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      secure: true, // Force HTTPS/WSS for deployed environments
      autoConnect: true, // Ensure it attempts to connect immediately
    });

    socketRef.current = socket; // Store the current socket instance

    socket.on('connect', () => {
      console.log('Notifications: Socket.IO Connected:', socket.id);
      setSocketConnected(true);
      if (userId) {
          socket.emit('joinConversation', userId); // Re-using for personal room
          console.log(`Notifications: Joined user room ${userId} for notifications.`);
      }
    });

    socket.on('connect_error', (err) => {
        console.error('Notifications: Socket.IO Connection Error:', err.message, err.data);
        setSocketConnected(false);
        if (err.message.includes('Authentication error')) {
            navigate('/login');
        }
    });

    socket.on('disconnect', (reason) => {
      console.log('Notifications: Socket.IO Disconnected. Reason:', reason);
      setSocketConnected(false);
    });

    socket.on('newNotification', (newNotification) => {
      console.log('Notifications: Received newNotification:', newNotification);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Cleanup: Disconnect when component unmounts
    return () => {
      if (socketRef.current) {
        console.log('Notifications: Disconnecting Socket.IO clean up on unmount.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, userId, backendBaseUrl, navigate]); // <--- CRITICAL: Depend only on stable values

  // --- Effect 2: Fetch Initial Notifications (Separated for clarity) ---
  useEffect(() => {
    // Only fetch if authenticated
    if (!token || !userId) {
      console.log("Notifications: Skipping initial fetch. User not authenticated or ID missing.");
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, apiConfig());
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error("Notifications: Failed to fetch notifications", error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            navigate('/login');
        }
      }
    };
    fetchNotifications();
  }, [token, userId, navigate, apiConfig]); // Depend only on stable values

  const handleOpen = async () => {
    if (!userInfo || !token) {
        console.warn("Notifications: User not authenticated, cannot open or mark read.");
        return;
    }

    setIsOpen((prev) => !prev);

    if (!isOpen && unreadCount > 0) {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/notifications/read`, {}, apiConfig());
        setUnreadCount(0);
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
        console.error("Notifications: Failed to mark notifications as read", error.response?.data?.message || error.message);
      }
    }
  };

  // Do not render anything if user is not logged in or if we don't have a token/userId
  if (!userInfo || !token || !userId) return null;

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.405L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
          <div className="px-4 py-2 text-sm text-gray-700 font-semibold border-b">Notifications</div>
          {notifications.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No new notifications.</div>
          ) : (
            notifications.map((n) => (
              <Link to={n.link || '#'} key={n._id} className={`block px-4 py-3 text-sm hover:bg-gray-100 ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`} onClick={() => setIsOpen(false)}>
                <p>{n.message}</p>
                <small className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</small>
              </Link>
            ))
          )}
          <div className="px-4 py-2 text-sm text-center border-t">
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;