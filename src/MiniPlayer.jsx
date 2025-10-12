import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusicQueue } from './MusicQueueContext';

function MiniPlayer() {
  const navigate = useNavigate();
  const { 
    getCurrentTrack, 
    isPlaying, 
    setIsPlaying, 
    playNext, 
    playPrevious,
    queue,
    currentTrackIndex,
    canPlayNext,
    canPlayPrevious,
    repeatMode,
    toggleRepeatMode,
    autoAdvance
  } = useMusicQueue();

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const currentTrack = getCurrentTrack();

  // Show mini player when there's a current track
  useEffect(() => {
    setIsVisible(!!currentTrack);
  }, [currentTrack]);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token || !currentTrack) return;

    const loadPlayer = () => {
      if (window.Spotify && !player) {
        const spotifyPlayer = new window.Spotify.Player({
          name: "WeVibe Mini Player",
          getOAuthToken: cb => cb(token),
          volume: 0.7,
        });

        // Ready
        spotifyPlayer.addListener("ready", ({ device_id }) => {
          console.log("Mini Player ready with Device ID:", device_id);
          setDeviceId(device_id);
          setPlayer(spotifyPlayer);
        });

        // State changes
        spotifyPlayer.addListener("player_state_changed", (state) => {
          if (!state) return;
          
          const wasPlaying = isPlaying;
          const prevPosition = currentTime;
          
          setIsPlaying(!state.paused);
          setCurrentTime(state.position);
          setDuration(state.duration);
          
          // Check if track ended (position reset to 0 and track was playing)
          if (state.position === 0 && prevPosition > 10000 && wasPlaying) {
            setTimeout(() => {
              const action = autoAdvance();
              if (action === 'restart') {
                // Restart current track
                spotifyPlayer.seek(0);
              }
            }, 500); // Small delay to ensure state updates
          }
        });

        // Error handling
        spotifyPlayer.addListener("initialization_error", ({ message }) => {
          console.error("Mini Player initialization error:", message);
        });

        spotifyPlayer.addListener("authentication_error", ({ message }) => {
          console.error("Mini Player authentication error:", message);
        });

        spotifyPlayer.addListener("account_error", ({ message }) => {
          console.error("Mini Player account error:", message);
        });

        spotifyPlayer.addListener("playback_error", ({ message }) => {
          console.error("Mini Player playback error:", message);
        });

        spotifyPlayer.connect();
      }
    };

    if (window.Spotify) {
      loadPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = loadPlayer;
    }

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [currentTrack]);

  // Auto-start playback when track changes
  useEffect(() => {
    if (deviceId && currentTrack && player) {
      startPlayback();
    }
  }, [deviceId, currentTrackIndex]);

  const startPlayback = async () => {
    const token = localStorage.getItem("spotify_access_token");
    if (!deviceId || !currentTrack?.uri) return;

    try {
      const uris = queue.slice(currentTrackIndex).map(t => t.uri);
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({ uris }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        console.error("Mini Player playback error:", response.status);
      }
    } catch (error) {
      console.error("Error starting mini player playback:", error);
    }
  };

  const togglePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const handleNext = () => {
    playNext();
  };

  const handlePrevious = () => {
    playPrevious();
  };

  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const goToFullPlayer = () => {
    navigate('/playback', { state: { track: currentTrack } });
  };

  const closeMiniPlayer = () => {
    if (player) {
      player.pause();
    }
    setIsVisible(false);
  };

  if (!isVisible || !currentTrack) {
    return null;
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        backgroundColor: '#181818',
        borderTop: '1px solid #282828',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          backgroundColor: '#404040',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          if (player && duration > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            const seekPosition = percentage * duration;
            player.seek(seekPosition);
          }
        }}
      >
        <div
          style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: '#1DB954',
            transition: 'width 0.1s ease',
          }}
        />
      </div>

      {/* Track Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '1',
          minWidth: 0,
          cursor: 'pointer',
        }}
        onClick={goToFullPlayer}
      >
        {currentTrack.album?.images?.[0]?.url && (
          <img
            src={currentTrack.album.images[0].url}
            alt={currentTrack.name}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '4px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        )}
        
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.name}
          </p>
          <p
            style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.artists?.map(a => a.name).join(', ')}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 20px',
        }}
      >
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!canPlayPrevious()}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: !canPlayPrevious() ? '#404040' : '#b3b3b3',
            cursor: !canPlayPrevious() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (canPlayPrevious()) {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = '#282828';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = !canPlayPrevious() ? '#404040' : '#b3b3b3';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#1DB954',
            color: '#000',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1ed760';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1DB954';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!canPlayNext()}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: !canPlayNext() ? '#404040' : '#b3b3b3',
            cursor: !canPlayNext() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (canPlayNext()) {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = '#282828';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = !canPlayNext() ? '#404040' : '#b3b3b3';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Time Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '100px',
          fontSize: '0.8rem',
          color: '#b3b3b3',
        }}
      >
        <span>{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Volume and Additional Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginLeft: '16px',
        }}
      >
        {/* Repeat Button */}
        <button
          onClick={toggleRepeatMode}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: repeatMode === 'off' ? '#b3b3b3' : '#1DB954',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#282828';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'track' ? 'Track' : 'Queue'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
          </svg>
          {repeatMode === 'track' && (
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#1DB954',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '6px',
                fontWeight: 'bold',
                color: '#000',
              }}
            >
              1
            </div>
          )}
        </button>

        {/* Volume/Open Player Button */}
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#b3b3b3',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.backgroundColor = '#282828';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#b3b3b3';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={goToFullPlayer}
          title="Open full player"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </button>

        {/* Close Button */}
        <button
          onClick={closeMiniPlayer}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#b3b3b3',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.backgroundColor = '#e22134';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#b3b3b3';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Close mini player"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MiniPlayer;