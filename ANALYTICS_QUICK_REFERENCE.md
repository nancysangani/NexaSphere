# Real-Time Analytics - Quick Reference & Examples

## 🎯 Quick Start (5 minutes)

### Step 1: Run Database Migration

```sql
-- Copy and run in Supabase SQL Editor
-- File: server/analytics-schema.sql
```

### Step 2: Start Backend

```bash
cd server
npm run dev
```

### Step 3: Start Frontend

```bash
cd admin-dashboard
npm install  # if not done yet
npm run dev
```

### Step 4: Access Dashboard

Visit: <http://localhost:5173/analytics>

---

## 📡 Common API Tasks

### Register User for Event

```bash
curl -X POST http://localhost:3001/api/admin/analytics/events/event-123/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe"
  }'
```

### Check In User

```bash
curl -X POST http://localhost:3001/api/admin/analytics/events/event-123/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "reg-uuid-here",
    "email": "john@example.com"
  }'
```

### Get Event Metrics

```bash
curl http://localhost:3001/api/admin/analytics/events/event-123
```

### Get Registration Trends

```bash
# Last 7 days
curl "http://localhost:3001/api/admin/analytics/events/event-123/trends?timeWindow=7%20days"

# Last 1 day
curl "http://localhost:3001/api/admin/analytics/events/event-123/trends?timeWindow=1%20day"

# Last 30 days
curl "http://localhost:3001/api/admin/analytics/events/event-123/trends?timeWindow=30%20days"
```

### Get Recent Registrations

```bash
curl "http://localhost:3001/api/admin/analytics/events/event-123/registrations/recent?limit=20"
```

### Export Analytics (CSV)

```bash
curl -O http://localhost:3001/api/admin/analytics/events/event-123/export?format=csv
```

### Export Analytics (JSON)

```bash
curl http://localhost:3001/api/admin/analytics/events/event-123/export?format=json > analytics.json
```

### Clear Cache

```bash
curl -X POST http://localhost:3001/api/admin/analytics/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"eventId": "event-123"}'
```

---

## 💻 React Component Usage

### Basic Dashboard Usage

```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function Page() {
  return <AnalyticsDashboard eventId="kss-153" />;
}
```

### Using Custom Hooks

```jsx
import { useEventAnalytics } from './hooks/useAnalyticsSocket';

export default function MyComponent() {
  const { metrics, registrationTrends, recentRegistrations, loading, error, isConnected } =
    useEventAnalytics('event-123');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Total: {metrics?.totalRegistrations}</p>
      <p>Checked In: {metrics?.checkedIn}</p>
      <p>Connection: {isConnected ? '🟢 Live' : '🔴 Offline'}</p>
    </div>
  );
}
```

### Using API Service

```jsx
import analyticsAPI from './services/analyticsAPI';
import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    analyticsAPI
      .getEventMetrics('event-123')
      .then(setMetrics)
      .catch((err) => console.error(err));
  }, []);

  return <div>Registrations: {metrics?.totalRegistrations}</div>;
}
```

---

## 🔌 WebSocket Examples

### Basic Socket Connection

```javascript
import { useAnalyticsSocket } from './hooks/useAnalyticsSocket';

const socket = useAnalyticsSocket();

// Subscribe to event
socket.emit('analytics:subscribe', 'event-123');

// Listen for updates
socket.on('analytics:metrics:update', (data) => {
  console.log('Metrics updated:', data);
});

// Unsubscribe
socket.emit('analytics:unsubscribe', 'event-123');
```

### Request Current Metrics

```javascript
socket.emit('analytics:request:metrics', 'event-123');
socket.on('analytics:metrics:current', (data) => {
  console.log('Current metrics:', data.metrics);
});
```

### Listen for New Registrations

```javascript
socket.on('analytics:registration:new', (data) => {
  console.log('New registration:', data.registration);
  // Update UI here
});
```

### Listen for Check-ins

```javascript
socket.on('analytics:checkin:new', (data) => {
  console.log('User checked in:', data.checkIn);
  // Update UI here
});
```

---

## 🧪 Test Data Generation

### Generate 50 Test Registrations

```bash
curl -X POST http://localhost:3001/api/tracking/events/event-123/bulk-register \
  -H "Content-Type: application/json" \
  -d '{
    "registrations": [
      {"email": "user1@test.com", "name": "User 1"},
      {"email": "user2@test.com", "name": "User 2"},
      {"email": "user3@test.com", "name": "User 3"}
    ]
  }'
```

### Simulate Check-ins

```bash
# First get recent registrations
REGS=$(curl -s http://localhost:3001/api/admin/analytics/events/event-123/registrations/recent?limit=5)

# Then check them in one by one
curl -X POST http://localhost:3001/api/admin/analytics/events/event-123/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "reg-id-from-response",
    "email": "user1@test.com"
  }'
```

---

## 🔧 Configuration

### Environment Variables

**Server (.env)**

```env
PORT=3001
SOCKET_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env.local)**

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

---

## 📊 Metrics Response Format

```json
{
  "eventId": "event-123",
  "eventName": "KSS #153",
  "eventDate": "March 14, 2025",
  "totalRegistrations": 150,
  "checkedIn": 120,
  "pendingCheckIn": 30,
  "maxAttendees": 200,
  "availableSeats": 50,
  "occupancyRate": "75.00",
  "eventCreatedAt": "2025-03-01T10:00:00Z",
  "eventUpdatedAt": "2025-03-14T15:30:00Z"
}
```

---

## 📈 Trends Response Format

```json
{
  "ok": true,
  "data": [
    {
      "date": "2025-03-08",
      "registrations": 25,
      "checkedIn": 20
    },
    {
      "date": "2025-03-09",
      "registrations": 35,
      "checkedIn": 28
    }
  ],
  "eventId": "event-123",
  "timeWindow": "7 days",
  "timestamp": "2025-03-14T16:00:00Z"
}
```

---

## ✅ Common Status Values

| Status       | Meaning                            |
| ------------ | ---------------------------------- |
| `registered` | User registered but not checked in |
| `checked_in` | User checked in at event           |
| `cancelled`  | Registration cancelled             |
| `no_show`    | Registered but didn't attend       |

---

## 🚨 Error Handling

### API Error Response

```json
{
  "ok": false,
  "error": "Event not found"
}
```

### WebSocket Error

```javascript
socket.on('analytics:error', (data) => {
  console.error('Analytics error:', data.error);
  // Handle error in UI
});
```

---

## 🔒 Authentication

All analytics endpoints require admin authentication. Include auth header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/analytics/events/event-123
```

Or use cookies (if using session auth):

```bash
curl --cookie "session_token=YOUR_TOKEN" \
  http://localhost:3001/api/admin/analytics/events/event-123
```

---

## 📱 Component Props

### AnalyticsDashboard

```javascript
<AnalyticsDashboard
  eventId="event-123" // Required: Event ID to display
/>
```

### LiveMetricsCards

```javascript
<LiveMetricsCards
  metrics={{
    totalRegistrations: 150,
    checkedIn: 120,
    pendingCheckIn: 30,
    maxAttendees: 200,
    availableSeats: 50,
    occupancyRate: '75.00',
  }}
/>
```

### RegistrationTrendsChart

```javascript
<RegistrationTrendsChart
  eventId="event-123"
  selectedTimeWindow="7 days"
  onTimeWindowChange={(window) => console.log(window)}
  data={trendsData}
/>
```

---

## 🐛 Debugging

### Enable Socket.IO Debug Logging

```javascript
// In browser console
localStorage.debug = 'socket.io-client:*';
location.reload();
```

### Log All Socket Events

```javascript
const socket = useAnalyticsSocket();

socket.onAny((eventName, ...args) => {
  console.log('[SOCKET]', eventName, args);
});
```

### Check API Responses

```javascript
// In browser DevTools Network tab, filter by "analytics"
```

---

## 🎯 Performance Tips

1. **Use specific time windows** for trends queries
2. **Limit recent registrations** - default is 20, adjust as needed
3. **Implement pagination** for large datasets
4. **Cache metrics locally** if updating frequently
5. **Debounce WebSocket listeners** to prevent excessive updates

---

## 📞 Getting Help

1. **Check REAL_TIME_ANALYTICS_GUIDE.md** for detailed docs
2. **Review SERVER_INTEGRATION_GUIDE.md** for setup help
3. **See component source** for usage examples
4. **Check browser console** for JavaScript errors
5. **Use Network tab** to inspect API calls

---

## 🚀 Production Checklist

- [ ] Run database migrations
- [ ] Set production environment variables
- [ ] Enable HTTPS/WSS for WebSocket
- [ ] Configure CORS for production domain
- [ ] Set up error tracking (Sentry)
- [ ] Enable database backups
- [ ] Configure monitoring and alerts
- [ ] Test all endpoints
- [ ] Verify WebSocket stability
- [ ] Load test with expected user volume

---

## 📝 Useful Commands

```bash
# Test backend is running
curl -I http://localhost:3001/api/admin/analytics/events

# Check WebSocket connection
# Open DevTools Console and check for "Socket connected" message

# View database registrations (PostgreSQL)
SELECT * FROM registrations ORDER BY created_at DESC LIMIT 10;

# Clear old registrations (optional maintenance)
DELETE FROM registrations WHERE created_at < now() - interval '1 year';

# Analyze database performance
ANALYZE registrations;

# View indexes
\d registrations  -- in psql
```

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2026-06-05  
**Status**: Ready for Production
