/\*\*

- Server Integration Guide - Real-Time Analytics
-
- This file shows the required changes to integrate Socket.IO
- and analytics into your existing Express server
  \*/

// ============================================================================
// STEP 1: Add these imports at the top of server/index.js
// ============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { EventEmitter } from 'events';
import { initializeSocketIO } from './config/socket.js';
import analyticsRouter from './routes/analytics.js';
// ... other imports

// ============================================================================
// STEP 2: Create HTTP server for Socket.IO (instead of using app.listen directly)
// ============================================================================

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with HTTP server
const io = initializeSocketIO(httpServer);

// ============================================================================
// STEP 3: Mount analytics routes (add this with other app.use statements)
// ============================================================================

const adminAuth = adminAuthMiddleware.requireAdmin;

// Mount analytics routes - requires admin authentication
app.use('/api/admin/analytics', adminAuth, analyticsRouter);

// ============================================================================
// STEP 4: Update server startup (replace app.listen with httpServer.listen)
// ============================================================================

const port = Number(process.env.PORT || 8787);

if (!process.env.VERCEL) {
const boot = HAS_SUPABASE ? Promise.resolve() : ensureContentFile();
boot.then(() => {
httpServer.listen(port, () => {
console.log(`NexaSphere server listening on http://localhost:${port}`);
console.log(`Socket.IO server running on ws://localhost:${port}`);
});
});
} else {
httpServer.listen(port, () => {
console.log(`NexaSphere server listening on http://localhost:${port}`);
});
}

// ============================================================================
// STEP 5: Configure environment variables (.env)
// ============================================================================

/_
SOCKET_URL=<http://localhost:3001>
CORS_ORIGIN=<http://localhost:5173,http://localhost:3000>
FRONTEND_URL=<http://localhost:5173>
_/

// ============================================================================
// STEP 6: Complete file structure after changes
// ============================================================================

/_
server/
├── config/
│ └── socket.js ✅ READY - WebSocket configuration
├── controllers/
│ ├── eventsController.js ✅ READY
│ └── registrationTrackingController.js ✅ NEW - Registration handling
├── repositories/
│ ├── analyticsRepository.js ✅ NEW - Analytics data access
│ └── eventsRepository.js ✅ READY
├── services/
│ ├── analyticsService.js ✅ NEW - Analytics business logic
│ └── eventsService.js ✅ READY
├── routes/
│ ├── analytics.js ✅ NEW - Analytics API endpoints
│ └── api.js ✅ READY
├── index.js ⚠️ NEEDS UPDATE - Add HTTP server setup
├── analytics-schema.sql ✅ NEW - Database schema
└── supabase-schema.sql ✅ READY
_/

// ============================================================================
// STEP 7: Database Setup
// ============================================================================

/\*
Run the analytics schema in your Supabase SQL editor or via psql:

psql -h <supabase-host> -U <user> -d <database> -f server/analytics-schema.sql

This creates:

- registrations table with indexes
- Updated events table with capacity fields
- event_analytics view for metrics
  \*/

// ============================================================================
// STEP 8: Frontend Integration
// ============================================================================

/\*
In admin-dashboard/src/pages or main App component:

import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { AnalyticsDashboardPage } from '../pages/AnalyticsDashboardPage';

// Add route
<Route path="/analytics" element={<AnalyticsDashboardPage />} />

// Or use directly
<AnalyticsDashboard eventId="kss-153" />
\*/

// ============================================================================
// STEP 9: Verify Setup
// ============================================================================

/\*
Terminal 1: Start backend
cd server
npm run dev

Expected output:
NexaSphere server listening on <http://localhost:3001>
Socket.IO server running on ws://localhost:3001

Terminal 2: Start frontend
cd admin-dashboard
npm install
npm run dev

Expected output:
Admin dashboard running on <http://localhost:5173>
\*/

// ============================================================================
// STEP 10: Test the Integration
// ============================================================================

/\*

1. Check WebSocket Connection:
   Open browser DevTools Console
   You should see: "Socket connected: <socket-id>"

2. Test Registration API:
   curl -X POST <http://localhost:3001/api/admin/analytics/events/kss-153/register> \
    -H "Content-Type: application/json" \
    -d '{"email": "<test@example.com>", "name": "Test User"}'

3. Check Metrics:
   curl <http://localhost:3001/api/admin/analytics/events/kss-153>

4. View Dashboard:
   Navigate to <http://localhost:5173/analytics>
   You should see live metrics updating
   \*/

// ============================================================================
// STEP 11: Common Integration Issues & Solutions
// ============================================================================

/\*
Issue: "Cannot find module './config/socket.js'"
Solution: Verify socket.js exists in server/config/socket.js

Issue: WebSocket connection fails with CORS error
Solution: Check CORS_ORIGIN env var matches your frontend URL
CORS_ORIGIN=<http://localhost:5173>

Issue: "analyticsRouter is not defined"
Solution: Ensure line 13+ has:
import analyticsRouter from './routes/analytics.js';

Issue: "adminAuth is not a function"
Solution: Check adminAuthMiddleware is imported:
import \* as adminAuthMiddleware from './middleware/adminAuthMiddleware.js';
const adminAuth = adminAuthMiddleware.requireAdmin;

Issue: Database shows no registrations table
Solution: Run analytics-schema.sql in Supabase: 1. Go to Supabase Dashboard → SQL Editor 2. Create new query 3. Copy contents of server/analytics-schema.sql 4. Execute

Issue: "Port 3001 already in use"
Solution: Kill existing process or change PORT env var:
PORT=3002 npm run dev
\*/

// ============================================================================
// STEP 12: Production Deployment
// ============================================================================

/\*
Environment Variables (Production):
PORT=3001
SOCKET_URL=<https://your-api-domain.com>
CORS_ORIGIN=<https://your-app-domain.com>
FRONTEND_URL=<https://your-app-domain.com>
NODE_ENV=production

Database:

- Use dedicated production database
- Run analytics-schema.sql migration
- Set up automated backups
- Configure read replicas for analytics queries

Deployment:

1. Deploy backend to Node.js hosting (Vercel, Railway, Render)
2. Deploy frontend to static hosting (Vercel, Netlify)
3. Update environment variables
4. Run database migrations
5. Test analytics endpoints
6. Monitor WebSocket connections
7. Set up error tracking (Sentry)
   \*/

// ============================================================================
// STEP 13: Performance Optimization (Optional)
// ============================================================================

/\*
Caching:

- Use Redis for distributed caching
- Cache metrics for 5-10 seconds
- Clear cache on new registrations

Database:

- Archive registrations older than 1 year
- Partition registrations table by event_id
- Add database connection pooling

WebSocket:

- Use Socket.IO adapters for multiple servers
- Implement message compression
- Rate limit socket connections

Frontend:

- Implement lazy loading for charts
- Use virtual scrolling for large lists
- Debounce real-time updates
  \*/

// ============================================================================
// STEP 14: Monitoring & Logging
// ============================================================================

/\*
Key Metrics to Monitor:

- WebSocket connection count
- Message throughput
- API response times
- Database query performance
- Memory usage
- Error rates

Setup Monitoring:

1. Configure Winston logger in server
2. Use Sentry for error tracking
3. Monitor database with pg_stat_statements
4. Track WebSocket health
5. Set up Prometheus metrics (optional)
   \*/

export default app;
