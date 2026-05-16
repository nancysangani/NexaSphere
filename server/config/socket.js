/**
 * Socket.IO Configuration
 * Handles WebSocket connections for real-time updates
 */

import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io = null;
const connectedUsers = new Map();
const rooms = {
  admin: 'admin-room',
  notifications: 'notifications-room',
  events: 'events-room',
};

/**
 * Initialize Socket.IO
 * @param {Object} httpServer - HTTP server instance
 */
export function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  io.on('connection', (socket) => {
    logger.info('User connected', { socketId: socket.id });

    // Store connected user
    socket.on('user:identify', (userData) => {
      connectedUsers.set(socket.id, {
        id: userData.userId,
        email: userData.email,
        socketId: socket.id,
        connectedAt: new Date(),
      });
      logger.info('User identified', { userId: userData.userId, socketId: socket.id });
    });

    // Join notification room
    socket.on('room:join', (roomName) => {
      socket.join(roomName);
      logger.info('User joined room', { socketId: socket.id, room: roomName });
    });

    // Leave room
    socket.on('room:leave', (roomName) => {
      socket.leave(roomName);
      logger.info('User left room', { socketId: socket.id, room: roomName });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      logger.info('User disconnected', { socketId: socket.id });
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error', { error: error.message, socketId: socket.id });
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit event to all connected clients
 */
export function broadcastEvent(eventName, data) {
  if (!io) return;
  io.emit(eventName, data);
  logger.debug('Broadcast event', { event: eventName });
}

/**
 * Emit event to specific room
 */
export function emitToRoom(roomName, eventName, data) {
  if (!io) return;
  io.to(roomName).emit(eventName, data);
  logger.debug('Emit to room', { room: roomName, event: eventName });
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId, eventName, data) {
  if (!io) return;
  const user = Array.from(connectedUsers.values()).find(u => u.id === userId);
  if (user) {
    io.to(user.socketId).emit(eventName, data);
    logger.debug('Emit to user', { userId, event: eventName });
  }
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount() {
  return connectedUsers.size;
}

/**
 * Get all connected users
 */
export function getConnectedUsers() {
  return Array.from(connectedUsers.values());
}

/**
 * Get room reference
 */
export function getRoom(roomType) {
  return rooms[roomType] || null;
}

export default { initializeSocketIO, getIO, broadcastEvent, emitToRoom, emitToUser };
