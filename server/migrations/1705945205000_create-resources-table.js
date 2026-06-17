/* Migration: Create resources table for the Student Resource Library
   Description: Creates the resources table for file sharing and community resources
   Version: 1.0.0
   Date: 2026-06-10
*/

export const up = (pgm) => {
  pgm.createTable('resources', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: false },
    file_url: { type: 'varchar(2048)', notNull: true },
    file_type: { type: 'varchar(50)', notNull: false },
    file_size: { type: 'integer', notNull: false },
    category: { type: 'varchar(100)', notNull: false, default: 'other' },
    tags: { type: 'jsonb', notNull: true, default: '[]' },
    difficulty_level: { type: 'varchar(20)', notNull: false },
    uploaded_by: { type: 'varchar(255)', notNull: false },
    downloads: { type: 'integer', notNull: true, default: 0 },
    votes: { type: 'jsonb', notNull: true, default: '[]' },
    rating: { type: 'numeric(3,1)', notNull: true, default: 0 },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('resources', 'category');
  pgm.createIndex('resources', 'status');
  pgm.createIndex('resources', 'uploaded_by');
  pgm.createIndex('resources', 'created_at');
};

export const down = (pgm) => {
  pgm.dropTable('resources');
};
