// Central config + shared constants. Values can be overridden via CRA env vars
// (REACT_APP_*) so local dev can point the app at a locally-run server.

export const SERVER_URL =
  process.env.REACT_APP_SERVER_URL || 'https://music-dapp.onrender.com';

export const RECEIVING_WALLET =
  process.env.REACT_APP_RECEIVING_WALLET ||
  '0x7FE522ab4F456cFc41FE7a7a0C94F28801CCA8fc';

export const DOWNLOAD_PRICE = process.env.REACT_APP_DOWNLOAD_PRICE || '5';

export const genres = [
  'Rock', 'Metal', 'Big Band', 'Jazz', 'Hip Hop', 'Rap', 'Drill', 'Trap',
  'Country', 'Pop', 'Blues', 'Electronic', 'R&B', 'Punk', 'Folk', 'Classical',
  'Reggae', 'Afrobeats', 'Gospel', 'Ambient', 'Soundtrack', 'Indie', 'Emo',
  'Grunge', 'Latin', 'Dancehall', 'Soul', 'Throat Singing', 'Monastery Chanting',
  'Drum and Bass', 'Dubstep',
];

export const languages = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Swedish', 'Polish',
];

export const modes = [
  { id: 'topic', label: '💡 Song topic' },
  { id: 'own', label: '✏️ My own lyrics' },
  { id: 'poem', label: '📜 Poem' },
  { id: 'haiku', label: '🌸 Haiku' },
];
