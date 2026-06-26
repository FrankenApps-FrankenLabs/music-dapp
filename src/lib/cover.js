// Deterministic procedural cover art so every song gets a distinct, stable look
// without storing images. Seed from title+genre -> gradient + a genre glyph.
import { COVER_PALETTES } from './theme';

const GENRE_GLYPH = {
  Rock: '🎸', Metal: '🤘', 'Big Band': '🎺', Jazz: '🎷', 'Hip Hop': '🎤',
  Rap: '🎤', Drill: '🥁', Trap: '🥁', Country: '🤠', Pop: '✨', Blues: '🎹',
  Electronic: '🎛️', 'R&B': '💜', Punk: '⚡', Folk: '🪕', Classical: '🎻',
  Reggae: '🌴', Afrobeats: '🥁', Gospel: '🕊️', Ambient: '🌫️', Soundtrack: '🎬',
  Indie: '🌙', Emo: '🖤', Grunge: '🎸', Latin: '💃', Dancehall: '🔥', Soul: '💫',
  'Throat Singing': '🏔️', 'Monastery Chanting': '🛕', 'Drum and Bass': '🔊',
  Dubstep: '🔊',
};

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function firstGenre(genre) {
  if (!genre) return '';
  return genre.split(',')[0].trim();
}

export function coverGlyph(genre) {
  return GENRE_GLYPH[firstGenre(genre)] || '🎵';
}

export function coverGradient(seed) {
  const h = hashString(seed || 'song');
  const [a, b] = COVER_PALETTES[h % COVER_PALETTES.length];
  const angle = 100 + (h % 9) * 20;
  return `linear-gradient(${angle}deg, ${a}, ${b})`;
}
