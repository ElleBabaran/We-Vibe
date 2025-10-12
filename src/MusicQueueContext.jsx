import { createContext, useContext, useState, useCallback } from 'react';

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
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'track', 'queue'
  const [shuffleMode, setShuffleMode] = useState(false);

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
    if (index >= 0 && index < queue.length) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  }, [queue.length]);

  // Play next track
  const playNext = useCallback(() => {
    if (repeatMode === 'track') {
      // Stay on current track
      return;
    }
    
    if (currentTrackIndex < queue.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else if (repeatMode === 'queue') {
      // Loop back to first track
      setCurrentTrackIndex(0);
    }
    // If repeatMode is 'off' and we're at the end, do nothing (stop playing)
  }, [currentTrackIndex, queue.length, repeatMode]);

  // Play previous track
  const playPrevious = useCallback(() => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    } else if (repeatMode === 'queue') {
      // Loop back to last track
      setCurrentTrackIndex(queue.length - 1);
    }
  }, [currentTrackIndex, queue.length, repeatMode]);

  // Auto-advance to next track (called when a track ends)
  const autoAdvance = useCallback(() => {
    if (repeatMode === 'track') {
      // Restart the current track
      return 'restart';
    } else if (currentTrackIndex < queue.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      return 'next';
    } else if (repeatMode === 'queue') {
      setCurrentTrackIndex(0);
      return 'next';
    } else {
      // End of queue, stop playing
      setIsPlaying(false);
      return 'stop';
    }
  }, [currentTrackIndex, queue.length, repeatMode]);

  // Toggle repeat mode
  const toggleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      switch (prev) {
        case 'off': return 'queue';
        case 'queue': return 'track';
        case 'track': return 'off';
        default: return 'off';
      }
    });
  }, []);

  // Toggle shuffle mode
  const toggleShuffleMode = useCallback(() => {
    setShuffleMode(prev => !prev);
  }, []);

  // Check if we can go to next track
  const canPlayNext = useCallback(() => {
    return currentTrackIndex < queue.length - 1 || repeatMode === 'queue';
  }, [currentTrackIndex, queue.length, repeatMode]);

  // Check if we can go to previous track
  const canPlayPrevious = useCallback(() => {
    return currentTrackIndex > 0 || repeatMode === 'queue';
  }, [currentTrackIndex, repeatMode]);

  // Get current track
  const getCurrentTrack = useCallback(() => {
    return queue[currentTrackIndex] || null;
  }, [queue, currentTrackIndex]);

  // Get next tracks in queue
  const getNextTracks = useCallback((limit = 5) => {
    return queue.slice(currentTrackIndex + 1, currentTrackIndex + 1 + limit);
  }, [queue, currentTrackIndex]);

  const value = {
    queue,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    repeatMode,
    shuffleMode,
    addTrackToQueue,
    addTracksToQueue,
    addAlbumToQueue,
    removeTrackFromQueue,
    clearQueue,
    playTrackFromQueue,
    playNext,
    playPrevious,
    autoAdvance,
    toggleRepeatMode,
    toggleShuffleMode,
    canPlayNext,
    canPlayPrevious,
    getCurrentTrack,
    getNextTracks,
  };

  return (
    <MusicQueueContext.Provider value={value}>
      {children}
    </MusicQueueContext.Provider>
  );
};
