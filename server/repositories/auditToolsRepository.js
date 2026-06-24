import { withDb } from './db.js';
import logger from '../utils/logger.js';

class AuditToolsRepository {
  async createAuditRun({
    runType,
    createdByAdminId,
    targetScope = {},
    metadata = {},
    summary = {},
  }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into audit_runs (run_type, created_by_admin_id, target_scope, metadata, summary)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [
          runType,
          createdByAdminId || null,
          JSON.stringify(targetScope || {}),
          JSON.stringify(metadata || {}),
          JSON.stringify(summary || {}),
        ]
      );
      return rows[0];
    });
  }

  async updateAuditRunStatus(runId, { status, finishedAt, summary }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update audit_runs
         set status = $1,
             finished_at = $2,
             summary = coalesce($3, summary)
         where id = $4
         returning *`,
        [status, finishedAt || new Date().toISOString(), JSON.stringify(summary || {}), runId]
      );
      return rows[0] || null;
    });
  }

  async getAuditRun(runId) {
    return withDb(async (client) => {
      const { rows } = await client.query('select * from audit_runs where id=$1', [runId]);
      return rows[0] || null;
    });
  }

  async listAuditRuns({ runType, status, limit = 50, offset = 0 } = {}) {
    return withDb(async (client) => {
      const clauses = [];
      const values = [];
      let i = 1;

      if (runType) {
        clauses.push(`run_type = $${i}`);
        values.push(runType);
        i++;
      }
      if (status) {
        clauses.push(`status = $${i}`);
        values.push(status);
        i++;
      }

      let query = 'select * from audit_runs';
      if (clauses.length) query += ` where ${clauses.join(' and ')}`;
      query += ' order by started_at desc';
      query += ` limit $${i}`;
      values.push(parseInt(limit, 10));
      i++;

      query += ` offset $${i}`;
      values.push(parseInt(offset, 10));

      const { rows } = await client.query(query, values);
      return rows;
    });
  }

  async upsertIssueForRun({ runId, issue }) {
    // Uses fingerprint to dedupe within the run.
    return withDb(async (client) => {
      const {
        issue_type,
        severity,
        title,
        description,
        page_url,
        selector,
        evidence,
        recommended_fix,
        suggested_fix_json,
        fingerprint,
      } = issue;

      const { rows } = await client.query(
        `insert into audit_issues (
          run_id, issue_type, severity, title, description, page_url, selector,
          evidence, recommended_fix, suggested_fix_json, fingerprint
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        on conflict (run_id, fingerprint) do update set
          severity = excluded.severity,
          title = excluded.title,
          description = excluded.description,
          page_url = excluded.page_url,
          selector = excluded.selector,
          evidence = excluded.evidence,
          recommended_fix = excluded.recommended_fix,
          suggested_fix_json = excluded.suggested_fix_json,
          created_at = audit_issues.created_at
        returning *`,
        [
          runId,
          issue_type,
          severity,
          title,
          description,
          page_url || null,
          selector || null,
          JSON.stringify(evidence || {}),
          recommended_fix || '',
          JSON.stringify(suggested_fix_json || {}),
          fingerprint,
        ]
      );
      return rows[0];
    });
  }

  async listIssues({ runId, issueType, severity, limit = 200, offset = 0 } = {}) {
    return withDb(async (client) => {
      const clauses = [];
      const values = [];
      let i = 1;

      if (runId) {
        clauses.push(`run_id = $${i}`);
        values.push(runId);
        i++;
      }
      if (issueType) {
        clauses.push(`issue_type = $${i}`);
        values.push(issueType);
        i++;
      }
      if (severity) {
        clauses.push(`severity = $${i}`);
        values.push(severity);
        i++;
      }

      let query = 'select * from audit_issues';
      if (clauses.length) query += ` where ${clauses.join(' and ')}`;
      query += ' order by created_at desc';
      query += ` limit $${i}`;
      values.push(parseInt(limit, 10));
      i++;
      query += ` offset $${i}`;
      values.push(parseInt(offset, 10));

      const { rows } = await client.query(query, values);
      return rows;
    });
  }

  async createRemediationForIssue({ issueId, assignedTo, deadline, notes }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into audit_remediations (issue_id, assigned_to, deadline, notes)
         values ($1,$2,$3,$4)
         returning *`,
        [issueId, assignedTo || null, deadline || null, notes || null]
      );
      return rows[0];
    });
  }

  async updateRemediation({ remediationId, updates }) {
    return withDb(async (client) => {
      const { remediationStatus, assignedTo, deadline, notes, completedAt, auditNotes } = updates;

      const { rows } = await client.query(
        `update audit_remediations
         set remediation_status = $1,
             assigned_to = $2,
             deadline = $3,
             notes = $4,
             completed_at = $5,
             audit_notes = $6,
             updated_at = now()
         where id = $7
         returning *`,
        [
          remediationStatus,
          assignedTo || null,
          deadline || null,
          notes || null,
          completedAt || null,
          JSON.stringify(auditNotes || {}),
          remediationId,
        ]
      );
      return rows[0] || null;
    });
  }

  async listRemediations({ runId, status, assignedTo, limit = 200, offset = 0 } = {}) {
    return withDb(async (client) => {
      const clauses = [];
      const values = [];
      let i = 1;

      if (runId) {
        clauses.push(`ri.issue_id in (select id from audit_issues where run_id = $${i})`);
        values.push(runId);
        i++;
      }
      if (status) {
        clauses.push(`ri.remediation_status = $${i}`);
        values.push(status);
        i++;
      }
      if (assignedTo) {
        clauses.push(`ri.assigned_to = $${i}`);
        values.push(assignedTo);
        i++;
      }

      let query = `select ri.*
                    from audit_remediations ri`;
      if (clauses.length) query += ` where ${clauses.join(' and ')}`;

      query += ' order by ri.updated_at desc';
      query += ` limit $${i}`;
      values.push(parseInt(limit, 10));
      i++;
      query += ` offset $${i}`;
      values.push(parseInt(offset, 10));

      const { rows } = await client.query(query, values);
      return rows;
    });
  }

  async saveTrend({ runType, weekStart, snapshot }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into audit_trends (run_type, week_start, snapshot)
         values ($1,$2,$3)
         on conflict (run_type, week_start) do update set snapshot = excluded.snapshot
         returning *`,
        [runType, weekStart, JSON.stringify(snapshot || {})]
      );
      return rows[0];
    });
  }

  async getTrends({ runType, limit = 12 } = {}) {
    return withDb(async (client) => {
      let query = 'select * from audit_trends';
      const values = [];
      let i = 1;
      if (runType) {
        query += ` where run_type = $${i}`;
        values.push(runType);
        i++;
      }
      query += ' order by week_start desc';
      query += ` limit $${i}`;
      values.push(parseInt(limit, 10));

      const { rows } = await client.query(query, values);
      return rows;
    });
  }

  async createAuditExport({ runId, exportType, createdByAdminId, payload, format, filename }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into audit_exports (run_id, export_type, created_by_admin_id, payload, format, filename)
         values ($1,$2,$3,$4,$5,$6)
         returning *`,
        [
          runId || null,
          exportType,
          createdByAdminId || null,
          JSON.stringify(payload || {}),
          format || 'json',
          filename || null,
        ]
      );
      return rows[0];
    });
  }

  async getLatestExportForRun(runId, exportType) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select * from audit_exports
         where run_id = $1 and export_type = $2
         order by created_at desc
         limit 1`,
        [runId, exportType]
      );
      return rows[0] || null;
    });
  }
}

export const auditToolsRepository = new AuditToolsRepository();
