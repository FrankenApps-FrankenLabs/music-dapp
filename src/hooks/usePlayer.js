import { useCallback, useEffect, useRef, useState } from 'react';

const XFADE_SEC = 6; // crossfade length for seamless DJ-set transitions

// A tiny silent WAV used once to "unlock" audio elements on the first user gesture.
let _silentUrl = null;
function silentWavUrl() {
  if (_silentUrl) return _silentUrl;
  const bytes = new Uint8Array(44 + 800);
  const v = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 836, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, 800, true);
  _silentUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  return _silentUrl;
}

// Pure: next index respecting shuffle/repeat. null = nothing next.
function computeNext(i, q, rep, shuf) {
  if (!q.length) return null;
  if (shuf) {
    if (q.length <= 1) return rep === 'all' ? i : null;
    let n = i;
    while (n === i) n = Math.floor(Math.random() * q.length);
    return n;
  }
  const ni = i + 1;
  if (ni >= q.length) return rep === 'all' ? 0 : null;
  return ni;
}

export function usePlayer({ onTrackStart, resolveAudio, prefetchAudio } = {}) {
  const decksRef = useRef(null);
  if (decksRef.current === null && typeof Audio !== 'undefined') {
    decksRef.current = [new Audio(), new Audio()];
  }
  const preloadRef = useRef(null);
  if (preloadRef.current === null && typeof Audio !== 'undefined') {
    preloadRef.current = new Audio();
    preloadRef.current.preload = 'auto';
  }
  const primaryRef = useRef(0);
  const xfadeRef = useRef({ active: false, raf: null });

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(1);

  const current = index >= 0 && index < queue.length ? queue[index] : null;

  const stateRef = useRef({});
  stateRef.current = { queue, index, repeat, shuffle, volume };

  const active = () => (decksRef.current ? decksRef.current[primaryRef.current] : null);
  const inactive = () => (decksRef.current ? decksRef.current[1 - primaryRef.current] : null);

  const cancelXfade = () => {
    if (xfadeRef.current.raf) cancelAnimationFrame(xfadeRef.current.raf);
    xfadeRef.current.raf = null;
    if (xfadeRef.current.active) { const b = inactive(); if (b) b.pause(); }
    xfadeRef.current.active = false;
  };

  const warmNext = (q, nextIndex) => {
    const nxt = q[nextIndex + 1];
    if (prefetchAudio) prefetchAudio(nxt);
    if (nxt && nxt.audio_url && preloadRef.current) {
      try { preloadRef.current.src = nxt.audio_url; preloadRef.current.load(); } catch { /* best-effort */ }
    }
  };

  // Hard play (used for explicit play / skip / prev): loads on the active deck.
  const playAt = useCallback(async (nextIndex, q) => {
    cancelXfade();
    const a = active();
    if (!a || nextIndex < 0 || nextIndex >= q.length) return;
    const song = q[nextIndex];
    setIndex(nextIndex);
    let url = song.audio_url;
    if (!url && resolveAudio) {
      setLoading(true);
      try { url = await resolveAudio(song); } catch { setLoading(false); return; }
      setLoading(false);
    }
    if (!url) return;
    const b = inactive(); if (b) b.pause();
    a.src = url; a.volume = stateRef.current.volume; a.currentTime = 0;
    a.play().catch(() => {});
    if (onTrackStart) onTrackStart(song);
    warmNext(q, nextIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTrackStart, resolveAudio, prefetchAudio]);

  // Seamless crossfade onto the inactive deck, then swap.
  const crossfadeTo = useCallback((nextIndex) => {
    const { queue: q, volume: vol } = stateRef.current;
    const song = q[nextIndex];
    if (!song || !song.audio_url) return;
    const out = active();
    const inc = inactive();
    if (!out || !inc) return;
    xfadeRef.current.active = true;
    inc.src = song.audio_url; inc.currentTime = 0; inc.volume = 0;
    inc.play().catch(() => { xfadeRef.current.active = false; });
    const start = performance.now();
    const tick = (now) => {
      if (!xfadeRef.current.active) return;
      const t = Math.min(1, (now - start) / (XFADE_SEC * 1000));
      out.volume = Math.max(0, vol * (1 - t));
      inc.volume = Math.min(vol, vol * t);
      if (t < 1) { xfadeRef.current.raf = requestAnimationFrame(tick); return; }
      out.pause(); out.volume = vol;
      primaryRef.current = 1 - primaryRef.current;
      xfadeRef.current.active = false; xfadeRef.current.raf = null;
      setIndex(nextIndex);
      setDuration(inc.duration || 0);
      setCurrentTime(inc.currentTime || 0);
      setIsPlaying(!inc.paused);
      if (onTrackStart) onTrackStart(song);
      warmNext(q, nextIndex);
    };
    xfadeRef.current.raf = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTrackStart, prefetchAudio]);

  useEffect(() => {
    const decks = decksRef.current;
    if (!decks) return undefined;
    const onTime = (e) => {
      if (e.target !== active()) return;
      setCurrentTime(e.target.currentTime || 0);
      const { index: i, queue: q, repeat: rep, shuffle: shuf } = stateRef.current;
      const dur = e.target.duration || 0;
      const rem = dur - e.target.currentTime;
      if (!xfadeRef.current.active && rep !== 'one' && dur > 0 && rem <= XFADE_SEC && rem > 0.3) {
        const ni = computeNext(i, q, rep, shuf);
        if (ni != null && q[ni] && q[ni].audio_url) crossfadeTo(ni);
      }
    };
    const onMeta = (e) => { if (e.target === active()) setDuration(e.target.duration || 0); };
    const onPlay = (e) => { if (e.target === active()) setIsPlaying(true); };
    const onPause = (e) => { if (e.target === active() && !xfadeRef.current.active) setIsPlaying(false); };
    const onEnded = (e) => {
      if (e.target !== active() || xfadeRef.current.active) return;
      const { index: i, queue: q, repeat: rep, shuffle: shuf } = stateRef.current;
      if (rep === 'one') { e.target.currentTime = 0; e.target.play().catch(() => {}); return; }
      const ni = computeNext(i, q, rep, shuf);
      if (ni == null) { setIsPlaying(false); return; }
      playAt(ni, q);
    };
    const onError = (e) => {
      if (e.target !== active() || xfadeRef.current.active) return;
      const { index: i, queue: q, repeat: rep, shuffle: shuf } = stateRef.current;
      const ni = computeNext(i, q, rep, shuf);
      if (ni != null && ni !== i) playAt(ni, q); else setIsPlaying(false);
    };
    decks.forEach((d) => {
      d.addEventListener('timeupdate', onTime);
      d.addEventListener('loadedmetadata', onMeta);
      d.addEventListener('play', onPlay);
      d.addEventListener('pause', onPause);
      d.addEventListener('ended', onEnded);
      d.addEventListener('error', onError);
    });
    return () => decks.forEach((d) => {
      d.removeEventListener('timeupdate', onTime);
      d.removeEventListener('loadedmetadata', onMeta);
      d.removeEventListener('play', onPlay);
      d.removeEventListener('pause', onPause);
      d.removeEventListener('ended', onEnded);
      d.removeEventListener('error', onError);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crossfadeTo, playAt]);

  useEffect(() => () => {
    const d = decksRef.current;
    if (d) d.forEach((x) => x.pause());
    cancelXfade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { const a = active(); if (a && !xfadeRef.current.active) a.volume = volume; }, [volume]);

  // Unlock both decks on first user gesture (autoplay policy).
  useEffect(() => {
    const decks = decksRef.current;
    if (!decks) return undefined;
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      const silent = silentWavUrl();
      decks.forEach((d) => {
        if (d.src) return;
        d.src = silent;
        const p = d.play();
        if (p && p.then) p.then(() => { if (d.src === silent) { d.pause(); d.removeAttribute('src'); } }).catch(() => {});
      });
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  const playSong = useCallback((song, list) => {
    if (!song) return;
    const q = list && list.length ? list : [song];
    setQueue(q);
    const found = q.findIndex((s) => String(s.id) === String(song.id));
    playAt(found >= 0 ? found : 0, q);
  }, [playAt]);

  const togglePlay = useCallback(() => {
    const a = active();
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }, [current]);

  const next = useCallback(() => {
    const { index: i, queue: q, repeat: rep, shuffle: shuf } = stateRef.current;
    const ni = computeNext(i, q, rep, shuf);
    if (ni != null) playAt(ni, q);
  }, [playAt]);

  const prev = useCallback(() => {
    const a = active();
    const { index: i, queue: q } = stateRef.current;
    if (!a || !q.length) return;
    if (a.currentTime > 3) { a.currentTime = 0; return; }
    const pi = i - 1;
    if (pi < 0) { a.currentTime = 0; return; }
    playAt(pi, q);
  }, [playAt]);

  const seek = useCallback((time) => {
    const a = active();
    if (a) { a.currentTime = time; setCurrentTime(time); }
  }, []);

  const enqueue = useCallback((song) => { if (song) setQueue((q) => [...q, song]); }, []);
  const cycleRepeat = useCallback(() => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')), []);

  return {
    current, queue, isPlaying, currentTime, duration, shuffle, repeat, loading, volume,
    playSong, togglePlay, next, prev, seek, enqueue, setVolume,
    toggleShuffle: () => setShuffle((s) => !s), cycleRepeat, setRepeatMode: setRepeat,
  };
}
