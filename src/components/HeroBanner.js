import React from 'react';
import { coverGradient } from '../lib/cover';
import CoverImage from './CoverImage';
import Icon from './Icon';

const styles = {
  hero: { position: 'relative', maxWidth: '1100px', margin: '0 auto 1.9rem', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
  bg: { position: 'absolute', inset: '-20%', width: '140%', height: '140%', objectFit: 'cover', filter: 'blur(44px) saturate(1.3)', transform: 'scale(1.1)', opacity: 0.6 },
  scrim: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,6,12,0.45), rgba(8,6,12,0.85))' },
  content: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.6rem', padding: '1.8rem 2rem' },
  art: (seed) => ({ width: 'min(190px, 38vw)', aspectRatio: '1 / 1', borderRadius: '14px', overflow: 'hidden', position: 'relative', flexShrink: 0, background: coverGradient(seed), boxShadow: '0 16px 40px rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  text: { minWidth: 0, flex: 1 },
  badge: { display: 'inline-block', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.16)', color: '#fff', borderRadius: '999px', padding: '0.25rem 0.7rem', marginBottom: '0.7rem', backdropFilter: 'blur(6px)' },
  title: { fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 900, color: 'white', lineHeight: 1.05, marginBottom: '0.45rem', textShadow: '0 2px 18px rgba(0,0,0,0.5)' },
  meta: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.82)', marginBottom: '1.15rem' },
  play: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#111', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', outline: 'none' },
};

export default function HeroBanner({ song, isPlaying, onPlay }) {
  if (!song) return null;
  const seed = `${song.title}-${song.genre}-${song.id}`;
  const metaParts = [song.artist, (song.genre || '').split(',')[0], song.album && `💿 ${song.album}`].filter(Boolean);

  return (
    <div style={styles.hero}>
      {song.cover_url && <img src={song.cover_url} alt="" style={styles.bg} onError={(e) => { e.target.style.display = 'none'; }} />}
      <div style={styles.scrim} />
      <div style={styles.content}>
        <div style={styles.art(seed)}><CoverImage song={song} glyphSize="3.5rem" /></div>
        <div style={styles.text}>
          <span style={styles.badge}>Featured</span>
          <div style={styles.title} className="lw-clamp-2">{song.title || 'Untitled'}</div>
          <div style={styles.meta} className="lw-clamp-1">{metaParts.join('  ·  ')}</div>
          <button style={styles.play} onClick={onPlay}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={20} color="#111" />
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
}
