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
    }
  }, [currentTrackIndex, queue.length]);

  // Play previous track
  const playPrevious = useCallback(() => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
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

  // Sync current track index to a playing track URI reported by the SDK
  const syncCurrentToUri = useCallback((uri) => {
    if (!uri) return;
    const matchIndex = queue.findIndex((track) => {
      if (!track) return false;
      const trackUri = track.uri || (track.id ? `spotify:track:${track.id}` : null);
      return trackUri === uri;
    });
    if (matchIndex !== -1 && matchIndex !== currentTrackIndex) {
      setCurrentTrackIndex(matchIndex);
    }
  }, [queue, currentTrackIndex]);

  // Clear queue and play a single track atomically
  const clearAndPlayTrack = useCallback((track) => {
    console.log('🎵 clearAndPlayTrack called with:', track.name);
    setIsPlaying(false); // Stop current playback first
    setQueue([track]);
    setCurrentTrackIndex(0);
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  }, []);

  // Clear queue and play multiple tracks atomically
  const clearAndPlayPlaylist = useCallback((tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    console.log('🎵 clearAndPlayPlaylist called with', tracks.length, 'tracks, starting at index', startIndex);
    setIsPlaying(false); // Stop current playback first
    setQueue(tracks);
    setCurrentTrackIndex(startIndex);
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
    syncCurrentToUri,
  };

  return (
    <MusicQueueContext.Provider value={value}>
      {children}
    </MusicQueueContext.Provider>
  );
};
