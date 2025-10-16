import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useMusicQueue } from "./MusicQueueContext";
import { LOCAL_MADE_FOR_YOU_TRACKS } from "./localCatalog";
import "./App.css";
import "./browse.css";

// Hashing helpers (inline, no external utils)
function hashString(input) {
  const str = String(input ?? "");
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash >>> 0) * 0x01000193;
  }
  return hash >>> 0;
}

function groupByHash(items, keySelector) {
  const buckets = Object.create(null);
  if (!Array.isArray(items)) return buckets;
  const selector = typeof keySelector === "function" ? keySelector : (x) => x;
  for (const item of items) {
    const key = selector(item);
    const h = String(hashString(key));
    if (!buckets[h]) buckets[h] = [];
    buckets[h].push(item);
  }
  return buckets;
}

class TrackCache {
  constructor() {
    this.map = new Map();
  }
  size() {
    return this.map.size;
  }
  addTrack(track) {
    if (track && track.id) this.map.set(track.id, track);
  }
  getTrack(id) {
    return this.map.get(id) || null;
  }
  has(id) {
    return this.map.has(id);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const USE_AUDIO_FEATURES = false;

const AUDIO_FEATURE_KEYS = [
  "danceability",
  "energy",
  "valence",
  "acousticness",
  "instrumentalness",
  "liveness",
  "speechiness",
];

function normalizeTempo(tempo) {
  const min = 60;
  const max = 200;
  const bounded = clamp(tempo ?? 120, min, max);
  return (bounded - min) / (max - min);
}

function computeCentroid(featuresList) {
  if (!featuresList || featuresList.length === 0) return null;

  const accum = {
    tempo: 0,
  };
  for (const key of AUDIO_FEATURE_KEYS) {
    accum[key] = 0;
  }

  for (const f of featuresList) {
    if (!f) continue;
    for (const key of AUDIO_FEATURE_KEYS) {
      accum[key] += f[key] ?? 0;
    }
    accum.tempo += normalizeTempo(f.tempo);
  }

  const count = featuresList.length;
  const centroid = { tempo: accum.tempo / count };
  for (const key of AUDIO_FEATURE_KEYS) {
    centroid[key] = accum[key] / count;
  }
  return centroid;
}

function computeSimilarityPercent(target, centroid) {
  if (!target || !centroid) return 0;

  const diffs = [];
  for (const key of AUDIO_FEATURE_KEYS) {
    const a = target[key] ?? 0;
    const b = centroid[key] ?? 0;
    diffs.push(Math.abs(a - b));
  }
  diffs.push(Math.abs(normalizeTempo(target.tempo) - (centroid.tempo ?? 0)));

  const avgDiff = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  const similarity = 1 - avgDiff;
  return Math.round(clamp(similarity * 100, 0, 100));
}

const FALLBACK_ALBUM_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231DB954" stop-opacity="0.6"/><stop offset="100%" stop-color="%231ed760" stop-opacity="0.6"/></linearGradient></defs><rect width="100%" height="100%" fill="%23181818"/><rect x="0" y="0" width="100%" height="100%" fill="url(%23g)"/></svg>';

export default function MadeForYou() {
  const navigate = useNavigate();
  const { clearAndPlayTrack } = useMusicQueue();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(15);
  const [recs, setRecs] = useState([]);
  const [seedTrackIds, setSeedTrackIds] = useState([]);
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  const trackCache = useRef(new TrackCache());
  const token = useMemo(() => localStorage.getItem("spotify_access_token"), []);

  useEffect(() => {
    loadRecommendations(limit);
  }, [token]);

  async function fetchJson(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (e) {
        if (i === retries) throw e;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  async function getUserTopTracks(max = 20) {
    const data = await fetchJson(`https://api.spotify.com/v1/me/top/tracks?limit=${max}`);
    return data.items ?? [];
  }

  async function getUserTopArtists(max = 20) {
    const data = await fetchJson(`https://api.spotify.com/v1/me/top/artists?limit=${max}`);
    return data.items ?? [];
  }

  async function getUserSavedTracks(max = 20) {
    const data = await fetchJson(`https://api.spotify.com/v1/me/tracks?limit=${max}`);
    return (data.items ?? []).map((i) => i.track).filter(Boolean);
  }

  async function findTrackByNameAndArtist(name, artistName) {
    if (!token || !name) return null;
    const query = [artistName ? `artist:${artistName}` : "", `track:${name}`].filter(Boolean).join(" ");
    try {
      const data = await fetchJson(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`);
      const found = data?.tracks?.items?.[0];
      return found || null;
    } catch (_) {
      return null;
    }
  }

  async function enrichLocalTracksWithURIs(localTracks) {
    if (!token || !Array.isArray(localTracks) || localTracks.length === 0) return localTracks;
    const results = await Promise.all(
      localTracks.map(async (t) => {
        if (t?.uri) return t;
        const primaryArtist = t?.artists?.[0]?.name || "";
        const found = await findTrackByNameAndArtist(t?.name, primaryArtist);
        if (found) {
          const recommendationScore =
            typeof t.recommendationScore === "number" ? t.recommendationScore : 50;
          return {
            ...found,
            recommendationScore,
            hash: hashString(found.id),
          };
        }
        return {
          ...t,
          hash: hashString(t.id || t.name),
        };
      })
    );
    return results;
  }

  async function loadRecommendations(targetLimit) {
    setLoading(true);
    setError("");
    try {
      if (!token) {
        setRecs(LOCAL_MADE_FOR_YOU_TRACKS.slice(0, targetLimit));
        setSeedTrackIds([]);
        return;
      }

      const [topTracksRes, savedTracksRes, topArtistsRes] = await Promise.allSettled([
        getUserTopTracks(20),
        getUserSavedTracks(20),
        getUserTopArtists(20),
      ]);

      const topTracks = topTracksRes.status === "fulfilled" ? topTracksRes.value ?? [] : [];
      const savedTracks = savedTracksRes.status === "fulfilled" ? savedTracksRes.value ?? [] : [];
      const topArtists = topArtistsRes.status === "fulfilled" ? topArtistsRes.value ?? [] : [];

      const trackSeedIds = (topTracks ?? []).slice(0, 5).map((t) => t.id);
      const fallbackSaved = (savedTracks ?? [])
        .slice(0, Math.max(0, 5 - trackSeedIds.length))
        .map((t) => t.id);
      const seedsTracks = [...trackSeedIds, ...fallbackSaved].slice(0, 5);
      const seedsArtists = (topArtists ?? []).slice(0, 5).map((a) => a.id);

      setSeedTrackIds(seedsTracks);

      const params = new URLSearchParams({ limit: String(targetLimit), market: "from_token" });
      if (seedsTracks.length > 0) {
        params.set("seed_tracks", seedsTracks.join(","));
      } else if (seedsArtists.length > 0) {
        params.set("seed_artists", seedsArtists.join(","));
      } else {
        params.set("seed_genres", "pop,rock,hip-hop");
      }

      const recData = await fetchJson(
        `https://api.spotify.com/v1/recommendations?${params.toString()}`
      );
      const recTracks = recData.tracks ?? [];

      if (recTracks.length === 0) {
        const fallbackParams = new URLSearchParams({
          limit: String(targetLimit),
          market: "from_token",
          seed_genres: "pop,rock,hip-hop,electronic,indie",
        });
        const fallbackData = await fetchJson(
          `https://api.spotify.com/v1/recommendations?${fallbackParams.toString()}`
        );
        const fallbackTracks = fallbackData.tracks ?? [];
        if (fallbackTracks.length > 0) {
          recTracks.push(...fallbackTracks);
        }
      }

      const topTrackIdSet = new Set(topTracks.map((t) => t.id));
      const savedTrackIdSet = new Set(savedTracks.map((t) => t.id));
      const topArtistIdSet = new Set(topArtists.map((a) => a.id));

      const scored = recTracks.map((track) => {
        const popularity = track.popularity ?? 0;
        const hasTopArtist = (track.artists || []).some((a) => topArtistIdSet.has(a.id));
        const inUserTracks = topTrackIdSet.has(track.id) || savedTrackIdSet.has(track.id);
        let score = Math.round(popularity * 0.6);
        if (hasTopArtist) score += 30;
        if (inUserTracks) score += 10;
        const pct = clamp(score, 0, 100);
        return { ...track, recommendationScore: pct };
      });

      const hashedTracks = scored.map((track) => ({
        ...track,
        hash: hashString(track.id),
      }));

      hashedTracks.forEach((track) => {
        trackCache.current.addTrack(track);
      });

      hashedTracks.sort((a, b) => {
        const scoreDiff = (b.recommendationScore || 0) - (a.recommendationScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.hash - b.hash;
      });

      const groupedTracks = groupByHash(hashedTracks, (track) => track.id);
      console.log(
        "Recommendations grouped by hash:",
        Object.keys(groupedTracks).length,
        "unique tracks"
      );

      if (recTracks.length === 0) {
        const fallback = LOCAL_MADE_FOR_YOU_TRACKS.slice(0, targetLimit);
        let enriched = fallback;
        try {
          enriched = await enrichLocalTracksWithURIs(fallback);
        } catch (_) {}
        setRecs(enriched);
      } else {
        setRecs(hashedTracks);
      }
    } catch (e) {
      const msg = String(e?.message || e || "");
      console.error("Recommendations error:", e);

      if (msg.includes("HTTP 401") || msg.includes("Unauthorized")) {
        setError("Authentication expired. Please re-login.");
      } else if (msg.includes("HTTP 403") || msg.includes("Forbidden")) {
        setError("Access denied. Please check your Spotify permissions.");
      } else if (msg.includes("HTTP 429") || msg.includes("Too Many Requests")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else if (msg.includes("HTTP 500") || msg.includes("Internal Server Error")) {
        setError("Spotify service temporarily unavailable. Please try again later.");
      }

      const fallback = LOCAL_MADE_FOR_YOU_TRACKS.slice(0, targetLimit);
      let enriched = fallback;
      try {
        enriched = await enrichLocalTracksWithURIs(fallback);
      } catch (_) {}
      setRecs(enriched);
    } finally {
      setLoading(false);
    }
  }

  const handleShuffle = () => {
    setRecs((prev) => shuffleArray(prev));
  };

  const handlePlay = async (track) => {
    if (!track) return;
    if (track.uri) {
      clearAndPlayTrack(track);
      if (window.location.pathname !== "/playback") {
        navigate("/playback");
      }
      return;
    }
    const primaryArtist = track?.artists?.[0]?.name || "";
    const found = await findTrackByNameAndArtist(track?.name, primaryArtist);
    if (found?.uri) {
      clearAndPlayTrack(found);
      if (window.location.pathname !== "/playback") {
        navigate("/playback");
      }
    }
  };

  const handleLimitChange = async (e) => {
    const value = Number(e.target.value);
    setLimit(value);
    await loadRecommendations(value);
  };

  const handleRefresh = async () => {
    await loadRecommendations(limit);
  };

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content">
        <div className="browse-header">
          <h1 className="browse-title">Made For You</h1>
          <p className="browse-tagline">Personalized picks based on your likes and top tracks</p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <label style={{ color: "#b3b3b3" }}>
            Show
            <select
              value={limit}
              onChange={handleLimitChange}
              style={{
                marginLeft: 8,
                background: "#181818",
                color: "#fff",
                borderRadius: 8,
                border: "1px solid #333",
                padding: "6px 10px",
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
            tracks
          </label>
          <button
            onClick={handleRefresh}
            style={{
              padding: "8px 14px",
              background: "#1DB954",
              border: "none",
              color: "#000",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Refresh
          </button>
          <button
            onClick={handleShuffle}
            style={{
              padding: "8px 14px",
              background: "#282828",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Shuffle
          </button>
          {seedTrackIds.length > 0 && (
            <span style={{ marginLeft: "auto", color: "#777", fontSize: 12 }}>
              Seeds: {seedTrackIds.slice(0, 3).join(", ")}
              {seedTrackIds.length > 3 ? "…" : ""}
            </span>
          )}
        </div>

        {error && (
          <div style={{ color: "#f66", marginBottom: 10 }}>
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              style={{
                background: "#1DB954",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading && <p style={{ color: "#b3b3b3" }}>Loading recommendations…</p>}

        {!loading && recs.length === 0 && !error && (
          <p style={{ color: "#b3b3b3" }}>No recommendations available right now.</p>
        )}

        {!loading && recs.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {recs.map((track) => (
              <div
                key={track.id}
                className="card-hover"
                style={{
                  background: "#181818",
                  borderRadius: 12,
                  padding: 14,
                  position: "relative",
                }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={track.album?.images?.[0]?.url || FALLBACK_ALBUM_IMAGE}
                    alt={track.name}
                    style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 8 }}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_ALBUM_IMAGE;
                    }}
                  />
                  {track.uri ? (
                    <button
                      onClick={() => handlePlay(track)}
                      style={{
                        position: "absolute",
                        right: 12,
                        bottom: 12,
                        background: "#1DB954",
                        color: "#000",
                        border: "none",
                        borderRadius: 999,
                        padding: "10px 14px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                      aria-label={`Play ${track.name}`}
                    >
                      ▶
                    </button>
                  ) : (
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        bottom: 12,
                        background: "#333",
                        color: "#aaa",
                        borderRadius: 999,
                        padding: "10px 14px",
                        fontWeight: 700,
                      }}
                    >
                      Offline
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    color: "#fff",
                    marginTop: 10,
                    marginBottom: 4,
                    fontSize: 16,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={track.name}
                >
                  {track.name}
                </h3>
                <p
                  style={{
                    color: "#b3b3b3",
                    fontSize: 14,
                    marginBottom: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={track.artists?.map((a) => a.name).join(", ")}
                >
                  {track.artists?.map((a) => a.name).join(", ")}
                </p>
                <div style={{ color: "#1DB954", fontWeight: 700, fontSize: 13 }}>
                  {track.recommendationScore}% match
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
