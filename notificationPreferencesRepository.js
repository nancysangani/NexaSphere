import { HAS_SUPABASE, supabaseRequest } from '../storage/supabaseClient.js';

export const notificationPreferencesRepository = {
  async get(userId) {
    if (HAS_SUPABASE) {
      const [prefs] = await supabaseRequest(`notification_preferences?user_id=eq.${userId}`);
      return prefs || this.getDefaults();
    }
    return this.getDefaults();
  },

  async set(userId, updates) {
    if (HAS_SUPABASE) {
      await supabaseRequest('notification_preferences', {
        method: 'POST', // Use UPSERT logic if available in your helpers
        body: [{ user_id: userId, ...updates, updated_at: new Date().toISOString() }],
      });
    }
  },

  getDefaults() {
    return {
      types: {
        event_reminders: { push: true, email: true, frequency: 'immediate' },
        registrations: { push: true, email: true, frequency: 'immediate' },
        messages: { push: true, email: false, frequency: 'immediate' },
        announcements: { push: true, email: true, frequency: 'daily_digest' },
        recommendations: { push: true, email: false, frequency: 'weekly_digest' },
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
      doNotDisturb: {
        enabled: false,
        until: null,
      },
    };
  },

  async isInsideQuietHours(userId) {
    const prefs = await this.get(userId);
    if (!prefs.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { start, end } = prefs.quietHours;

    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Over midnight
      return currentTime >= start || currentTime <= end;
    }
  },

  async isDNDActive(userId) {
    const prefs = await this.get(userId);
    return (
      prefs.doNotDisturb?.enabled &&
      (!prefs.doNotDisturb.until || new Date(prefs.doNotDisturb.until) > new Date())
    );
  },
};
