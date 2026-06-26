import React from 'react';
import { THEME } from '../lib/theme';

const styles = {
  card: { maxWidth: '600px', margin: '0 auto 1.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,68,0,0.2)', borderRadius: '12px', padding: '1.25rem' },
  meta: { color: '#aaa', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' },
  pre: { whiteSpace: 'pre-wrap', color: '#e5e7eb', lineHeight: '1.8', margin: 0 },
  listen: { maxWidth: '600px', margin: '0 auto', background: 'rgba(255,68,0,0.05)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,68,0,0.3)' },
  heading: { color: '#aa00ff', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '2px', textTransform: 'uppercase' },
  greenBtn: { width: '100%', background: THEME.greenGrad, color: 'white', border: 'none', borderRadius: '8px', padding: '0.9rem', fontSize: '1rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' },
  outlineBtn: { background: 'transparent', border: '1px solid rgba(255,68,0,0.4)', color: '#aaa', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' },
  title: { textAlign: 'center', fontSize: '3rem', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', background: 'linear-gradient(135deg,#ff4400,#ff0088,#aa00ff,#ff4400)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' },
  sub: { textAlign: 'center', color: '#666', letterSpacing: '6px', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '2.5rem' },
};

export default function SharedView({ sharedSong, loading, onHome, player }) {
  return (
    <>
      <h1 style={styles.title}>🎵 LyricsAI</h1>
      <p style={styles.sub}>Powered by LightChain</p>

      {loading && <div style={{ textAlign: 'center', color: '#aa00ff', marginTop: '3rem' }}>⚡ Loading song...</div>}

      {sharedSong && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
            <div style={styles.meta}>
              {sharedSong.genre} · {sharedSong.language}
              {sharedSong.artist && ` · ${sharedSong.artist} style`}
            </div>
            <pre style={styles.pre}>{sharedSong.lyrics}</pre>
          </div>
          {sharedSong.audio_url && (
            <div style={styles.listen}>
              <div style={styles.heading}>🎸 Listen</div>
              <button onClick={() => player.playSong(sharedSong, [sharedSong])} style={styles.greenBtn}>
                ▶️ Play Song
              </button>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button onClick={onHome} style={styles.outlineBtn}>🎵 Create your own song</button>
          </div>
        </div>
      )}
    </>
  );
}
