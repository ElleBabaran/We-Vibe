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
  console.log('🎵 MusicQueueProvider initializing...');
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  
  // Single global Spotify player instance
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Use refs to avoid stale closures
  const currentTrackRef = useRef(null);
  const isPlayingRef = useRef(false);
  const queueRef = useRef([]);
  const currentTrackIndexRef = useRef(0);
  
  // Update refs whenever state changes
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  
  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

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

  // This will be defined after playTrack is created
  let playTrackFromQueue;

  // Forward declarations - will be assigned after global methods are defined

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

  // These will be defined after playTrack
  let clearAndPlayTrack, clearAndPlayPlaylist;

  // Initialize global Spotify player when context loads
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    
    const initializePlayer = () => {
      if (window.Spotify && !spotifyPlayer) {
        console.log('🎵 GLOBAL: Initializing Spotify player...');
        const player = new window.Spotify.Player({
          name: 'WeVibe Global Player',
          getOAuthToken: cb => cb(token),
          volume: 0.7,
        });
        
        // Player ready
        player.addListener('ready', async ({ device_id }) => {
          console.log('🎵 GLOBAL: Player ready with device:', device_id);
          setSpotifyPlayer(player);
          setDeviceId(device_id);
          setIsPlayerReady(true);
          
          // Transfer playback to this device
          try {
            await fetch('https://api.spotify.com/v1/me/player', {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ device_ids: [device_id], play: false })
            });
          } catch (e) {
            console.warn('Device transfer failed:', e);
          }
        });
        
        // Player state changes - update position/duration only
        player.addListener('player_state_changed', (state) => {
          if (!state) return;
          
          setPositionMs(state.position || 0);
          setDurationMs(state.duration || 0);
          
          // Sync isPlaying with actual playback state
          const actuallyPlaying = !state.paused;
          if (isPlayingRef.current !== actuallyPlaying) {
            console.log('🎵 GLOBAL: Syncing play state:', actuallyPlaying);
            setIsPlaying(actuallyPlaying);
          }
        });
        
        // Error listeners
        player.addListener('initialization_error', ({ message }) => {
          console.error('Spotify player initialization error:', message);
        });
        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify player authentication error:', message);
        });
        player.addListener('account_error', ({ message }) => {
          console.error('Spotify player account error:', message);
        });
        player.addListener('playback_error', ({ message }) => {
          console.error('Spotify player playback error:', message);
        });
        
        player.connect();
      }
    };
    
    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }
  }, [spotifyPlayer]);
  
  // Update currentTrack when queue/index changes
  useEffect(() => {
    const track = queue[currentTrackIndex] || null;
    setCurrentTrack(track);
  }, [queue, currentTrackIndex]);
  
  // THE SINGLE SOURCE OF TRUTH: Play specific track
  const playTrack = useCallback(async (track) => {
    if (!track || !spotifyPlayer || !deviceId) {
      console.error('❌ GLOBAL: Cannot play track - missing requirements:', {
        hasTrack: !!track,
        hasPlayer: !!spotifyPlayer,
        hasDevice: !!deviceId
      });
      return;
    }
    
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    
    console.log('🚀 GLOBAL: Playing track:', track.name, track.uri);
    
    try {
      // 1. Activate player element (browser requirement)
      if (spotifyPlayer.activateElement) {
        await spotifyPlayer.activateElement();
      }
      
      // 2. Pause any current playback
      await spotifyPlayer.pause();
      
      // 3. Use Spotify API to start the specific track
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [track.uri], position_ms: 0 })
      });
      
      if (response.ok) {
        console.log('✅ GLOBAL: Track started successfully');
        setCurrentTrack(track);
        setIsPlaying(true);
        
        // Increment play count
        try {
          const counts = JSON.parse(localStorage.getItem('wv_play_counts') || '{}');
          counts[track.id || track.uri] = (counts[track.id || track.uri] || 0) + 1;
          localStorage.setItem('wv_play_counts', JSON.stringify(counts));
        } catch (_) {}
      } else {
        const errorText = await response.text();
        console.error('❌ GLOBAL: Play request failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ GLOBAL: playTrack error:', error);
    }
  }, [spotifyPlayer, deviceId]);
  
  // Global play/pause toggle
  const togglePlayPause = useCallback(async () => {
    if (!spotifyPlayer) {
      console.warn('⚠️ GLOBAL: No player available for play/pause');
      return;
    }
    
    try {
      if (spotifyPlayer.activateElement) {
        await spotifyPlayer.activateElement();
      }
      
      const state = await spotifyPlayer.getCurrentState();
      
      if (!state || !state.track_window?.current_track) {
        // No track loaded - start current track from queue
        const track = queueRef.current[currentTrackIndexRef.current];
        if (track) {
          console.log('🎵 GLOBAL: Starting fresh track:', track.name);
          await playTrack(track);
        }
        return;
      }
      
      // Toggle playback state
      if (state.paused) {
        console.log('▶️ GLOBAL: Resuming playback');
        await spotifyPlayer.resume();
        setIsPlaying(true);
      } else {
        console.log('⏸️ GLOBAL: Pausing playback');
        await spotifyPlayer.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('❌ GLOBAL: togglePlayPause error:', error);
    }
  }, [spotifyPlayer, playTrack]);
  
  // Global next track
  const nextTrack = useCallback(async () => {
    const queue = queueRef.current;
    const currentIndex = currentTrackIndexRef.current;
    
    if (currentIndex < queue.length - 1) {
      console.log('⏭️ GLOBAL: Going to next track');
      const nextIndex = currentIndex + 1;
      const nextTrack = queue[nextIndex];
      
      setCurrentTrackIndex(nextIndex);
      if (nextTrack) {
        await playTrack(nextTrack);
      }
    }
  }, [playTrack]);
  
  // Global previous track
  const previousTrack = useCallback(async () => {
    const currentIndex = currentTrackIndexRef.current;
    const queue = queueRef.current;
    
    if (currentIndex > 0) {
      console.log('⏮️ GLOBAL: Going to previous track');
      const prevIndex = currentIndex - 1;
      const prevTrack = queue[prevIndex];
      
      setCurrentTrackIndex(prevIndex);
      if (prevTrack) {
        await playTrack(prevTrack);
      }
    }
  }, [playTrack]);
  
  // Progress polling
  useEffect(() => {
    if (!spotifyPlayer) return;
    
    const interval = setInterval(async () => {
      try {
        const state = await spotifyPlayer.getCurrentState();
        if (state) {
          setPositionMs(state.position || 0);
          setDurationMs(state.duration || 0);
        }
      } catch (_) {}
    }, 1000);
    
    return () => clearInterval(interval);
  }, [spotifyPlayer]);
  
  // Now define playTrackFromQueue after playTrack exists
  playTrackFromQueue = useCallback(async (index) => {
    console.log('🎵 playTrackFromQueue called with index:', index);
    if (index >= 0 && index < queue.length) {
      const track = queue[index];
      setCurrentTrackIndex(index);
      if (track) {
        await playTrack(track);
      }
    }
  }, [queue, playTrack]);
  
  // Define other functions that depend on playTrack
  clearAndPlayTrack = useCallback(async (track) => {
    console.log('🎵 clearAndPlayTrack called with:', track.name);
    setQueue([track]);
    setCurrentTrackIndex(0);
    await playTrack(track);
  }, [playTrack]);

  clearAndPlayPlaylist = useCallback(async (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    console.log('🎵 clearAndPlayPlaylist called with', tracks.length, 'tracks, starting at index', startIndex);
    setQueue(tracks);
    setCurrentTrackIndex(startIndex);
    const trackToPlay = tracks[startIndex];
    if (trackToPlay) {
      await playTrack(trackToPlay);
    }
  }, [playTrack]);

  const value = {
    queue,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    currentTrack,
    positionMs,
    durationMs,
    addTrackToQueue,
    addTracksToQueue,
    addAlbumToQueue,
    removeTrackFromQueue,
    clearQueue,
    playTrackFromQueue,
    playNext: nextTrack,
    playPrevious: previousTrack,
    getCurrentTrack,
    getNextTracks,
    moveTrackInQueue,
    clearAndPlayTrack,
    clearAndPlayPlaylist,
    // Global player methods - single source of truth
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    spotifyPlayer,
    deviceId,
    isPlayerReady,
  };

  return (
    <MusicQueueContext.Provider value={value}>
      {children}
    </MusicQueueContext.Provider>
  );
};
