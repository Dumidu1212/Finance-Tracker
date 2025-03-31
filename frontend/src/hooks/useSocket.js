import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to manage Socket.IO connection.
 * @param {string} userId - The current user's ID to join a room.
 * @returns {object} - Returns the socket instance and an array of notifications.
 */
const useSocket = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection using environment variable for the URL
    const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    // Join a room based on the userId (if provided)
    if (userId) {
      socket.emit('joinRoom', { userId });
    }

    // Listen for 'notification' events
    socket.on('notification', (data) => {
      setNotifications((prev) => [...prev, data]);
    });

    // Cleanup: Disconnect on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return { socket: socketRef.current, notifications };
};

export default useSocket;
