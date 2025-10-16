import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useMusicQueue } from "./MusicQueueContext";
import "./App.css";

// Hashing function for strings
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash >>> 0;
}

// Sorting algorithm for genres
function sortGenres(genres, order) {
    return [...genres].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (order === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });
}

// Sorting algorithm for tracks
function sortTracks(tracks, order) {
    return [...tracks].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (order === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });
}

function Genre() {
  const navigate = useNavigate();
  const { clearAndPlayPlaylist } = useMusicQueue();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [trackSortOrder, setTrackSortOrder] = useState('asc');

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    fetchGenres(token);
  }, [navigate]);

  const fetchGenres = async (token) => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/browse/categories?limit=50",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      const allGenres = data.categories?.items || [];

      // Filter genres that have available songs
      const filteredGenres = [];
      const promises = allGenres.map(async (genre) => {
        try {
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre.name)}&type=track&limit=1`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const searchData = await searchResponse.json();
          if (searchData.tracks?.items?.length > 0) {
            return genre;
          }
        } catch (e) {
          console.error(`Error checking songs for genre ${genre.name}:`, e);
        }
        return null;
      });

      const results = await Promise.all(promises);
      results.forEach((genre) => {
        if (genre) filteredGenres.push(genre);
      });

      setGenres(sortGenres(filteredGenres, sortOrder));
    } catch (error) {
      console.error("Error fetching genres:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewGenre = async (genre) => {
    setSelectedGenre(genre);
    setLoadingTracks(true);
    const token = localStorage.getItem("spotify_access_token");
    try {
      // Search for tracks by genre
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre.name)}&type=track&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setTracks(sortTracks(data.tracks?.items || [], trackSortOrder));
    } catch (error) {
      console.error("Error fetching tracks:", error);
      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
    // Scroll to the songs area
    setTimeout(() => {
      const songsSection = document.querySelector('.songs-section');
      if (songsSection) {
        songsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const playTrack = (track) => {
    const trackWithSrc = { ...track, src: track.preview_url };
    clearAndPlayPlaylist([trackWithSrc], 0);
  };

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <div style={{ marginBottom: '50px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '30px',
            color: '#fff',
            letterSpacing: '-0.5px',
          }}>
            🎵 Music Genres
          </h1>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setGenres(sortGenres(genres, sortOrder === 'asc' ? 'desc' : 'asc'));
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#b3b3b3' }}>Loading genres...</p>
          ) : genres.length === 0 ? (
            <p style={{ color: '#b3b3b3' }}>No genres available</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px'
            }}>
              {genres.map((genre) => (
                <div
                  key={genre.id}
                  onClick={() => viewGenre(genre)}
                  onKeyDown={(e) => { if (e.key === 'Enter') viewGenre(genre); }}
                  tabIndex={0}
                  style={{
                    backgroundColor: '#121212',
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#282828';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#121212';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {genre.icons?.[0]?.url && (
                    <img
                      src={genre.icons[0].url}
                      alt={genre.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        margin: '0 auto',
                      }}
                    />
                  )}
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color: '#fff',
                    margin: '0',
                  }}>
                    {genre.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedGenre && (
          <div className="songs-section" style={{ marginTop: '50px' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#fff',
            }}>
              {selectedGenre.name} Music
            </h2>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  const newOrder = trackSortOrder === 'asc' ? 'desc' : 'asc';
                  setTrackSortOrder(newOrder);
                  setTracks(sortTracks(tracks, newOrder));
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1DB954',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Sort Songs: {trackSortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>

            {loadingTracks ? (
              <p style={{ color: '#b3b3b3' }}>Loading tracks...</p>
            ) : tracks.length === 0 ? (
              <p style={{ color: '#b3b3b3' }}>No tracks available for this genre</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    style={{
                      backgroundColor: '#181818',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, transform 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#282828';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.querySelector('.play-overlay').style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#181818';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.querySelector('.play-overlay').style.opacity = '0';
                    }}
                    onClick={() => playTrack(track)}
                  >
                    {/* Album Art */}
                    {track.album?.images?.[0]?.url ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginBottom: '12px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '160px',
                          backgroundColor: '#333',
                          borderRadius: '4px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#b3b3b3',
                          fontSize: '2rem',
                        }}
                      >
                        🎵
                      </div>
                    )}

                    {/* Track Info */}
                    <div style={{ marginBottom: '12px' }}>
                      <p
                        style={{
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {track.name || "Untitled"}
                      </p>
                      <p
                        style={{
                          color: '#b3b3b3',
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {track.artists?.map(a => a.name).join(', ') || "Unknown artist"}
                      </p>
                    </div>

                    {/* Play Button Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#1DB954',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: 'none',
                      }}
                      className="play-overlay"
                    >
                      <span style={{ color: '#fff', fontSize: '1.2rem' }}>
                        ▶️
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Genre;
