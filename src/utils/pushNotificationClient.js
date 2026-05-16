/**
 * Frontend Push Notification Service
 * Handles service worker registration and push notification setup
 */

import logger from '../utils/logger.js';

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return null;
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return null;
    }
  }

  return null;
}

/**
 * Get push notification subscription
 */
export async function getPushSubscription(registration) {
  if (!registration || !('pushManager' in registration)) {
    console.log('Push Manager not available');
    return null;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(registration, vapidPublicKey) {
  if (!registration || !('pushManager' in registration)) {
    console.log('Push Manager not available');
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('Subscribed to push notifications:', subscription);

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription }),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(registration) {
  if (!registration || !('pushManager' in registration)) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');

      // Notify server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });

      return true;
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
  }

  return false;
}

/**
 * Show local notification
 */
export function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
  }
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Initialize push notifications
 */
export async function initializePushNotifications(vapidPublicKey) {
  try {
    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('Service Worker registration failed');
      return null;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Get or create subscription
    let subscription = await getPushSubscription(registration);
    if (!subscription) {
      subscription = await subscribeToPushNotifications(registration, vapidPublicKey);
    }

    return { registration, subscription };
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return null;
  }
}

export default {
  registerServiceWorker,
  requestNotificationPermission,
  getPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showNotification,
  initializePushNotifications,
};
