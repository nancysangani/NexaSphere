/**
 * Socket.IO Client
 * Handles WebSocket connections and real-time updates
 */

import io from 'socket.io-client';

let socket = null;
let eventHandlers = {};

/**
 * Initialize Socket.IO client
 */
export function initializeSocket(serverUrl = window.location.origin) {
  socket = io(serverUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  // Global event handlers
  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    identifyUser();
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from Socket.IO server:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  // Setup custom event listeners
  setupEventListeners();

  return socket;
}

/**
 * Get socket instance
 */
export function getSocket() {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return socket;
}

/**
 * Identify user to server
 */
export function identifyUser(userId, email) {
  if (socket) {
    socket.emit('user:identify', { userId, email });
  }
}

/**
 * Join notification room
 */
export function joinRoom(roomName) {
  if (socket) {
    socket.emit('room:join', roomName);
  }
}

/**
 * Leave room
 */
export function leaveRoom(roomName) {
  if (socket) {
    socket.emit('room:leave', roomName);
  }
}

/**
 * Setup event listeners for real-time updates
 */
function setupEventListeners() {
  if (!socket) return;

  // Registration confirmed
  socket.on('registration-confirmed', (data) => {
    console.log('Registration confirmed:', data);
    if (eventHandlers.registrationConfirmed) {
      eventHandlers.registrationConfirmed(data);
    }
  });

  // Waitlist promotion
  socket.on('waitlist-promotion', (data) => {
    console.log('Waitlist promotion:', data);
    if (eventHandlers.waitlistPromotion) {
      eventHandlers.waitlistPromotion(data);
    }
  });

  // Event reminder
  socket.on('event-reminder', (data) => {
    console.log('Event reminder:', data);
    if (eventHandlers.eventReminder) {
      eventHandlers.eventReminder(data);
    }
  });

  // Attendance marked
  socket.on('attendance-marked', (data) => {
    console.log('Attendance marked:', data);
    if (eventHandlers.attendanceMarked) {
      eventHandlers.attendanceMarked(data);
    }
  });

  // Admin notifications
  socket.on('admin:new-registration', (data) => {
    console.log('Admin - new registration:', data);
    if (eventHandlers.adminNewRegistration) {
      eventHandlers.adminNewRegistration(data);
    }
  });

  socket.on('admin:waitlist-promotion', (data) => {
    console.log('Admin - waitlist promotion:', data);
    if (eventHandlers.adminWaitlistPromotion) {
      eventHandlers.adminWaitlistPromotion(data);
    }
  });

  socket.on('admin:attendance-marked', (data) => {
    console.log('Admin - attendance marked:', data);
    if (eventHandlers.adminAttendanceMarked) {
      eventHandlers.adminAttendanceMarked(data);
    }
  });
}

/**
 * Register event handler
 */
export function on(eventName, handler) {
  eventHandlers[eventName] = handler;
}

/**
 * Remove event handler
 */
export function off(eventName) {
  delete eventHandlers[eventName];
}

/**
 * Emit custom event to server
 */
export function emit(eventName, data) {
  if (socket) {
    socket.emit(eventName, data);
  }
}

/**
 * Disconnect socket
 */
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get socket status
 */
export function isConnected() {
  return socket?.connected || false;
}

/**
 * Get socket id
 */
export function getSocketId() {
  return socket?.id || null;
}

export default {
  initializeSocket,
  getSocket,
  identifyUser,
  joinRoom,
  leaveRoom,
  on,
  off,
  emit,
  disconnect,
  isConnected,
  getSocketId,
};
