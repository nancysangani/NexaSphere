import { useTranslation } from 'react-i18next';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON, GL_BAJAJ_LOGO } from './brandAssets';
import { Mail, Heart } from 'lucide-react';

const NEXASPHERE_EMAIL = 'nexasphere@glbajajgroup.org';

export default function Footer({ onAdmin }) {
  const { t } = useTranslation();
  return (
    <footer className="ns-footer">
      <div className="container">
        <div className="ns-footer-inner">
          <div className="ns-footer-logos">
            <img
              src={BRAND_LOGO_ICON}
              alt="NexaSphere"
              className="ns-footer-logo-ns ns-footer-logo-mobile"
            />
            <img
              src={BRAND_LOGO_FULL}
              alt="NexaSphere"
              className="ns-nav-logo-ns ns-nav-logo-icon"
            />
            <div style={{ width: 1, height: 24, background: 'var(--bdr2)' }} />
            <img src={GL_BAJAJ_LOGO} alt="GL Bajaj" className="ns-footer-logo-gl" />
          </div>
          <p className="ns-footer-text">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="ns-footer-text">
            <Mail size={14} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
            <a href={`mailto:${NEXASPHERE_EMAIL}`} className="ns-footer-email-link">
              {NEXASPHERE_EMAIL}
            </a>
          </p>
          <p className="ns-footer-text ns-footer-built">
            {t('footer.built_with')}{' '}
            <Heart
              size={12}
              fill="currentColor"
              style={{ display: 'inline', verticalAlign: '-1px' }}
            />{' '}
            {t('footer.by_team')}{' '}
            <span
              role="button"
              tabIndex={0}
              onClick={onAdmin}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAdmin();
                }
              }}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              aria-label="Open Admin Dashboard"
            >
              {t('footer.admin_dashboard')}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
