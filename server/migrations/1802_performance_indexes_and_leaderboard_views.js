/**
 * 1802_performance_indexes_and_leaderboard_views.js
 * Performance: indexes + materialized views for scaling (#1777)
 */

export const shorthands = undefined;

function createIndexIfNotExists(pgm, table, indexName, createSql) {
  // pg-promise migrations sometimes don’t support ifNotExists for indexes consistently.
  // We use CREATE INDEX IF NOT EXISTS directly when possible.
  pgm.sql(createSql.replace(/__INDEX_NAME__/g, indexName).replace(/__TABLE__/g, table));
}

export const up = async (pgm) => {
  // ---------------------------------------------------------------------------
  // Hot query indexes (events)
  // ---------------------------------------------------------------------------
  // events listing uses:
  //   WHERE (restricted_groups IS NULL OR jsonb_array_length(restricted_groups)=0 OR restricted_groups='[]' OR EXISTS ... jsonb_array_elements_text(restricted_groups) ...)
  //   ORDER BY created_at DESC
  //   plus possible filtering on status.

  // created_at desc for list ordering
  pgm.sql(
    `CREATE INDEX IF NOT EXISTS __INDEX_NAME__ ON __TABLE__ (created_at DESC);`
      .replace(/__INDEX_NAME__/g, 'idx_events_created_at_desc')
      .replace(/__TABLE__/g, 'events')
  );

  // status + created_at for admin/public lists when status is involved
  pgm.sql(
    `CREATE INDEX IF NOT EXISTS __INDEX_NAME__ ON __TABLE__ (status, created_at DESC);`
      .replace(/__INDEX_NAME__/g, 'idx_events_status_created_at_desc')
      .replace(/__TABLE__/g, 'events')
  );

  // For membership checks we rely on EXISTS over jsonb_array_elements_text(restricted_groups)
  // This can benefit from a GIN index on restricted_groups.
  pgm.sql(
    `CREATE INDEX IF NOT EXISTS __INDEX_NAME__ ON __TABLE__ USING GIN (restricted_groups);`
      .replace(/__INDEX_NAME__/g, 'idx_events_restricted_groups_gin')
      .replace(/__TABLE__/g, 'events')
  );

  // ---------------------------------------------------------------------------
  // Leaderboard / user metrics
  // ---------------------------------------------------------------------------
  // The production leaderboard computation is not fully visible in this environment.
  // We provide a materialized view that can be used once leaderboard query is pointed to it.
  // If student_users table/columns differ, this migration will fail and must be adjusted.

  // Expected table name/columns (based on issue text): student_users (or similar)
  // If your schema uses a different table name, update this migration accordingly.

  pgm.sql(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_nightly AS
    SELECT
      su.user_id::text AS user_id,
      COALESCE(su.xp, 0)::bigint AS xp,
      COALESCE(su.level, 0)::int AS level,
      su.created_at
    FROM student_users su;
  `);

  pgm.sql(
    `CREATE INDEX IF NOT EXISTS idx_leaderboard_nightly_level_xp ON leaderboard_nightly (level DESC, xp DESC);`
  );
  pgm.sql(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_nightly_user_id ON leaderboard_nightly (user_id);`
  );
};

export const down = async (pgm) => {
  pgm.sql(`DROP MATERIALIZED VIEW IF EXISTS leaderboard_nightly;`);
  // indexes are created with IF NOT EXISTS, so dropping them is safe but optional.
  pgm.sql(`DROP INDEX IF EXISTS idx_leaderboard_nightly_level_xp;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_leaderboard_nightly_user_id;`);

  pgm.sql(`DROP INDEX IF EXISTS idx_events_created_at_desc;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_events_status_created_at_desc;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_events_restricted_groups_gin;`);
};
