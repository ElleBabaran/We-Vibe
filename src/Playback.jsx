import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import "./App.css";

function Playback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    queue, 
    currentTrackIndex, 
    isPlaying, 
    setIsPlaying, 
    getCurrentTrack, 
    getNextTracks, 
    playNext, 
    playPrevious,
    removeTrackFromQueue,
    addTrackToQueue,
    playTrackFromQueue,
    clearAndPlayTrack,
    syncCurrentToUri
  } = useMusicQueue();

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [fallbackTracks, setFallbackTracks] = useState([]);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [sortMode, setSortMode] = useState("queue"); // queue | mostPlayed | az

  // Small utility to wait between retries
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    // Initialize Spotify Web Playback SDK
    let sdkPlayer = null;
    const loadPlayer = () => {
      if (window.Spotify) {
        const player = new window.Spotify.Player({
          name: "WeVibe Player",
          getOAuthToken: cb => cb(token),
          volume: 0.7,
        });
        sdkPlayer = player;

        // Listeners
        player.addListener("ready", async ({ device_id }) => {
          console.log("Spotify Player ready with Device ID:", device_id);
          setDeviceId(device_id);
          setPlayer(player);
          try {
            localStorage.setItem("spotify_device_id", device_id);
          } catch (_) {}

          // Attempt to transfer playback to this Web Playback SDK device
          try {
            const res = await fetch("https://api.spotify.com/v1/me/player", {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ device_ids: [device_id], play: false })
            });
            if (!res.ok) {
              const text = await res.text();
              console.warn("Failed to transfer playback to SDK device:", res.status, text);
            }
          } catch (e) {
            console.warn("Transfer playback request failed", e);
          }
        });

        player.addListener("not_ready", ({ device_id }) => {
          console.warn("Device ID has gone offline", device_id);
          try {
            const stored = localStorage.getItem("spotify_device_id");
            if (stored === device_id) localStorage.removeItem("spotify_device_id");
          } catch (_) {}
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
          
          const currentlyPlaying = !state.paused;
          console.log('🎵 Player state changed:', { 
            paused: state.paused, 
            trackName: state.track_window?.current_track?.name 
          });
          
          // Only update isPlaying if it's different to avoid loops
          setIsPlaying(prev => {
            if (prev !== currentlyPlaying) {
              console.log('🎵 Updating isPlaying from', prev, 'to', currentlyPlaying);
              return currentlyPlaying;
            }
            return prev;
          });

          // Keep queue index in sync with the SDK's current track
          const trackUri = state.track_window?.current_track?.uri;
          if (trackUri) {
            try { syncCurrentToUri(trackUri); } catch (_) {}
          }
          
          if (typeof state.position === "number") setPositionMs(state.position);
          if (typeof state.duration === "number") setDurationMs(state.duration);
        });

        player.connect();
      } else {
        console.log("Spotify SDK not loaded, waiting...");
        window.onSpotifyWebPlaybackSDKReady = loadPlayer;
      }
    };

    // Wait for Spotify SDK to load
    let timer;
    if (window.Spotify) {
      loadPlayer();
    } else {
      // Retry after a short delay
      timer = setTimeout(() => {
        if (window.Spotify) {
          loadPlayer();
        } else {
          console.error("Spotify SDK failed to load");
        }
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      try {
        sdkPlayer?.disconnect();
      } catch (_) {}
    };
    
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
    const track = queue[currentTrackIndex] || null;
    setCurrentTrack(track);
  }, [queue, currentTrackIndex]);
  
  // Handle playback - start when track and isPlaying are both true
  useEffect(() => {
    console.log('🎵 Playback useEffect triggered:', {
      hasDevice: !!deviceId,
      hasTrack: !!currentTrack,
      isPlaying: isPlaying,
      hasPlayer: !!player,
      trackUri: currentTrack?.uri
    });
    
    if (deviceId && currentTrack && isPlaying && player && currentTrack.uri) {
      console.log('▶️ Starting playback:', currentTrack.name);

      const maybeStart = async () => {
        try {
          const state = await player.getCurrentState?.();
          const alreadyPlayingThis = state && !state.paused && (state.track_window?.current_track?.uri === currentTrack.uri);
          if (alreadyPlayingThis) {
            console.log('⏭️ Already playing current track, skipping restart');
            return;
          }
        } catch (_) {}
        try {
          await startPlayback(currentTrack);
        } catch (error) {
          console.error('Playback failed:', error);
        }
      };

      const t = setTimeout(() => { maybeStart(); }, 200);
      return () => clearTimeout(t);
    } else if (deviceId && currentTrack && !isPlaying && player) {
      // If isPlaying is false, pause the player
      console.log('⏸️ Pausing playback');
      player.pause?.().catch(err => console.warn('Pause failed:', err));
    }
  }, [currentTrack, isPlaying, deviceId, player]);

  // Smooth progress polling
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(async () => {
      try {
        const state = await player.getCurrentState();
        if (!state) return;
          setIsPlaying(!state.paused);
          setPositionMs(state.position || 0);
          setDurationMs(state.duration || 0);
      } catch (_) {
        // no-op
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, setIsPlaying]);

  // Function to start playback on our player device
  const startPlayback = async (trackToPlay = currentTrack) => {
    const token = localStorage.getItem("spotify_access_token");
    console.log('🎵 startPlayback called with:', {
      trackName: trackToPlay?.name,
      trackUri: trackToPlay?.uri,
      deviceId: !!deviceId,
      hasToken: !!token
    });
    
    if (!deviceId || !trackToPlay?.uri) {
      console.log("❌ Missing deviceId or track URI:", { deviceId, trackUri: trackToPlay?.uri });
      return;
    }

    try {
      console.log("🎵 Starting playback for track:", trackToPlay.name);
      
      // First, ensure any current playback is stopped
      try {
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
        // Wait a moment for the pause to take effect
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn('Failed to pause current playback:', e);
      }
      // increment play count
      try {
        const countsRaw = localStorage.getItem("wv_play_counts");
        const counts = countsRaw ? JSON.parse(countsRaw) : {};
        const key = trackToPlay.id || trackToPlay.uri;
        counts[key] = (counts[key] || 0) + 1;
        localStorage.setItem("wv_play_counts", JSON.stringify(counts));
      } catch (_) {}
      
      // Ensure SDK device is active before trying to play
      try {
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ device_ids: [deviceId], play: false })
        });
      } catch (e) {
        console.warn("Device transfer before play failed", e);
      }

      // If we have a queue, play from the current track
      if (queue.length > 0) {
        const currentIndex = currentTrackIndex;
        // Spotify API has practical limits; avoid sending very large payloads
        const MAX_URIS = 100;
        const uris = queue
          .slice(currentIndex, currentIndex + MAX_URIS)
          .map(t => t.uri)
          .filter(Boolean);
        console.log("Starting queue playback with up to", uris.length, "URIs");

        let response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: "PUT",
          body: JSON.stringify({ uris }),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Fallback to single-track start if the bulk request fails
        if (!response.ok) {
          const errorText = await response.text();
          console.warn("Bulk play failed, falling back to single track:", response.status, errorText);
          response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            body: JSON.stringify({ uris: [trackToPlay.uri] }),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            const text2 = await response.text();
            console.error("Single-track fallback failed:", response.status, text2);
          }
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

      // Give the SDK a moment and verify it actually started
      await sleep(500);
      try {
        const state = await player.getCurrentState?.();
        if (state && !state.paused) {
          console.log('✅ Playback successfully started');
          return;
        } else {
          console.log('⚠️ Playback might not have started, attempting toggle');
          await player.togglePlay?.();
        }
      } catch (e) {
        console.warn('Failed to verify playback state:', e);
      }
    } catch (error) {
      console.error("Error starting playback:", error);
    }
  };

  const togglePlayPause = async () => {
    if (!player) return;

    try {
      // Required by browsers: must be called from a user gesture
      if (player.activateElement) {
        await player.activateElement();
      }

      const state = await player.getCurrentState();

      // If nothing is loaded yet but we have a track queued, start it
      if (!state || (!state.track_window?.current_track && currentTrack)) {
        await startPlayback(currentTrack);
        return;
      }

      await player.togglePlay();
    } catch (e) {
      console.warn("togglePlayPause failed, attempting direct start", e);
      try {
        if (currentTrack) {
          await startPlayback(currentTrack);
        }
      } catch (_) {}
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

  const handleNext = async () => {
    // Skip SDK and use our queue directly for more reliable behavior
    if (currentTrackIndex < queue.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      const nextTrack = queue[nextIndex];
      
      if (nextTrack) {
        playNext(); // Update the context state
        setCurrentTrack(nextTrack); // Update local state immediately
        await startPlayback(nextTrack); // Start playing the new track
      }
    }
  };

  const handlePrevious = async () => {
    // Skip SDK and use our queue directly for more reliable behavior
    if (currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      const prevTrack = queue[prevIndex];
      
      if (prevTrack) {
        playPrevious(); // Update the context state
        setCurrentTrack(prevTrack); // Update local state immediately
        await startPlayback(prevTrack); // Start playing the new track
      }
    }
  };

  const toggleLoop = async () => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token || !deviceId) return;
    const next = !isLooping;
    try {
      const state = next ? "track" : "off";
      const res = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${state}&device_id=${deviceId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("repeat api failed");
      setIsLooping(next);
    } catch (e) {
      console.error("Loop toggle failed", e);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };


  // Get tracks to display: prioritize queue, fall back to unique fallback tracks
  let baseTracks;
  if (queue.length > 0) {
    baseTracks = queue;
  } else {
    baseTracks = fallbackTracks;
  }
  
  // Remove duplicates based on track ID or URI
  const uniqueTracks = baseTracks.filter((track, index) => {
    if (!track) return false;
    return baseTracks.findIndex(t => 
      (t?.id && t.id === track?.id) || (t?.uri && t.uri === track?.uri)
    ) === index;
  });
  
  let displayTracks = uniqueTracks;
  const handleClickUpNext = async (track) => {
    if (!track) return;
    // Try to locate this track in the actual queue by id/uri
    const matchIndex = queue.findIndex(
      (t) => (t?.id && t.id === track.id) || (t?.uri && t.uri === track.uri)
    );

    if (matchIndex >= 0) {
      // Found in queue - just update the index (useEffect will handle playback)
      playTrackFromQueue(matchIndex);
      return;
    }

    // Not in queue (likely from fallback list). Clear queue and play it.
    clearAndPlayTrack(track);
  };

  try {
    if (sortMode === "az") {
      displayTracks = [...baseTracks].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else if (sortMode === "mostPlayed") {
      const countsRaw = localStorage.getItem("wv_play_counts");
      const counts = countsRaw ? JSON.parse(countsRaw) : {};
      displayTracks = [...baseTracks].sort((a, b) => {
        const ka = a?.id || a?.uri;
        const kb = b?.id || b?.uri;
        return (counts[kb] || 0) - (counts[ka] || 0);
      });
    }
  } catch (_) {}

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
              <div onClick={handleSeek} style={{
                width: "100%",
                height: "4px",
                backgroundColor: "#e0e0e0",
                borderRadius: "2px",
                overflow: "hidden",
                cursor: durationMs ? "pointer" : "default"
              }}>
                <div style={{
                  width: `${durationMs ? Math.min(100, (positionMs / durationMs) * 100) : 0}%`,
                    height: "100%",
                    backgroundColor: "#1DB954",
                    borderRadius: "2px",
                  transition: "width 0.3s linear"
                }}></div>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
                fontSize: "0.8rem",
                color: "#666"
              }}>
                <span>{formatDuration(positionMs || 0)}</span>
                <span>{formatDuration(durationMs || 0)}</span>
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
                onClick={toggleLoop}
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: isLooping ? "#1DB954" : "#fff",
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
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill={isLooping ? "#fff" : "#666"}/>
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

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <label htmlFor="wv-sort" style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>Sort:</label>
              <select
                id="wv-sort"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                style={{
                  background: "#181818",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "6px 10px"
                }}
              >
                <option value="queue">Queue Order</option>
                <option value="mostPlayed">Most Played</option>
                <option value="az">A–Z</option>
              </select>
            </div>

            <div className="upnext-scroll" style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "6px" }}>
              {displayTracks.length === 0 ? (
                <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '20px' }}>
                  No tracks available
                </p>
              ) : (
                displayTracks.map((track, displayIndex) => {
                  // Find the actual index of this track in the original queue
                  const actualIndex = queue.length > 0 ? queue.findIndex(t => 
                    (t?.id && t.id === track?.id) || (t?.uri && t.uri === track?.uri)
                  ) : -1;
                  const isCurrentTrack = actualIndex >= 0 && actualIndex === currentTrackIndex;
                  
                  return (
                    <div
                      key={track.id || displayIndex}
                      onClick={() => handleClickUpNext(track)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "12px",
                        backgroundColor: isCurrentTrack ? "#1DB954" : "#181818",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        opacity: isCurrentTrack ? 0.9 : 1,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = isCurrentTrack ? "#1ed760" : "#282828")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isCurrentTrack ? "#1DB954" : "#181818")
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
                        ${displayIndex === 0
                          ? "#7c9fff, #a8b8ff"
                          : displayIndex === 1
                          ? "#d896ff, #f0a8ff"
                          : displayIndex === 2
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
                  );
                })
              )}
            </div>


            <button
              onClick={() => navigate('/browse')}
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
