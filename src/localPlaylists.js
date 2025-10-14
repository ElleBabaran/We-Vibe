// Local custom playlists stored in localStorage under key 'wv_custom_playlists'

const STORAGE_KEY = 'wv_custom_playlists';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveAll(playlists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
  } catch (_) {}
}

export function getPlaylists() {
  return loadAll();
}

export function createPlaylist(name, coverImage = null) {
  const playlists = loadAll();
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const playlist = { 
    id, 
    name: name || 'New Playlist', 
    tracks: [],
    images: coverImage ? [{ url: coverImage }] : []
  };
  saveAll([playlist, ...playlists]);
  return playlist;
}

export function addTrackToPlaylist(playlistId, track) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].tracks.push(track);
  saveAll(playlists);
}

export function addTracksToPlaylist(playlistId, tracks) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].tracks.push(...tracks);
  saveAll(playlists);
}

export function moveTrack(playlistId, fromIndex, toIndex) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  const list = playlists[idx].tracks;
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
  const [item] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, item);
  saveAll(playlists);
}

export function removeTrack(playlistId, trackIndex) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].tracks = playlists[idx].tracks.filter((_, i) => i !== trackIndex);
  saveAll(playlists);
}

export function getPlaylist(playlistId) {
  return loadAll().find(p => p.id === playlistId);
}

export function updatePlaylistCover(playlistId, coverImage) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].images = coverImage ? [{ url: coverImage }] : [];
  saveAll(playlists);
}


