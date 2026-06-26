import React, { useState } from 'react';
import { coverGradient } from '../lib/cover';
import { formatDate } from '../lib/format';
import CoverImage from './CoverImage';
import Icon from './Icon';

const styles = {
  card: (current) => ({
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${current ? 'rgba(255,68,0,0.6)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: '14px', padding: '0.85rem', position: 'relative',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
  }),
  cover: (seed) => ({
    width: '100%', aspectRatio: '1 / 1', borderRadius: '10px', background: coverGradient(seed),
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    overflow: 'hidden', marginBottom: '0.75rem',
  }),
  playOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
  },
  playCircle: { width: '46px', height: '46px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.45)' },
  fav: (active) => ({
    position: 'absolute', top: '0.5rem', right: '0.5rem', width: '32px', height: '32px',
    borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
    background: 'rgba(0,0,0,0.45)', color: active ? '#ff3377' : 'white', backdropFilter: 'blur(4px)',
  }),
  title: { fontSize: '0.95rem', fontWeight: 700, color: 'white', marginBottom: '0.3rem' },
  chips: { display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' },
  chip: { fontSize: '0.65rem', color: '#bbb', background: 'rgba(255,68,0,0.12)', border: '1px solid rgba(255,68,0,0.2)', borderRadius: '999px', padding: '0.12rem 0.5rem' },
  meta: { fontSize: '0.68rem', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  menuBtn: { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem', lineHeight: 1 },
  menu: { position: 'absolute', right: '0.6rem', bottom: '2.1rem', background: '#16121c', border: '1px solid rgba(255,68,0,0.3)', borderRadius: '10px', padding: '0.35rem', zIndex: 30, minWidth: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' },
  menuItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '0.82rem', padding: '0.5rem 0.6rem', borderRadius: '7px' },
  backdrop: { position: 'fixed', inset: 0, zIndex: 20 },
};

export default function SongCard({
  song, isCurrent, isPlaying, isLoading, favorite, playCount,
  onPlay, onToggleFavorite, onViewLyrics, onShare, onDownload, onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const seed = `${song.title}-${song.genre}-${song.id}`;
  const showPause = isCurrent && isPlaying;

  const runAction = (fn) => () => { setMenuOpen(false); fn(); };

  return (
    <div style={styles.card(isCurrent)} className="lw-fade-in">
      <div style={styles.cover(seed)} className="lw-card-cover">
        <CoverImage song={song} />
        <button style={styles.playOverlay} onClick={onPlay} aria-label="Play">
          <span className={`lw-play-circle${isCurrent ? ' show' : ''}`} style={styles.playCircle}>
            {isLoading ? <span style={{ fontSize: '1.1rem' }}>...</span> : <Icon name={showPause ? 'pause' : 'play'} size={24} color="#111" />}
          </span>
        </button>
        <button style={styles.fav(favorite)} onClick={onToggleFavorite} aria-label="Favorite">
          <Icon name={favorite ? 'heart' : 'heartOutline'} size={16} color={favorite ? '#ff3377' : '#fff'} />
        </button>
      </div>

      <div style={styles.title} className="lw-clamp-1" title={song.title}>{song.title || 'Untitled'}</div>

      <div style={styles.chips}>
        {(song.genre || '').split(',').slice(0, 1).map((g) => (
          <span key={g} style={styles.chip}>{g.trim()}</span>
        ))}
        {song.artist && <span style={styles.chip}>{song.artist}</span>}
      </div>

      <div style={styles.meta}>
        <span>{formatDate(song.created_at)}{playCount ? ` - ${playCount} plays` : ''}</span>
        <button style={styles.menuBtn} onClick={() => setMenuOpen((o) => !o)} aria-label="More actions">...</button>
      </div>

      {menuOpen && (
        <>
          <div style={styles.backdrop} onClick={() => setMenuOpen(false)} />
          <div style={styles.menu}>
            {song.lyrics && <button style={styles.menuItem} onClick={runAction(() => onViewLyrics(song))}>View lyrics</button>}
            <button style={styles.menuItem} onClick={runAction(() => onDownload(song))}>Download MP3</button>
            <button style={styles.menuItem} onClick={runAction(() => onShare(song))}>Copy share link</button>
            <button style={{ ...styles.menuItem, color: '#ff6666' }} onClick={runAction(() => onDelete(song))}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
}
