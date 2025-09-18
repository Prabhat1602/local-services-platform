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

      // If on chat page and the notification is for the *current* conversation,
      // you might not want a separate notification in the bell, but rather update the chat UI.
      // This logic depends on how you want to handle "in-chat" vs "out-of-chat" notifications.
      // For now, let's just add it to the bell count.
      // You'll need to store full notifications in DB if you want to display them in dropdown
      // For now, we'll increment unread count and add a placeholder to state.

      // Option 1: Just increment count and refetch (simpler if notifications are saved in DB)
      // fetchNotifications(); // Refetch all to ensure full data and correct count

      // Option 2: Optimistically update state (requires notificationData to be complete)
      // For chat messages, you'd typically want the backend to save the actual Notification document
      // and send its ID and full content here, then you push it to `notifications` state.

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










// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import io from 'socket.io-client';
// import axios from 'axios';
// import { Link, useNavigate } from 'react-router-dom';

// const Notifications = () => {
//   const [notifications, setNotifications] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [socketConnected, setSocketConnected] = useState(false);
//   const socketRef = useRef(null);
//   const navigate = useNavigate();

//   // Retrieve userInfo directly from localStorage in the component body
//   const userInfo = JSON.parse(localStorage.getItem('userInfo'));
//   const token = userInfo?.token;
//   const userId = userInfo?._id;

//   // IMPORTANT: Memoize SOCKET_SERVER_URL too, or derive it outside of effects
//   // Ensure this correctly points to your Render backend's root URL (e.g., https://your-backend.onrender.com)
//   // It should NOT include '/api'
//   const backendBaseUrl = process.env.REACT_APP_API_URL
//     ? process.env.REACT_APP_API_URL.replace('/api', '')
//     : 'http://localhost:5001';

//   // Log the URL to verify in console
//   useEffect(() => {
//     console.log("Notifications: SOCKET_SERVER_URL set to:", backendBaseUrl);
//   }, [backendBaseUrl]); // Depend only on backendBaseUrl

//   // Memoize config for API calls, its dependencies are fine
//   const apiConfig = useCallback(() => ({
//     headers: { Authorization: `Bearer ${token}` }
//   }), [token]);

//   // --- Effect 1: Socket.IO Connection and Event Listeners ---
//   useEffect(() => {
//     // Only proceed if authenticated and we have a target URL
//     if (!token || !userId || !backendBaseUrl) {
//       console.log("Notifications: Skipping Socket.IO connection. User not authenticated, ID missing, or backend URL empty.");
//       // Optional: if this component should only render for logged in users, return null from render function
//       return;
//     }

//     console.log("Notifications: Attempting Socket.IO connection to:", backendBaseUrl);

//     // Ensure only one socket instance exists.
//     // If a connection already exists, and its state is not 'connecting' or 'connected',
//     // disconnect it before creating a new one.
//     // This part is critical for preventing multiple connections
//     if (socketRef.current && socketRef.current.connected) {
//         console.log("Notifications: Existing socket is connected, skipping new connection.");
//         return; // Do not attempt to reconnect if already connected
//     }
//     // If a socket exists but is disconnected, ensure it's properly cleaned up
//     if (socketRef.current && !socketRef.current.connected) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//     }


//     const socket = io(backendBaseUrl, {
//       auth: { token: token },
//       transports: ['websocket', 'polling'],
//       secure: true, // Force HTTPS/WSS for deployed environments
//       autoConnect: true, // Ensure it attempts to connect immediately
//     });

//     socketRef.current = socket; // Store the current socket instance

//     socket.on('connect', () => {
//       console.log('Notifications: Socket.IO Connected:', socket.id);
//       setSocketConnected(true);
//       if (userId) {
//           socket.emit('joinConversation', userId); // Re-using for personal room
//           console.log(`Notifications: Joined user room ${userId} for notifications.`);
//       }
//     });

//     socket.on('connect_error', (err) => {
//         console.error('Notifications: Socket.IO Connection Error:', err.message, err.data);
//         setSocketConnected(false);
//         if (err.message.includes('Authentication error')) {
//             navigate('/login');
//         }
//     });

//     socket.on('disconnect', (reason) => {
//       console.log('Notifications: Socket.IO Disconnected. Reason:', reason);
//       setSocketConnected(false);
//     });

//     socket.on('newNotification', (newNotification) => {
//       console.log('Notifications: Received newNotification:', newNotification);
//       setNotifications((prev) => [newNotification, ...prev]);
//       setUnreadCount((prev) => prev + 1);
//     });

//     // Cleanup: Disconnect when component unmounts
//     return () => {
//       if (socketRef.current) {
//         console.log('Notifications: Disconnecting Socket.IO clean up on unmount.');
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//     };
//   }, [token, userId, backendBaseUrl, navigate]); // <--- CRITICAL: Depend only on stable values

//   // --- Effect 2: Fetch Initial Notifications (Separated for clarity) ---
//   useEffect(() => {
//     // Only fetch if authenticated
//     if (!token || !userId) {
//       console.log("Notifications: Skipping initial fetch. User not authenticated or ID missing.");
//       return;
//     }

//     const fetchNotifications = async () => {
//       try {
//         const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, apiConfig());
//         setNotifications(data);
//         setUnreadCount(data.filter(n => !n.read).length);
//       } catch (error) {
//         console.error("Notifications: Failed to fetch notifications", error.response?.data?.message || error.message);
//         if (error.response?.status === 401) {
//             navigate('/login');
//         }
//       }
//     };
//     fetchNotifications();
//   }, [token, userId, navigate, apiConfig]); // Depend only on stable values

//   const handleOpen = async () => {
//     if (!userInfo || !token) {
//         console.warn("Notifications: User not authenticated, cannot open or mark read.");
//         return;
//     }

//     setIsOpen((prev) => !prev);

//     if (!isOpen && unreadCount > 0) {
//       try {
//         await axios.put(`${process.env.REACT_APP_API_URL}/notifications/read`, {}, apiConfig());
//         setUnreadCount(0);
//         setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
//       } catch (error) {
//         console.error("Notifications: Failed to mark notifications as read", error.response?.data?.message || error.message);
//       }
//     }
//   };

//   // Do not render anything if user is not logged in or if we don't have a token/userId
//   if (!userInfo || !token || !userId) return null;

//   return (
//     <div className="relative">
//       <button onClick={handleOpen} className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
//         <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.405L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
//         {unreadCount > 0 && (
//           <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
//             {unreadCount}
//           </span>
//         )}
//       </button>
//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
//           <div className="px-4 py-2 text-sm text-gray-700 font-semibold border-b">Notifications</div>
//           {notifications.length === 0 ? (
//             <div className="px-4 py-3 text-sm text-gray-500">No new notifications.</div>
//           ) : (
//             notifications.map((n) => (
//               <Link to={n.link || '#'} key={n._id} className={`block px-4 py-3 text-sm hover:bg-gray-100 ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`} onClick={() => setIsOpen(false)}>
//                 <p>{n.message}</p>
//                 <small className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</small>
//               </Link>
//             ))
//           )}
//           <div className="px-4 py-2 text-sm text-center border-t">
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Notifications;