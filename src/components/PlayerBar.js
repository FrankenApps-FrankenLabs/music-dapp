import React from 'react';
import { THEME } from '../lib/theme';
import { coverGradient } from '../lib/cover';
import { formatTime } from '../lib/format';
import CoverImage from './CoverImage';
import Icon from './Icon';

const styles = {
  bar: {
    position: 'fixed', bottom: 0, left: `${THEME.sidebarWidth}px`, right: 0, height: `${THEME.playerHeight}px`,
    background: 'rgba(10,8,14,0.96)', backdropFilter: 'blur(18px)', borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem', zIndex: 200, boxSizing: 'border-box',
  },
  left: { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '260px', minWidth: '160px' },
  cover: (seed) => ({ width: '52px', height: '52px', borderRadius: '8px', background: coverGradient(seed), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }),
  title: { fontSize: '0.88rem', fontWeight: 700, color: 'white' },
  artist: { fontSize: '0.74rem', color: '#9a9a9a' },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', maxWidth: '640px', margin: '0 auto' },
  controls: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  seekRow: { display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%' },
  time: { fontSize: '0.7rem', color: '#9a9a9a', width: '36px', textAlign: 'center', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  right: { width: '230px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' },
  vol: { display: 'flex', alignItems: 'center', gap: '0.15rem' },
};

function progressBg(pct) {
  return `linear-gradient(to right, #fff 0%, #fff ${pct}%, rgba(255,255,255,0.22) ${pct}%, rgba(255,255,255,0.22) 100%)`;
}

export default function PlayerBar({ player, onViewLyrics, onExpand, onQueue, mobile }) {
  const { current, isPlaying, currentTime, duration, shuffle, repeat, loading } = player;
  if (!current) return null;
  const seed = `${current.title}-${current.genre}-${current.id}`;
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const playGlyph = loading ? null : isPlaying ? 'pause' : 'play';

  const Cover = (
    <div style={styles.cover(seed)}><CoverImage song={current} glyphSize="1.2rem" /></div>
  );

  if (mobile) {
    return (
      <div style={{ ...styles.bar, left: 0, gap: '0.6rem', padding: '0 0.8rem' }}>
        <div style={{ ...styles.left, width: 'auto', flex: 1, cursor: 'pointer' }} onClick={onExpand}>
          {Cover}
          <div style={{ overflow: 'hidden' }}>
            <div style={styles.title} className="lw-clamp-1">{current.title || 'Untitled'}</div>
            <div style={styles.artist} className="lw-clamp-1">{loading ? 'Loading...' : (current.artist || (current.genre || '').split(',')[0])}</div>
          </div>
        </div>
        <button className="lw-playbtn" style={{ width: 40, height: 40 }} onClick={player.togglePlay}>
          {loading ? <span style={{ fontSize: 14 }}>⏳</span> : <Icon name={playGlyph} size={22} color="#111" />}
        </button>
        <button className="lw-ctrl" onClick={player.next}><Icon name="next" size={24} color="#fff" /></button>
      </div>
    );
  }

  return (
    <div style={styles.bar}>
      <div style={{ ...styles.left, cursor: 'pointer' }} onClick={onExpand} title="Open now playing">
        {Cover}
        <div style={{ overflow: 'hidden' }}>
          <div style={styles.title} className="lw-clamp-1">{current.title || 'Untitled'}</div>
          <div style={styles.artist} className="lw-clamp-1">{(current.artist || (current.genre || '').split(',')[0])}{current.album ? ` · 💿 ${current.album}` : ''}</div>
        </div>
      </div>

      <div style={styles.center}>
        <div style={styles.controls}>
          <button className={`lw-ctrl${shuffle ? ' active' : ''}`} onClick={player.toggleShuffle} title="Shuffle"><Icon name="shuffle" size={18} /></button>
          <button className="lw-ctrl" onClick={player.prev} title="Previous"><Icon name="prev" size={22} /></button>
          <button className="lw-playbtn" style={{ width: 40, height: 40 }} onClick={player.togglePlay} title="Play/Pause">
            {loading ? <span style={{ fontSize: 14 }}>⏳</span> : <Icon name={playGlyph} size={22} color="#111" />}
          </button>
          <button className="lw-ctrl" onClick={player.next} title="Next"><Icon name="next" size={22} /></button>
          <button className={`lw-ctrl${repeat !== 'off' ? ' active' : ''}`} onClick={player.cycleRepeat} title={`Repeat: ${repeat}`}><Icon name={repeat === 'one' ? 'repeatOne' : 'repeat'} size={18} /></button>
        </div>
        <div style={styles.seekRow}>
          <span style={styles.time}>{formatTime(currentTime)}</span>
          <input
            className="lw-range" style={{ flex: 1, background: progressBg(pct) }} type="range" min={0} max={duration || 0}
            value={Math.min(currentTime, duration || 0)} onChange={(e) => player.seek(Number(e.target.value))}
          />
          <span style={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      <div style={styles.right}>
        {current.lyrics && <button className="lw-iconbtn" onClick={() => onViewLyrics(current)} title="Lyrics"><Icon name="lyrics" size={18} /></button>}
        <button className="lw-iconbtn" onClick={onQueue} title="Up next"><Icon name="queue" size={18} /></button>
        <div style={styles.vol}>
          <button className="lw-iconbtn" onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)} title="Mute"><Icon name={player.volume === 0 ? 'volumeMute' : 'volume'} size={18} /></button>
          <input className="lw-range" style={{ width: 68, background: progressBg(player.volume * 100) }} type="range" min={0} max={1} step={0.01} value={player.volume} onChange={(e) => player.setVolume(Number(e.target.value))} />
        </div>
        <button className="lw-iconbtn" onClick={onExpand} title="Expand"><Icon name="expand" size={20} /></button>
      </div>
    </div>
  );
}
