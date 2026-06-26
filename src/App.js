import React, { useCallback, useEffect, useState } from 'react';
import './lib/ui.css';
import { SERVER_URL } from './lib/config';
import { THEME } from './lib/theme';
import { usePlayer } from './hooks/usePlayer';
import { useLibrary } from './hooks/useLibrary';
import { useIsMobile } from './hooks/useIsMobile';
import { ToastProvider, useToast } from './components/ToastProvider';
import Sidebar from './components/Sidebar';
import CreateView from './components/CreateView';
import Library from './components/Library';
import SharedView from './components/SharedView';
import PlayerBar from './components/PlayerBar';
import LyricsModal from './components/LyricsModal';
import NowPlaying from './components/NowPlaying';
import QueuePanel from './components/QueuePanel';

function Shell() {
  const { notify } = useToast();
  const [view, setView] = useState('home');
  const [walletAddress, setWalletAddress] = useState(null);
  const [sharedSong, setSharedSong] = useState(null);
  const [loadingShared, setLoadingShared] = useState(false);
  const [lyricsSong, setLyricsSong] = useState(null);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const isMobile = useIsMobile();
  const lib = useLibrary(walletAddress);
  const resolveAudio = useCallback((song) => song.audio_url, []);
  const player = usePlayer({ onTrackStart: (song) => lib.registerPlay(song), resolveAudio });

  useEffect(() => {
    if (!window.ethereum) return undefined;
    // eth_accounts returns already-authorized accounts without prompting, so a
    // refresh silently restores the connection instead of dropping it.
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => { if (accounts && accounts[0]) setWalletAddress(accounts[0]); })
      .catch(() => {});
    const handler = (accounts) => setWalletAddress(accounts[0] || null);
    window.ethereum.on?.('accountsChanged', handler);
    return () => window.ethereum.removeListener?.('accountsChanged', handler);
  }, []);

  useEffect(() => {
    const songId = new URLSearchParams(window.location.search).get('song');
    if (!songId) return;
    setLoadingShared(true);
    fetch(`${SERVER_URL}/api/song/${songId}`)
      .then((r) => r.json())
      .then((data) => { setSharedSong(data.song); setView('shared'); })
      .catch(() => {})
      .finally(() => setLoadingShared(false));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (!player.current) return;
      if (e.code === 'Space') { e.preventDefault(); player.togglePlay(); }
      else if (e.code === 'ArrowRight' && e.shiftKey) player.next();
      else if (e.code === 'ArrowLeft' && e.shiftKey) player.prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player]);

  const navigate = (next) => {
    setView(next);
    if (next !== 'shared') window.history.pushState({}, '', '/');
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
    } catch (err) {
      notify(err.message || 'Wallet connection failed', 'error');
    }
  };

  const disconnectWallet = async () => {
    try {
      await window.ethereum?.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
    } catch { /* not all wallets support revoke; clearing local state still disconnects the app */ }
    setWalletAddress(null);
    notify('Wallet disconnected', 'info');
  };

  const onWalletClick = () => (walletAddress ? disconnectWallet() : connectWallet());

  const handleShare = (song) => {
    const link = `${window.location.origin}/?song=${song.id}`;
    navigator.clipboard.writeText(link)
      .then(() => notify('Share link copied', 'success'))
      .catch(() => notify(link, 'info'));
  };

  const handleDownload = async (song) => {
    const url = song?.audio_url;
    if (!url) return;
    const fileName = `${(song.title || 'song').replace(/[^a-z0-9]+/gi, '_')}.mp3`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const burl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = burl; a.download = fileName; a.click();
      URL.revokeObjectURL(burl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDelete = async (song) => {
    if (!window.confirm(`Delete "${song.title || 'Untitled'}"? This cannot be undone.`)) return;
    await lib.removeSong(song.id);
    notify('Song deleted', 'info');
  };

  const appStyle = { minHeight: '100vh', background: THEME.appBg, color: 'white', fontFamily: 'inherit' };
  const bottomPad = player.current ? THEME.playerHeight + 28 : 32;
  const mainStyle = isMobile
    ? { padding: `74px 1rem ${bottomPad}px` }
    : { padding: `2rem 2rem ${bottomPad}px 200px` };

  return (
    <div style={appStyle}>
      <Sidebar
        view={view}
        onNavigate={navigate}
        walletAddress={walletAddress}
        onWalletClick={onWalletClick}
        mobile={isMobile}
      />

      <div style={mainStyle}>
        {view === 'home' && (
          <CreateView
            walletAddress={walletAddress}
            onConnect={connectWallet}
            player={player}
            onSongSaved={lib.addSong}
            onGoToLibrary={() => navigate('library')}
            notify={notify}
          />
        )}
        {view === 'library' && (
          <Library
            lib={lib}
            player={player}
            walletAddress={walletAddress}
            onConnect={connectWallet}
            onGoCreate={() => navigate('home')}
            onViewLyrics={setLyricsSong}
            onShare={handleShare}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        )}
        {view === 'shared' && (
          <SharedView sharedSong={sharedSong} loading={loadingShared} onHome={() => navigate('home')} player={player} />
        )}
      </div>

      <PlayerBar player={player} onViewLyrics={setLyricsSong} onExpand={() => setNowPlayingOpen(true)} onQueue={() => setQueueOpen((o) => !o)} mobile={isMobile} />
      {queueOpen && player.current && <QueuePanel player={player} onClose={() => setQueueOpen(false)} />}
      {nowPlayingOpen && player.current && (
        <NowPlaying
          player={player}
          favorite={lib.isFavorite(player.current.id)}
          onToggleFavorite={() => lib.toggleFavorite(player.current.id)}
          onViewLyrics={setLyricsSong}
          onDownload={() => handleDownload(player.current)}
          onClose={() => setNowPlayingOpen(false)}
        />
      )}
      <LyricsModal song={lyricsSong} onClose={() => setLyricsSong(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
