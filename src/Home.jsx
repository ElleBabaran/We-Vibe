import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import "./App.css";

function Home() {
  const navigate = useNavigate();
  const { addTrackToQueue, clearQueue, playTrackFromQueue, clearAndPlayTrack, clearAndPlayPlaylist, queue } = useMusicQueue();
  const [profile, setProfile] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPlaylists, setUserPlaylists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");

    if (!token) {
      console.error("No access token found – please log in again.");
      navigate("/");
      return;
    }

    // Fetch the user's Spotify profile
    fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Spotify user data:", data);
        setProfile(data);
        fetchDiscoverPicks(token);
      })
      .catch(err => {
        console.error("Error fetching user data:", err);
        navigate("/");
      });
  }, [navigate]);

  const fetchDiscoverPicks = async (token) => {
    try {
      // Fetch Featured Albums
      const albumsRes = await fetch(
        "https://api.spotify.com/v1/browse/new-releases?limit=12",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const albumsData = await albumsRes.json();
      setAlbums(albumsData.albums?.items || []);

      // Fetch New Releases - increased to 20
      const newReleasesRes = await fetch(
        "https://api.spotify.com/v1/browse/new-releases?limit=20",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newReleasesData = await newReleasesRes.json();
      setNewReleases(newReleasesData.albums?.items || []);

      // Fetch User Playlists
      const playlistsRes = await fetch(
        "https://api.spotify.com/v1/me/playlists?limit=20",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const playlistsData = await playlistsRes.json();
      setUserPlaylists(playlistsData.items || []);
      
    } catch (err) {
      console.error("Error fetching discover picks:", err);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (track) => {
    if (!track) return;
    
    // Clear queue and play this track atomically
    clearAndPlayTrack(track);
    
    // Navigate to playback page if not already there
    if (window.location.pathname !== '/playback') {
      navigate('/playback');
    }
  };

  const viewAlbum = (album) => {
    navigate('/album', { state: { album } });
  };

  const viewPlaylist = (playlist) => {
    navigate('/playlist', { state: { playlist } });
  };
  
  const playAlbum = async (album) => {
    if (!album) return;
    
    const token = localStorage.getItem("spotify_access_token");
    if (!token) return;
    
    try {
      // Fetch album tracks
      const response = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const tracks = data.items || [];
        
        if (tracks.length > 0) {
          // Add album info to each track
          const tracksWithAlbum = tracks.map(track => ({
            ...track,
            album: album
          }));
          
          // Play the album
          clearAndPlayPlaylist(tracksWithAlbum, 0);
          
          // Navigate to playback page if not already there
          if (window.location.pathname !== '/playback') {
            navigate('/playback');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      // Fallback to album view
      viewAlbum(album);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="home-content">
        <div className="welcome-header">
          <h1 className="welcome-title" style={{
            fontFamily: '\'Plus Jakarta Sans\', system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
            fontWeight: '800',
            fontSize: '4rem',
            color: '#1DB954',
            letterSpacing: '-1px',
            marginBottom: '24px',
            textAlign: 'left',
            textShadow: '0 0 20px rgba(29, 185, 84, 0.3)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            borderRight: '3px solid #1DB954',
            animation: 'typing 3s steps(17, end) 0.5s both, blink-caret 1s step-end 2 3.5s, hide-cursor 0.1s ease-out 5.5s forwards'
          }}>
            Welcome to WeVibe
          </h1>
          {profile && (
            <div className="profile-info">
              {profile.images?.[0]?.url && (
                <img
                  src={profile.images[0].url}
                  alt="Profile"
                  className="profile-image"
                />
              )}
              <div>
                <p className="profile-label">Logged in as</p>
                <p className="profile-name">{profile.display_name}</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#b3b3b3' }}>Loading your picks...</p>
        ) : (
          <>
            {/* Featured Albums */}
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Featured Albums
              </h2>
              
              {albums.length === 0 ? (
                <p style={{ color: '#b3b3b3' }}>No albums available</p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                  gap: '20px' 
                }}>
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => viewAlbum(album)}
                      style={{
                        backgroundColor: '#181818',
                        padding: '15px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#282828';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#181818';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {album.images?.[0]?.url && (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          style={{
                            width: '100%',
                            height: '130px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '10px',
                          }}
                        />
                      )}
                      <p style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '5px', 
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {album.name}
                      </p>
                      <p style={{ 
                        color: '#b3b3b3', 
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {album.artists?.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Releases */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#fff' }}>
                ✨ New Releases
              </h2>
              
              {newReleases.length === 0 ? (
                <p style={{ color: '#b3b3b3' }}>No new releases available</p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                  gap: '20px' 
                }}>
                  {newReleases.map((album) => (
                    <div
                      key={album.id}
                      style={{
                        backgroundColor: '#181818',
                        padding: '15px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#282828';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#181818';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={() => viewAlbum(album)}
                    >
                      {album.images?.[0]?.url && (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          style={{
                            width: '100%',
                            height: '130px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '10px',
                          }}
                        />
                      )}
                      <p style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '5px', 
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {album.name}
                      </p>
                      <p style={{ 
                        color: '#b3b3b3', 
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {album.artists?.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Playlists section moved to Playlist page */}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;