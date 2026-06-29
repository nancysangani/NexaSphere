/**
 * Authentication API Endpoints Documentation
 * All auth-related endpoints with request/response examples
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user-123
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate with email and password to get JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful, JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify email token
 *     description: Verify user email with verification token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: verification-token-abc123
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using refresh token
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New token generated
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
 *                     token:
 *                       type: string
 *       401:
 *         description: Unauthorized - token expired or invalid
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve list of all events with pagination and filtering
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by event status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search events by name
 *     responses:
 *       200:
 *         description: List of events
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
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create new event
 *     description: Create a new event (admin only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *               - location
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Workshop
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-06-15T10:00:00Z'
 *               location:
 *                 type: string
 *                 example: Building A, Room 101
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 50
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event details
 *     description: Retrieve details of a specific event
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update event
 *     description: Update event details (admin only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete event
 *     description: Delete an event (admin only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register for event
 *     description: Register current user for an event
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Successfully registered for event
 *       400:
 *         description: Already registered or event full
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}/stats:
 *   get:
 *     summary: Get event statistics
 *     description: Get registration and attendance statistics for an event
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event statistics
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
 *                     totalRegistrations:
 *                       type: integer
 *                     attendance:
 *                       type: integer
 *                     attendanceRate:
 *                       type: number
 *                       format: float
 *                     avgRating:
 *                       type: number
 *                       format: float
 */

/**
 * @swagger
 * /api/portfolio/{username}/analytics:
 *   get:
 *     summary: Get portfolio analytics
 *     description: Retrieve portfolio performance analytics including profile visits, engagement, downloads, and project popularity.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio username
 *     responses:
 *       200:
 *         description: Portfolio analytics retrieved successfully
 *       404:
 *         description: Portfolio not found
 */
/**
 * @swagger
 * /api/portfolio/{username}/visit:
 *   post:
 *     summary: Record portfolio visit
 *     description: Records a visit to a user's portfolio for analytics purposes.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit recorded successfully
 *       404:
 *         description: Portfolio not found
 */
/**
 * @swagger
 * /api/portfolio/{username}/monthly-report:
 *   get:
 *     summary: Get monthly analytics report
 *     description: Returns the monthly portfolio performance report.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
 *       404:
 *         description: Portfolio not found
 */
/**
 * @swagger
 * /api/portfolio/{username}/monthly-report:
 *   get:
 *     ...
 */

/**
 * @swagger
 * ...
 */

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Returns all announcements sorted by priority and pinned status.
 *     tags:
 *       - Announcements
 *     responses:
 *       200:
 *         description: List of announcements retrieved successfully.
 *
 *   post:
 *     summary: Create a new announcement
 *     description: Creates a new announcement with priority, audience, and expiration.
 *     tags:
 *       - Announcements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *               pinned:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               audience:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created successfully.
 */

/**
 * @swagger
 * /api/announcements/{id}/priority:
 *   patch:
 *     summary: Update announcement priority
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *     responses:
 *       200:
 *         description: Priority updated successfully.
 */

/**
 * @swagger
 * /api/announcements/{id}/pin:
 *   patch:
 *     summary: Pin or unpin an announcement
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Announcement updated successfully.
 */

/**
 * @swagger
 * /api/announcements/{id}/read:
 *   post:
 *     summary: Mark announcement as read
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement marked as read.
 */

/**
 * @swagger
 * /api/announcements/analytics:
 *   get:
 *     summary: Get announcement analytics
 *     description: Returns announcement statistics including views, reads, and priority distribution.
 *     tags:
 *       - Announcements
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/conflicts:
 *   get:
 *     summary: Detect event scheduling conflicts
 *     description: Returns events that overlap in time or venue.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conflict list returned successfully.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/venue:
 *   get:
 *     summary: Check venue availability
 *     description: Verify whether a venue is available for a selected date.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: venue
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Venue availability returned.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/attendance-impact:
 *   get:
 *     summary: Attendance impact analysis
 *     description: Analyze attendance impact caused by conflicting events.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance analysis generated.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/recommendations:
 *   get:
 *     summary: Smart scheduling recommendations
 *     description: Returns recommended schedules for events.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduling recommendations returned.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/calendar:
 *   get:
 *     summary: Calendar integration
 *     description: Returns event data formatted for calendar integration.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar events returned.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/alerts:
 *   get:
 *     summary: Organizer alerts
 *     description: Returns scheduling alerts for organizers.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizer alerts returned successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/join:
 *   post:
 *     summary: Join an event waitlist
 *     description: Adds a user to the waitlist when an event is full.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully added to waitlist.
 */

/**
 * @swagger
 * /api/admin/waitlist/position:
 *   get:
 *     summary: Get waitlist position
 *     description: Returns the user's current position in the event waitlist.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waitlist position returned.
 */

/**
 * @swagger
 * /api/admin/waitlist/auto-enroll:
 *   post:
 *     summary: Auto-enroll next waitlisted user
 *     description: Automatically enrolls the first user from the waitlist when a seat becomes available.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User enrolled successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/notifications:
 *   get:
 *     summary: Get waitlist notifications
 *     description: Returns notification history for waitlisted users.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/analytics:
 *   get:
 *     summary: Waitlist analytics
 *     description: Returns statistics about waitlists and enrollments.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/deadline:
 *   post:
 *     summary: Set registration deadline
 *     description: Configure the registration deadline for an event.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registration deadline updated successfully.
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global Search
 *     description: Search across events, team members, portfolios, and resources.
 *     tags:
 *       - Global Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum:
 *             - all
 *             - events
 *             - members
 *             - portfolios
 *             - resources
 *         description: Filter search by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Search results returned successfully.
 */

/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Trending Searches
 *     description: Returns the most popular search queries.
 *     tags:
 *       - Global Search
 *     responses:
 *       200:
 *         description: Trending searches retrieved successfully.
 */

/**
 * @swagger
 * /api/search/recent:
 *   get:
 *     summary: Recent Searches
 *     description: Returns the user's recent search history.
 *     tags:
 *       - Global Search
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent searches returned successfully.
 */

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Instant Search Suggestions
 *     description: Returns autocomplete suggestions while typing.
 *     tags:
 *       - Global Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suggestions returned successfully.
 */

/**
 * @swagger
 * /api/admin/search/analytics:
 *   get:
 *     summary: Search Analytics Dashboard
 *     description: Returns analytics about search usage, popular keywords and categories.
 *     tags:
 *       - Global Search
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 */
export default {};
