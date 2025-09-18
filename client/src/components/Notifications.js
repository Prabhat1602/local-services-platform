// client/src/components/Notifications.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5001';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // To check if we are on the chat page

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;
  const userId = userInfo?._id;

  const config = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // --- 1. Fetch existing notifications from DB on component mount ---
  useEffect(() => {
    if (!token || !userId) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, config());
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error("Notifications: Error fetching notifications:", error.response?.data?.message || error.message);
      }
    };
    fetchNotifications();
  }, [token, userId, config]);

  // --- 2. Socket.IO Connection and Listener for new notifications ---
  useEffect(() => {
    if (!token || !userId || !SOCKET_SERVER_URL) {
        console.log("Notifications: Skipping Socket.IO connection. User not authenticated or ID missing.");
        return;
    }

    if (socketRef.current && socketRef.current.connected) {
        console.log("Notifications: Existing socket is connected, skipping new connection.");
        return;
    }
    if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }

    console.log("Notifications: Attempting Socket.IO connection to:", SOCKET_SERVER_URL);
    const socket = io(SOCKET_SERVER_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      secure: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Notifications: Socket.IO Connected:', socket.id);
      // Join personal user room on connect for notifications
      if (userId) {
          socket.emit('joinConversation', userId); // Reusing 'joinConversation' for user-specific room
          console.log(`Notifications: Joined user room ${userId} for notifications.`);
      }
    });

    socket.on('connect_error', (err) => {
        console.error('Notifications: Socket.IO Connection Error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Notifications: Socket.IO Disconnected. Reason:', reason);
    });

    // --- Listen for new notifications from the server ---
    socket.on('newNotification', (notificationData) => {
      console.log('Notifications: Received new notification:', notificationData);

    
      // For now, let's assume we create a simple local notification object:
      setNotifications(prev => [
          {
              _id: `temp-${Date.now()}`,
              type: notificationData.type,
              message: notificationData.message,
              createdAt: new Date().toISOString(),
              isRead: false,
              link: notificationData.conversationId ? `/chat?conversationId=${notificationData.conversationId}` : '#'
          },
          ...prev
      ]);
      setUnreadCount(prev => prev + 1);

      // Optional: Visual cue like a toast notification
      // You could use a library like react-toastify here
      alert(notificationData.message); // Temporary for testing
    });


    return () => {
      if (socketRef.current) {
        console.log('Notifications: Disconnecting Socket.IO clean up.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, userId, config]);


  // --- Click outside to close dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  const markAsRead = async (notificationId, navigateToLink) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/notifications/${notificationId}/read`, {}, config());
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1)); // Decrement count
      if (navigateToLink) {
          navigate(navigateToLink);
      }
    } catch (error) {
      console.error("Notifications: Error marking notification as read:", error.response?.data?.message || error.message);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/notifications/read-all`, {}, config());
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Notifications: Error clearing all notifications:", error.response?.data?.message || error.message);
    }
  };

  if (!token || !userId) {
    return null; // Don't render if not logged in
  }

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={toggleDropdown}>
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {dropdownOpen && (
        <div className="notification-dropdown">
          {notifications.length > 0 ? (
            <>
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className="notification-item"
                  style={{ backgroundColor: notification.isRead ? '#f0f0f0' : 'white' }}
                  onClick={() => {
                      setDropdownOpen(false); // Close dropdown on click
                      markAsRead(notification._id, notification.link);
                  }}
                >
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
              ))}
              <button onClick={clearAllNotifications} className="btn btn-secondary" style={{ width: '100%', borderTop: '1px solid #eee', borderRadius: '0 0 8px 8px' }}>
                Clear All Read
              </button>
            </>
          ) : (
            <div className="notification-item">No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;










