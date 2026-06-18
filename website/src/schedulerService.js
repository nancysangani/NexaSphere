import cron from 'node-cron';
import notificationsService from './notificationsService.js';

/**
 * Handles recurring tasks including notification digests and cleanup.
 */
export const schedulerService = {
  init() {
    console.log('[Scheduler] Initializing automated tasks...');

    // Hourly Digest: Runs at minute 0 of every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[Scheduler] Processing hourly notification digests...');
      await notificationsService.processDigests('hourly_digest');
    });

    // Daily Digest: Runs at 08:00 AM every day
    cron.schedule('0 8 * * *', async () => {
      console.log('[Scheduler] Processing daily notification digests...');
      await notificationsService.processDigests('daily_digest');
    });

    // Add more tasks for analytics cleanup or frequency re-calculation
  },
};
