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
          timestamp TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    });
  }

  async insertAuditLog(logEntry) {
    const { adminId, action, ipAddress, userAgent, oldState, newState } = logEntry;

    const id = crypto.randomUUID();
    const delays = [100, 500, 1000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        await withDb(async (client) => {
          await client.query(
            `INSERT INTO audit_logs (id, admin_id, action, ip_address, user_agent, old_state, new_state, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              id,
              adminId,
              action,
              ipAddress || null,
              userAgent || null,
              oldState ? JSON.stringify(oldState) : null,
              newState ? JSON.stringify(newState) : null,
            ]
          );
        });
        return;
      } catch (err) {
        if (attempt === delays.length) {
          logger.error('Failed to insert audit log', { error: err.message, logEntry });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  async searchAuditLogs({ search = '', action = '', adminId = '', limit = 50, offset = 0 } = {}) {
    await this.init();
    const filters = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      filters.push(
        `(action ilike $${params.length} or admin_id ilike $${params.length} or new_state::text ilike $${params.length} or old_state::text ilike $${params.length})`
      );
    }
    if (action) {
      params.push(`%${action}%`);
      filters.push(`action ilike $${params.length}`);
    }
    if (adminId) {
      params.push(adminId);
      filters.push(`admin_id = $${params.length}`);
    }

    const where = filters.length ? `where ${filters.join(' and ')}` : '';
    params.push(Math.min(Math.max(Number(limit) || 50, 1), 500));
    const limitParam = params.length;
    params.push(Math.max(Number(offset) || 0, 0));
    const offsetParam = params.length;

    return withDb(async (client) => {
      const { rows } = await client.query(
        `select id, admin_id, action, ip_address, user_agent, old_state, new_state, timestamp
         from audit_logs
         ${where}
         order by timestamp desc
         limit $${limitParam} offset $${offsetParam}`,
        params
      );

      return rows.map((row) => ({
        id: row.id,
        adminId: row.admin_id,
        action: row.action,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        oldState: row.old_state,
        newState: row.new_state,
        timestamp: row.timestamp,
      }));
    });
  }

  async exportAuditLogsCsv(filters = {}) {
    const rows = await this.searchAuditLogs({ ...filters, limit: 500 });
    const header = ['timestamp', 'adminId', 'action', 'ipAddress', 'details'];
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((row) =>
      [
        row.timestamp,
        row.adminId,
        row.action,
        row.ipAddress,
        JSON.stringify({ oldState: row.oldState, newState: row.newState }),
      ]
        .map(escape)
        .join(',')
    );

    return [header.join(','), ...lines].join('\n');
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
