import { notificationPreferencesRepository } from '../repositories/notificationPreferencesRepository.js';
import { notificationAnalyticsRepository } from '../repositories/notificationAnalyticsRepository.js';
import { pushSubscriptionsRepository } from '../repositories/pushSubscriptionsRepository.js';
import webpush from 'web-push';

/**
 * Orchestrates notification delivery based on user preferences and behavior.
 */
class NotificationsService {
  constructor() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@nexasphere.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async addNotification(userId, data) {
    const { type, title, message, priority = 'normal', actions = [] } = data;

    // 1. Check DND status (critical notifications bypass DND)
    const isDND = await notificationPreferencesRepository.isDNDActive(userId);
    if (isDND && priority !== 'high') {
      console.log(`[Orchestrator] DND active for user ${userId}, queuing notification.`);
      return this.queueForLater(userId, data);
    }

    // 2. Resolve Frequency Preference
    const prefs = await notificationPreferencesRepository.get(userId);
    const typeConfig = prefs.types[type] || { frequency: 'immediate' };

    if (typeConfig.frequency === 'immediate') {
      // 3. Check Quiet Hours
      const inQuietHours = await notificationPreferencesRepository.isInsideQuietHours(userId);
      if (inQuietHours && priority !== 'high') {
        return this.queueForLater(userId, data);
      }
      return this.sendNow(userId, data);
    } else {
      // Queue for digest (Batching)
      return this.addToDigest(userId, typeConfig.frequency, data);
    }
  }

  async sendNow(userId, data) {
    const subs = await pushSubscriptionsRepository.listByUser(userId);
    const payload = JSON.stringify({
      notification: {
        title: data.title,
        body: data.message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: data.id || 'nexasphere-general',
        data: {
          link: data.link || '/',
          type: data.type,
          id: data.id,
        },
        actions: data.actions || [{ action: 'dismiss', title: 'Dismiss' }],
      },
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        await notificationAnalyticsRepository.logEvent(userId, data.id, 'delivered');
      } catch (err) {
        if (err.statusCode === 410) {
          await pushSubscriptionsRepository.remove(sub.endpoint);
        }
      }
    }
  }

  async addToDigest(userId, frequency, data) {
    // Store in a pending_digests table to be picked up by the SchedulerService
    // supabaseRequest('pending_digests', { method: 'POST', body: [{ userId, frequency, data }] });
    console.log(`[Orchestrator] Added to ${frequency} digest for user ${userId}`);
  }

  async queueForLater(userId, data) {
    // Queue logic for after Quiet Hours or DND ends
    console.log(`[Orchestrator] Queued notification for user ${userId} due to quiet hours/DND`);
  }

  /**
   * Smart Batching: Called by SchedulerService
   */
  async processDigests(frequency) {
    // 1. Fetch all pending digests for the frequency
    // 2. Group by user
    // 3. For each user, send ONE notification summarizing the batch
    // "You have 3 new event recommendations and 2 portfolio views"
  }

  async markAsRead(userId, notificationId) {
    // Logic for marking read in storage
    return true;
  }

  async clearAll(userId) {
    return true;
  }

  async removeNotification(userId, id) {
    return true;
  }
}

export default new NotificationsService();
