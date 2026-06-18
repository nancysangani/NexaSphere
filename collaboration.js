import { pool } from '../config/db.js'; // Assuming DB pool is here

/**
 * Middleware to check if user has specific role for an event
 */
export const checkOrganizerRole = (requiredRoles) => {
  return async (req, res, next) => {
    const { eventId } = req.params;
    const userId = req.user.id; // From auth middleware

    try {
      const result = await pool.query(
        'SELECT role, committee FROM event_teams WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );

      if (result.rows.length === 0 || !requiredRoles.includes(result.rows[0].role)) {
        return res.status(403).json({ error: 'Insufficient permissions for this event' });
      }
      req.organizerRole = result.rows[0].role;
      req.committee = result.rows[0].committee;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Get Hub Dashboard Data
export const getHubDashboard = async (req, res) => {
  const { eventId } = req.params;
  try {
    const tasks = await pool.query('SELECT * FROM collaboration_tasks WHERE event_id = $1', [
      eventId,
    ]);
    const budget = await pool.query('SELECT * FROM collaboration_budget WHERE event_id = $1', [
      eventId,
    ]);
    const team = await pool.query(
      'SELECT et.*, u.name FROM event_teams et JOIN users u ON et.user_id = u.id WHERE et.event_id = $1',
      [eventId]
    );
    const docs = await pool.query(
      'SELECT * FROM collaboration_docs WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    const discussions = await pool.query(
      'SELECT d.*, u.name as author_name FROM collaboration_discussions d JOIN users u ON d.author_id = u.id WHERE d.event_id = $1',
      [eventId]
    );
    const decisions = await pool.query(
      'SELECT d.*, u.name as decider_name FROM collaboration_decisions d JOIN users u ON d.decided_by = u.id WHERE d.event_id = $1',
      [eventId]
    );

    res.json({
      tasks: tasks.rows,
      budget: budget.rows,
      team: team.rows,
      docs: docs.rows,
      discussions: discussions.rows,
      decisions: decisions.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Task Management
export const createHubTask = async (req, res) => {
  const { eventId } = req.params;
  const { title, description, assigned_to, due_date, dependency_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO collaboration_tasks (event_id, title, description, assigned_to, due_date, dependency_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [eventId, title, description, assigned_to, due_date, dependency_id]
    );

    // Emit via Socket.IO for real-time updates
    req.io.to(`event_${eventId}`).emit('task_created', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Budgeting
export const addBudgetLineItem = async (req, res) => {
  const { eventId } = req.params;
  const { item_name, budgeted_amount, responsible_person } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO collaboration_budget (event_id, item_name, budgeted_amount, responsible_person) VALUES ($1, $2, $3, $4) RETURNING *',
      [eventId, item_name, budgeted_amount, responsible_person]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveExpense = async (req, res) => {
  const { eventId, itemId } = req.params;
  const { status, actual_amount } = req.body; // status: 'APPROVED' or 'PAID'
  try {
    const result = await pool.query(
      'UPDATE collaboration_budget SET status = $1, actual_amount = COALESCE($2, actual_amount) WHERE id = $3 AND event_id = $4 RETURNING *',
      [status, actual_amount, itemId, eventId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Document Management
export const uploadDocument = async (req, res) => {
  const { eventId } = req.params;
  const { name, file_url, permissions } = req.body;
  try {
    // Check for existing version
    const existing = await pool.query(
      'SELECT MAX(version) as last_version FROM collaboration_docs WHERE event_id = $1 AND name = $2',
      [eventId, name]
    );
    const newVersion = (existing.rows[0].last_version || 0) + 1;

    const result = await pool.query(
      'INSERT INTO collaboration_docs (event_id, name, file_url, version, uploaded_by, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [eventId, name, file_url, newVersion, req.user.id, permissions || 'ORGANIZER']
    );

    req.io.to(`event_${eventId}`).emit('doc_uploaded', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Discussions
export const postComment = async (req, res) => {
  const { eventId } = req.params;
  const { topic, content, parent_id } = req.body;
  const author_id = req.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO collaboration_discussions (event_id, topic, author_id, content, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [eventId, topic, author_id, content, parent_id]
    );

    req.io.to(`event_${eventId}`).emit('new_comment', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Decision Log
export const logDecision = async (req, res) => {
  const { eventId } = req.params;
  const { decision, rationale } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO collaboration_decisions (event_id, decision, rationale, decided_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [eventId, decision, rationale, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
