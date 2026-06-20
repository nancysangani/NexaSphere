import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { withDb } from './db.js';
import { HAS_SUPABASE } from '../storage/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SLACK_STUDENTS_FILE = path.join(__dirname, '..', 'data', 'student_users_slack.json');

async function ensureLocalFile() {
  const dir = path.dirname(SLACK_STUDENTS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(SLACK_STUDENTS_FILE);
  } catch {
    await fs.writeFile(SLACK_STUDENTS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readLocalSlackSettings() {
  await ensureLocalFile();
  const raw = await fs.readFile(SLACK_STUDENTS_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeLocalSlackSettings(data) {
  await ensureLocalFile();
  await fs.writeFile(SLACK_STUDENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export const studentUsersRepository = {
  async ensureSchema() {
    if (!HAS_SUPABASE) return;
    return withDb(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS student_users (
          id SERIAL PRIMARY KEY,
          provider VARCHAR(40) NOT NULL,
          provider_id VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          avatar_url VARCHAR(2048),
          role VARCHAR(40) NOT NULL DEFAULT 'student',
          scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
          last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(provider, provider_id)
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_student_users_email ON student_users(email)
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS backup_restore_logs (
          id SERIAL PRIMARY KEY,
          backup_key VARCHAR(255),
          restore_type VARCHAR(50) NOT NULL,
          target_time TIMESTAMPTZ,
          status VARCHAR(20) NOT NULL,
          duration_ms INTEGER,
          verified_at TIMESTAMPTZ DEFAULT NOW(),
          error_message TEXT
        )
      `);
      await client.query(`
        ALTER TABLE student_users ADD COLUMN IF NOT EXISTS slack_user_id VARCHAR(255) DEFAULT NULL;
      `);
      await client.query(`
        ALTER TABLE student_users ADD COLUMN IF NOT EXISTS slack_dm_reminders BOOLEAN DEFAULT FALSE;
      `);
    });
  },

  async findByProvider(provider, providerId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM student_users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
        [provider, providerId]
      );
      return rows[0] || null;
    });
  },

  async findByEmail(email) {
    if (!HAS_SUPABASE) {
      const localSettings = await readLocalSlackSettings();
      const settings = localSettings[email] || {};
      return {
        email,
        full_name: 'Local Student',
        slack_user_id: settings.slackUserId || null,
        slack_dm_reminders: settings.slackDmReminders || false,
      };
    }
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM student_users WHERE email = $1 LIMIT 1', [
        email,
      ]);
      return rows[0] || null;
    });
  },

  async upsertFromOAuth({ provider, providerId, email, fullName, avatarUrl }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const check = await client.query(
        'SELECT id FROM student_users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
        [provider, providerId]
      );
      const isNewUser = check.rows.length === 0;

      const { rows } = await client.query(
        `INSERT INTO student_users (provider, provider_id, email, full_name, avatar_url, last_login_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (provider, provider_id) DO UPDATE SET
           email = EXCLUDED.email,
           full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), student_users.full_name),
           avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), student_users.avatar_url),
           last_login_at = NOW(),
           updated_at = NOW()
         RETURNING *`,
        [provider, providerId, email, fullName || null, avatarUrl || null]
      );

      if (isNewUser && rows[0]) {
        try {
          const { trackRegistration } = await import('../middleware/performanceMonitor.js');
          trackRegistration();
        } catch (e) {
          // ignore
        }
      }

      return rows[0];
    });
  },

  async updateRole(id, role) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'UPDATE student_users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [role, id]
      );
      return rows[0] || null;
    });
  },

  async saveRecoveryCode(email, code) {
    return {
      email,
      code,
    };
  },

  async getRecoveryCode(email) {
    return null;
  },

  async listAll() {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM student_users ORDER BY last_login_at DESC'
      );
      return rows;
    });
  },

  async updateSlackSettings(email, { slackUserId, slackDmReminders }) {
    if (!HAS_SUPABASE) {
      const localSettings = await readLocalSlackSettings();
      localSettings[email] = {
        slackUserId,
        slackDmReminders: Boolean(slackDmReminders),
      };
      await writeLocalSlackSettings(localSettings);
      return {
        email,
        slack_user_id: slackUserId,
        slack_dm_reminders: Boolean(slackDmReminders),
      };
    }
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE student_users
         SET slack_user_id = $1, slack_dm_reminders = $2, updated_at = NOW()
         WHERE email = $3
         RETURNING *`,
        [slackUserId, Boolean(slackDmReminders), email]
      );
      return rows[0] || null;
    });
  },
};
