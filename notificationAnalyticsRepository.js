import { HAS_SUPABASE, supabaseRequest } from '../storage/supabaseClient.js';

/**
 * Tracks notification delivery, opens, and actions for efficacy analysis.
 */
export const notificationAnalyticsRepository = {
  async logEvent(userId, notificationId, eventType, action = null) {
    const event = {
      user_id: userId,
      notification_id: notificationId,
      event_type: eventType, // 'delivered', 'opened', 'action_clicked'
      action_taken: action,
      created_at: new Date().toISOString(),
    };

    if (HAS_SUPABASE) {
      try {
        await supabaseRequest('notification_analytics', {
          method: 'POST',
          body: [event],
        });
      } catch (err) {
        console.error('[Analytics] Failed to log notification event:', err.message);
      }
    }
    // Fallback: In-memory or file-based logging if needed
  },

  async getUserStats(userId) {
    if (!HAS_SUPABASE) return { openRate: 0, actionRate: 0 };

    try {
      // Example query to calculate rates
      const data = await supabaseRequest(`notification_analytics?user_id=eq.${userId}`);
      const delivered = data.filter((e) => e.event_type === 'delivered').length;
      const opened = data.filter((e) => e.event_type === 'opened').length;
      const actions = data.filter((e) => e.event_type === 'action_clicked').length;

      return {
        totalDelivered: delivered,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        actionRate: opened > 0 ? (actions / opened) * 100 : 0,
        fatigueIndex: delivered > 20 && opened / delivered < 0.1 ? 'high' : 'normal',
      };
    } catch (err) {
      return { openRate: 0, actionRate: 0 };
    }
  },

  async getUserActivityMetrics(userId) {
    if (!HAS_SUPABASE) return { daysSinceLastActive: 0, dailyActiveCount: 0 };
    try {
      const data = await supabaseRequest(
        `user_activity_metrics?user_id=eq.${userId}&order=last_active.desc&limit=1`
      );
      if (!data.length) return { daysSinceLastActive: 100, dailyActiveCount: 0 };

      const lastActive = new Date(data[0].last_active);
      const daysInactive = Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24));

      // Mocking daily count for logic demonstration; in production, query activity from last 24h
      return {
        daysSinceLastActive: daysInactive,
        dailyActiveCount: data[0].daily_count || 0,
      };
    } catch (err) {
      return { daysSinceLastActive: 0, dailyActiveCount: 0 };
    }
  },

  async trackAppActivity(userId) {
    // Updates the last active timestamp and increment daily count
    // This is used by the orchestration engine to adjust frequency
    await supabaseRequest('user_activity_metrics', {
      method: 'POST',
      body: [{ user_id: userId, last_active: new Date().toISOString() }],
    });
  },
};
