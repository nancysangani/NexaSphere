/* Migration: Admin Audit Log Enhancements
   Description: Add resource_type, resource_id, session_id, and hash_checksum to audit_logs for issue #1767
   Version: 1.0.0
   Date: 2026-06-18
*/

export const up = (pgm) => {
  pgm.addColumns('audit_logs', {
    resource_type: { type: 'text' },
    resource_id: { type: 'text' },
    session_id: { type: 'text' },
    hash_checksum: { type: 'text' },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('audit_logs', ['resource_type', 'resource_id', 'session_id', 'hash_checksum']);
};
