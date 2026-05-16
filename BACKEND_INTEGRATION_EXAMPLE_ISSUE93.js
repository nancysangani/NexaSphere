/**
 * BACKEND INTEGRATION EXAMPLE - Issue #93 Real-Time Features
 * Shows how to integrate WebSocket, push notifications, and emails
 */

// ============================================================================
// 1. SERVER SETUP - Integrate Socket.IO into Express server
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { initializeSocketIO } from './config/socket.js';
import { initializeFirebase } from './services/pushNotificationService.js';
import { initializeSendGrid } from './services/emailService.js';
import adminStreamRoutes from './routes/adminStream.js';
import eventEmitter from './services/eventEmitterService.js';

const app = express();
const httpServer = createServer(app);

// Initialize real-time services
initializeSocketIO(httpServer);
initializeFirebase();
initializeSendGrid();

// Mount admin stream routes
app.use('/api/admin', adminStreamRoutes);

// ============================================================================
// 2. EXAMPLE: Emit registration-confirmed event
// ============================================================================

// In your events controller or registration endpoint:
import eventEmitter from '../services/eventEmitterService.js';

export async function registerUserForEvent(req, res) {
  try {
    const { userId, eventId, userEmail, userName, eventName, eventDate, eventTime, eventLocation, pushToken } = req.body;

    // Register user in database (existing code)
    const registration = await saveRegistration({ userId, eventId });

    // Emit registration-confirmed event
    eventEmitter.emit('registration-confirmed', {
      userId,
      eventId,
      userEmail,
      userName,
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      pushToken,
    });

    res.json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// 3. EXAMPLE: Emit waitlist-promotion event
// ============================================================================

export async function promoteFromWaitlist(req, res) {
  try {
    const { userId, eventId, userEmail, userName, eventName, eventDate, eventTime, confirmationId, pushToken } = req.body;

    // Update user in database (existing code)
    await updateUserEventStatus(userId, eventId, 'confirmed');

    // Emit waitlist-promotion event
    eventEmitter.emit('waitlist-promotion', {
      userId,
      eventId,
      userEmail,
      userName,
      eventName,
      eventDate,
      eventTime,
      confirmationId,
      pushToken,
    });

    res.json({ success: true, message: 'User promoted from waitlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// 4. EXAMPLE: Emit event-reminder event (typically scheduled via cron)
// ============================================================================

// Setup cron job to run reminders 24 hours before event
import cron from 'node-cron';

cron.schedule('0 */6 * * *', async () => {
  // Run every 6 hours
  const eventsIn24Hours = await getEventsIn24Hours();

  eventsIn24Hours.forEach(async (event) => {
    const attendees = await getEventAttendees(event.id);

    attendees.forEach((attendee) => {
      eventEmitter.emit('event-reminder', {
        userId: attendee.id,
        eventId: event.id,
        userEmail: attendee.email,
        userName: attendee.name,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        timeUntilEvent: 'tomorrow',
        pushToken: attendee.pushToken,
      });
    });
  });
});

// ============================================================================
// 5. EXAMPLE: Emit attendance-marked event
// ============================================================================

export async function markAttendance(req, res) {
  try {
    const { userId, eventId, userEmail, userName, eventName, eventDate, points } = req.body;

    // Mark attendance in database (existing code)
    await updateAttendance(userId, eventId, true);

    // Emit attendance-marked event
    eventEmitter.emit('attendance-marked', {
      userId,
      eventId,
      userEmail,
      userName,
      eventName,
      eventDate,
      points,
      pushToken: req.user.pushToken,
    });

    res.json({ success: true, message: 'Attendance marked', points });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// 6. EXAMPLE: Use Socket.IO for live admin updates
// ============================================================================

import { getIO, emitToRoom, getRoom, broadcastEvent } from '../config/socket.js';
import { broadcastSSEEvent } from '../services/sseService.js';

// Broadcast to admin dashboard when metrics change
export function trackLiveMetrics() {
  setInterval(() => {
    const metrics = calculateMetrics();

    // Send via Socket.IO to admin room
    emitToRoom(getRoom('admin'), 'admin:metrics-update', {
      totalRegistrations: metrics.registrations,
      totalAttendance: metrics.attendance,
      avgRating: metrics.avgRating,
      timestamp: new Date(),
    });

    // Send via SSE for dashboard streaming
    broadcastSSEEvent('admin:metrics-update', metrics);
  }, 30000); // Every 30 seconds
}

// ============================================================================
// 7. EXAMPLE: Handle push notification subscription from frontend
// ============================================================================

export async function subscribeToPushNotifications(req, res) {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    // Store subscription in database
    await savePushSubscription(userId, subscription);

    res.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// 8. EXAMPLE: Environment variables setup
// ============================================================================

/*
.env file example:

# WebSocket & Real-time
FRONTEND_URL=http://localhost:5173

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# SendGrid Email
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@nexasphere.com

# VAPID for Web Push
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
*/

// ============================================================================
// 9. STARTUP SEQUENCE
// ============================================================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log('✅ Server started');
  console.log('✅ Socket.IO initialized');
  console.log('✅ Firebase Cloud Messaging ready');
  console.log('✅ SendGrid Email service ready');
  console.log('✅ Real-time features active');
  console.log(`📡 Listening on http://localhost:${PORT}`);
});

// ============================================================================
// 10. ERROR HANDLING AND LOGGING
// ============================================================================

import logger from '../utils/logger.js';
import sentry from '../utils/sentry.js';

// All events are logged automatically by the event emitter
// All WebSocket connections are logged by Socket.IO middleware
// All push notifications are logged by pushNotificationService
// All emails are logged by emailService

// Monitor real-time service health
setInterval(() => {
  const io = getIO();
  const connectedUsers = io.engine.clientsCount;

  logger.info('Real-time services health check', {
    socketIOClients: connectedUsers,
    webSocketStatus: 'healthy',
  });
}, 60000); // Every minute
