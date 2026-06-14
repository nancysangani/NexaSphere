export const up = (pgm) => {
  pgm.createTable('mentors', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    domains: { type: 'jsonb', notNull: true, default: '[]' },
    bio: { type: 'text', notNull: false },
    experience: { type: 'varchar(100)', notNull: false },
    availability: { type: 'text', notNull: false },
    is_available: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('mentors', 'email');
  pgm.createIndex('mentors', 'is_available');

  pgm.createTable('mentorships', {
    id: { type: 'serial', primaryKey: true },
    mentor_id: { type: 'integer', notNull: true, references: 'mentors(id)', onDelete: 'CASCADE' },
    mentee_name: { type: 'varchar(255)', notNull: true },
    mentee_email: { type: 'varchar(255)', notNull: true },
    mentee_domain: { type: 'varchar(100)', notNull: false },
    mentee_goals: { type: 'text', notNull: false },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    message: { type: 'text', notNull: false },
    started_at: { type: 'timestamptz' },
    ended_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('mentorships', 'mentor_id');
  pgm.createIndex('mentorships', 'mentee_email');
  pgm.createIndex('mentorships', 'status');

  pgm.createTable('mentorship_sessions', {
    id: { type: 'serial', primaryKey: true },
    mentorship_id: {
      type: 'integer',
      notNull: true,
      references: 'mentorships(id)',
      onDelete: 'CASCADE',
    },
    title: { type: 'varchar(255)', notNull: true },
    notes: { type: 'text', notNull: false },
    duration_minutes: { type: 'integer', notNull: false },
    session_date: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('mentorship_sessions', 'mentorship_id');

  pgm.createTable('buddy_pairs', {
    id: { type: 'serial', primaryKey: true },
    buddy1_name: { type: 'varchar(255)', notNull: true },
    buddy1_email: { type: 'varchar(255)', notNull: true },
    buddy2_name: { type: 'varchar(255)', notNull: true },
    buddy2_email: { type: 'varchar(255)', notNull: true },
    domain: { type: 'varchar(100)', notNull: false },
    paired_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    is_active: { type: 'boolean', notNull: true, default: true },
  });
  pgm.createIndex('buddy_pairs', 'buddy1_email');
  pgm.createIndex('buddy_pairs', 'buddy2_email');
};

export const down = (pgm) => {
  pgm.dropTable('buddy_pairs');
  pgm.dropTable('mentorship_sessions');
  pgm.dropTable('mentorships');
  pgm.dropTable('mentors');
};
