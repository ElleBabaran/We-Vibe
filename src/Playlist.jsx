import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import { getPlaylists, createPlaylist as lpCreate, addTrackToPlaylist, addTracksToPlaylist, moveTrack, getPlaylist } from './localPlaylists';
import "./App.css";

function Playlist() {
  const location = useLocation();
  const navigate = useNavigate();
  const playlist = location.state?.playlist;
  const { addTrackToQueue, clearQueue, playTrackFromQueue, queue } = useMusicQueue();
  const [visitedPlaylists, setVisitedPlaylists] = useState([]);
  
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistCoverImage, setNewPlaylistCoverImage] = useState('');
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [selectedCustomId, setSelectedCustomId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    if (playlist) {
      // Check if this is a local playlist
      const isLocal = location.state?.isLocal || playlist.id?.startsWith('local_');
      
      if (isLocal) {
        // For local playlists, tracks are already provided
        const localPlaylist = getPlaylist(playlist.id);
        if (localPlaylist) {
          setTracks(localPlaylist.tracks || []);
        } else if (playlist.tracks?.items) {
          setTracks(playlist.tracks.items.map(item => item.track));
        }
        setLoading(false);
      } else {
        // Fetch Spotify playlist tracks
        fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            setTracks(data.items?.map(item => item.track) || []);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching playlist tracks:", err);
            setLoading(false);
          });

        // Record visited playlist (only for Spotify playlists)
        try {
          const raw = localStorage.getItem('wv_playlists_visited');
          const list = raw ? JSON.parse(raw) : [];
          const entry = { id: playlist.id, name: playlist.name, images: playlist.images };
          const filtered = [entry, ...list.filter(p => p.id !== playlist.id)].slice(0, 12);
          localStorage.setItem('wv_playlists_visited', JSON.stringify(filtered));
        } catch (_) {}
      }
    } else {
      setLoading(false);
    }
  }, [playlist, navigate, location.state?.isLocal]);

  // Load visited, created, and custom playlists
  useEffect(() => {
    try {
      const visitedRaw = localStorage.getItem('wv_playlists_visited');
      const visited = visitedRaw ? JSON.parse(visitedRaw) : [];
      const createdRaw = localStorage.getItem('wv_playlists_created');
      const created = createdRaw ? JSON.parse(createdRaw) : [];
      setVisitedPlaylists([...created, ...visited]);
      setCustomPlaylists(getPlaylists());
    } catch (_) {}
  }, [location?.state?.playlist, showCreateForm]); // Added showCreateForm to refresh when form closes

  const playTrack = (track) => {
    // Add this track to the queue (don't clear existing queue)
    addTrackToQueue(track);
    navigate('/playback');
    playTrackFromQueue(queue.length); // Play the newly added track
  };

  const playPlaylist = () => {
    if (tracks.length === 0) return;
    
    // Clear current queue and add entire playlist
    clearQueue();
    tracks.forEach(track => addTrackToQueue(track));
    navigate('/playback');
    playTrackFromQueue(0);
  };

  const createPlaylist = async () => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token || !newPlaylistName.trim()) return;

    try {
      // Get user ID first
      const userRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      
      // Create playlist
      const response = await fetch(
        `https://api.spotify.com/v1/users/${userData.id}/playlists`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newPlaylistName,
            description: newPlaylistDescription,
            public: false,
          }),
        }
      );

      if (response.ok) {
        const newPlaylist = await response.json();
        alert(`Playlist "${newPlaylistName}" created successfully!`);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateForm(false);

        // Store in "created" list
        try {
          const raw = localStorage.getItem('wv_playlists_created');
          const list = raw ? JSON.parse(raw) : [];
          const entry = { id: newPlaylist.id, name: newPlaylist.name, images: newPlaylist.images };
          const updated = [entry, ...list.filter(p => p.id !== newPlaylist.id)].slice(0, 20);
          localStorage.setItem('wv_playlists_created', JSON.stringify(updated));
        } catch (_) {}
      } else {
        alert('Failed to create playlist');
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert('Error creating playlist');
    }
  };

  // Create local custom playlist
  const createLocalPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const playlistData = {
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim(),
      coverImage: newPlaylistCoverImage.trim()
    };
    const p = lpCreate(playlistData.name, playlistData.description, playlistData.coverImage);
    
    // Immediately update the custom playlists state
    setCustomPlaylists(getPlaylists());
    
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setNewPlaylistCoverImage('');
    setShowCreateForm(false);
    
    alert(`Local playlist "${playlistData.name}" created successfully!`);
  };

  // Add current loaded playlist's tracks to a custom playlist
  const addLoadedToCustom = (targetId) => {
    if (!targetId) return;
    addTracksToPlaylist(targetId, tracks.filter(Boolean));
    alert('Added to your playlist');
  };

  // Reorder inside custom playlist view
  const moveInCustom = (pid, from, to) => {
    moveTrack(pid, from, to);
    const updated = getPlaylist(pid);
    if (updated && pid === selectedCustomId) {
      setTracks(updated.tracks);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (!playlist && !showCreateForm) {
    return (
      <div className="home-container">
        <Sidebar />
        
        <div className="home-content">
          <div style={{ textAlign: 'center', padding: '40px', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#fff' }}>
              🎵 Playlists
            </h1>
            <p style={{ color: '#b3b3b3', marginBottom: '30px', fontSize: '1.1rem' }}>
              Create and manage your playlists
            </p>
            
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '16px 32px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1ed760';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1DB954';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ➕ Create New Playlist
            </button>
          </div>

          {/* Spotify Playlists */}
          <div style={{ marginBottom: '30px', padding: '0 40px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#fff' }}>Your Spotify Playlists</h2>
            {visitedPlaylists.length === 0 ? (
              <p style={{ color: '#b3b3b3' }}>No Spotify playlists yet</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {visitedPlaylists.map(p => (
                  <div key={p.id} onClick={() => navigate('/playlist', { state: { playlist: p } })} style={{ background: '#181818', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#282828';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#181818';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '130px', background: '#333', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '2rem' }}>🎵</div>
                    )}
                    <p style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local Custom Playlists */}
          <div style={{ marginBottom: '30px', padding: '0 40px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#fff' }}>Your Custom Playlists</h2>
            {customPlaylists.length === 0 ? (
              <p style={{ color: '#b3b3b3' }}>No custom playlists yet. <button onClick={() => setShowCreateForm(true)} style={{ background: 'none', border: 'none', color: '#1DB954', cursor: 'pointer', textDecoration: 'underline' }}>Create one!</button></p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {customPlaylists.map(p => (
                  <div key={p.id} onClick={() => {
                    // Navigate to view local playlist
                    const localPlaylist = {
                      id: p.id,
                      name: p.name,
                      description: p.description,
                      images: p.coverImage ? [{ url: p.coverImage }] : [],
                      owner: { display_name: 'You' },
                      tracks: { items: p.tracks?.map(track => ({ track })) || [] }
                    };
                    navigate('/playlist', { state: { playlist: localPlaylist, isLocal: true } });
                  }} style={{ background: '#181818', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#282828';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#181818';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}>
                    {p.coverImage ? (
                      <img src={p.coverImage} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '130px', background: 'linear-gradient(135deg, #1DB954, #1ed760)', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem' }}>🎵</div>
                    )}
                    <p style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ color: '#b3b3b3', fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.tracks?.length || 0} songs</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="home-container">
        <Sidebar />
        
        <div className="home-content">
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', color: '#fff', textAlign: 'center' }}>
              Create New Playlist
            </h1>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                Playlist Name
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#181818',
                  border: '2px solid #282828',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                Description (Optional)
              </label>
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Enter playlist description..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#181818',
                  border: '2px solid #282828',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                value={newPlaylistCoverImage}
                onChange={(e) => setNewPlaylistCoverImage(e.target.value)}
                placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#181818',
                  border: '2px solid #282828',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
              {newPlaylistCoverImage && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '8px' }}>Preview:</p>
                  <img 
                    src={newPlaylistCoverImage} 
                    alt="Cover preview" 
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '2px solid #282828'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: newPlaylistName.trim() ? '#1DB954' : '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                Create Spotify Playlist
              </button>
              
              <button
                onClick={createLocalPlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: newPlaylistName.trim() ? '#1ed760' : '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                Create Local Playlist
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#b3b3b3',
                  border: '2px solid #b3b3b3',
                  borderRadius: '24px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="home-content">

        {/* Playlist Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '30px',
          marginBottom: '40px',
          padding: '20px',
          background: 'linear-gradient(180deg, #282828 0%, #121212 100%)',
          borderRadius: '8px',
        }}>
          {playlist.images?.[0]?.url ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              style={{
                width: '232px',
                height: '232px',
                objectFit: 'cover',
                borderRadius: '4px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}
            />
          ) : (
            <div style={{
              width: '232px',
              height: '232px',
              background: playlist.id?.startsWith('local_') 
                ? 'linear-gradient(135deg, #1DB954, #1ed760)' 
                : 'linear-gradient(135deg, #333, #666)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '4rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            }}>
              🎵
            </div>
          )}
          <div>
            <p style={{ 
              fontSize: '0.8rem', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              marginBottom: '8px',
              color: '#fff'
            }}>
              {playlist.id?.startsWith('local_') ? 'Local Playlist' : 'Playlist'}
            </p>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              color: '#fff',
              lineHeight: '1.2'
            }}>
              {playlist.name}
            </h1>
            {playlist.description && (
              <p style={{
                color: '#b3b3b3',
                fontSize: '1rem',
                marginBottom: '15px',
                lineHeight: '1.4'
              }}>
                {playlist.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b3b3b3', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>
                {playlist.owner?.display_name || 'You'}
              </span>
              <span>•</span>
              <span>{tracks.length} songs</span>
            </div>
            
            <button
              onClick={playPlaylist}
              disabled={tracks.length === 0}
              style={{
                padding: '12px 32px',
                backgroundColor: tracks.length > 0 ? '#1DB954' : '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: tracks.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (tracks.length > 0) {
                  e.currentTarget.style.backgroundColor = '#1ed760';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (tracks.length > 0) {
                  e.currentTarget.style.backgroundColor = '#1DB954';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              ▶️ {tracks.length > 0 ? 'Play Playlist' : 'No tracks to play'}
            </button>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: '20px',
            padding: '10px 24px',
            backgroundColor: 'transparent',
            color: '#b3b3b3',
            border: '2px solid #b3b3b3',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#b3b3b3';
            e.currentTarget.style.borderColor = '#b3b3b3';
          }}
        >
          ← Back
        </button>

        {/* Track List */}
        {loading ? (
          <p style={{ color: '#b3b3b3' }}>Loading tracks...</p>
        ) : tracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b3b3b3' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎵</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fff' }}>No tracks yet</h3>
            <p style={{ fontSize: '1rem' }}>This playlist is empty. Add some tracks to get started!</p>
          </div>
        ) : (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ 
              display: 'flex', 
              padding: '12px',
              borderBottom: '1px solid #282828',
              color: '#b3b3b3',
              fontSize: '0.85rem',
              fontWeight: 'bold',
            }}>
              <span style={{ width: '40px', textAlign: 'center' }}>#</span>
              <span style={{ flex: 1 }}>TITLE</span>
              <span style={{ width: '80px', textAlign: 'right' }}>DURATION</span>
            </div>
            
            {tracks.map((track, index) => (
              <div
                key={track.id || index}
                onClick={() => playTrack(track)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#121212',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  marginBottom: '2px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#121212'}
              >
                <span style={{ 
                  width: '40px', 
                  color: '#b3b3b3',
                  textAlign: 'center',
                  fontSize: '0.95rem'
                }}>
                  {index + 1}
                </span>
                
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '3px', 
                    fontSize: '0.95rem',
                    color: '#fff'
                  }}>
                    {track.name || 'Unknown Track'}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                    {track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
                  </p>
                </div>
                
                <span style={{ 
                  width: '80px', 
                  color: '#b3b3b3', 
                  fontSize: '0.9rem',
                  textAlign: 'right'
                }}>
                  {track.duration_ms ? formatDuration(track.duration_ms) : '--:--'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Playlist;
