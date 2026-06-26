import React from 'react';
import { THEME } from '../lib/theme';
import { coverGradient } from '../lib/cover';
import CoverImage from './CoverImage';

const styles = {
  panel: { position: 'fixed', right: '1rem', bottom: `${THEME.playerHeight + 12}px`, width: '340px', maxWidth: 'calc(100vw - 2rem)', maxHeight: 'min(60vh, 480px)', background: 'rgba(18,14,24,0.97)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,68,0,0.25)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 250, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  title: { fontSize: '0.95rem', fontWeight: 800, color: 'white' },
  close: { background: 'transparent', border: 'none', color: '#999', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 },
  list: { overflowY: 'auto', padding: '0.5rem' },
  row: (active) => ({ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer', background: active ? 'rgba(255,68,0,0.12)' : 'transparent' }),
  cover: (seed) => ({ width: '40px', height: '40px', borderRadius: '7px', background: coverGradient(seed), position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  rowTitle: (active) => ({ fontSize: '0.85rem', fontWeight: active ? 800 : 600, color: active ? '#ff7a52' : 'white' }),
  rowMeta: { fontSize: '0.7rem', color: '#888' },
  empty: { padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.85rem', lineHeight: 1.5 },
  sectionLbl: { fontSize: '0.65rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.5rem 0.5rem 0.3rem' },
};

function Row({ song, active, player }) {
  const seed = `${song.title}-${song.genre}-${song.id}`;
  return (
    <div style={styles.row(active)} onClick={() => player.playSong(song, player.queue)}>
      <div style={styles.cover(seed)}><CoverImage song={song} glyphSize="1rem" /></div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={styles.rowTitle(active)} className="lw-clamp-1">{song.title || 'Untitled'}</div>
        <div style={styles.rowMeta} className="lw-clamp-1">{song.artist || (song.genre || '').split(',')[0]}</div>
      </div>
      {active && <span style={{ color: '#ff7a52', fontSize: '0.9rem' }}>♪</span>}
    </div>
  );
}

export default function QueuePanel({ player, onClose }) {
  const { queue, current } = player;
  const curIdx = current ? queue.findIndex((s) => String(s.id) === String(current.id)) : -1;
  const upNext = curIdx >= 0 ? queue.slice(curIdx + 1) : queue;

  return (
    <div style={styles.panel} className="lw-fade-in">
      <div style={styles.head}>
        <div style={styles.title}>Up Next</div>
        <button style={styles.close} onClick={onClose} aria-label="Close">×</button>
      </div>
      <div style={styles.list}>
        {current && (
          <>
            <div style={styles.sectionLbl}>Now Playing</div>
            <Row song={current} active player={player} />
          </>
        )}
        {upNext.length > 0 ? (
          <>
            <div style={styles.sectionLbl}>Next Up · {upNext.length}</div>
            {upNext.map((s, i) => <Row key={`${s.id}-${i}`} song={s} player={player} />)}
          </>
        ) : (
          <div style={styles.empty}>Nothing queued. Play a song from your library to fill up the queue.</div>
        )}
      </div>
    </div>
  );
}
