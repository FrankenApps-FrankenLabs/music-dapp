import React, { useEffect, useMemo, useState } from 'react';
import { coverGlyph } from '../lib/cover';
import { generateCoverDataUrl } from '../lib/coverGen';

// Renders a song's cover: the song's cover_url if present, else a
// canvas-generated cover (so every track gets artwork), falling back to a glyph.
export default function CoverImage({ song, glyphSize = '2.6rem' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [song.cover_url]);

  const seed = `${song.title}-${song.genre}-${song.id}`;
  const generated = useMemo(() => generateCoverDataUrl(seed, song.title, song.genre), [seed, song.title, song.genre]);
  const src = song.cover_url && !failed ? song.cover_url : generated;

  if (src) {
    return (
      <img
        src={src}
        alt={song.title || ''}
        onError={() => { if (!failed) setFailed(true); }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }
  return <span style={{ fontSize: glyphSize, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>{coverGlyph(song.genre)}</span>;
}
