// utils/socket.js
let io = null;

/**
 * Stores the Socket.IO instance for use in other modules.
 * @param {Object} socketIOInstance - The Socket.IO instance.
 */
export const setSocketIO = (socketIOInstance) => {
  io = socketIOInstance;
};

/**
 * Retrieves the stored Socket.IO instance.
 * @returns {Object} The Socket.IO instance.
 */
export const getSocketIO = () => io;
