// Read a wallet's songs published on the on-chain LightTunes contract (chain
// 9200) and assemble their audio from event logs. Read only: this module does
// not publish, tip, or track views.
import { JsonRpcProvider, Contract } from 'ethers';

export const LT_CONTRACT = '0x3587067a1E37A1c05095B3cc053564Db49a27F7D';
export const LT_RPC = 'https://rpc.mainnet.lightchain.ai';
export const LT_EXPLORER = 'https://mainnet.lightscan.app';
export const LT_SITE = 'https://lighttunes.win';
export const LT_THUMB = 'https://raw.githubusercontent.com/Keiko-Dev-LCAI/lighttunes/main/thumbs/';

// Album/track/explicit tags are encoded in the on-chain description, e.g.
// "...||album:Summer Nights|| ||track:3|| ||explicit||".
export function parseAlbum(desc) {
  const m = (desc || '').match(/\|\|album:([^|]+)\|\|/);
  return m ? m[1].trim() : null;
}
export function parseTrackNum(desc) {
  const m = (desc || '').match(/\|\|track:(\d+)\|\|/);
  return m ? parseInt(m[1], 10) : 0;
}
export function isExplicit(desc) {
  return /\|\|explicit\|\|/i.test(desc || '');
}
export function cleanDescription(desc) {
  return (desc || '')
    .replace(/\s*\|\|album:[^|]+\|\|/g, '')
    .replace(/\s*\|\|track:\d+\|\|/g, '')
    .replace(/\s*\|\|explicit\|\|/gi, '')
    .replace(/\s*\|\|tags:[^|]+\|\|/g, '')
    .trim();
}

const LT_ABI = [
  'event SongCreated(uint256 indexed songId, address indexed uploader, string title, string artist, string genre, string description, bool isPublic, uint256 totalChunks, uint256 timestamp)',
  'event SongChunkStored(uint256 indexed songId, uint256 indexed chunkIndex, uint256 totalChunks, string chunkData)',
];

const audioCache = new Map(); // songId -> assembled blob URL

function readContract() {
  return new Contract(LT_CONTRACT, LT_ABI, new JsonRpcProvider(LT_RPC));
}

function mapSongLog(log) {
  const a = log.args;
  const songId = Number(a.songId);
  const description = a.description || '';
  return {
    id: `lt-${songId}`,
    songId,
    source: 'lighttunes',
    wallet_address: a.uploader.toLowerCase(),
    title: a.title || 'Untitled',
    artist: a.artist || '',
    genre: a.genre || '',
    language: '',
    lyrics: '',
    description,
    album: parseAlbum(description),
    trackNum: parseTrackNum(description),
    explicit: isExplicit(description),
    clean_description: cleanDescription(description),
    cover_url: `${LT_THUMB}v1_${songId}.jpg`,
    is_public: a.isPublic,
    total_chunks: Number(a.totalChunks),
    created_at: new Date(Number(a.timestamp) * 1000).toISOString(),
    audio_url: null, // assembled on demand via loadLightTunesAudio
  };
}

export async function getMyLightTunesSongs(wallet) {
  if (!wallet) return [];
  const contract = readContract();
  const logs = await contract.queryFilter(contract.filters.SongCreated(null, wallet));
  return logs.map(mapSongLog).sort((x, y) => y.songId - x.songId);
}

export async function getAllLightTunesSongs() {
  const contract = readContract();
  const logs = await contract.queryFilter(contract.filters.SongCreated());
  return logs.map(mapSongLog).filter((s) => s.is_public).sort((x, y) => y.songId - x.songId);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Assemble a song's audio from its on-chain SongChunkStored events: fetch each
// chunk by (songId, chunkIndex), decode base64 on 4-char boundaries with a carry
// buffer, and build a blob URL.
async function fetchChunksBulk(contract, songId) {
  const logs = await contract.queryFilter(contract.filters.SongChunkStored(songId), 0, 'latest');
  const byIndex = [];
  let maxIdx = -1;
  for (const log of logs) {
    const idx = Number(log.args.chunkIndex);
    byIndex[idx] = log.args.chunkData || log.args[3] || '';
    if (idx > maxIdx) maxIdx = idx;
  }
  const out = [];
  for (let i = 0; i <= maxIdx; i++) out.push(byIndex[i] || '');
  return out;
}

async function fetchChunksPerIndex(contract, songId, totalChunks) {
  const n = Math.max(1, Number(totalChunks) || 1);
  const results = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      contract.queryFilter(contract.filters.SongChunkStored(songId, i), 0, 'latest')
    )
  );
  return results.map((evts) => (evts[0] && (evts[0].args.chunkData || evts[0].args[3])) || '');
}

export async function loadLightTunesAudio(songId, totalChunks) {
  if (audioCache.has(songId)) return audioCache.get(songId);
  const contract = readContract();

  // Prefer one bulk getLogs; fall back to per-chunk reads if the bulk response
  // is rejected or empty in the browser.
  let rawChunks = [];
  try {
    rawChunks = await fetchChunksBulk(contract, songId);
    if (!rawChunks.some((c) => c)) throw new Error('empty');
  } catch {
    rawChunks = await fetchChunksPerIndex(contract, songId, totalChunks);
  }
  if (!rawChunks.some((c) => c)) throw new Error('No audio data found on chain yet');

  let mimeType = 'audio/mpeg';
  const firstData = rawChunks.find((c) => c.startsWith('data:'));
  const mime = firstData && firstData.match(/^data:([^;]+);base64,/);
  if (mime) mimeType = mime[1];

  const byteArrays = [];
  let carry = '';
  for (const chunk of rawChunks) {
    const b64raw = chunk.includes(',') ? chunk.split(',', 2)[1] : chunk;
    if (!b64raw) continue;
    const b64 = carry + b64raw;
    const alignedLen = Math.floor(b64.length / 4) * 4;
    carry = b64.slice(alignedLen);
    const toDecode = b64.slice(0, alignedLen);
    if (toDecode) byteArrays.push(base64ToBytes(toDecode));
  }
  if (carry) {
    try { byteArrays.push(base64ToBytes(carry + '='.repeat((4 - (carry.length % 4)) % 4))); } catch { /* drop tail */ }
  }

  const totalLen = byteArrays.reduce((sum, a) => sum + a.length, 0);
  const merged = new Uint8Array(totalLen);
  let pos = 0;
  for (const arr of byteArrays) { merged.set(arr, pos); pos += arr.length; }

  const url = URL.createObjectURL(new Blob([merged], { type: mimeType }));
  audioCache.set(songId, url);
  return url;
}

// Warm the cache in the background (on hover) so pressing play is near-instant
// instead of waiting for the chain read.
export function prefetchLightTunesAudio(song) {
  if (song && song.source === 'lighttunes' && song.songId != null && !audioCache.has(song.songId)) {
    loadLightTunesAudio(song.songId, song.total_chunks).catch(() => {});
  }
}
