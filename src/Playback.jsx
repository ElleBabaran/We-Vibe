import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import "./App.css";

function Playback() {
  const location = useLocation();
  const navigate = useNavigate();
  const track = location.state?.track;
  const { 
    queue, 
    currentTrackIndex, 
    isPlaying, 
    setIsPlaying, 
    getCurrentTrack, 
    getNextTracks, 
    playNext, 
    playPrevious,
    removeTrackFromQueue 
  } = useMusicQueue();

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [fallbackTracks, setFallbackTracks] = useState([]);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    // Initialize Spotify Web Playback SDK
    const loadPlayer = () => {
      if (window.Spotify) {
        const player = new window.Spotify.Player({
          name: "WeVibe Player",
          getOAuthToken: cb => cb(token),
          volume: 0.7,
        });

        // Listeners
        player.addListener("ready", ({ device_id }) => {
          console.log("Spotify Player ready with Device ID:", device_id);
          setDeviceId(device_id);
          setPlayer(player);
        });

        player.addListener("not_ready", ({ device_id }) => {
          console.warn("Device ID has gone offline", device_id);
        });

        player.addListener("initialization_error", ({ message }) => {
          console.error("Initialization error:", message);
        });
        player.addListener("authentication_error", ({ message }) => {
          console.error("Authentication error:", message);
        });
        player.addListener("account_error", ({ message }) => {
          console.error("Account error:", message);
        });
        player.addListener("playback_error", ({ message }) => {
          console.error("Playback error:", message);
        });

        // Listen for track changes
        player.addListener("player_state_changed", (state) => {
          if (!state) return;
          setIsPlaying(!state.paused);
          if (typeof state.position === "number") {
            setPositionMs(state.position);
          }
          if (typeof state.duration === "number") {
            setDurationMs(state.duration);
          }
        });

        player.connect();
      } else {
        console.log("Spotify SDK not loaded, waiting...");
        window.onSpotifyWebPlaybackSDKReady = loadPlayer;
      }
    };

    // Wait for Spotify SDK to load
    if (window.Spotify) {
      loadPlayer();
    } else {
      // Retry after a short delay
      const timer = setTimeout(() => {
        if (window.Spotify) {
    loadPlayer();
        } else {
          console.error("Spotify SDK failed to load");
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Fetch fallback tracks when no queue exists
    fetchFallbackTracks(token);
  }, [navigate]);

  const fetchFallbackTracks = async (token) => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=5",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setFallbackTracks(data.items?.map(item => item.track) || []);
    } catch (error) {
      console.error("Error fetching fallback tracks:", error);
    }
  };

  // Update current track when queue changes
  useEffect(() => {
    const track = getCurrentTrack();
    setCurrentTrack(track);
  }, [getCurrentTrack, currentTrackIndex]);

  // Poll player state for smooth progress updates
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(async () => {
      try {
        const state = await player.getCurrentState();
        if (state) {
          setIsPlaying(!state.paused);
          setPositionMs(state.position || 0);
          setDurationMs(state.duration || 0);
        }
      } catch (err) {
        // no-op
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player, setIsPlaying]);

  // Function to start playback on our player device
  const startPlayback = async (trackToPlay = currentTrack) => {
    const token = localStorage.getItem("spotify_access_token");
    if (!deviceId || !trackToPlay?.uri) {
      console.log("Missing deviceId or track URI:", { deviceId, trackUri: trackToPlay?.uri });
      return;
    }

    try {
      console.log("Starting playback for track:", trackToPlay.name);
      
      // If we have a queue, play the entire queue starting from current track
      if (queue.length > 0) {
        const currentIndex = currentTrackIndex;
        const uris = queue.slice(currentIndex).map(t => t.uri);
        console.log("Playing queue with URIs:", uris);
        
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: "PUT",
          body: JSON.stringify({ uris }),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Playback API error:", response.status, errorData);
        }
      } else {
        // Play single track
        console.log("Playing single track:", trackToPlay.uri);
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
          body: JSON.stringify({ uris: [trackToPlay.uri] }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Playback API error:", response.status, errorData);
        }
      }
    setIsPlaying(true);
    } catch (error) {
      console.error("Error starting playback:", error);
    }
  };

  const togglePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const handleSeek = async (e) => {
    if (!player || !durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
    const newPosition = Math.floor(ratio * durationMs);
    try {
      await player.seek(newPosition);
      setPositionMs(newPosition);
    } catch (error) {
      console.error("Seek error:", error);
    }
  };

  const handleNext = () => {
    playNext();
  };

  const handlePrevious = () => {
    playPrevious();
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  // Once player is ready, start playing the current track
  useEffect(() => {
    if (deviceId && currentTrack) {
      startPlayback();
    }
  }, [deviceId, currentTrack]);

  // Get next tracks for the queue display
  const nextTracks = getNextTracks(5);
  const displayTracks = nextTracks.length > 0 ? nextTracks : fallbackTracks;

  if (!currentTrack) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="home-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#b3b3b3', fontSize: '1.2rem', marginBottom: '20px' }}>
              No track selected. Go back to browse music.
            </p>
            <button
              onClick={() => navigate('/home')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              🏠 Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = durationMs ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <div className="home-container">
      <Sidebar />

      <div
        className="home-content"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "60px",
            alignItems: "center",
            maxWidth: "1200px",
            width: "100%",
          }}
        >
          {/* 🎵 iPod-style Player */}
          <div
            style={{
              background: "linear-gradient(145deg, #e8e8f0 0%, #d4d4e0 100%)",
              borderRadius: "32px",
              padding: "30px",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
              width: "380px",
              border: "8px solid #b8b8c8",
              position: "relative",
            }}
          >
            {/* Screen */}
            <div
              style={{
                background: "linear-gradient(180deg, #f5f5f8 0%, #e8e8f0 100%)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "30px",
                boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.15)",
                border: "3px solid #a8a8b8",
                minHeight: "280px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              {currentTrack.album?.images?.[0]?.url && (
                <img
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.name}
                  style={{
                    width: "140px",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                />
              )}

              <div style={{ textAlign: "center", width: "100%" }}>
                <h2
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#2c2c3c",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentTrack.name}
                </h2>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#6c6c7c",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentTrack.album?.name ||
                    currentTrack.artists?.map((a) => a.name).join(", ")}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              <div
                onClick={handleSeek}
                style={{
                  width: "100%",
                  height: "4px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "2px",
                  overflow: "hidden",
                  cursor: durationMs ? "pointer" : "default",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    backgroundColor: "#1DB954",
                    borderRadius: "2px",
                    transition: "width 0.3s linear",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "0.8rem",
                  color: "#666",
                }}
              >
                <span>{formatDuration(positionMs)}</span>
                <span>{formatDuration(durationMs)}</span>
              </div>
            </div>

            {/* iPod-style Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" fill="#666"/>
                </svg>
              </button>

              {/* Main Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  border: "none",
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 12px 35px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)";
                }}
              >
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#666"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="#666"/>
                  </svg>
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="#666"/>
                </svg>
              </button>
            </div>

            {/* Loop Button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
              <button
                onClick={() => {/* Loop functionality */}}
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="#666"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Queue Section */}
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                marginBottom: "30px",
                color: "#fff",
                letterSpacing: "-0.5px",
              }}
            >
              Up Next
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {displayTracks.length === 0 ? (
                <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '20px' }}>
                  No tracks available
                </p>
              ) : (
                displayTracks.map((track, index) => (
                  <div
                    key={track.id || index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "12px",
                    backgroundColor: "#181818",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#282828")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#181818")
                  }
                >
                    {track.album?.images?.[0]?.url ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        style={{
                          width: "56px",
                          height: "56px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "8px",
                      background: `linear-gradient(135deg, 
                        ${index === 0
                          ? "#7c9fff, #a8b8ff"
                          : index === 1
                          ? "#d896ff, #f0a8ff"
                          : index === 2
                          ? "#b8a8ff, #d8c0ff"
                          : "#ffa8c8, #ffc0d8"})`,
                      flexShrink: 0,
                    }}
                  ></div>
                    )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "1rem",
                        color: "#fff",
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                        {track.name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#b3b3b3",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                        {track.artists?.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </div>
                ))
              )}
            </div>


            <button
              onClick={() => navigate(-1)}
              style={{
                marginTop: "40px",
                padding: "12px 32px",
                backgroundColor: "transparent",
                color: "#b3b3b3",
                border: "2px solid #b3b3b3",
                borderRadius: "24px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ← Back to Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Playback;
