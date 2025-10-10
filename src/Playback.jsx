import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./App.css";

function Playback() {
  const location = useLocation();
  const navigate = useNavigate();
  const track = location.state?.track;

  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!track) {
      navigate("/home");
      return;
    }

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

        player.addListener("initialization_error", ({ message }) => console.error(message));
        player.addListener("authentication_error", ({ message }) => console.error(message));
        player.addListener("account_error", ({ message }) => console.error(message));
        player.addListener("playback_error", ({ message }) => console.error(message));

        player.connect();
      } else {
        window.onSpotifyWebPlaybackSDKReady = loadPlayer;
      }
    };

    loadPlayer();

    // Mock queue (you can replace this later)
    setQueue([
      { title: "Detox", artist: "The Weeknd" },
      { title: "Lose Control", artist: "Meduza" },
      { title: "Mind Of Me", artist: "aelhad" },
      { title: "Sunset Lover", artist: "Petit Biscuit" },
    ]);
  }, [track, navigate]);

  // Function to start playback on our player device
  const startPlayback = async () => {
    const token = localStorage.getItem("spotify_access_token");
    if (!deviceId || !track?.uri) return;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris: [track.uri] }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (player) {
      player.togglePlay();
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  // Once player is ready, start playing the selected track
  useEffect(() => {
    if (deviceId && track) {
      startPlayback();
    }
  }, [deviceId, track]);

  if (!track) return null;

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
              {track.album?.images?.[0]?.url && (
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
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
                  {track.name}
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
                  {track.album?.name ||
                    track.artists?.map((a) => a.name).join(", ")}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div
              onClick={togglePlayPause}
              style={{
                width: "100px",
                height: "100px",
                background:
                  "linear-gradient(145deg, #f0f0f8 0%, #d8d8e8 100%)",
                borderRadius: "50%",
                boxShadow:
                  "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                margin: "0 auto",
              }}
            >
              <div style={{ fontSize: "2rem", color: "#7c7cf0" }}>
                {isPlaying ? "❚❚" : "▶️"}
              </div>
            </div>
          </div>

          {/* Queue Section (unchanged) */}
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
              {queue.map((item, index) => (
                <div
                  key={index}
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
                      {item.title}
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
                      {item.artist}
                    </p>
                  </div>
                </div>
              ))}
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
