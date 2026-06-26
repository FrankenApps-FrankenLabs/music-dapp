// Generate album cover art on a canvas for songs that have no uploaded artwork.
// Cached by seed.
import { COVER_PALETTES } from './theme';
import { coverGlyph } from './cover';

const cache = new Map();

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 3);
  const startY = y - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

export function generateCoverDataUrl(seed, title, genre) {
  if (cache.has(seed)) return cache.get(seed);
  if (typeof document === 'undefined') return null;
  const size = 400;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const h = hashString(seed || 'song');
  const [a, b] = COVER_PALETTES[h % COVER_PALETTES.length];

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, a); grad.addColorStop(1, b);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.14; ctx.fillStyle = '#000';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc((h * (i + 1)) % size, (h * (i + 3)) % size, 70 + (h % 70), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.22; ctx.font = '150px sans-serif';
  ctx.fillText(coverGlyph(genre), size / 2, size * 0.34);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fff'; ctx.font = 'bold 42px sans-serif';
  wrapText(ctx, (title || 'Untitled').toUpperCase(), size / 2, size * 0.62, size - 60, 48);

  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '20px sans-serif';
  ctx.fillText(((genre || '').split(',')[0] || '').toUpperCase(), size / 2, size * 0.88);

  const url = canvas.toDataURL('image/jpeg', 0.85);
  cache.set(seed, url);
  return url;
}
