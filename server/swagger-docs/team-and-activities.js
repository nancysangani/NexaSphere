/**
 * Team Management API Endpoints Documentation
 * All team-related endpoints with request/response examples
 */

/**
 * @swagger
 * /api/core-team:
 *   get:
 *     summary: Get all team members
 *     description: Retrieve list of core team members
 *     tags:
 *       - Team
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: List of team members
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
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       email:
 *                         type: string
 *                       department:
 *                         type: string
 *                       photo:
 *                         type: string
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/core-team:
 *   post:
 *     summary: Add team member
 *     description: Add a new core team member (admin only)
 *     tags:
 *       - Team
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
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [lead, coordinator, member]
 *               department:
 *                 type: string
 *               bio:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Team member added successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @swagger
 * /api/core-team/{memberId}:
 *   get:
 *     summary: Get team member details
 *     description: Retrieve details of a specific team member
 *     tags:
 *       - Team
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team member details
 *       404:
 *         description: Team member not found
 */

/**
 * @swagger
 * /api/core-team/{memberId}:
 *   put:
 *     summary: Update team member
 *     description: Update team member information (admin only)
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
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
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team member updated
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Team member not found
 */

/**
 * @swagger
 * /api/core-team/{memberId}:
 *   delete:
 *     summary: Delete team member
 *     description: Remove a team member (admin only)
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team member deleted
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Team member not found
 */

/**
 * @swagger
 * /api/activity-events:
 *   get:
 *     summary: Get all activity events
 *     description: Retrieve list of activity events with pagination
 *     tags:
 *       - Activities
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [workshop, meetup, webinar, competition]
 *     responses:
 *       200:
 *         description: List of activity events
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
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       attendees:
 *                         type: integer
 */

/**
 * @swagger
 * /api/activity-events:
 *   post:
 *     summary: Create activity event
 *     description: Create a new activity event (admin only)
 *     tags:
 *       - Activities
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 example: Python Workshop
 *               type:
 *                 type: string
 *                 enum: [workshop, meetup, webinar, competition]
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
 *       201:
 *         description: Activity event created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @swagger
 * /api/activity-events/{eventId}:
 *   get:
 *     summary: Get activity event details
 *     description: Retrieve details of a specific activity event
 *     tags:
 *       - Activities
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity event details
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/activity-events/{eventId}:
 *   put:
 *     summary: Update activity event
 *     description: Update activity event details (admin only)
 *     tags:
 *       - Activities
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/activity-events/{eventId}:
 *   delete:
 *     summary: Delete activity event
 *     description: Delete an activity event (admin only)
 *     tags:
 *       - Activities
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
 *         description: Event deleted
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/activity-events/{eventId}/register:
 *   post:
 *     summary: Register for activity event
 *     description: Register current user for an activity event
 *     tags:
 *       - Activities
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
 *       400:
 *         description: Already registered or event full
 *       404:
 *         description: Event not found
 */

export default {};
