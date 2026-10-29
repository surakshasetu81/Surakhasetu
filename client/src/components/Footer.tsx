import { Link } from 'react-router-dom';
import { Heart, Phone } from 'lucide-react';

const footerLinks = {
  platform: [
    { label: 'Report an Incident', to: '/report' },
    { label: 'Track a Case', to: '/track' },
    { label: 'Counselling Support', to: '/counselling-support' },
    { label: 'Proof Vault', to: '/proof-vault' },
    { label: 'Legal Framework', to: '/legal' },
    { label: 'Respondent Portal', to: '/respondent' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Use', to: '/terms' },
    { label: 'Disclaimer', to: '/disclaimer' },
    { label: 'Accessibility', to: '/accessibility' },
  ],
  emergency: [
    { label: 'Women Helpline: 181', href: 'tel:181' },
    { label: 'Childline: 1098', href: 'tel:1098' },
    { label: 'Police: 112', href: 'tel:112' },
    { label: 'NCW Helpline: 7827170170', href: 'tel:7827170170' },
  ],
};

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-block', marginBottom: 16 }} aria-label="Suraksha Setu Home">
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: 200,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <img
                  src="/images/suraksha-setu-logo.png"
                  alt="Suraksha Setu — सुरक्षित कार्यस्थल, सशक्त समाज"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                    maxHeight: 180,
                  }}
                  width={180}
                  height={180}
                />
              </div>
            </Link>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              A secure, confidential bridge between people seeking support and the resources that can help them.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {footerLinks.platform.map(link => (
                <li key={link.to}>
                  <Link to={link.to} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {footerLinks.legal.map(link => (
                <li key={link.to}>
                  <Link to={link.to} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-emergency)' }}>
              Emergency Contacts
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {footerLinks.emergency.map(link => (
                <li key={link.href}>
                  <a href={link.href} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-emergency)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
                    <Phone size={13} /> {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            © {new Date().getFullYear()} SurakshaSetu. A public safety platform. Not a substitute for legal advice.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <Heart size={13} color="var(--color-primary)" />
            Built with care for every survivor's dignity.
          </div>
        </div>
      </div>
    </footer>
  );
}
