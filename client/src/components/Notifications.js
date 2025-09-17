import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import io from 'socket.io-client';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false); // Track socket connection status
  const socketRef = useRef(null); // Initialize with null
  const navigate = useNavigate(); // For redirecting on auth error

  // Retrieve userInfo consistently, and userId for socket room
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const userId = userInfo?._id;

  // Memoize config to prevent re-creation on every render if token doesn't change
  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // --- CRITICAL CORRECTION FOR SOCKET_SERVER_URL ---
  // Ensure this correctly points to your Render backend's root URL (e.g., https://your-backend.onrender.com)
  // It should NOT include '/api'
  const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '') // Remove /api to get base URL
    : 'http://localhost:5001'; // Fallback for local dev, ensure this matches server port

  // Log the URL to verify in console
  useEffect(() => {
    console.log("Notifications: SOCKET_SERVER_URL set to:", SOCKET_SERVER_URL);
  }, [SOCKET_SERVER_URL]);

  // --- Effect 1: Handle Authentication/Authorization & Fetch Notifications ---
  useEffect(() => {
    if (!token || !userInfo || !userId) {
      console.log("Notifications: User not authenticated or ID missing, not fetching notifications or connecting socket.");
      // Optionally redirect if this component is always expected to be in a protected route
      // navigate('/login'); // Uncomment if you want immediate redirect if userInfo is missing
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, config()); // Use memoized config
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error("Notifications: Failed to fetch notifications", error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            navigate('/login'); // Redirect on 401 for notifications API
        }
      }
    };
    fetchNotifications();

    // --- Connect to the socket server for notifications ---
    if (!SOCKET_SERVER_URL) {
      console.error("Notifications: SOCKET_SERVER_URL is empty, cannot connect Socket.IO.");
      return;
    }

    console.log("Notifications: Attempting Socket.IO connection to:", SOCKET_SERVER_URL);
    // Explicitly disconnect any existing socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      secure: true, // Force HTTPS/WSS for deployed environments
    });

    socketRef.current.on('connect', () => {
      console.log('Notifications: Socket.IO Connected:', socketRef.current.id);
      setSocketConnected(true);
      // Join a personal room immediately upon connect for notifications
      if (userId) {
          socketRef.current.emit('joinConversation', userId); // Join personal room, re-using emit name
          console.log(`Notifications: Joined user room ${userId} for notifications.`);
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('Notifications: Socket.IO Connection Error:', err.message, err.data);
        setSocketConnected(false);
        // If connection fails due to auth, redirect to login
        if (err.message.includes('Authentication error')) {
            navigate('/login');
        }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Notifications: Socket.IO Disconnected. Reason:', reason);
      setSocketConnected(false);
    });

    // Listen for the 'newNotification' event
    socketRef.current.on('newNotification', (newNotification) => {
      console.log('Notifications: Received newNotification:', newNotification);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Clean up the connection when the component unmounts
    return () => {
      if (socketRef.current) {
        console.log('Notifications: Disconnecting Socket.IO clean up.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // Dependencies: token for auth, SOCKET_SERVER_URL for connection target, userId for initial join.
  }, [token, userId, SOCKET_SERVER_URL, navigate, config]); // Added config, navigate

  const handleOpen = async () => {
    // Only toggle and mark read if the user is authenticated
    if (!userInfo || !token) {
        console.warn("Notifications: User not authenticated, cannot open or mark read.");
        return;
    }

    // Toggle dropdown visibility
    setIsOpen((prev) => !prev);

    // When the dropdown is opened AND there are unread notifications, mark them as read
    if (!isOpen && unreadCount > 0) { // Check !isOpen to only mark read when opening
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/notifications/read`, {}, config()); // Use memoized config
        setUnreadCount(0);
        // Optimistically update the notifications list to mark them read
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
        console.error("Notifications: Failed to mark notifications as read", error.response?.data?.message || error.message);
      }
    }
  };

  // Do not render anything if user is not logged in
  if (!userInfo || !token || !userId) return null;

  return (
    <div className="relative"> {/* Use relative for dropdown positioning */}
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
              {/* Optional: <Link to="/notifications" className="text-blue-600 hover:underline">View All</Link> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;