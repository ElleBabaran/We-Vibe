import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";

// Compute a user's taste vector from audio features
function buildUserFeatureProfile(featuresList) {
  if (!featuresList || featuresList.length === 0) return null;
  const keys = [
    "danceability",
    "energy",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "tempo",
  ];
  const sums = Object.fromEntries(keys.map((k) => [k, 0]));
  featuresList.forEach((f) => {
    keys.forEach((k) => {
      if (typeof f[k] === "number") sums[k] += f[k];
    });
  });
  const avg = {};
  keys.forEach((k) => {
    avg[k] = sums[k] / featuresList.length;
  });
  return avg;
}

// Simple similarity: inverse normalized distance across selected features
function computeMatchPercent(userProfile, trackFeatures) {
  if (!userProfile || !trackFeatures) return 0;
  const keys = [
    "danceability",
    "energy",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
  ];
  // For tempo, normalize to 0..1 scale with a simple clamp
  const maxTempo = 200; // heuristic
  const userTempo = Math.min(1, Math.max(0, (userProfile.tempo || 0) / maxTempo));
  const trackTempo = Math.min(1, Math.max(0, (trackFeatures.tempo || 0) / maxTempo));

  let distance = 0;
  let count = 0;
  keys.forEach((k) => {
    const a = userProfile[k];
    const b = trackFeatures[k];
    if (typeof a === "number" && typeof b === "number") {
      distance += Math.abs(a - b);
      count += 1;
    }
  });
  // Include tempo
  distance += Math.abs(userTempo - trackTempo);
  count += 1;

  if (count === 0) return 0;
  const avgDistance = distance / count; // 0..1-ish
  const similarity = 1 - Math.min(1, avgDistance);
  return Math.round(similarity * 100);
}

function shuffleArray(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MadeForYou() {
  const navigate = useNavigate();
  const { clearAndPlayTrack } = useMusicQueue();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const [limit, setLimit] = useState(15); // 10 or 15 per output
  const [shuffled, setShuffled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // 1) Fetch user's top tracks and artists
        const [topTracksRes, topArtistsRes] = await Promise.all([
          fetch("https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=25", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!topTracksRes.ok || !topArtistsRes.ok) {
          throw new Error("Failed to fetch user top data");
        }

        const topTracksData = await topTracksRes.json();
        const topArtistsData = await topArtistsRes.json();
        const userTopTracks = topTracksData.items || [];
        const userTopArtists = topArtistsData.items || [];

        setTopTracks(userTopTracks);
        setTopArtists(userTopArtists);

        // 2) Fetch audio features for user's top tracks to build profile
        const trackIds = userTopTracks.slice(0, 50).map((t) => t.id).join(",");
        let featuresList = [];
        if (trackIds) {
          const featuresRes = await fetch(
            `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (featuresRes.ok) {
            const featuresData = await featuresRes.json();
            featuresList = featuresData.audio_features?.filter(Boolean) || [];
          }
        }

        const profile = buildUserFeatureProfile(featuresList);
        setUserProfile(profile);

        // 3) Seed recommendations using a mix of top tracks and artists
        const seedTracks = userTopTracks.slice(0, 2).map((t) => t.id);
        const seedArtists = userTopArtists.slice(0, 3).map((a) => a.id);
        const params = new URLSearchParams({
          limit: "50",
        });
        if (seedTracks.length) params.append("seed_tracks", seedTracks.join(","));
        if (seedArtists.length) params.append("seed_artists", seedArtists.join(","));

        const recRes = await fetch(
          `https://api.spotify.com/v1/recommendations?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!recRes.ok) throw new Error("Failed to fetch recommendations");
        const recData = await recRes.json();
        const recTracks = recData.tracks || [];

        // 4) Fetch audio features for recommended tracks to compute match %
        const recIds = recTracks.slice(0, 100).map((t) => t.id).join(",");
        let recFeaturesMap = {};
        if (recIds) {
          const recFeaturesRes = await fetch(
            `https://api.spotify.com/v1/audio-features?ids=${recIds}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (recFeaturesRes.ok) {
            const recFeaturesData = await recFeaturesRes.json();
            for (const f of recFeaturesData.audio_features || []) {
              if (f && f.id) recFeaturesMap[f.id] = f;
            }
          }
        }

        // 5) Attach match percentage to recommendations
        const withMatch = recTracks.map((t) => {
          const f = recFeaturesMap[t.id];
          const match = computeMatchPercent(profile, f);
          return { ...t, _matchPercent: match };
        });

        setRecommended(withMatch);
      } catch (e) {
        console.error(e);
        setError(e.message || "Error loading personalized data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const displayTracks = useMemo(() => {
    const base = [...recommended];
    // Sort by match desc by default
    base.sort((a, b) => (b._matchPercent || 0) - (a._matchPercent || 0));
    const sliced = base.slice(0, limit);
    if (shuffled) return shuffleArray(sliced);
    return sliced;
  }, [recommended, limit, shuffled]);

  const playTrack = (track) => {
    if (!track) return;
    clearAndPlayTrack(track);
    if (window.location.pathname !== "/playback") {
      navigate("/playback");
    }
  };

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content" style={{ padding: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: "3rem", color: "#fff", marginBottom: 6, fontWeight: 800, letterSpacing: "-0.5px" }}>Made For You</h1>
            <p style={{ color: "#b3b3b3" }}>Personalized recommendations based on your listening</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ color: "#b3b3b3", fontSize: 14 }}>Count</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              style={{
                padding: "8px 12px",
                background: "#181818",
                color: "#fff",
                borderRadius: 8,
                border: "1px solid #333",
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
            <button
              onClick={() => setShuffled((s) => !s)}
              style={{
                padding: "10px 16px",
                background: shuffled ? "#22e668" : "#1DB954",
                border: "none",
                borderRadius: 8,
                color: "#000",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {shuffled ? "Unshuffle" : "Shuffle"}
            </button>
          </div>
        </div>

        {loading && <p style={{ color: "#b3b3b3" }}>Loading your personalized recommendations...</p>}
        {error && !loading && <p style={{ color: "#ff6b6b" }}>{error}</p>}

        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
            {displayTracks.map((track) => (
              <div
                key={track.id}
                style={{
                  backgroundColor: "#181818",
                  borderRadius: 12,
                  padding: 12,
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onClick={() => playTrack(track)}
              >
                <img
                  src={track.album?.images?.[0]?.url || "/default_album.png"}
                  alt={track.name}
                  style={{ width: "100%", height: 180, borderRadius: 8, objectFit: "cover", marginBottom: 10 }}
                />
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.name}
                </p>
                <p style={{ color: "#b3b3b3", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artists?.map((a) => a.name).join(", ")}
                </p>
                <p style={{ color: "#b3b3b3", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.album?.name}
                </p>
                <p style={{ color: "#1DB954", fontSize: "0.9rem", fontWeight: 700 }}>Match: {track._matchPercent ?? 0}%</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
