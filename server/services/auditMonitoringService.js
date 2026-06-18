import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { withDb } from '../repositories/db.js';
import logger from '../utils/logger.js';

class AuditMonitoringService {
  /**
   * Check for suspicious logins for a given admin and IP.
   * 1. Alert if login is from a new IP (not used by this admin in the last 30 days)
   * 2. Alert if 5+ failed login attempts within 15 minutes
   */
  async checkSuspiciousActivity(adminId, currentIp) {
    const alerts = [];

    await withDb(async (client) => {
      // 1. Check for logins from a new IP in the last 30 days
      const { rows: ipRows } = await client.query(
        `SELECT DISTINCT ip_address 
         FROM audit_logs 
         WHERE admin_id = $1 
           AND action = 'login' 
           AND timestamp >= NOW() - INTERVAL '30 days'`,
        [adminId]
      );

      const knownIps = ipRows.map((r) => r.ip_address);
      if (knownIps.length > 0 && !knownIps.includes(currentIp)) {
        alerts.push({
          type: 'NEW_IP_LOGIN',
          severity: 'MEDIUM',
          message: `Admin '${adminId}' logged in from a new IP address: ${currentIp}`,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Check for failed logins in the last 15 minutes
      const { rows: failedRows } = await client.query(
        `SELECT COUNT(*) as failed_count 
         FROM audit_logs 
         WHERE (admin_id = $1 OR ip_address = $2) 
           AND action = 'failed_login' 
           AND timestamp >= NOW() - INTERVAL '15 minutes'`,
        [adminId, currentIp]
      );

      const failedCount = parseInt(failedRows[0].failed_count, 10);
      if (failedCount >= 5) {
        alerts.push({
          type: 'FAILED_LOGIN_SPIKE',
          severity: 'HIGH',
          message: `Detected ${failedCount} failed login attempts for admin '${adminId}' / IP '${currentIp}' within 15 minutes`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    if (alerts.length > 0) {
      logger.warn('Suspicious activity detected', { alerts });
    }

    return alerts;
  }

  /**
   * Get all active sessions currently stored in the system.
   */
  async getActiveSessions() {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT username, COUNT(*) as session_count, MAX(last_seen_at) as last_active 
         FROM admin_sessions 
         WHERE expires_at > NOW() AND revoked_at IS NULL 
         GROUP BY username`
      );
      return rows;
    });
  }

  /**
   * Generates a structural Activity Report
   */
  async generateActivityReport(startDate, endDate) {
    const logs = await auditLogRepository.queryAuditLogs({
      startDate,
      endDate,
    });

    const totalActions = logs.length;
    const actionsByAdmin = {};
    const actionsByResource = {};
    const actionsByType = {};

    for (const log of logs) {
      actionsByAdmin[log.admin_id] = (actionsByAdmin[log.admin_id] || 0) + 1;
      if (log.resource_type) {
        actionsByResource[log.resource_type] = (actionsByResource[log.resource_type] || 0) + 1;
      }
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    }

    return {
      timeframe: { startDate, endDate },
      summary: {
        totalActions,
        uniqueAdmins: Object.keys(actionsByAdmin).length,
      },
      breakdown: {
        byAdmin: actionsByAdmin,
        byResource: actionsByResource,
        byAction: actionsByType,
      },
    };
  }

  /**
   * Generates a detailed Security & Integrity Incident Report
   */
  async generateSecurityIncidentReport() {
    // 1. Run Log Tampering verification
    const corruptedIds = await auditLogRepository.verifyLogTampering();

    // 2. Fetch suspicious activities from database (failed logins in last 24h)
    let failedLogins = [];
    await withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT admin_id, ip_address, timestamp 
         FROM audit_logs 
         WHERE action = 'failed_login' 
           AND timestamp >= NOW() - INTERVAL '24 hours' 
         ORDER BY timestamp DESC`
      );
      failedLogins = rows;
    });

    // 3. New IP logins in the last 24h
    let newIps = [];
    await withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT DISTINCT admin_id, ip_address, timestamp 
         FROM audit_logs 
         WHERE action = 'login' 
           AND timestamp >= NOW() - INTERVAL '24 hours'`
      );

      for (const row of rows) {
        const pastLogins = await client.query(
          `SELECT COUNT(*) as count 
           FROM audit_logs 
           WHERE admin_id = $1 
             AND action = 'login' 
             AND ip_address = $2 
             AND timestamp < $3`,
          [row.admin_id, row.ip_address, row.timestamp]
        );
        if (parseInt(pastLogins.rows[0].count, 10) === 0) {
          newIps.push(row);
        }
      }
    });

    return {
      timestamp: new Date().toISOString(),
      integrity: {
        status: corruptedIds.length === 0 ? 'SECURE' : 'COMPROMISED',
        corruptedLogsCount: corruptedIds.length,
        corruptedLogIds: corruptedIds,
      },
      suspiciousActivity: {
        failedLoginsCount24h: failedLogins.length,
        failedLoginsList: failedLogins,
        newIpLoginsCount24h: newIps.length,
        newIpLoginsList: newIps,
      },
    };
  }

  /**
   * Generates a Compliance Report showing overall security and retention compliance status
   */
  async generateComplianceReport() {
    const securityReport = await this.generateSecurityIncidentReport();
    const activeSessions = await this.getActiveSessions();

    return {
      complianceStatus:
        securityReport.integrity.status === 'SECURE' ? 'COMPLIANT' : 'NON-COMPLIANT',
      certifiedAt: new Date().toISOString(),
      securityAudit: securityReport,
      sessionMetrics: {
        totalActiveSessions: activeSessions.reduce((acc, curr) => acc + curr.session_count, 0),
        sessions: activeSessions,
      },
    };
  }

  /**
   * Run Retention Policy Cleanup
   */
  async runRetentionCleanup(retentionDays = 90) {
    const deletedCount = await auditLogRepository.enforceRetentionPolicies(retentionDays);
    return {
      success: true,
      deletedCount,
      retentionDays,
      timestamp: new Date().toISOString(),
    };
  }
}

export const auditMonitoringService = new AuditMonitoringService();
