export const up = (pgm) => {
  pgm.sql(`-- Content Moderation Queue Migration
-- Run this migration to add moderation tables to the database

-- Moderation Flags table
CREATE TABLE IF NOT EXISTS moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_preview TEXT,
  user_id TEXT NOT NULL,
  reported_by TEXT,
  flag_type TEXT NOT NULL,
  reason TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  moderator_id TEXT,
  resolution TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_flags_status ON moderation_flags (status);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_user_id ON moderation_flags (user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_flag_type ON moderation_flags (flag_type);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_created_at ON moderation_flags (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_content ON moderation_flags (content_type, content_id);

-- User Warnings table
CREATE TABLE IF NOT EXISTS moderation_user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  warning_level INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  issued_by TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_warnings_user_id ON moderation_user_warnings (user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_warnings_level ON moderation_user_warnings (warning_level);

-- Moderator Notes table
CREATE TABLE IF NOT EXISTS moderation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_notes_target ON moderation_notes (target_type, target_id);

-- Appeals table
CREATE TABLE IF NOT EXISTS moderation_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES moderation_flags(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  decision TEXT,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status ON moderation_appeals (status);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_flag_id ON moderation_appeals (flag_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_user_id ON moderation_appeals (user_id);
`);
};

export const down = (_pgm) => {
  // down migration not implemented
};
