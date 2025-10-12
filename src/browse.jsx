import "./App.css";
import "./browse.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Browse() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
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
      setSearchResults(data);
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
    navigate('/playback', { state: { track } });
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
    <div className="home-container">
      <Sidebar />
      
      <div className={`browse-container ${hasSearched ? 'with-results' : ''}`}>
        <div className="browse-header">
          <h1 className="browse-title">WeVibe!</h1>
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
                {/* Tracks */}
                {searchResults.tracks?.items?.length > 0 && (
                  <div className="results-section">
                    <h2 className="results-title">Songs</h2>
                    <div className="tracks-grid">
                      {searchResults.tracks.items.map((track) => (
                        <div
                          key={track.id}
                          className="result-item track-item"
                          onClick={() => playTrack(track)}
                        >
                          {track.album?.images?.[0]?.url && (
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="result-image"
                            />
                          )}
                          <div className="result-info">
                            <p className="result-name">{track.name}</p>
                            <p className="result-artist">
                              {track.artists?.map(a => a.name).join(', ')}
                            </p>
                            <p className="result-duration">
                              {formatDuration(track.duration_ms)}
                            </p>
                          </div>
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
    </div>
  );
}