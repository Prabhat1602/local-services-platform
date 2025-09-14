import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) return;

    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

    // Fetch initial notifications when the component loads
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/notifications', config);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifications();

    // Connect to the socket server
    socketRef.current = io('http://localhost:5001');
    // Join a personal room to receive private notifications
    socketRef.current.emit('joinConversation', userInfo._id); // Re-using joinConversation to join a personal room

    // Listen for the 'newNotification' event
    socketRef.current.on('newNotification', (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Clean up the connection when the component unmounts
    return () => socketRef.current.disconnect();
  }, [userInfo?._id, userInfo?.token]);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    // When the dropdown is opened, mark all unread notifications as read
    if (unreadCount > 0) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put('http://localhost:5001/api/notifications/read', {}, config);
        setUnreadCount(0);
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    }
  };

  if (!userInfo) return null;

  return (
    <div className="notification-container">
      <button onClick={handleOpen} className="notification-bell">
        🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <div className="notification-item">No new notifications.</div>
          ) : (
            notifications.map((n) => (
              <Link to={n.link || '#'} key={n._id} className="notification-item" onClick={() => setIsOpen(false)}>
                {n.message}
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;