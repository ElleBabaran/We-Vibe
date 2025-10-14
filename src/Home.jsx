import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import "./App.css";

function Home() {
  const navigate = useNavigate();
  const { addTrackToQueue, clearQueue, playTrackFromQueue, queue } = useMusicQueue();
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
    // Add this track to the queue (don't clear existing queue)
    addTrackToQueue(track);
    navigate('/playback', { state: { track } });
  };

  const viewAlbum = (album) => {
    navigate('/album', { state: { album } });
  };

  const viewPlaylist = (playlist) => {
    navigate('/playlist', { state: { playlist } });
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
          <h1 className="welcome-title">
            Welcome to WeVibe 🎶
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
              <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#fff' }}>
                🎵 Featured Albums
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

            {/* Your Playlists */}
            {userPlaylists.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#fff' }}>
                  🎵 Your Playlists
                </h2>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '20px' 
                }}>
                  {userPlaylists.slice(0, 12).map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => viewPlaylist(playlist)}
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
                      {playlist.images?.[0]?.url ? (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          style={{
                            width: '100%',
                            height: '130px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '10px',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '130px',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            color: '#666',
                          }}
                        >
                          🎵
                        </div>
                      )}
                      <p style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '5px', 
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {playlist.name}
                      </p>
                      <p style={{ 
                        color: '#b3b3b3', 
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {playlist.tracks?.total || 0} songs
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;