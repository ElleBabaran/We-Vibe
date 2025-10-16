// src/ArtistView.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useMusicQueue } from "./MusicQueueContext";
import "./App.css";

export default function ArtistView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateArtist = location.state?.artist;
  const token = localStorage.getItem("spotify_access_token");
  const { clearAndPlayTrack, clearAndPlayPlaylist } = useMusicQueue();

  const [artist, setArtist] = useState(stateArtist || null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/artist");
      return;
    }

    const fetchArtistData = async () => {
      try {
        if (stateArtist) {
          setArtist(stateArtist);
          setLoading(false);
        }

        if (!token) {
          setArtist(stateArtist || sampleFallbackArtist);
          setTopTracks(sampleArtistTopTracks);
          setAlbums([]);
          setLoading(false);
          return;
        }

        // fetch artist info
        if (!stateArtist) {
          const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const artistJson = await res.json();
          setArtist(artistJson);
        }

        // top tracks (limit to 5)
        const topRes = await fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const topJson = await topRes.json();
        setTopTracks(topJson.tracks?.slice(0, 5) || []);

        // fetch artist albums
        const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=15&market=US`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const albumsJson = await albumsRes.json();
        setAlbums(albumsJson.items || []);
      } catch (err) {
        console.error("ArtistView fetch error:", err);
        setArtist(stateArtist || sampleFallbackArtist);
        setTopTracks(sampleArtistTopTracks);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id, token, stateArtist, navigate]);

  const playTrack = (track) => {
    clearAndPlayTrack(track);
    navigate("/playback");
  };

  const playAllTop = () => {
    if (!topTracks || topTracks.length === 0) return;
    clearAndPlayPlaylist(topTracks, 0);
    navigate("/playback");
  };

  if (loading) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="home-content" style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ color: "#fff" }}>Loading artist…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content" style={{ padding: 28 }}>
        {/* Artist Header */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
          <img
            src={artist?.images?.[0]?.url || FALLBACK_IMAGE}
            alt={artist?.name}
            style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 8 }}
            onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE; }}
          />
          <div>
            <h1 style={{ color: "#fff", margin: 0 }}>{artist?.name}</h1>
            <div style={{ color: "#b3b3b3", marginTop: 6 }}>
              {artist?.genres?.slice(0, 3).join(", ") || ""}
            </div>
            {artist?.followers?.total && (
              <div style={{ color: "#1DB954", marginTop: 6 }}>
                {Number(artist.followers.total).toLocaleString()} followers
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <button
                onClick={playAllTop}
                style={{
                  background: "#1DB954",
                  color: "#000",
                  padding: "10px 16px",
                  borderRadius: 20,
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ▶ Play Top Tracks
              </button>
            </div>
          </div>
        </div>

        {/* Top Tracks Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#fff", marginBottom: 12 }}>Top Tracks</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {topTracks.map((t, i) => (
              <li
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                }}
                onClick={() => playTrack(t)}
              >
                <div style={{ color: "#b3b3b3", width: 24, textAlign: "center" }}>{i + 1}</div>
                <img
                  src={t.album?.images?.[0]?.url || FALLBACK_IMAGE}
                  alt={t.name}
                  style={{ width: 56, height: 56, borderRadius: 6, objectFit: "cover" }}
                  onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 600 }}>{t.name}</div>
                  <div style={{ color: "#b3b3b3", fontSize: 13 }}>{t.album?.name}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(t);
                  }}
                  style={{
                    background: "#1DB954",
                    color: "#000",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 20,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Play
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Albums & Singles Section */}
        {albums.length > 0 && (
          <section>
            <h2 style={{ color: "#fff", marginBottom: 12 }}>Albums & Singles</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 16,
              }}
            >
              {albums.slice(0, 15).map((al) => (
                <div
                  key={al.id}
                  style={{
                    background: "#181818",
                    padding: 10,
                    borderRadius: 8,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => window.open(al.external_urls.spotify, "_blank")}
                >
                  <img
                    src={al.images?.[0]?.url || FALLBACK_IMAGE}
                    alt={al.name}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                    onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      marginTop: 8,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {al.name}
                  </div>
                  <div style={{ color: "#b3b3b3", fontSize: 12 }}>{al.release_date}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231DB954" stop-opacity="0.6"/><stop offset="100%" stop-color="%231ed760" stop-opacity="0.6"/></linearGradient></defs><rect width="100%" height="100%" fill="%23181818"/><rect x="0" y="0" width="100%" height="100%" fill="url(%23g)"/></svg>';
const sampleFallbackArtist = {
  id: "sample-a",
  name: "Sample Artist",
  images: [{ url: FALLBACK_IMAGE }],
  genres: ["pop"],
};
const sampleArtistTopTracks = [
  {
    id: "s1",
    name: "Sample Track 1",
    album: { images: [{ url: FALLBACK_IMAGE }], name: "Sample Album" },
  },
  {
    id: "s2",
    name: "Sample Track 2",
    album: { images: [{ url: FALLBACK_IMAGE }], name: "Sample Album" },
  },
];