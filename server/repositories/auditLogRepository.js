import { withDb } from './db.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

class AuditLogRepository {
  async init() {
    await withDb(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY,
          admin_id VARCHAR(255) NOT NULL,
          action VARCHAR(255) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          old_state JSONB,
          new_state JSONB,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          resource_type TEXT,
          resource_id TEXT,
          session_id TEXT,
          hash_checksum TEXT
        )
      `);
    });
  }

  calculateChecksum(
    id,
    adminId,
    action,
    ipAddress,
    userAgent,
    oldState,
    newState,
    resourceType,
    resourceId,
    sessionId
  ) {
    const data = [
      id,
      adminId,
      action,
      ipAddress || '',
      userAgent || '',
      oldState ? JSON.stringify(oldState) : '',
      newState ? JSON.stringify(newState) : '',
      resourceType || '',
      resourceId || '',
      sessionId || '',
    ].join('|');
    return crypto
      .createHmac('sha256', process.env.AUDIT_LOG_SECRET || 'audit-secret-key')
      .update(data)
      .digest('hex');
  }

  async insertAuditLog(logEntry) {
    const {
      adminId,
      action,
      ipAddress,
      userAgent,
      oldState,
      newState,
      resourceType,
      resourceId,
      sessionId,
    } = logEntry;

    const id = crypto.randomUUID();
    const hash = this.calculateChecksum(
      id,
      adminId,
      action,
      ipAddress,
      userAgent,
      oldState,
      newState,
      resourceType,
      resourceId,
      sessionId
    );

    const delays = [100, 500, 1000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        await withDb(async (client) => {
          await client.query(
            `INSERT INTO audit_logs (id, admin_id, action, ip_address, user_agent, old_state, new_state, resource_type, resource_id, session_id, hash_checksum, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [
              id,
              adminId,
              action,
              ipAddress || null,
              userAgent || null,
              oldState ? JSON.stringify(oldState) : null,
              newState ? JSON.stringify(newState) : null,
              resourceType || null,
              resourceId || null,
              sessionId || null,
              hash,
            ]
          );
        });
        return id;
      } catch (err) {
        if (attempt === delays.length) {
          logger.error('Failed to insert audit log', { error: err.message, logEntry });
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  async queryAuditLogs(filters = {}) {
    return withDb(async (client) => {
      let query = 'SELECT * FROM audit_logs';
      const clauses = [];
      const values = [];
      let i = 1;

      if (filters.actor) {
        clauses.push(`admin_id = $${i}`);
        values.push(filters.actor);
        i++;
      }
      if (filters.action) {
        clauses.push(`action = $${i}`);
        values.push(filters.action);
        i++;
      }
      if (filters.resourceType) {
        clauses.push(`resource_type = $${i}`);
        values.push(filters.resourceType);
        i++;
      }
      if (filters.startDate) {
        clauses.push(`timestamp >= $${i}`);
        values.push(new Date(filters.startDate));
        i++;
      }
      if (filters.endDate) {
        clauses.push(`timestamp <= $${i}`);
        values.push(new Date(filters.endDate));
        i++;
      }
      if (filters.searchText) {
        clauses.push(`(old_state::text ILIKE $${i} OR new_state::text ILIKE $${i})`);
        values.push(`%${filters.searchText}%`);
        i++;
      }

      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        query += ` LIMIT $${i}`;
        values.push(parseInt(filters.limit, 10));
        i++;
      }
      if (filters.offset) {
        query += ` OFFSET $${i}`;
        values.push(parseInt(filters.offset, 10));
        i++;
      }

      const { rows } = await client.query(query, values);
      return rows;
    });
  }

  async verifyLogTampering() {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM audit_logs');
      const corruptedIds = [];

      for (const log of rows) {
        const expectedHash = this.calculateChecksum(
          log.id,
          log.admin_id,
          log.action,
          log.ip_address,
          log.user_agent,
          log.old_state,
          log.new_state,
          log.resource_type,
          log.resource_id,
          log.session_id
        );

        if (log.hash_checksum !== expectedHash) {
          corruptedIds.push(log.id);
        }
      }

      return corruptedIds;
    });
  }

  async getReports() {
    return withDb(async (client) => {
      // 1. Most active admins
      const activeAdmins = await client.query(
        `SELECT admin_id, COUNT(*) as action_count 
         FROM audit_logs 
         GROUP BY admin_id 
         ORDER BY action_count DESC 
         LIMIT 5`
      );

      // 2. Most changed resource types
      const activeResources = await client.query(
        `SELECT resource_type, COUNT(*) as change_count 
         FROM audit_logs 
         WHERE resource_type IS NOT NULL
         GROUP BY resource_type 
         ORDER BY change_count DESC 
         LIMIT 5`
      );

      // 3. Actions breakdown
      const actionsBreakdown = await client.query(
        `SELECT action, COUNT(*) as count 
         FROM audit_logs 
         GROUP BY action 
         ORDER BY count DESC`
      );

      return {
        activeAdmins: activeAdmins.rows,
        activeResources: activeResources.rows,
        actionsBreakdown: actionsBreakdown.rows,
      };
    });
  }

  async enforceRetentionPolicies(days = 90) {
    return withDb(async (client) => {
      // Hot storage cleanup: archive logs older than 90 days
      const { rowCount } = await client.query(
        "DELETE FROM audit_logs WHERE timestamp < NOW() - $1 * INTERVAL '1 day'",
        [days]
      );
      return rowCount;
    });
  }

  async clearAll_TEST_ONLY() {
    if (process.env.NODE_ENV === 'test') {
      await withDb(async (client) => {
        await client.query('DELETE FROM audit_logs');
      });
    }
  }
}

export const auditLogRepository = new AuditLogRepository();

// Initialize the table on load
auditLogRepository.init().catch((err) => {
  logger.error('Failed to initialize audit_logs table', { error: err.message });
});
