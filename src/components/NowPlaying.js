import React from 'react';
import { coverGradient } from '../lib/cover';
import { formatTime } from '../lib/format';
import CoverImage from './CoverImage';
import Icon from './Icon';

function progressBg(pct) {
  return `linear-gradient(to right, #fff 0%, #fff ${pct}%, rgba(255,255,255,0.25) ${pct}%, rgba(255,255,255,0.25) 100%)`;
}

const styles = {
  wrap: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  backdrop: (seed) => ({ position: 'absolute', inset: 0, background: coverGradient(seed) }),
  backdropImg: { position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(60px) saturate(1.4)', transform: 'scale(1.2)', opacity: 0.55 },
  scrim: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.92) 100%)' },
  close: { position: 'absolute', top: '1.25rem', right: '1.5rem', width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '1.1rem', backdropFilter: 'blur(8px)', zIndex: 2 },
  content: { position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' },
  art: (seed) => ({ width: 'min(78vw, 360px)', aspectRatio: '1 / 1', borderRadius: '18px', background: coverGradient(seed), position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }),
  meta: { textAlign: 'center', width: '100%' },
  title: { fontSize: '1.7rem', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: '0.35rem' },
  artist: { fontSize: '1rem', color: 'rgba(255,255,255,0.7)' },
  chips: { display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.7rem' },
  chip: { fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.14)', borderRadius: '999px', padding: '0.18rem 0.6rem' },
  seekRow: { display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%' },
  time: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', width: '38px', textAlign: 'center', flexShrink: 0 },
  loading: { color: '#d9a6ff', fontSize: '0.78rem' },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.6rem', marginTop: '0.3rem' },
  ctrl: (active) => ({ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: active ? '#ff5a2c' : 'rgba(255,255,255,0.92)', padding: 0, lineHeight: 1 }),
  bigPlay: { width: '68px', height: '68px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'white', color: '#111', fontSize: '1.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' },
  actions: { display: 'flex', gap: '0.6rem', marginTop: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', borderRadius: '999px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', outline: 'none' },
};

export default function NowPlaying({ player, favorite, onToggleFavorite, onViewLyrics, onDownload, onClose }) {
  const { current, isPlaying, currentTime, duration, shuffle, repeat, loading } = player;
  if (!current) return null;
  const seed = `${current.title}-${current.genre}-${current.id}`;

  return (
    <div style={styles.wrap} className="lw-fade-in">
      <div style={styles.backdrop(seed)} />
      {current.cover_url && <img src={current.cover_url} alt="" style={styles.backdropImg} onError={(e) => { e.target.style.display = 'none'; }} />}
      <div style={styles.scrim} />

      <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>

      <div style={styles.content}>
        <div style={styles.art(seed)}><CoverImage song={current} glyphSize="5rem" /></div>

        <div style={styles.meta}>
          <div style={styles.title}>{current.title || 'Untitled'}</div>
          <div style={styles.artist}>{current.artist || (current.genre || '').split(',')[0] || 'Unknown artist'}</div>
          <div style={styles.chips}>
            {(current.genre || '').split(',').slice(0, 2).map((g) => g.trim() && <span key={g} style={styles.chip}>{g.trim()}</span>)}
            {current.album && <span style={styles.chip}>💿 {current.album}</span>}
          </div>
        </div>

        <div style={styles.seekRow}>
          <span style={styles.time}>{formatTime(currentTime)}</span>
          <input
            className="lw-range" style={{ flex: 1, background: progressBg(duration ? Math.min(100, (currentTime / duration) * 100) : 0) }}
            type="range" min={0} max={duration || 0}
            value={Math.min(currentTime, duration || 0)} onChange={(e) => player.seek(Number(e.target.value))}
          />
          <span style={styles.time}>{formatTime(duration)}</span>
        </div>
        {loading && <div style={styles.loading}>Loading...</div>}

        <div style={styles.controls}>
          <button className={`lw-ctrl${shuffle ? ' active' : ''}`} onClick={player.toggleShuffle} title="Shuffle"><Icon name="shuffle" size={24} /></button>
          <button className="lw-ctrl" onClick={player.prev} title="Previous"><Icon name="prev" size={34} color="#fff" /></button>
          <button className="lw-playbtn" style={{ width: 72, height: 72 }} onClick={player.togglePlay} title="Play/Pause">
            {loading ? <span style={{ fontSize: '1.4rem' }}>⏳</span> : <Icon name={isPlaying ? 'pause' : 'play'} size={34} color="#111" />}
          </button>
          <button className="lw-ctrl" onClick={player.next} title="Next"><Icon name="next" size={34} color="#fff" /></button>
          <button className={`lw-ctrl${repeat !== 'off' ? ' active' : ''}`} onClick={player.cycleRepeat} title={`Repeat: ${repeat}`}><Icon name={repeat === 'one' ? 'repeatOne' : 'repeat'} size={24} /></button>
        </div>

        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={onToggleFavorite}>
            <Icon name={favorite ? 'heart' : 'heartOutline'} size={16} color={favorite ? '#ff3377' : '#fff'} style={{ marginRight: 6 }} />
            {favorite ? 'Liked' : 'Like'}
          </button>
          {onDownload && (
            <button style={styles.actionBtn} onClick={onDownload}>
              <Icon name="download" size={16} color="#fff" style={{ marginRight: 6 }} /> Download
            </button>
          )}
          {current.lyrics && (
            <button style={styles.actionBtn} onClick={() => onViewLyrics(current)}>
              <Icon name="lyrics" size={16} color="#fff" style={{ marginRight: 6 }} /> Lyrics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
