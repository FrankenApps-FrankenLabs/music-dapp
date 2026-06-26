import React from 'react';
import SongCard from './SongCard';
import HeroBanner from './HeroBanner';
import Rail from './Rail';
import { THEME } from '../lib/theme';

function groupByAlbum(list) {
  const map = new Map();
  const singles = [];
  list.forEach((s) => {
    if (s.album) {
      if (!map.has(s.album)) map.set(s.album, []);
      map.get(s.album).push(s);
    } else singles.push(s);
  });
  const albums = [...map.entries()].map(([name, songs]) => ({
    name,
    songs: songs.slice().sort((a, b) => (a.trackNum || 0) - (b.trackNum || 0)),
  }));
  return { albums, singles };
}

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'title', label: 'Title A-Z' },
  { id: 'favorites', label: 'Favorites' },
];

const SOURCE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'lighttunes', label: 'On-chain' },
  { id: 'drafts', label: 'Drafts' },
];

const styles = {
  header: { display: 'flex', alignItems: 'baseline', gap: '0.75rem', maxWidth: '1100px', margin: '0 auto 1.25rem' },
  h1: { fontSize: '2rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', background: THEME.accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  count: { color: '#666', fontSize: '0.9rem' },
  toolbar: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', maxWidth: '1100px', margin: '0 auto 1.5rem' },
  search: { flex: 1, minWidth: '200px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,68,0,0.3)', borderRadius: '10px', padding: '0.7rem 1rem', color: 'white', fontSize: '0.95rem', outline: 'none' },
  select: { background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,68,0,0.3)', borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'white', fontSize: '0.9rem', cursor: 'pointer', outline: 'none' },
  clear: { background: 'rgba(255,68,0,0.12)', border: '1px solid rgba(255,68,0,0.35)', borderRadius: '10px', padding: '0.7rem 1rem', color: '#ff7a52', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '1rem', maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { maxWidth: '1100px', margin: '0 auto 1rem', fontSize: '1.15rem', fontWeight: 800, color: 'white' },
  playAll: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,68,0,0.3)', color: 'white', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
  statsRow: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', maxWidth: '1100px', margin: '0 auto 1rem' },
  stat: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,68,0,0.18)', borderRadius: '10px', padding: '0.5rem 0.9rem', minWidth: '78px' },
  statN: { fontSize: '1.15rem', fontWeight: 800, color: 'white', lineHeight: 1.1 },
  statL: { fontSize: '0.62rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tabs: { display: 'flex', gap: '0.4rem', maxWidth: '1100px', margin: '0 auto 1rem' },
  tab: (active) => ({ padding: '0.45rem 0.9rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
    background: active ? THEME.accentGrad2 : 'transparent', border: active ? '1px solid transparent' : '1px solid rgba(255,68,0,0.25)',
    color: active ? 'white' : '#999' }),
  state: { maxWidth: '560px', margin: '4rem auto', textAlign: 'center', color: '#888' },
  stateIcon: { fontSize: '3rem', marginBottom: '1rem' },
  cta: { marginTop: '1.5rem', background: THEME.accentGrad, color: 'white', border: 'none', borderRadius: '10px', padding: '0.9rem 1.6rem', fontSize: '1rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' },
  skelCard: { borderRadius: '14px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.06)' },
  skelCover: { width: '100%', aspectRatio: '1 / 1', borderRadius: '10px', marginBottom: '0.75rem' },
  skelLine: { height: '12px', borderRadius: '6px', marginBottom: '0.5rem' },
};

function StateBlock({ title, subtitle, cta, onCta }) {
  return (
    <div style={styles.state} className="lw-fade-in">
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ddd', marginBottom: '0.4rem' }}>{title}</div>
      <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{subtitle}</div>
      {cta && <button style={styles.cta} onClick={onCta}>{cta}</button>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={styles.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={styles.skelCard}>
          <div style={styles.skelCover} className="lw-skeleton" />
          <div style={{ ...styles.skelLine, width: '80%' }} className="lw-skeleton" />
          <div style={{ ...styles.skelLine, width: '50%' }} className="lw-skeleton" />
        </div>
      ))}
    </div>
  );
}

export default function Library({ lib, player, walletAddress, onConnect, onGoCreate, onViewLyrics, onShare, onDownload, onDelete }) {
  const { filtered, songs, loading, error, stats, query, setQuery, genreFilter, setGenreFilter, sourceFilter, setSourceFilter, sort, setSort, allGenres } = lib;

  const featured = songs.find((s) => s.source === 'lighttunes' && s.cover_url) || songs.find((s) => s.cover_url) || songs[0];
  const featuredPlaying = featured && String(player.current?.id) === String(featured.id) && player.isPlaying;
  const playFeatured = () => {
    if (!featured) return;
    if (String(player.current?.id) === String(featured.id)) player.togglePlay();
    else player.playSong(featured, filtered.length ? filtered : songs);
  };

  const renderCard = (song, queue) => (
    <SongCard
      key={song.id}
      song={song}
      isCurrent={String(player.current?.id) === String(song.id)}
      isPlaying={player.isPlaying}
      isLoading={String(player.current?.id) === String(song.id) && player.loading}
      favorite={lib.isFavorite(song.id)}
      playCount={lib.playsFor(song)}
      onPlay={() => {
        if (String(player.current?.id) === String(song.id)) player.togglePlay();
        else player.playSong(song, queue);
      }}
      onToggleFavorite={() => lib.toggleFavorite(song.id)}
      onViewLyrics={onViewLyrics}
      onShare={onShare}
      onDownload={onDownload}
      onDelete={onDelete}
    />
  );

  const inResults = query.trim() !== '' || genreFilter !== 'All' || sourceFilter !== 'all';
  const anyFilter = inResults || sort !== 'newest';
  const clearFilters = () => { setQuery(''); setGenreFilter('All'); setSourceFilter('all'); setSort('newest'); };

  const body = () => {
    if (!walletAddress) {
      return <StateBlock title="Connect your wallet" subtitle="Your library is tied to your wallet. Connect it to see the songs you have created." cta="Connect Wallet" onCta={onConnect} />;
    }
    if (loading) return <SkeletonGrid />;
    if (error) return <StateBlock title="Could not load your library" subtitle={error} cta="Retry" onCta={lib.refresh} />;
    if (songs.length === 0) {
      return <StateBlock title="No songs yet" subtitle="Head to Create, write some lyrics, and generate your first track. It shows up here automatically." cta="Create a song" onCta={onGoCreate} />;
    }
    if (filtered.length === 0) {
      return <StateBlock title="No matches" subtitle="Nothing matches your search or filters. Try clearing them." />;
    }
    if (inResults) {
      return <div style={styles.grid}>{filtered.map((s) => renderCard(s, filtered))}</div>;
    }

    const recent = [...songs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12);
    const { albums } = groupByAlbum(songs);
    return (
      <>
        {songs.length > 1 && <Rail title="Recently Added">{recent.map((s) => renderCard(s, recent))}</Rail>}
        {albums.map((al) => (
          <Rail
            key={al.name}
            title={al.name}
            action={<button style={styles.playAll} onClick={() => player.playSong(al.songs[0], al.songs)}>Play</button>}
          >
            {al.songs.map((s) => renderCard(s, al.songs))}
          </Rail>
        ))}
        <div style={styles.sectionTitle}>All Songs</div>
        <div style={styles.grid}>{filtered.map((s) => renderCard(s, filtered))}</div>
      </>
    );
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.h1}>My Library</h1>
        {walletAddress && songs.length > 0 && (
          <span style={styles.count}>{songs.length} song{songs.length === 1 ? '' : 's'}</span>
        )}
      </div>

      {walletAddress && songs.length > 0 && (
        <>
          <HeroBanner song={featured} isPlaying={featuredPlaying} onPlay={playFeatured} />
          <div style={styles.statsRow}>
            <div style={styles.stat}><div style={styles.statN}>{stats.total}</div><div style={styles.statL}>Songs</div></div>
            <div style={styles.stat}><div style={styles.statN}>{stats.onchain}</div><div style={styles.statL}>On-chain</div></div>
            <div style={styles.stat}><div style={styles.statN}>{stats.favorites}</div><div style={styles.statL}>Favorites</div></div>
            <div style={styles.stat}><div style={styles.statN}>{stats.plays}</div><div style={styles.statL}>Plays</div></div>
          </div>
          <div style={styles.tabs}>
            {SOURCE_TABS.map((t) => (
              <button key={t.id} style={styles.tab(sourceFilter === t.id)} onClick={() => setSourceFilter(t.id)}>{t.label}</button>
            ))}
          </div>
        </>
      )}

      {walletAddress && songs.length > 0 && (
        <div style={styles.toolbar}>
          <input
            style={styles.search}
            placeholder="Search title, genre, artist, lyrics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select style={styles.select} value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
            {allGenres.map((g) => <option key={g} value={g}>{g === 'All' ? 'All genres' : g}</option>)}
          </select>
          <select style={styles.select} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {anyFilter && <button style={styles.clear} onClick={clearFilters}>Clear</button>}
        </div>
      )}

      {body()}
    </div>
  );
}
