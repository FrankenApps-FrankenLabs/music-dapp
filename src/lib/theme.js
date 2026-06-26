// Shared visual tokens so every component matches the existing neon-dark look
// (orange/pink/purple gradients on near-black) without duplicating literals.

export const THEME = {
  appBg: `
    radial-gradient(ellipse at 20% 50%, #3a0a0a 0%, transparent 60%),
    radial-gradient(ellipse at 80% 30%, #0a0a3a 0%, transparent 60%),
    radial-gradient(ellipse at 50% 80%, #1a0a2a 0%, transparent 50%),
    #0a0a0a
  `,
  panel: 'rgba(255,255,255,0.04)',
  panelBorder: 'rgba(255,68,0,0.2)',
  ink: '#ffffff',
  inkDim: '#aaaaaa',
  inkFaint: '#666666',
  accent: '#ff4400',
  accentGrad: 'linear-gradient(135deg,#ff4400,#ff0088,#aa00ff)',
  accentGrad2: 'linear-gradient(135deg,#ff4400,#aa00ff)',
  blueGrad: 'linear-gradient(135deg,#0066ff,#aa00ff)',
  green: '#00cc66',
  greenGrad: 'linear-gradient(135deg,#00cc66,#00aa44)',
  franken: '#33ff66',
  radius: '12px',
  sidebarWidth: 180,
  playerHeight: 84,
};

// Deterministic gradient palettes for procedural cover art (see lib/cover.js).
export const COVER_PALETTES = [
  ['#ff4400', '#aa00ff'],
  ['#0066ff', '#aa00ff'],
  ['#00cc66', '#0066ff'],
  ['#ff0088', '#ff4400'],
  ['#aa00ff', '#ff0088'],
  ['#ffaa00', '#ff0088'],
  ['#00ccaa', '#aa00ff'],
  ['#ff4400', '#ffaa00'],
];
