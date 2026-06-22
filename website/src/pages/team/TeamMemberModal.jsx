import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// ── Copy Popup ──
function CopyPopup({ value, onClose }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);
  const copiedTimeoutRef = useRef(null);

  const handleCopy = () => {
    // eslint-disable-next-line no-control-regex
    const sanitized = String(value || '').replace(/[\x00-\x08\x0B\x0C\x0D\x0E-\x1F\x7F-\x9F]/g, '');
    navigator.clipboard
      .writeText(sanitized)
      .then(() => {
        setCopied(true);
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => {
          setCopied(false);
          copiedTimeoutRef.current = null;
        }, 2000);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.copy-popup')) onClose();
    };
    timeoutRef.current = setTimeout(() => {
      document.addEventListener('click', handler);
    }, 0);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      document.removeEventListener('click', handler);
    };
  }, [onClose]);

  return (
    <div className="copy-popup">
      <span className="copy-popup-value">{value}</span>
      <button className="copy-popup-btn" onClick={handleCopy}>
        {copied ? '✅ Copied!' : '📋 Copy'}
      </button>
    </div>
  );
}

// ── URL safety helper: only allow https:// from allowed domains ──
function isSafeSocialUrl(url, allowedDomains) {
  if (!url || typeof url !== 'string') return '#';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return '#';
    return allowedDomains.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    )
      ? url
      : '#';
  } catch {
    return '#';
  }
}

// ── Normalize WhatsApp: handle plain numbers OR full URLs ──
function getWhatsappDisplay(raw) {
  if (!raw) return null;
  if (raw.startsWith('https://wa.me/')) return raw;
  if (raw.startsWith('http')) return '#';
  return raw;
}

// ── Modal Content ──
function ModalContent({ member, onClose }) {
  const [activePopup, setActivePopup] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const hasSocial = member.linkedin || member.whatsapp || member.instagram || member.email;
  const whatsappValue = getWhatsappDisplay(member.whatsapp);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Photo */}
        <img
          src={
            !member.photo || imgError
              ? 'https://api.dicebear.com/7.x/initials/svg?seed=' +
                encodeURIComponent(member.name) +
                '&backgroundColor=7b6fff&textColor=ffffff'
              : member.photo
          }
          alt={member.name}
          className="modal-photo"
          loading="lazy"
          width="120"
          height="120"
          onError={() => setImgError(true)}
        />

        {/* Name & Role */}
        <div className="modal-name">{member.name}</div>
        <div className="modal-role">{member.role}</div>

        {/* Info */}
        <div className="modal-info">
          <div className="modal-info-row">
            <span className="modal-info-label">🎓 Year</span>
            <span className="modal-info-value">{member.year}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">🔬 Branch</span>
            <span className="modal-info-value">{member.branch}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">📋 Section</span>
            <span className="modal-info-value">{member.section}</span>
          </div>
        </div>

        {/* Social */}
        {hasSocial && (
          <div className="modal-social">
            {member.linkedin && (
              <a
                href={isSafeSocialUrl(member.linkedin, ['linkedin.com'])}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-social-btn btn-linkedin"
              >
                🔗 LinkedIn
              </a>
            )}

            {member.whatsapp && (
              <div style={{ position: 'relative' }}>
                {whatsappValue && whatsappValue.startsWith('https://wa.me/') ? (
                  <a
                    href={whatsappValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-social-btn btn-whatsapp"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    💬 WhatsApp
                  </a>
                ) : whatsappValue ? (
                  <>
                    <button
                      className="modal-social-btn btn-whatsapp"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopup(activePopup === 'whatsapp' ? null : 'whatsapp');
                      }}
                    >
                      💬 WhatsApp
                    </button>
                    {activePopup === 'whatsapp' && (
                      <CopyPopup value={whatsappValue} onClose={() => setActivePopup(null)} />
                    )}
                  </>
                ) : null}
              </div>
            )}

            {member.instagram && (
              <a
                href={isSafeSocialUrl(member.instagram, ['instagram.com'])}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-social-btn btn-instagram"
              >
                📸 Instagram
              </a>
            )}

            {member.email && (
              <div style={{ position: 'relative' }}>
                <button
                  className="modal-social-btn btn-contact"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopup(activePopup === 'email' ? null : 'email');
                  }}
                >
                  ✉️ Email
                </button>
                {activePopup === 'email' && (
                  <CopyPopup value={member.email} onClose={() => setActivePopup(null)} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export: renders via Portal so it's never clipped by any parent ──
export default function TeamMemberModal({ member, onClose }) {
  if (!member) return null;
  return createPortal(<ModalContent member={member} onClose={onClose} />, document.body);
}
