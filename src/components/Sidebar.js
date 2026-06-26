import React from 'react';
import frankenLogo from '../frankenlabs_logo.png';
import { THEME } from '../lib/theme';
import { shortAddress } from '../lib/format';

const NAV = [
  { id: 'home', label: 'Create', icon: '🎤' },
  { id: 'library', label: 'My Library', icon: '📚' },
];

const styles = {
  sidebar: {
    position: 'fixed', left: 0, top: 0, height: '100vh', width: `${THEME.sidebarWidth}px`,
    background: 'rgba(0,0,0,0.7)', borderRight: '1px solid rgba(51,255,102,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '1rem', padding: '1.5rem 1rem', zIndex: 100, boxSizing: 'border-box',
  },
  logo: { width: '120px', borderRadius: '12px', border: '2px solid rgba(51,255,102,0.4)' },
  brand: {
    fontFamily: 'Georgia, serif', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px',
    color: THEME.franken, textAlign: 'center', textTransform: 'uppercase',
  },
  presents: {
    color: '#555', fontSize: '0.6rem', letterSpacing: '3px',
    textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.5rem',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' },
  navBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
    padding: '0.7rem 0.9rem', borderRadius: '10px', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'left',
    background: active ? THEME.accentGrad2 : 'transparent',
    border: active ? '1px solid transparent' : '1px solid rgba(255,68,0,0.2)',
    color: active ? 'white' : '#999', transition: 'all 0.15s ease',
  }),
  spacer: { flex: 1 },
  wallet: (connected) => ({
    width: '100%', padding: '0.6rem 0.7rem', borderRadius: '10px', cursor: 'pointer',
    fontSize: '0.75rem', fontWeight: 700, textAlign: 'center',
    background: connected ? 'rgba(0,200,100,0.12)' : THEME.accentGrad2,
    border: connected ? '1px solid rgba(0,200,100,0.4)' : 'none',
    color: connected ? THEME.green : 'white', wordBreak: 'break-all',
  }),
};

const mobileStyles = {
  bar: {
    position: 'fixed', top: 0, left: 0, right: 0, height: '58px', zIndex: 100,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(51,255,102,0.2)',
    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0 0.8rem', boxSizing: 'border-box',
  },
  logo: { width: '38px', height: '38px', borderRadius: '8px', border: '1px solid rgba(51,255,102,0.4)', flexShrink: 0 },
  nav: { display: 'flex', gap: '0.4rem', flex: 1 },
  navBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.7rem', borderRadius: '999px',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
    background: active ? THEME.accentGrad2 : 'transparent', border: active ? '1px solid transparent' : '1px solid rgba(255,68,0,0.25)',
    color: active ? 'white' : '#aaa',
  }),
  wallet: (connected) => ({
    padding: '0.45rem 0.7rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
    background: connected ? 'rgba(0,200,100,0.12)' : THEME.accentGrad2,
    border: connected ? '1px solid rgba(0,200,100,0.4)' : 'none', color: connected ? THEME.green : 'white',
  }),
};

export default function Sidebar({ view, onNavigate, walletAddress, onWalletClick, mobile }) {
  if (mobile) {
    return (
      <div style={mobileStyles.bar}>
        <img src={frankenLogo} alt="FrankenLabs" style={mobileStyles.logo} />
        <nav style={mobileStyles.nav}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={mobileStyles.navBtn(view === item.id)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <button onClick={onWalletClick} style={mobileStyles.wallet(!!walletAddress)}>
          {walletAddress ? `👤 ${shortAddress(walletAddress)}` : '🔌 Connect'}
        </button>
      </div>
    );
  }
  return (
    <div style={styles.sidebar}>
      <img src={frankenLogo} alt="FrankenLabs" style={styles.logo} />
      <div style={styles.brand}>FRANKENLABS</div>
      <div style={styles.presents}>Presents</div>

      <nav style={styles.nav}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={styles.navBtn(view === item.id)}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={styles.spacer} />

      <button onClick={onWalletClick} style={styles.wallet(!!walletAddress)}>
        {walletAddress ? `👤 ${shortAddress(walletAddress)}` : '🔌 Connect Wallet'}
      </button>
    </div>
  );
}
