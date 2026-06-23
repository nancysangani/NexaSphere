import { withDb } from '../repositories/db.js';

// NOTE: This domain does not use Prisma at runtime. Audit rows are written by
// auditLogRepository.insertAuditLog() into the raw `audit_logs` table created
// in auditLogRepository.init(). Columns: id, admin_id, action, ip_address,
// user_agent, old_state, new_state, timestamp. There is no Prisma `AuditLog`
// model backing this data — querying prisma.auditLog (the previous bug) will
// always return an empty result set because nothing writes to it.

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function parseListQuery(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));

  // Accept both `adminId` and the legacy `userId` query param name so any
  // existing frontend/bookmarked links don't break.
  const adminId = query.adminId || query.userId || undefined;

  // `action` is a free-text string here (e.g. "POST /api/admin/events"),
  // not an enum, so we match it with a partial/case-insensitive search
  // rather than an exact equality check.
  const action = query.action ? String(query.action).trim() : undefined;

  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  return { page, limit, adminId, action, startDate, endDate };
}

function buildWhereClause({ adminId, action, startDate, endDate }) {
  const conditions = [];
  const values = [];

  if (adminId) {
    values.push(adminId);
    conditions.push(`admin_id = $${values.length}`);
  }

  if (action) {
    values.push(`%${action}%`);
    conditions.push(`action ILIKE $${values.length}`);
  }

  if (startDate && !Number.isNaN(startDate.getTime())) {
    values.push(startDate.toISOString());
    conditions.push(`timestamp >= $${values.length}`);
  }

  if (endDate && !Number.isNaN(endDate.getTime())) {
    values.push(endDate.toISOString());
    conditions.push(`timestamp <= $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values };
}

export const auditLogController = {
  /**
   * GET /api/admin/audit-logs
   * Returns paginated audit logs with optional filters:
   *   ?page=1&limit=50&adminId=&action=&startDate=&endDate=
   */
  async listLogs(req, res) {
    try {
      const filters = parseListQuery(req.query);
      const { whereClause, values } = buildWhereClause(filters);
      const { page, limit } = filters;
      const offset = (page - 1) * limit;

      const { logs, total } = await withDb(async (client) => {
        const dataValues = [...values, limit, offset];
        const limitParam = dataValues.length - 1;
        const offsetParam = dataValues.length;

        const dataResult = await client.query(
          `SELECT id, admin_id, action, ip_address, user_agent, old_state, new_state, timestamp
           FROM audit_logs
           ${whereClause}
           ORDER BY timestamp DESC
           LIMIT $${limitParam} OFFSET $${offsetParam}`,
          dataValues
        );

        const countResult = await client.query(
          `SELECT COUNT(*) AS count FROM audit_logs ${whereClause}`,
          values
        );

        return {
          logs: dataResult.rows,
          total: parseInt(countResult.rows[0].count, 10),
        };
      });

      return res.json({
        logs,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      console.error('auditLogController.listLogs error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  },

  /**
   * GET /api/admin/audit-logs/stats
   * Returns aggregate stats: total count, breakdown by action, and daily activity
   * for the last 30 days.
   */
  async getStats(req, res) {
    try {
      const stats = await withDb(async (client) => {
        const totalResult = await client.query('SELECT COUNT(*) AS count FROM audit_logs');
        const total = parseInt(totalResult.rows[0].count, 10);

        const byActionResult = await client.query(
          `SELECT action, COUNT(*) AS count
           FROM audit_logs
           GROUP BY action
           ORDER BY count DESC
           LIMIT 20`
        );
        const byAction = byActionResult.rows.map((row) => ({
          action: row.action,
          count: parseInt(row.count, 10),
        }));

        const dailyResult = await client.query(
          `SELECT to_char(timestamp, 'YYYY-MM-DD') AS date, COUNT(*) AS count
           FROM audit_logs
           WHERE timestamp >= NOW() - INTERVAL '30 days'
           GROUP BY date
           ORDER BY date ASC`
        );
        const daily = dailyResult.rows.map((row) => ({
          date: row.date,
          count: parseInt(row.count, 10),
        }));

        return { total, byAction, daily };
      });

      return res.json(stats);
    } catch (error) {
      console.error('auditLogController.getStats error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit log stats' });
    }
  },
};
