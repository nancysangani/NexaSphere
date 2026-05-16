/**
 * FRONTEND INTEGRATION EXAMPLE - Issue #93 Real-Time Features
 * Shows how to integrate WebSocket, push notifications, and SSE in React
 */

import React, { useEffect, useState } from 'react';
import { initializeSocket, joinRoom, on, off, isConnected } from '@/utils/socketClient';
import { initializePushNotifications, showNotification } from '@/utils/pushNotificationClient';
import logger from '@/utils/errorTracking';

// ============================================================================
// 1. APP COMPONENT SETUP - Initialize real-time services
// ============================================================================

function App() {
  useEffect(() => {
    // Initialize Socket.IO
    initializeSocket();

    // Initialize push notifications
    initializePushNotifications(process.env.REACT_APP_VAPID_PUBLIC_KEY);

    // Connect to SSE admin stream (for admins only)
    if (isUserAdmin()) {
      connectToAdminStream();
    }

    return () => {
      // Cleanup on unmount
      off('registrationConfirmed');
      off('waitlistPromotion');
      off('eventReminder');
      off('attendanceMarked');
    };
  }, []);

  return (
    <div>
      {/* App content */}
    </div>
  );
}

// ============================================================================
// 2. HOOK: useRealtimeUpdates - Handle real-time events
// ============================================================================

function useRealtimeUpdates(userId, email) {
  const [registrationUpdate, setRegistrationUpdate] = useState(null);
  const [promotionUpdate, setPromotionUpdate] = useState(null);
  const [reminderUpdate, setReminderUpdate] = useState(null);
  const [attendanceUpdate, setAttendanceUpdate] = useState(null);

  useEffect(() => {
    // Identify user
    const { identifyUser } = require('@/utils/socketClient');
    identifyUser(userId, email);

    // Join notifications room
    joinRoom('notifications-room');

    // Listen to registration-confirmed event
    on('registrationConfirmed', (data) => {
      console.log('You registered for:', data.eventName);
      setRegistrationUpdate(data);

      // Show notification
      showNotification('Registration Confirmed', {
        body: `You're registered for ${data.eventName}`,
        tag: 'registration',
      });

      // Log event
      logger.info('Registration confirmed via WebSocket', {
        eventName: data.eventName,
        eventId: data.eventId,
      });
    });

    // Listen to waitlist-promotion event
    on('waitlistPromotion', (data) => {
      console.log('Promoted from waitlist');
      setPromotionUpdate(data);

      showNotification('🎉 Promotion!', {
        body: 'You\'ve been promoted from the waitlist!',
        tag: 'promotion',
      });

      logger.info('Promoted from waitlist via WebSocket', {
        eventId: data.eventId,
      });
    });

    // Listen to event-reminder event
    on('eventReminder', (data) => {
      console.log('Event reminder for:', data.eventName);
      setReminderUpdate(data);

      showNotification('⏰ Event Reminder', {
        body: `Don't forget: ${data.eventName}`,
        tag: 'reminder',
      });

      logger.info('Event reminder received via WebSocket', {
        eventName: data.eventName,
      });
    });

    // Listen to attendance-marked event
    on('attendanceMarked', (data) => {
      console.log('Attendance marked:', data.points, 'points earned');
      setAttendanceUpdate(data);

      showNotification('✅ Attendance Marked', {
        body: `You earned ${data.points} points!`,
        tag: 'attendance',
      });

      logger.info('Attendance marked via WebSocket', {
        points: data.points,
      });
    });

    return () => {
      off('registrationConfirmed');
      off('waitlistPromotion');
      off('eventReminder');
      off('attendanceMarked');
    };
  }, [userId, email]);

  return {
    registrationUpdate,
    promotionUpdate,
    reminderUpdate,
    attendanceUpdate,
  };
}

// ============================================================================
// 3. EXAMPLE: Event Registration Component with Real-time Feedback
// ============================================================================

function EventRegistrationComponent({ eventId, userId, email }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const updates = useRealtimeUpdates(userId, email);

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId, email }),
      });

      if (!response.ok) throw new Error('Registration failed');

      // Wait for registration-confirmed event from server
      // The event will trigger via Socket.IO and show toast
      setMessage('Registration submitted!');
    } catch (error) {
      setMessage('Registration failed: ' + error.message);
      logger.captureApiError(error, { eventId });
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation from real-time update
  if (updates.registrationUpdate) {
    return (
      <div className="success-message">
        <h3>✅ Registration Confirmed!</h3>
        <p>Event: {updates.registrationUpdate.eventName}</p>
        <p>Date: {updates.registrationUpdate.eventDate}</p>
        <p>Check your email for details.</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleRegister} disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

// ============================================================================
// 4. ADMIN COMPONENT: Real-time Activity Stream
// ============================================================================

function AdminActivityStream() {
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!isUserAdmin()) return;

    // Join admin room
    joinRoom('admin-room');

    // Listen to admin events
    on('adminNewRegistration', (data) => {
      setActivities((prev) => [
        { type: 'registration', ...data, id: Date.now() },
        ...prev.slice(0, 19),
      ]);
    });

    on('adminWaitlistPromotion', (data) => {
      setActivities((prev) => [
        { type: 'promotion', ...data, id: Date.now() },
        ...prev.slice(0, 19),
      ]);
    });

    on('adminAttendanceMarked', (data) => {
      setActivities((prev) => [
        { type: 'attendance', ...data, id: Date.now() },
        ...prev.slice(0, 19),
      ]);
    });

    return () => {
      off('adminNewRegistration');
      off('adminWaitlistPromotion');
      off('adminAttendanceMarked');
    };
  }, []);

  return (
    <div className="admin-stream">
      <h2>Live Activity Feed</h2>
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className={`activity activity-${activity.type}`}>
            {activity.type === 'registration' && (
              <p>
                📝 {activity.userName} registered for {activity.eventName}
              </p>
            )}
            {activity.type === 'promotion' && (
              <p>
                🎉 {activity.userName} promoted to {activity.eventName}
              </p>
            )}
            {activity.type === 'attendance' && (
              <p>
                ✅ {activity.userName} attended {activity.eventName} (+{activity.points} pts)
              </p>
            )}
            <time>{new Date(activity.timestamp).toLocaleTimeString()}</time>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. ADMIN COMPONENT: Real-time Metrics Dashboard
// ============================================================================

function AdminMetricsDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!isUserAdmin()) return;

    // Connect to SSE stream
    const eventSource = new EventSource('/api/admin/stream');

    eventSource.addEventListener('admin:metrics-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data.data);
        logger.info('Metrics updated via SSE', data.data);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!metrics) return <div>Loading metrics...</div>;

  return (
    <div className="metrics-dashboard">
      <h2>Real-time Metrics</h2>
      <div className="metric-card">
        <h3>Total Registrations</h3>
        <p className="metric-value">{metrics.totalRegistrations}</p>
      </div>
      <div className="metric-card">
        <h3>Attendance Rate</h3>
        <p className="metric-value">{metrics.totalAttendance}%</p>
      </div>
      <div className="metric-card">
        <h3>Average Rating</h3>
        <p className="metric-value">{metrics.avgRating}/5</p>
      </div>
      <p className="last-updated">
        Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}

// ============================================================================
// 6. CONNECTION STATUS INDICATOR
// ============================================================================

function ConnectionStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setConnected(isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      <span className="status-indicator"></span>
      {connected ? 'Connected' : 'Disconnected'}
    </div>
  );
}

// ============================================================================
// 7. HELPER FUNCTIONS
// ============================================================================

function isUserAdmin() {
  return localStorage.getItem('userRole') === 'admin';
}

function connectToAdminStream() {
  // Only admins connect to SSE stream
  if (isUserAdmin()) {
    const eventSource = new EventSource('/api/admin/stream');

    eventSource.onerror = () => {
      console.log('Admin stream disconnected');
      eventSource.close();
    };
  }
}

// ============================================================================
// 8. ENVIRONMENT VARIABLES (.env.local)
// ============================================================================

/*
REACT_APP_API_URL=http://localhost:3000
REACT_APP_VAPID_PUBLIC_KEY=your-vapid-public-key
*/

export default App;
export { useRealtimeUpdates, EventRegistrationComponent, AdminActivityStream, AdminMetricsDashboard, ConnectionStatus };
