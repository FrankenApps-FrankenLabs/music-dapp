import React, { useState } from 'react';
import { THEME } from '../lib/theme';
import { coverGradient, coverGlyph } from '../lib/cover';

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' },
  modal: { width: '100%', maxWidth: '560px', maxHeight: '82vh', overflow: 'auto', background: '#120e18', border: '1px solid rgba(255,68,0,0.35)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' },
  head: { display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.1rem' },
  cover: (seed) => ({ width: '56px', height: '56px', borderRadius: '10px', background: coverGradient(seed), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }),
  title: { fontSize: '1.2rem', fontWeight: 800, color: 'white' },
  meta: { fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.2rem' },
  close: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#999', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 },
  pre: { whiteSpace: 'pre-wrap', color: '#e5e7eb', lineHeight: 1.85, margin: 0, fontSize: '0.95rem' },
  copy: (copied) => ({ marginTop: '1.25rem', width: '100%', background: copied ? 'rgba(0,200,100,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(0,200,100,0.4)' : 'rgba(255,68,0,0.3)'}`, color: copied ? THEME.green : '#ccc', borderRadius: '8px', padding: '0.7rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 700 }),
};

export default function LyricsModal({ song, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!song) return null;
  const seed = `${song.title}-${song.genre}-${song.id}`;

  const copy = () => {
    navigator.clipboard.writeText(song.lyrics || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} className="lw-fade-in" onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <div style={styles.cover(seed)}>{coverGlyph(song.genre)}</div>
          <div>
            <div style={styles.title}>{song.title || 'Untitled'}</div>
            <div style={styles.meta}>{song.genre}{song.language ? ` · ${song.language}` : ''}{song.artist ? ` · ${song.artist}` : ''}</div>
          </div>
          <button style={styles.close} onClick={onClose} aria-label="Close">×</button>
        </div>
        <pre style={styles.pre}>{song.lyrics || 'No lyrics saved for this track.'}</pre>
        {song.lyrics && <button style={styles.copy(copied)} onClick={copy}>{copied ? '✅ Copied!' : '📋 Copy lyrics'}</button>}
      </div>
    </div>
  );
}
