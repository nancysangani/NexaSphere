export const up = (pgm) => {
  pgm.sql(`-- Email Campaign System Migration
-- Run this migration to add email campaign tables to the database

-- Email Campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  content JSONB NOT NULL DEFAULT '{}'::JSONB,
  segment_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns (created_at DESC);

-- Email Campaign Analytics table
CREATE TABLE IF NOT EXISTS email_campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_campaign ON email_campaign_analytics (campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_analytics_email ON email_campaign_analytics (recipient_email);

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  html_content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates (category);

-- Email Unsubscribes table
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes (email);

-- Email Automation Triggers table
CREATE TABLE IF NOT EXISTS email_automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_automation_triggers_type ON email_automation_triggers (trigger_type);
CREATE INDEX IF NOT EXISTS idx_email_automation_triggers_active ON email_automation_triggers (is_active);
`);
};

export const down = (_pgm) => {
  // down migration not implemented
};
