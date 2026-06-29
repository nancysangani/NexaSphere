/**
 * UpdatePrompt.jsx
 * ─────────────────
 * Toast shown when a new service worker is waiting to activate.
 * Receives the `updateSW` function via the 'nexasphere:sw-update' event
 * dispatched by registerSW.js.
 *
 * Mount this once in App.jsx (AppShell level):
 *   <UpdatePrompt />
 */

import { useState, useEffect, useCallback } from 'react';
import '../../styles/pwa.css';

export default function UpdatePrompt() {
  const [updateSW, setUpdateSW] = useState(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for new SW version waiting
    const onUpdate = (e) => {
      setUpdateSW(() => e.detail.updateSW);
      setDismissed(false);
    };

    // Listen for offline-ready confirmation
    const onOffline = () => setOfflineReady(true);

    window.addEventListener('nexasphere:sw-update', onUpdate);
    window.addEventListener('nexasphere:sw-offline-ready', onOffline);

    return () => {
      window.removeEventListener('nexasphere:sw-update', onUpdate);
      window.removeEventListener('nexasphere:sw-offline-ready', onOffline);
    };
  }, []);

  // Auto-dismiss offline toast after 4 seconds
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(t);
  }, [offlineReady]);

  const handleUpdate = useCallback(async () => {
    if (!updateSW) return;
    await updateSW(true); // true = reload page after SW activation
  }, [updateSW]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setUpdateSW(null);
  }, []);

  const showUpdateToast = updateSW && !dismissed;

  if (!showUpdateToast && !offlineReady) return null;

  return (
    <>
      {/* ── Update available toast ─────────────────────────────────────── */}
      {showUpdateToast && (
        <div
          role="alert"
          aria-live="assertive"
          aria-label="App update available"
          className="pwa-update-toast pwa-update--visible"
        >
          <span className="pwa-update__icon" aria-hidden="true">
            🔄
          </span>
          <span className="pwa-update__text">A new version of NexaSphere is available.</span>
          <button
            id="pwa-update-btn"
            className="pwa-btn-update"
            onClick={handleUpdate}
            aria-label="Reload to update"
          >
            Update now
          </button>
          <button
            id="pwa-update-dismiss-btn"
            className="pwa-btn-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss update notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Offline-ready toast ────────────────────────────────────────── */}
      {offlineReady && (
        <div
          role="status"
          aria-live="polite"
          className="pwa-update-toast pwa-offline-ready--visible"
        >
          <span className="pwa-update__icon" aria-hidden="true">
            ✅
          </span>
          <span className="pwa-update__text">NexaSphere is ready to work offline.</span>
        </div>
      )}
    </>
  );
}
