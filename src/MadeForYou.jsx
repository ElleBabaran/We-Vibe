import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useMusicQueue } from "./MusicQueueContext";
import "./App.css";

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

// Feature flag: disable audio-features calls by default (avoids 403 in some environments)
const USE_AUDIO_FEATURES = false;

const AUDIO_FEATURE_KEYS = [
  "danceability",
  "energy",
  "valence",
  "acousticness",
  "instrumentalness",
  "liveness",
  "speechiness",
  // tempo will be normalized separately
];

function normalizeTempo(tempo) {
  // Normalize typical tempo range to 0..1 (assume 60-200 BPM)
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

  // Convert average absolute difference into a similarity percentage
  const avgDiff = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  const similarity = 1 - avgDiff; // 1.0 means identical
  return Math.round(clamp(similarity * 100, 0, 100));
}

export default function MadeForYou() {
  const navigate = useNavigate();
  const { clearAndPlayTrack } = useMusicQueue();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(15);
  const [recs, setRecs] = useState([]);
  const [seedTrackIds, setSeedTrackIds] = useState([]);

  const token = useMemo(() => localStorage.getItem("spotify_access_token"), []);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    loadRecommendations(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      // Soft-handle audio-features 403: return empty payload rather than throw
      if (url.includes('/audio-features') && res.status === 403) {
        console.warn('Audio-features forbidden (403). Proceeding without features.');
        return { audio_features: [] };
      }
      throw new Error(`HTTP ${res.status} for ${url}: ${body}`);
    }
    return res.json();
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
    // items[].track
    return (data.items ?? []).map((i) => i.track).filter(Boolean);
  }

  async function getAudioFeatures(ids) {
    if (!ids || ids.length === 0) return {};
    const unique = Array.from(new Set(ids));
    const chunks = [];
    for (let i = 0; i < unique.length; i += 100) {
      chunks.push(unique.slice(i, i + 100));
    }
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const data = await fetchJson(
            `https://api.spotify.com/v1/audio-features?ids=${chunk.join(",")}`
          );
          return data.audio_features ?? [];
        } catch (err) {
          const msg = String(err?.message || "");
          // Gracefully ignore 403 from audio-features and continue without it
          if (msg.includes("/audio-features") && msg.includes("HTTP 403")) {
            return [];
          }
          throw err;
        }
      })
    );
    const map = {};
    results.flat().forEach((f) => {
      if (f && f.id) map[f.id] = f;
    });
    return map;
  }

  async function loadRecommendations(targetLimit) {
    setLoading(true);
    setError("");
    try {
      // 1) Gather user taste profile from top/saved tracks and top artists, with per-call resilience
      const [topTracksRes, savedTracksRes, topArtistsRes] = await Promise.allSettled([
        getUserTopTracks(20),
        getUserSavedTracks(20),
        getUserTopArtists(20),
      ]);

      const topTracks = topTracksRes.status === 'fulfilled' ? (topTracksRes.value ?? []) : [];
      const savedTracks = savedTracksRes.status === 'fulfilled' ? (savedTracksRes.value ?? []) : [];
      const topArtists = topArtistsRes.status === 'fulfilled' ? (topArtistsRes.value ?? []) : [];

      // Build seeds: prefer track seeds, then artist seeds, then genre seeds
      const trackSeedIds = (topTracks ?? []).slice(0, 5).map((t) => t.id);
      const fallbackSaved = (savedTracks ?? []).slice(0, Math.max(0, 5 - trackSeedIds.length)).map((t) => t.id);
      const seedsTracks = [...trackSeedIds, ...fallbackSaved].slice(0, 5);
      const seedsArtists = (topArtists ?? []).slice(0, 5).map(a => a.id);

      // Expose seed IDs for UI hinting
      setSeedTrackIds(seedsTracks);

      // 2) Fetch recommendations using whatever seeds are available
      const params = new URLSearchParams({ limit: String(targetLimit), market: 'from_token' });
      if (seedsTracks.length > 0) {
        params.set('seed_tracks', seedsTracks.join(','));
      } else if (seedsArtists.length > 0) {
        params.set('seed_artists', seedsArtists.join(','));
      } else {
        // Fallback to genre seeds that are broadly available
        params.set('seed_genres', 'pop,rock,hip-hop');
      }
      const recData = await fetchJson(`https://api.spotify.com/v1/recommendations?${params.toString()}`);
      const recTracks = recData.tracks ?? [];

      // 3) Score recommendations using metadata-only fallback (no audio-features)
      const topTrackIdSet = new Set(topTracks.map(t => t.id));
      const savedTrackIdSet = new Set(savedTracks.map(t => t.id));
      const topArtistIdSet = new Set(topArtists.map(a => a.id));

      const scored = recTracks.map((track) => {
        const popularity = track.popularity ?? 0; // 0..100
        const hasTopArtist = (track.artists || []).some(a => topArtistIdSet.has(a.id));
        const inUserTracks = topTrackIdSet.has(track.id) || savedTrackIdSet.has(track.id);
        let score = Math.round(popularity * 0.6); // up to 60 from popularity
        if (hasTopArtist) score += 30;            // +30 if artist is among user's top artists
        if (inUserTracks) score += 10;            // +10 if the exact track is in user's set
        const pct = clamp(score, 0, 100);
        return { ...track, recommendationScore: pct };
      });

      // Sort by score desc by default
      scored.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
      setRecs(scored);
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (msg.includes('/audio-features') || msg.includes('HTTP 403')) {
        console.warn('Proceeding with fallback after API error:', msg);
        setError("");
      } else {
        console.error(e);
        setError("Failed to load recommendations. Please refresh or re-login.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleShuffle = () => {
    setRecs((prev) => shuffleArray(prev));
  };

  const handlePlay = (track) => {
    if (!track) return;
    clearAndPlayTrack(track);
    if (window.location.pathname !== "/playback") {
      navigate("/playback");
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
        <div className="welcome-header" style={{ marginBottom: 24 }}>
          <h1 className="welcome-title" style={{
            fontFamily: '\'Plus Jakarta Sans\', system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
            fontWeight: 800,
            fontSize: '2.2rem',
            color: '#1DB954',
          }}>
            Made For You
          </h1>
          <p style={{ color: '#b3b3b3' }}>Personalized picks based on your likes and top tracks</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <label style={{ color: '#b3b3b3' }}>
            Show
            <select value={limit} onChange={handleLimitChange} style={{ marginLeft: 8, background: '#181818', color: '#fff', borderRadius: 8, border: '1px solid #333', padding: '6px 10px' }}>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
            tracks
          </label>
          <button onClick={handleRefresh} style={{ padding: '8px 14px', background: '#1DB954', border: 'none', color: '#000', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
          <button onClick={handleShuffle} style={{ padding: '8px 14px', background: '#282828', border: '1px solid #333', color: '#fff', borderRadius: 8, cursor: 'pointer' }}>Shuffle</button>
          {seedTrackIds.length > 0 && (
            <span style={{ marginLeft: 'auto', color: '#777', fontSize: 12 }}>
              Seeds: {seedTrackIds.slice(0, 3).join(', ')}{seedTrackIds.length > 3 ? '…' : ''}
            </span>
          )}
        </div>

        {loading && <p style={{ color: '#b3b3b3' }}>Loading recommendations…</p>}
        {error && !loading && (
          <div style={{ color: '#ff7b7b', marginBottom: 16 }}>Error: {error}</div>
        )}

        {!loading && recs.length === 0 && !error && (
          <p style={{ color: '#b3b3b3' }}>No recommendations available right now.</p>
        )}

        {!loading && recs.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: 20 
          }}>
            {recs.map((track) => (
              <div key={track.id} className="card-hover" style={{
                background: '#181818',
                borderRadius: 12,
                padding: 14,
                position: 'relative',
              }}>
                {track.album?.images?.[0]?.url && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={track.album.images[0].url}
                      alt={track.name}
                      style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <button
                      onClick={() => handlePlay(track)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        bottom: 12,
                        background: '#1DB954',
                        color: '#000',
                        border: 'none',
                        borderRadius: 999,
                        padding: '10px 14px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      aria-label={`Play ${track.name}`}
                    >
                      ▶
                    </button>
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontWeight: 700, color: '#fff', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</p>
                  <p style={{ color: '#b3b3b3', fontSize: 13, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.artists?.map((a) => a.name).join(', ')}
                  </p>
                  <p style={{ color: '#999', fontSize: 12, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.album?.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      flex: 1,
                      height: 6,
                      background: '#2a2a2a',
                      borderRadius: 6,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${track.recommendationScore ?? 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #1DB954, #1ed760)'
                      }} />
                    </div>
                    <span style={{ color: '#b3b3b3', fontSize: 12 }}>{track.recommendationScore ?? 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
