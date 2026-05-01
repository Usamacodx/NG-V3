import { Link } from 'react-router-dom';
import ngLogo from '../assets/ng-logo.png';

export default function Footer() {
  return (
    <>
      {/* Wave
      <div style={{ background: '#f9fafb', lineHeight: 0, marginBottom: '-2px' }}>
        <svg viewBox="0 0 1440 130" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '130px' }}>
          <path d="M0,80 C200,20 400,110 600,60 C800,10 1000,90 1200,50 C1320,30 1400,70 1440,60 L1440,130 L0,130 Z"
            fill="#162032" opacity="0.4" />
          <path d="M0,90 C180,40 360,110 540,70 C720,30 900,100 1080,60 C1260,20 1380,80 1440,65 L1440,130 L0,130 Z"
            fill="#1a2a42" opacity="0.6" />
          <path d="M0,100 C200,50 400,120 600,80 C800,40 1000,110 1200,70 C1320,50 1400,90 1440,80 L1440,130 L0,130 Z"
            fill="#0f172a" />
        </svg>
      </div> */}

      <footer style={{
        background: '#0f172a',
        fontFamily: "'DM Sans', sans-serif",
        padding: '2.5rem 4rem 0',
        width: '100%',
        boxSizing: 'border-box',
        marginTop: '80px'
      }}>

        {/* Gold accent line */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
          marginBottom: '2.5rem',
        }} />

        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1.3fr',
          gap: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid #1e293b',
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              {/* Logo with golden background */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#c9a84c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                padding: '4px',
              }}>
                <img
                  src={ngLogo}
                  alt="NextGen Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    filter: 'invert(1)', // makes black logo white on gold bg
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8d5a0' }}>NextGen</div>
                <div style={{ fontSize: '.72rem', color: '#475569', letterSpacing: '.15em', textTransform: 'uppercase' }}>
                  Apparel Studio
                </div>
              </div>
            </div>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#94a3b8', margin: 0 }}>
              Custom apparel designed your way.<br />
              Quality you can trust — made right<br />
              here in Karachi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 style={{
              fontSize: '.88rem', letterSpacing: '.18em', textTransform: 'uppercase',
              color: '#c9a84c', margin: '0 0 1.2rem 0', fontWeight: 600,
            }}>Quick Links</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { label: 'About Us', to: '/about' },
                { label: 'How It Works', to: '/how-it-works' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'FAQs', to: '/faqs' },
                { label: 'Admin Panel', to: '/admin' },
              ].map(({ label, to }) => (
                <li key={label} style={{ marginBottom: '.65rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ color: '#c9a84c', fontSize: '.65rem' }}>▸</span>
                  <Link to={to} style={{ color: '#94a3b8', fontSize: '1.1rem', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = '#e8d5a0'}
                    onMouseLeave={e => e.target.style.color = '#94a3b8'}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 style={{
              fontSize: '.88rem', letterSpacing: '.18em', textTransform: 'uppercase',
              color: '#c9a84c', margin: '0 0 1.2rem 0', fontWeight: 600,
            }}>Support</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { label: 'Contact Us', to: '/contact' },
                { label: 'Shipping', to: '/shipping' },
                { label: 'Returns', to: '/returns' },
                { label: 'Privacy Policy', to: '/privacy' },
              ].map(({ label, to }) => (
                <li key={label} style={{ marginBottom: '.65rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ color: '#c9a84c', fontSize: '.65rem' }}>▸</span>
                  <Link to={to} style={{ color: '#94a3b8', fontSize: '1.1rem', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = '#e8d5a0'}
                    onMouseLeave={e => e.target.style.color = '#94a3b8'}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 style={{
              fontSize: '.88rem', letterSpacing: '.18em', textTransform: 'uppercase',
              color: '#c9a84c', margin: '0 0 1.2rem 0', fontWeight: 600,
            }}>Contact</h5>
            {[
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>,
                text: 'admin@nextgen.com',
                href: 'mailto:admin@nextgen.com',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1.02h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>,
                text: '+92 3497994442',
                href: 'tel:+923497994442',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>,
                text: 'Karachi, Pakistan',
                href: null,
              },
            ].map(({ icon, text, href }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.85rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1px solid #1e293b', background: '#162032',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{icon}</div>
                {href
                  ? <a href={href} style={{ color: '#94a3b8', fontSize: '1.1rem', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.color = '#c9a84c'}
                      onMouseLeave={e => e.target.style.color = '#94a3b8'}
                    >{text}</a>
                  : <span style={{ color: '#94a3b8', fontSize: '1.1rem' }}>{text}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.2rem 0', flexWrap: 'wrap', gap: '.5rem',
        }}>
          <p style={{ fontSize: '1rem', color: '#475569', margin: 0 }}>
            © 2026 NextGen Custom Apparel. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            {[
              { label: 'f', href: 'https://facebook.com' },
              { label: 'ig', href: 'https://instagram.com' },
              { label: 'tw', href: 'https://twitter.com' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                width: 34, height: 34, borderRadius: '50%',
                border: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', fontSize: '.8rem', textDecoration: 'none',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#c9a84c';
                  e.currentTarget.style.color = '#c9a84c';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1e293b';
                  e.currentTarget.style.color = '#475569';
                }}
              >{label}</a>
            ))}
          </div>
        </div>

      </footer>
    </>
  );
}