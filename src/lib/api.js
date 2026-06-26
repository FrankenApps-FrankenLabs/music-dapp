// Thin fetch wrappers around the backend song-persistence endpoints.
import { SERVER_URL } from './config';

async function jsonFetch(url, init) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    throw new Error(`Network error reaching server: ${networkErr.message}`);
  }
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected server response (${res.status})`);
    }
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function saveSong(song) {
  const data = await jsonFetch(`${SERVER_URL}/api/save-song`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  });
  return data.song;
}

export async function getMySongs(walletAddress) {
  if (!walletAddress) return [];
  const data = await jsonFetch(`${SERVER_URL}/api/my-songs/${walletAddress}`);
  return data.songs || [];
}

export async function deleteSong(id, walletAddress) {
  if (!id || !walletAddress) throw new Error('Missing song id or wallet');
  return jsonFetch(
    `${SERVER_URL}/api/song/${id}?wallet=${encodeURIComponent(walletAddress)}`,
    { method: 'DELETE' }
  );
}
