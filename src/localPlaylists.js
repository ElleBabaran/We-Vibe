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

function tracksAreSame(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id) return a.id === b.id;
  if (a.uri && b.uri) return a.uri === b.uri;
  return false;
}

export function getPlaylists() {
  return loadAll();
}

export function createPlaylist(name, coverImage = null) {
  const playlists = loadAll();
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  const playlist = {
    id,
    name: name || 'New Playlist',
    tracks: [],
    images: coverImage ? [{ url: coverImage }] : [],
    createdAt: now,
    updatedAt: now,
  };
  saveAll([playlist, ...playlists]);
  return playlist;
}

export function addTrackToPlaylist(playlistId, track) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  const list = playlists[idx].tracks || [];
  const exists = list.some(t => tracksAreSame(t, track));
  if (!exists) {
    list.push(track);
    playlists[idx].tracks = list;
    playlists[idx].updatedAt = Date.now();
    saveAll(playlists);
  }
  return playlists[idx];
}

export function addTracksToPlaylist(playlistId, tracks) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  const list = playlists[idx].tracks || [];
  for (const tr of tracks || []) {
    if (!list.some(t => tracksAreSame(t, tr))) {
      list.push(tr);
    }
  }
  playlists[idx].tracks = list;
  playlists[idx].updatedAt = Date.now();
  saveAll(playlists);
  return playlists[idx];
}

export function moveTrack(playlistId, fromIndex, toIndex) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  const list = playlists[idx].tracks || [];
  if (fromIndex < 0 || fromIndex >= list.length) return;
  // Allow moving to end (toIndex === list.length)
  const clampedTo = Math.max(0, Math.min(toIndex, list.length - 1));
  const [item] = list.splice(fromIndex, 1);
  list.splice(clampedTo, 0, item);
  playlists[idx].tracks = list;
  playlists[idx].updatedAt = Date.now();
  saveAll(playlists);
}

export function removeTrack(playlistId, trackIndex) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].tracks = (playlists[idx].tracks || []).filter((_, i) => i !== trackIndex);
  playlists[idx].updatedAt = Date.now();
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
  playlists[idx].updatedAt = Date.now();
  saveAll(playlists);
  return playlists[idx];
}

export function renamePlaylist(playlistId, name) {
  const playlists = loadAll();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].name = name || playlists[idx].name;
  playlists[idx].updatedAt = Date.now();
  saveAll(playlists);
  return playlists[idx];
}

export function deletePlaylist(playlistId) {
  const playlists = loadAll();
  const filtered = playlists.filter(p => p.id !== playlistId);
  saveAll(filtered);
}

