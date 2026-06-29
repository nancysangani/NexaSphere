import { useState, useEffect, useCallback } from 'react';
import { PLATFORMS, addUtmParams, getQRUrl, copyToClipboard } from '../../utils/shareUtils';
import './ShareHub.css';

export default function ShareHub({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const shareUrl = isOpen && data ? addUtmParams(data.url || window.location.href, 'direct') : '';
  const shareTitle = data?.title || 'Check this out on NexaSphere!';

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  if (!isOpen || !data) return null;

  function handlePlatform(platform) {
    const url = platform.buildUrl({
      url: addUtmParams(shareUrl, platform.key),
      title: shareTitle,
    });
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=480');
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title: shareTitle, url: shareUrl }).catch((err) => {
        // User cancelled (AbortError) — no feedback needed.
        // Any other failure (e.g. share target unavailable) falls back to
        // copying the URL to clipboard so the user can still share manually.
        if (err?.name !== 'AbortError' && navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).catch(() => {});
        }
      });
    }
  }

  return (
    <div
      className="sharehub-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share"
    >
      <div className="sharehub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sharehub-header">
          <h2 className="sharehub-heading">Share</h2>
          <button className="sharehub-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sharehub-preview">
          {data.image && (
            <img
              src={data.image}
              alt={`Preview image for ${data.title}`}
              className="sharehub-preview-img"
            />
          )}
          <div>
            <p className="sharehub-preview-title">{data.title}</p>
            {data.subtitle && <p className="sharehub-preview-sub">{data.subtitle}</p>}
          </div>
        </div>

        <div className="sharehub-platforms">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.key}
              className="sharehub-platform-btn"
              style={{ '--platform-color': platform.color }}
              onClick={() => handlePlatform(platform)}
              aria-label={`Share on ${platform.name}`}
            >
              {platform.name}
            </button>
          ))}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              className="sharehub-platform-btn sharehub-native"
              onClick={handleNativeShare}
              aria-label="Share via device"
            >
              More options
            </button>
          )}
        </div>

        <div className="sharehub-copy-row">
          <input
            className="sharehub-copy-input"
            value={shareUrl}
            readOnly
            aria-label="Shareable link"
          />
          <button className="sharehub-copy-btn" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          className="sharehub-qr-toggle"
          onClick={() => setShowQR((v) => !v)}
          aria-expanded={showQR}
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {showQR && (
          <div className="sharehub-qr">
            <img src={getQRUrl(shareUrl)} alt="QR code for this link" width={200} height={200} />
            <p className="sharehub-qr-hint">Scan to open on any device</p>
          </div>
        )}
      </div>
    </div>
  );
}
