// src/Artists.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
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

class ArtistCache {
  constructor() {
    this.map = new Map();
  }
  size() {
    return this.map.size;
  }
  addArtist(artist) {
    if (artist && artist.id) this.map.set(artist.id, artist);
  }
  getArtist(id) {
    return this.map.get(id) || null;
  }
  has(id) {
    return this.map.has(id);
  }
}

export default function Artists() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'az', 'za'
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hash table for artist caching
  const artistCache = useRef(new ArtistCache());
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  // Handle URL hash for sorting
  useEffect(() => {
    const hash = location.hash.substring(1); // Remove the # symbol
    if (hash === 'az' || hash === 'za' || hash === 'popular') {
      setSortBy(hash);
    }
  }, [location.hash]);

  // Sort artists based on current sortBy state using hash-based comparison
  const sortedArtists = [...trending].sort((a, b) => {
    switch (sortBy) {
      case 'az':
        return a.name.localeCompare(b.name);
      case 'za':
        return b.name.localeCompare(a.name);
      case 'popular':
      default:
        // Sort by follower count descending; tie-breaker by hash for stability
        const aFollowers = a.followers?.total || 0;
        const bFollowers = b.followers?.total || 0;
        if (aFollowers !== bFollowers) {
          return bFollowers - aFollowers;
        }
        return hashString(a.id) - hashString(b.id);
    }
  });

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    // Update URL hash
    navigate(`/artist#${newSort}`, { replace: true });
  };

  useEffect(() => {
        // Prefer artists captured from Browse results if available
    try {
      const stored = localStorage.getItem('browse_last_artists');
      if (stored) {
        const parsed = JSON.parse(stored) || [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.slice(0, 20).map(a => ({
            id: a.id,
            name: a.name,
            images: a.images || [],
            genres: a.genres || [],
            followers: a.followers || null,
            external_urls: a.external_urls || null,
            hash: hashString(a.id),
          }));
          setTrending(mapped);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}
    const token = localStorage.getItem("spotify_access_token");

    // If no token, show fallback sample list
    if (!token) {
      setTrending(sampleTrendingArtists.slice(0, 20));
      setLoading(false);
      return;
    }

    const fetchTrending = async () => {
      try {
        // Strategy:
        // 1) Get featured playlists to find current trending content
        // 2) Fetch a few tracks from each playlist and collect artists
        // 3) Deduplicate artists and take the top 20
        const featuredRes = await fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=8", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const featuredJson = await featuredRes.json();
        const playlists = featuredJson.playlists?.items || [];

        const trackFetches = playlists.map((pl) =>
          fetch(`https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=6`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .catch(() => null)
        );

        const tracksResults = await Promise.all(trackFetches);

        const artistCandidates = [];
        tracksResults.forEach((res) => {
          (res?.items || []).forEach((item) => {
            const track = item.track;
            if (track?.artists) {
              track.artists.forEach((a) => artistCandidates.push(a));
            }
          });
        });

        // If not enough found, fallback to searching artists
        if (artistCandidates.length < 12) {
          const searchRes = await fetch("https://api.spotify.com/v1/search?q=top%20artists&type=artist&limit=40", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const searchJson = await searchRes.json();
          artistCandidates.push(...(searchJson.artists?.items || []));
        }

        // Dedupe by id and fetch full artist objects where needed
        const uniqueIds = [];
        const deduped = [];
        for (const a of artistCandidates) {
          if (!a || !a.id) continue;
          if (!uniqueIds.includes(a.id)) {
            uniqueIds.push(a.id);
            deduped.push(a);
            if (uniqueIds.length >= 40) break; // gather extra to ensure high-quality picks
          }
        }

        // If deduped items are simple artist stubs, we will accept them; otherwise try to fetch details for the first 20
        const trimmed = deduped.slice(0, 20);
        // Some items already have images & followers; if some lack data, fetch artist details in a batch
        const needDetailIds = trimmed.filter(a => !a.images || a.images.length === 0).map(a => a.id);
        let fullArtists = trimmed;
        if (needDetailIds.length > 0) {
          // fetch details individually — keep it simple (Spotify allows multiple artist ids in /artists)
          try {
            const detailRes = await fetch(`https://api.spotify.com/v1/artists?ids=${trimmed.map(t=>t.id).join(",")}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const detailJson = await detailRes.json();
            if (detailJson.artists && detailJson.artists.length) {
              fullArtists = detailJson.artists;
            }
          } catch (e) {
            // if detail fetch fails, continue with what we have
            console.warn("Artist details batch fetch failed, continuing with partial data", e);
          }
        }

        // Final dedupe and limit 20, map to consistent shape
        const final = fullArtists
          .filter(Boolean)
          .map(a => ({
            id: a.id,
            name: a.name,
            images: a.images || [],
            genres: a.genres || [],
            followers: a.followers || null,
            external_urls: a.external_urls || null,
            hash: hashString(a.id) // Add hash for consistent ordering
          }))
          .slice(0, 20);

        // Cache the artists
        final.forEach(artist => {
          artistCache.current.addArtist(artist);
        });

        // Group by hash for additional organization
        const groupedArtists = groupByHash(final, artist => artist.id);
        console.log('Artists grouped by hash:', Object.keys(groupedArtists).length, 'groups');

        setTrending(final.length ? final : sampleTrendingArtists.slice(0,20));
      } catch (err) {
        console.error("Error fetching trending artists:", err);
        setTrending(sampleTrendingArtists.slice(0,20));
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [navigate]);

  if (loading) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="home-content" style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ color: "#fff" }}>Loading artists…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content" style={{ padding: "28px" }}>
        <div className="browse-header green-banner">
          <h1 className="browse-title">Artists</h1>
          <p className="browse-tagline">Discover your favorite artists</p>
        </div>

        {/* Sorting Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => handleSortChange('popular')}
            style={{
              padding: '10px 20px',
              background: sortBy === 'popular' ? '#1DB954' : '#282828',
              color: sortBy === 'popular' ? '#000' : '#fff',
              border: '1px solid #333',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (sortBy !== 'popular') {
                e.target.style.background = '#404040';
              }
            }}
            onMouseLeave={(e) => {
              if (sortBy !== 'popular') {
                e.target.style.background = '#282828';
              }
            }}
          >
            Most Popular
          </button>
          <button
            onClick={() => handleSortChange('az')}
            style={{
              padding: '10px 20px',
              background: sortBy === 'az' ? '#1DB954' : '#282828',
              color: sortBy === 'az' ? '#000' : '#fff',
              border: '1px solid #333',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (sortBy !== 'az') {
                e.target.style.background = '#404040';
              }
            }}
            onMouseLeave={(e) => {
              if (sortBy !== 'az') {
                e.target.style.background = '#282828';
              }
            }}
          >
            A → Z
          </button>
          <button
            onClick={() => handleSortChange('za')}
            style={{
              padding: '10px 20px',
              background: sortBy === 'za' ? '#1DB954' : '#282828',
              color: sortBy === 'za' ? '#000' : '#fff',
              border: '1px solid #333',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (sortBy !== 'za') {
                e.target.style.background = '#404040';
              }
            }}
            onMouseLeave={(e) => {
              if (sortBy !== 'za') {
                e.target.style.background = '#282828';
              }
            }}
          >
            Z → A
          </button>
        </div>

        {/* Trending Artists grid: 5 per row */}
        <section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            {sortedArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`, { state: { artist } })}
                style={{
                  background: "#121212",
                  borderRadius: 10,
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  minHeight: 220,
                }}
              >
                <img
                  src={artist.images?.[0]?.url || fallbackArtist}
                  alt={artist.name}
                  style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 8 }}
                  onError={(e) => (e.currentTarget.src = fallbackArtist)}
                />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginTop: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {artist.name}
                </div>
                <div style={{ color: "#1DB954", fontSize: 12, marginTop: 6 }}>
                  {artist.followers?.total ? `${Number(artist.followers.total).toLocaleString()} followers` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* fallback */
const fallbackArtist = "https://cdn-icons-png.flaticon.com/512/685/685655.png";

/* sample trending artists (used when token missing or API fails) */
const sampleTrendingArtists = [
  { id: "t1", name: "Olivia Rodrigo", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb5f0b1c6f..." }], followers:{total:30000000} },
  { id: "t2", name: "Drake", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:85000000} },
  { id: "t3", name: "Bad Bunny", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:70000000} },
  { id: "t4", name: "Taylor Swift", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:90000000} },
  { id: "t5", name: "Dua Lipa", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:27000000} },
  { id: "t6", name: "The Weeknd", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:53000000} },
  { id: "t7", name: "Billie Eilish", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:72000000} },
  { id: "t8", name: "Ed Sheeran", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:76000000} },
  { id: "t9", name: "Ariana Grande", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:60000000} },
  { id: "t10", name: "Kendrick Lamar", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:42000000} },
  { id: "t11", name: "Post Malone", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:43000000} },
  { id: "t12", name: "Olivia", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:20000000} },
  { id: "t13", name: "Megan Thee Stallion", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:14000000} },
  { id: "t14", name: "Doja Cat", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:23000000} },
  { id: "t15", name: "Lizzo", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:17000000} },
  { id: "t16", name: "Calvin Harris", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:25000000} },
  { id: "t17", name: "Shawn Mendes", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:30000000} },
  { id: "t18", name: "Coldplay", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:45000000} },
  { id: "t19", name: "Lil Nas X", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:18000000} },
  { id: "t20", name: "J Balvin", images: [{url:"https://i.scdn.co/image/ab6761610000e5eb..." }], followers:{total:32000000} },
];