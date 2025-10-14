import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const MusicQueueContext = createContext();

export const useMusicQueue = () => {
  const context = useContext(MusicQueueContext);
  if (!context) {
    throw new Error('useMusicQueue must be used within a MusicQueueProvider');
  }
  return context;
};

export const MusicQueueProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // Active Spotify Web Playback SDK device id shared app-wide
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  // Spotify Web Playback SDK player instance and device id
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const queueRef = useRef(queue);
  const indexRef = useRef(currentTrackIndex);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = currentTrackIndex; }, [currentTrackIndex]);

  // Restore persisted device id if available so controls work before Playback loads
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('wv_device_id');
      if (savedId) setActiveDeviceId(savedId);
    } catch (_) {}
  }, []);

  // Initialize Spotify Web Playback SDK globally so playback works on all pages
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;

    const setup = () => {
      if (!window.Spotify || player) return;
      const p = new window.Spotify.Player({
        name: 'WeVibe Player',
        getOAuthToken: cb => cb(token),
        volume: 0.7,
      });

      p.addListener('ready', async ({ device_id }) => {
        setDeviceId(device_id);
        setActiveDeviceId(device_id);
        try { localStorage.setItem('wv_device_id', device_id); } catch (_) {}
        setPlayer(p);
        try {
          // Transfer playback context to this device but don't autoplay
          await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: [device_id], play: false })
          });
        } catch (_) {}
      });

      p.addListener('not_ready', ({ device_id }) => {
        setDeviceId(null);
        setActiveDeviceId(null);
        try { localStorage.removeItem('wv_device_id'); } catch (_) {}
      });

      p.addListener('initialization_error', ({ message }) => console.error('SDK init error', message));
      p.addListener('authentication_error', ({ message }) => console.error('SDK auth error', message));
      p.addListener('account_error', ({ message }) => console.error('SDK account error', message));
      p.addListener('playback_error', ({ message }) => console.error('SDK playback error', message));

      // Keep isPlaying and currentTrackIndex aligned with SDK
      p.addListener('player_state_changed', (state) => {
        if (!state) return;
        const currentlyPlaying = !state.paused;
        setIsPlaying(prev => (prev !== currentlyPlaying ? currentlyPlaying : prev));

        try {
          const sdkUri = state.track_window?.current_track?.uri;
          const q = queueRef.current || [];
          const currentIdx = indexRef.current || 0;
          if (sdkUri && q.length > 0) {
            const idx = q.findIndex(t => t?.uri === sdkUri);
            if (idx >= 0 && idx !== currentIdx) {
              setCurrentTrackIndex(idx);
            }
          }
        } catch (_) {}
      });

      p.connect();
    };

    if (window.Spotify) {
      setup();
    } else {
      window.onSpotifyWebPlaybackSDKReady = setup;
    }
  }, [player, deviceId, queue, currentTrackIndex]);

  // Start playback on this device when we have a track and play is requested
  const startPlayback = useCallback(async (trackToPlayArg) => {
    const trackToPlay = trackToPlayArg ?? (queue[currentTrackIndex] || null);
    const token = localStorage.getItem('spotify_access_token');
    if (!token || !deviceId || !player || !trackToPlay?.uri) return;

    try {
      // Activate audio in browser if required
      try { if (player.activateElement) await player.activateElement(); } catch (_) {}

      // Pause to reset current playback
      try {
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token}` }
        });
        await new Promise(r => setTimeout(r, 250));
      } catch (_) {}

      // Ensure device is active
      try {
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_ids: [deviceId], play: false })
        });
      } catch (_) {}

      if (queue.length > 0) {
        const MAX_URIS = 100;
        const uris = queue
          .slice(currentTrackIndex, currentTrackIndex + MAX_URIS)
          .map(t => t?.uri)
          .filter(Boolean);
        let res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris })
        });
        if (!res.ok) {
          // fallback to single
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [trackToPlay.uri] })
          });
        }
      } else {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: [trackToPlay.uri] })
        });
      }
    } catch (e) {
      // Log and allow UI to continue
      console.error('startPlayback failed', e);
    }
  }, [queue, currentTrackIndex, deviceId, player]);

  // Auto-start/pause based on state
  useEffect(() => {
    const track = queue[currentTrackIndex] || null;
    if (deviceId && track && isPlaying && player && track.uri) {
      // debounce to let state settle
      const t = setTimeout(() => startPlayback(track), 150);
      return () => clearTimeout(t);
    } else if (deviceId && track && !isPlaying && player) {
      player.pause?.().catch(() => {});
    }
  }, [queue, currentTrackIndex, isPlaying, deviceId, player, startPlayback]);

  // Ensure track has a valid Spotify URI; fallback to id if present
  const ensureTrackUri = (track) => {
    if (!track) return null;
    if (track.uri) return track;
    if (track.id) {
      return { ...track, uri: `spotify:track:${track.id}` };
    }
    return null;
  };

  // Add a single track to the queue
  const addTrackToQueue = useCallback((track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  // Add multiple tracks to the queue
  const addTracksToQueue = useCallback((tracks) => {
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  // Add album tracks to queue (for album playback)
  const addAlbumToQueue = useCallback((albumTracks, startIndex = 0) => {
    // If starting from a specific track, add remaining tracks from that point
    const tracksToAdd = albumTracks.slice(startIndex);
    setQueue(prev => [...prev, ...tracksToAdd]);
  }, []);

  // Remove track from queue
  const removeTrackFromQueue = useCallback((index) => {
    setQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
      // Adjust current track index if needed
      if (index < currentTrackIndex) {
        setCurrentTrackIndex(prev => prev - 1);
      } else if (index === currentTrackIndex && newQueue.length > 0) {
        // If we removed the current track, stay at the same index (next track)
        if (currentTrackIndex >= newQueue.length) {
          setCurrentTrackIndex(newQueue.length - 1);
        }
      }
      return newQueue;
    });
  }, [currentTrackIndex]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentTrackIndex(0);
  }, []);

  // Play specific track from queue
  const playTrackFromQueue = useCallback((index) => {
    console.log('🎵 playTrackFromQueue called with index:', index);
    if (index >= 0 && index < queue.length) {
      setIsPlaying(false); // Stop current playback first
      setCurrentTrackIndex(index);
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    }
  }, [queue.length]);

  // Play next track
  const playNext = useCallback(() => {
    if (currentTrackIndex < queue.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  }, [currentTrackIndex, queue.length]);

  // Play previous track
  const playPrevious = useCallback(() => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  // Get current track
  const getCurrentTrack = useCallback(() => {
    return queue[currentTrackIndex] || null;
  }, [queue, currentTrackIndex]);

  // Get next tracks in queue
  const getNextTracks = useCallback((limit = 5) => {
    return queue.slice(currentTrackIndex + 1, currentTrackIndex + 1 + limit);
  }, [queue, currentTrackIndex]);

  // Move track in queue
  const moveTrackInQueue = useCallback((fromIndex, toIndex) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedTrack] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedTrack);
      
      // Update current track index if needed
      if (fromIndex === currentTrackIndex) {
        setCurrentTrackIndex(toIndex);
      } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
        setCurrentTrackIndex(prev => prev - 1);
      } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
        setCurrentTrackIndex(prev => prev + 1);
      }
      
      return newQueue;
    });
  }, [currentTrackIndex]);

  // Set current track index without toggling playback state (for SDK sync)
  const setCurrentTrackIndexDirect = useCallback((index) => {
    if (typeof index !== 'number') return;
    setCurrentTrackIndex(index);
  }, []);

  // Clear queue and play a single track atomically
  const clearAndPlayTrack = useCallback((track) => {
    const prepared = ensureTrackUri(track);
    if (!prepared?.uri) return;
    console.log('🎵 clearAndPlayTrack called with:', prepared.name);
    setIsPlaying(false); // Stop current playback first
    setQueue([prepared]);
    setCurrentTrackIndex(0);
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  }, []);

  // Clear queue and play multiple tracks atomically
  const clearAndPlayPlaylist = useCallback((tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    // Prepare list: ensure URIs, drop invalid, de-duplicate by URI
    const preparedList = tracks
      .filter(Boolean)
      .map(ensureTrackUri)
      .filter(t => t && t.uri);
    const seen = new Set();
    const deduped = preparedList.filter(t => {
      if (seen.has(t.uri)) return false;
      seen.add(t.uri);
      return true;
    });

    if (deduped.length === 0) return;

    const safeIndex = Math.max(0, Math.min(startIndex, deduped.length - 1));
    console.log('🎵 clearAndPlayPlaylist called with', deduped.length, 'tracks, starting at index', safeIndex);
    setIsPlaying(false); // Stop current playback first
    setQueue(deduped);
    setCurrentTrackIndex(safeIndex);
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  }, []);

  const value = {
    queue,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    activeDeviceId,
    setActiveDeviceId,
    setCurrentTrackIndexDirect,
    // Expose SDK/device and controls app-wide
    player,
    deviceId,
    startPlayback,
    addTrackToQueue,
    addTracksToQueue,
    addAlbumToQueue,
    removeTrackFromQueue,
    clearQueue,
    playTrackFromQueue,
    playNext,
    playPrevious,
    getCurrentTrack,
    getNextTracks,
    moveTrackInQueue,
    clearAndPlayTrack,
    clearAndPlayPlaylist,
  };

  return (
    <MusicQueueContext.Provider value={value}>
      {children}
    </MusicQueueContext.Provider>
  );
};
