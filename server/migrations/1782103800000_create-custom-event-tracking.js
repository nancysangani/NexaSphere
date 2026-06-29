/* Migration: Create Custom Event Tracking Tables
   Description: Tables for admins to define custom tracked events, their properties,
                log occurrences, and generate analytics/exports.
   Version: 1.0.0
   Date: 2026-06-22
*/

export const up = (pgm) => {
  // Table 1: custom_event_definitions — admin-defined event templates
  pgm.createTable('custom_event_definitions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    // JSON array of property definitions: [{name, type, required}]
    properties: {
      type: 'jsonb',
      notNull: true,
      default: '[]',
    },
    created_by: {
      type: 'text',
      notNull: true,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('custom_event_definitions', 'name', {
    name: 'idx_custom_event_defs_name',
    unique: true,
  });
  pgm.createIndex('custom_event_definitions', 'is_active', {
    name: 'idx_custom_event_defs_active',
  });

  // Table 2: custom_event_logs — individual occurrences of custom events
  pgm.createTable('custom_event_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_definition_id: {
      type: 'uuid',
      notNull: true,
    },
    user_id: {
      type: 'text',
    },
    session_id: {
      type: 'text',
    },
    // Actual property values for this occurrence
    properties: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    occurred_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint(
    'custom_event_logs',
    'fk_custom_event_logs_definition',
    'FOREIGN KEY (event_definition_id) REFERENCES custom_event_definitions(id) ON DELETE CASCADE'
  );

  pgm.createIndex('custom_event_logs', 'event_definition_id', {
    name: 'idx_custom_event_logs_def_id',
  });
  pgm.createIndex('custom_event_logs', 'occurred_at', {
    name: 'idx_custom_event_logs_occurred_at',
    order: 'DESC',
  });
  pgm.createIndex('custom_event_logs', 'user_id', {
    name: 'idx_custom_event_logs_user',
  });
};

export const down = (pgm) => {
  pgm.dropTable('custom_event_logs', { ifExists: true, cascade: true });
  pgm.dropTable('custom_event_definitions', { ifExists: true, cascade: true });
};
