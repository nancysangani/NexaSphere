/**
 * Monitoring and Admin API Endpoints Documentation
 * System monitoring, health checks, and admin operations
 */

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Health check
 *     description: Check if API is running and get system status
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Get performance metrics
 *     description: Retrieve real-time performance metrics for all endpoints
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     endpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           path:
 *                             type: string
 *                           method:
 *                             type: string
 *                           avgResponseTime:
 *                             type: number
 *                           minResponseTime:
 *                             type: number
 *                           maxResponseTime:
 *                             type: number
 *                           errorCount:
 *                             type: integer
 *                           requestCount:
 *                             type: integer
 */

/**
 * @swagger
 * /api/monitoring/errors/stats:
 *   get:
 *     summary: Get error statistics
 *     description: Retrieve error statistics and breakdown by status code
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalErrors:
 *                       type: integer
 *                     errorsByStatus:
 *                       type: object
 *                       properties:
 *                         '4xx':
 *                           type: integer
 *                         '5xx':
 *                           type: integer
 *                     topErrorEndpoints:
 *                       type: array
 *                       items:
 *                         type: object
 */

/**
 * @swagger
 * /api/monitoring/errors/recent:
 *   get:
 *     summary: Get recent errors
 *     description: Retrieve recent errors with detailed information
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Recent errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       statusCode:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       path:
 *                         type: string
 *                       method:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */

/**
 * @swagger
 * /api/monitoring/errors/endpoint:
 *   get:
 *     summary: Get errors by endpoint
 *     description: Retrieve errors for a specific endpoint
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: Endpoint URL
 *     responses:
 *       200:
 *         description: Endpoint errors
 */

/**
 * @swagger
 * /api/monitoring/errors/user/{userId}:
 *   get:
 *     summary: Get user-specific errors
 *     description: Retrieve errors related to a specific user
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User errors
 */

/**
 * @swagger
 * /api/monitoring/test-error:
 *   post:
 *     summary: Test error tracking
 *     description: Trigger a test error for monitoring verification (development only)
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       500:
 *         description: Test error triggered
 */

/**
 * @swagger
 * /api/admin/stream:
 *   get:
 *     summary: Real-time admin stream
 *     description: Server-Sent Events stream for real-time admin dashboard updates
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSE stream connected
 */

/**
 * @swagger
 * /api/admin/stream/info:
 *   get:
 *     summary: Get connected clients info
 *     description: Get information about connected SSE clients
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 connectedClients:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/notifications/subscribe:
 *   post:
 *     summary: Subscribe to push notifications
 *     description: Register device for push notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 description: Web Push API subscription object
 *     responses:
 *       200:
 *         description: Subscription successful
 *       400:
 *         description: Invalid subscription
 */

/**
 * @swagger
 * /api/notifications/unsubscribe:
 *   post:
 *     summary: Unsubscribe from push notifications
 *     description: Remove device from push notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */

/**
 * @swagger
 * /api/docs-info:
 *   get:
 *     summary: API Documentation Info
 *     description: Get information about available documentation endpoints
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: Documentation endpoints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 documentation:
 *                   type: object
 *                   properties:
 *                     swagger_ui:
 *                       type: string
 *                       example: http://localhost:3000/api/docs
 *                     redoc:
 *                       type: string
 *                       example: http://localhost:3000/api/redoc
 *                     openapi_json:
 *                       type: string
 *                       example: http://localhost:3000/api/swagger.json
 */

/**
 * @swagger
 * /api/monitoring/deployment-status:
 *   get:
 *     summary: Get deployment status
 *     description: Retrieve deployment health and rollback readiness information
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Deployment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 rollbackAvailable:
 *                   type: boolean
 *                 trafficSwitchReady:
 *                   type: boolean
 */

export default {};
