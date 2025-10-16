import "./App.css";
import "./browse.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import { getPlaylists, addTrackToPlaylist } from './localPlaylists';
import { addToRecent } from "./recent";

// ==================== ALGORITHMS & SORTING ====================

// 1. QuickSort for Tracks - O(n log n)
function quickSortTracks(arr, key = 'name') {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(item => item[key] < pivot[key]);
  const middle = arr.filter(item => item[key] === pivot[key]);
  const right = arr.filter(item => item[key] > pivot[key]);
  
  return [...quickSortTracks(left, key), ...middle, ...quickSortTracks(right, key)];
}

// 2. Bubble Sort for Albums - O(n²) - simple comparison
function bubbleSortAlbums(arr) {
  const result = [...arr];
  const n = result.length;
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (result[j].name > result[j + 1].name) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
      }
    }
  }
  return result;
}

// 3. Hash Table for Caching Search Results
class HashTable {
  constructor(size = 16) {
    this.size = size;
    this.buckets = Array(size).fill(null).map(() => []);
  }

  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.size;
  }

  set(key, value) {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    
    bucket.push([key, value]);
  }

  get(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }
}

// 4. Binary Search for Artists - O(log n) - requires sorted array
function binarySearchArtist(arr, targetName) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid].name === targetName) {
      return mid;
    } else if (arr[mid].name < targetName) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

export default function Browse() {
  const navigate = useNavigate();
  const { addTrackToQueue, playTrackFromQueue, clearQueue, clearAndPlayTrack, queue } = useMusicQueue();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  
  // Algorithm state
  const [searchCache] = useState(new HashTable(32));
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);

  // Load custom playlists
  useEffect(() => {
    try {
      setCustomPlaylists(getPlaylists());
    } catch (_) {}
  }, []);

  // Real-time search as user types
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    const delaySearch = setTimeout(() => {
      performSearch(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async (query) => {
    console.log('🔍 performSearch called with query:', query);
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    // 1. HASH TABLE - Check cache first
    const cached = searchCache.get(query);
    if (cached) {
      console.log('✅ Cache Hit - Using cached results');
      setCacheHits(prev => prev + 1);
      setSearchResults(cached);
      setLoading(false);
      return;
    }
    
    console.log('❌ Cache Miss - Fetching from Spotify API...');
    setCacheMisses(prev => prev + 1);

    const token = localStorage.getItem("spotify_access_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album,artist&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      console.log('📦 API Response received:', data);
      
      // 2. QUICKSORT - Sort tracks by name
      if (data.tracks?.items) {
        console.log(`🎵 Found ${data.tracks.items.length} tracks - applying QuickSort`);
        data.tracks.items = quickSortTracks(data.tracks.items, 'name');
        console.log('✅ QuickSort applied to tracks');
      }
      
      // 3. BUBBLE SORT - Sort albums by name
      if (data.albums?.items) {
        console.log(`💿 Found ${data.albums.items.length} albums - applying Bubble Sort`);
        data.albums.items = bubbleSortAlbums(data.albums.items);
        console.log('✅ Bubble Sort applied to albums');
      }
      
      // 4. BINARY SEARCH PREP - Sort artists for binary search
      if (data.artists?.items) {
        console.log(`👤 Found ${data.artists.items.length} artists - sorting for Binary Search`);
        data.artists.items = [...data.artists.items].sort((a, b) => a.name.localeCompare(b.name));
        console.log('✅ Artists sorted for Binary Search');
      }
      
      // Cache the sorted results
      searchCache.set(query, data);
      console.log('💾 Results cached successfully');
      
      try {
        localStorage.setItem('browse_last_artists', JSON.stringif(data.artists?.items || []));
      } catch (_) {}
      setSearchResults(data);
      console.log('✅ Search results set - displaying results');
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ tracks: { items: [] }, albums: { items: [] }, artists: { items: [] } });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const playTrack = (track) => {
    if (!track) return;

    console.log('🎵 Browse: playTrack called with:', track.name, track.uri);

    // Clear queue and play this track atomically
    clearAndPlayTrack(track);

    // Add to recent tracks
    addToRecent(track);

    // Navigate to playback page if not already there
    if (window.location.pathname !== '/playback') {
      navigate('/playback');
    }
  };

  const addToCustomPlaylist = (track, playlistId) => {
    if (!playlistId || !track) return;
    addTrackToPlaylist(playlistId, track);
    alert('Added to your playlist!');
  };

  const viewAlbum = (album) => {
    navigate('/album', { state: { album } });
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  return (
    <>
      <Sidebar />
      
      <div className={`browse-container ${hasSearched ? 'with-results' : ''}`}>
        <div className="browse-header">
          <h1 className="browse-title">WeVibe!</h1>
          <p className="browse-tagline">Discover your perfect musical journey</p>
        </div>
        
        <div className="browse-search-wrapper">
          <form className="browse-search-form" onSubmit={handleSearch}>
            <div className="search-box">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search for songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="search-results-container">
            {loading ? (
              <p className="loading-text">Searching...</p>
            ) : searchResults ? (
              <>
                {/* Algorithm Info Panel */}
                <div className="algorithm-panel">
                  <h3 className="algorithm-panel-title">⚡ Active Algorithms</h3>
                  <div className="algorithm-grid">
                    <div className="algorithm-card">
                      <div className="algorithm-icon">🔍</div>
                      <div className="algorithm-content">
                        <div className="algorithm-name">Hash Table</div>
                        <div className="algorithm-desc">Caching</div>
                        <div className="algorithm-stats">
                          Hits: {cacheHits} | Misses: {cacheMisses}
                        </div>
                      </div>
                    </div>
                    <div className="algorithm-card">
                      <div className="algorithm-icon">🎵</div>
                      <div className="algorithm-content">
                        <div className="algorithm-name">Tracks</div>
                        <div className="algorithm-desc">QuickSort</div>
                        <div className="algorithm-complexity">O(n log n)</div>
                      </div>
                    </div>
                    <div className="algorithm-card">
                      <div className="algorithm-icon">💿</div>
                      <div className="algorithm-content">
                        <div className="algorithm-name">Albums</div>
                        <div className="algorithm-desc">Bubble Sort</div>
                        <div className="algorithm-complexity">O(n²)</div>
                      </div>
                    </div>
                    <div className="algorithm-card">
                      <div className="algorithm-icon">👤</div>
                      <div className="algorithm-content">
                        <div className="algorithm-name">Artists</div>
                        <div className="algorithm-desc">Binary Search</div>
                        <div className="algorithm-complexity">O(log n)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracks */}
                {searchResults.tracks?.items?.length > 0 && (
                  <div className="results-section">
                    <h2 className="results-title">Songs</h2>
                    <div className="tracks-grid">
                      {searchResults.tracks.items.map((track) => (
                        <div
                          key={track.id}
                          className="result-item track-item"
                          style={{ position: 'relative' }}
                        >
                          {track.album?.images?.[0]?.url && (
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="result-image"
                            />
                          )}
                          <div className="result-info" onClick={() => playTrack(track)} style={{ cursor: 'pointer', flex: 1 }}>
                            <p className="result-name">{track.name}</p>
                            <p className="result-artist">
                              {track.artists?.map(a => a.name).join(', ')}
                            </p>
                            <p className="result-duration">
                              {formatDuration(track.duration_ms)}
                            </p>
                          </div>
                          
                          {/* Add to Playlist Dropdown */}
                          {customPlaylists.length > 0 && (
                            <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    addToCustomPlaylist(track, e.target.value);
                                    e.target.value = ''; // Reset selection
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '8px 12px',
                                  background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  minWidth: '120px',
                                  boxShadow: '0 2px 8px rgba(29, 185, 84, 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                defaultValue=""
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <option value="" disabled style={{ background: '#282828', color: '#b3b3b3' }}>
                                  Add to playlist...
                                </option>
                                {customPlaylists.map(p => (
                                  <option key={p.id} value={p.id} style={{ background: '#282828', color: '#fff' }}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums */}
                {searchResults.albums?.items?.length > 0 && (
                  <div className="results-section">
                    <h2 className="results-title">Albums</h2>
                    <div className="albums-grid">
                      {searchResults.albums.items.map((album) => (
                        <div
                          key={album.id}
                          className="result-item album-item"
                          onClick={() => viewAlbum(album)}
                        >
                          {album.images?.[0]?.url && (
                            <img
                              src={album.images[0].url}
                              alt={album.name}
                              className="result-image album-image"
                            />
                          )}
                          <div className="result-info">
                            <p className="result-name">{album.name}</p>
                            <p className="result-artist">
                              {album.artists?.map(a => a.name).join(', ')}
                            </p>
                            <p className="result-meta">
                              {album.release_date?.split('-')[0]} • {album.total_tracks} tracks
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artists */}
                {searchResults.artists?.items?.length > 0 && (
                  <div className="results-section">
                    <h2 className="results-title">Artists</h2>
                    <div className="artists-grid">
                      {searchResults.artists.items.map((artist) => (
                        <div
                          key={artist.id}
                          className="result-item artist-item"
                          onClick={() => navigate(`/artist/${artist.id}`, { state: { artist } })}
                          style={{ cursor: `pointer` }}
                        >
                          {artist.images?.[0]?.url && (
                            <img
                              src={artist.images[0].url}
                              alt={artist.name}
                              className="result-image artist-image"
                            />
                          )}
                          <div className="result-info">
                            <p className="result-name">{artist.name}</p>
                            <p className="result-meta">Artist</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchResults.tracks?.items?.length === 0 &&
                 searchResults.albums?.items?.length === 0 &&
                 searchResults.artists?.items?.length === 0 && (
                  <p className="no-results">No results found for "{searchQuery}"</p>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}