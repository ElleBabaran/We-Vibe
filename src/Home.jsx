import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./App.css";

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Fetch Top Tracks from a popular playlist
      const topTracksRes = await fetch(
        "https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=10",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const topTracksData = await topTracksRes.json();
      setTopTracks(topTracksData.items?.map(item => item.track) || []);

      // Fetch New Releases
      const newReleasesRes = await fetch(
        "https://api.spotify.com/v1/browse/new-releases?limit=10",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newReleasesData = await newReleasesRes.json();
      setNewReleases(newReleasesData.albums?.items || []);
      
    } catch (err) {
      console.error("Error fetching discover picks:", err);
    } finally {
      setLoading(false);
    }
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
            {/* Top 10 Global Tracks */}
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#fff' }}>
                🔥 Top 10 Global Hits
              </h2>
              
              {topTracks.length === 0 ? (
                <p style={{ color: '#b3b3b3' }}>No tracks available</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topTracks.map((track, index) => (
                    <div
                      key={track?.id || index}
                      onClick={() => playTrack(track)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#181818',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}
                    >
                      <span style={{ 
                        width: '30px', 
                        color: index < 3 ? '#1DB954' : '#b3b3b3', 
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                      
                      {track?.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginRight: '15px',
                          }}
                        />
                      )}
                      
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '0.95rem' }}>
                          {track?.name}
                        </p>
                        <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                          {track?.artists?.map(a => a.name).join(', ')}
                        </p>
                      </div>
                      
                      <span style={{ color: '#b3b3b3', fontSize: '0.9rem', marginRight: '15px' }}>
                        {track?.album?.name}
                      </span>
                      
                      <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                        {formatDuration(track?.duration_ms)}
                      </span>
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
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}
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
          </>
        )}
      </div>
    </div>
  );
}

export default Home;