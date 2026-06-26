// Library state for the connected wallet: fetch the songs you have created, plus
// search/filter/sort and favorites + play counts persisted in localStorage
// (no DB schema change needed).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMySongs, deleteSong } from '../lib/api';
import { getMyLightTunesSongs, prefetchLightTunesAudio } from '../lib/lighttunes';

function lsKey(prefix, wallet) {
  return `lw_${prefix}_${(wallet || 'anon').toLowerCase()}`;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable; non-fatal */
  }
}

function matchesQuery(song, q) {
  return (
    (song.title || '').toLowerCase().includes(q) ||
    (song.genre || '').toLowerCase().includes(q) ||
    (song.artist || '').toLowerCase().includes(q) ||
    (song.lyrics || '').toLowerCase().includes(q)
  );
}

function sortSongs(list, sort, isFavorite) {
  const out = list.slice();
  if (sort === 'oldest') out.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  else if (sort === 'title') out.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  else if (sort === 'favorites') return out.filter((s) => isFavorite(s.id));
  else out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return out;
}

export function useLibrary(walletAddress) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'lighttunes' | 'drafts'
  const [sort, setSort] = useState('newest');
  const [favorites, setFavorites] = useState([]);
  const [playCounts, setPlayCounts] = useState({});

  useEffect(() => {
    setFavorites(readJSON(lsKey('favs', walletAddress), []));
    setPlayCounts(readJSON(lsKey('plays', walletAddress), {}));
  }, [walletAddress]);

  const refresh = useCallback(async () => {
    if (!walletAddress) { setSongs([]); return; }
    setLoading(true);
    setError('');
    try {
      const [mine, onchain] = await Promise.all([
        getMySongs(walletAddress).catch(() => []),
        getMyLightTunesSongs(walletAddress).catch(() => []),
      ]);
      const drafts = mine.map((s) => ({ ...s, source: s.source || 'local' }));
      const list = [...drafts, ...onchain]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setSongs(list);
      // Warm the on-chain audio cache so pressing play is instant.
      list.filter((s) => s.source === 'lighttunes').slice(0, 8).forEach(prefetchLightTunesAudio);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { refresh(); }, [refresh]);

  const isFavorite = useCallback(
    (id) => favorites.map(String).includes(String(id)),
    [favorites]
  );

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const has = prev.map(String).includes(String(id));
      const nextList = has ? prev.filter((x) => String(x) !== String(id)) : [...prev, id];
      writeJSON(lsKey('favs', walletAddress), nextList);
      return nextList;
    });
  }, [walletAddress]);

  const registerPlay = useCallback((song) => {
    if (!song || !song.id) return;
    setPlayCounts((prev) => {
      const nextCounts = { ...prev, [song.id]: (prev[song.id] || 0) + 1 };
      writeJSON(lsKey('plays', walletAddress), nextCounts);
      return nextCounts;
    });
  }, [walletAddress]);

  const playsFor = useCallback((song) => playCounts[song.id] || 0, [playCounts]);

  const addSong = useCallback((song) => {
    if (!song) return;
    setSongs((prev) => [song, ...prev.filter((s) => String(s.id) !== String(song.id))]);
  }, []);

  const removeSong = useCallback(async (id) => {
    setSongs((prev) => prev.filter((s) => String(s.id) !== String(id)));
    try {
      await deleteSong(id, walletAddress);
    } catch (e) {
      setError(e.message);
      refresh();
    }
  }, [walletAddress, refresh]);

  const allGenres = useMemo(() => {
    const set = new Set();
    songs.forEach((s) =>
      (s.genre || '').split(',').forEach((g) => {
        const t = g.trim();
        if (t) set.add(t);
      })
    );
    return ['All', ...Array.from(set).sort()];
  }, [songs]);

  const filtered = useMemo(() => {
    let list = songs;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((s) => matchesQuery(s, q));
    if (genreFilter !== 'All') {
      list = list.filter((s) => (s.genre || '').toLowerCase().includes(genreFilter.toLowerCase()));
    }
    if (sourceFilter === 'lighttunes') list = list.filter((s) => s.source === 'lighttunes');
    else if (sourceFilter === 'drafts') list = list.filter((s) => s.source !== 'lighttunes');
    return sortSongs(list, sort, isFavorite);
  }, [songs, query, genreFilter, sourceFilter, sort, isFavorite]);

  const stats = useMemo(() => {
    const plays = songs.reduce((sum, s) => sum + (playCounts[s.id] || 0), 0);
    const onchain = songs.filter((s) => s.source === 'lighttunes').length;
    return { total: songs.length, onchain, favorites: favorites.length, plays };
  }, [songs, playCounts, favorites]);

  return {
    songs, filtered, loading, error, stats,
    query, setQuery, genreFilter, setGenreFilter, sourceFilter, setSourceFilter,
    sort, setSort, allGenres,
    favorites, isFavorite, toggleFavorite,
    playCounts, playsFor, registerPlay,
    refresh, addSong, removeSong,
  };
}
