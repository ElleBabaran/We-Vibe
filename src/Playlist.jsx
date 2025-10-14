import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import { getPlaylists, createPlaylist as lpCreate, addTrackToPlaylist, addTracksToPlaylist, moveTrack, removeTrack, getPlaylist, updatePlaylistCover, deletePlaylist, updatePlaylistName, fileToBase64 } from './localPlaylists';
import "./App.css";

function Playlist() {
  const location = useLocation();
  const navigate = useNavigate();
  const playlist = location.state?.playlist;
  const { addTrackToQueue, clearQueue, playTrackFromQueue, clearAndPlayTrack, clearAndPlayPlaylist, queue } = useMusicQueue();
  const [visitedPlaylists, setVisitedPlaylists] = useState([]);
  
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistCoverImage, setNewPlaylistCoverImage] = useState('');
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [selectedCustomId, setSelectedCustomId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState(false);
  const [newPlaylistNameEdit, setNewPlaylistNameEdit] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    if (playlist) {
      // Check if it's a local playlist
      if (playlist.id.startsWith('local_')) {
        // Load local playlist tracks
        const localPlaylist = getPlaylist(playlist.id);
        if (localPlaylist) {
          setTracks(localPlaylist.tracks || []);
          setLoading(false);
        } else {
          setTracks([]);
          setLoading(false);
        }
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

        // Record visited playlist
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
  }, [playlist, navigate]);

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
  }, [location?.state?.playlist]);
  
  // Also load playlists on component mount to show on main page
  useEffect(() => {
    if (!playlist) { // Only load when on main playlist page
      try {
        const visitedRaw = localStorage.getItem('wv_playlists_visited');
        const visited = visitedRaw ? JSON.parse(visitedRaw) : [];
        const createdRaw = localStorage.getItem('wv_playlists_created');
        const created = createdRaw ? JSON.parse(createdRaw) : [];
        setVisitedPlaylists([...created, ...visited]);
        setCustomPlaylists(getPlaylists());
      } catch (_) {}
    }
  }, [playlist]);

  const playTrack = (track) => {
    if (!track) return;
    
    // Clear queue and play this track atomically
    clearAndPlayTrack(track);
    
    // Navigate to playback page if not already there
    if (window.location.pathname !== '/playback') {
      navigate('/playback');
    }
  };

  const playPlaylist = () => {
    if (tracks.length === 0) return;
    
    // Clear queue and play entire playlist atomically
    clearAndPlayPlaylist(tracks, 0);
    
    // Navigate to playback page if not already there
    if (window.location.pathname !== '/playback') {
      navigate('/playback');
    }
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
        setNewPlaylistCoverImage('');
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
    const p = lpCreate(newPlaylistName.trim(), newPlaylistCoverImage.trim() || null);
    setCustomPlaylists(prev => [p, ...prev]);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setNewPlaylistCoverImage('');
    setShowCreateForm(false);
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

  // Handle file upload for playlist cover
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        setNewPlaylistCoverImage(base64);
        setImageFile(file);
      } catch (error) {
        alert('Failed to upload image');
      }
    }
  };

  // Delete a local playlist
  const handleDeletePlaylist = (playlistId, playlistName) => {
    setPlaylistToDelete({ id: playlistId, name: playlistName });
    setShowDeleteConfirm(true);
  };

  const confirmDeletePlaylist = () => {
    if (playlistToDelete) {
      deletePlaylist(playlistToDelete.id);
      setCustomPlaylists(prev => prev.filter(p => p.id !== playlistToDelete.id));
      if (playlist?.id === playlistToDelete.id) {
        navigate('/playlist');
      }
    }
    setShowDeleteConfirm(false);
    setPlaylistToDelete(null);
  };

  // Remove track from local playlist
  const removeTrackFromPlaylist = (trackIndex) => {
    if (playlist && playlist.id.startsWith('local_')) {
      removeTrack(playlist.id, trackIndex);
      setTracks(prev => prev.filter((_, i) => i !== trackIndex));
    }
  };

  // Edit playlist name
  const startEditingName = () => {
    setEditingPlaylistName(true);
    setNewPlaylistNameEdit(playlist.name);
  };

  const savePlaylistName = () => {
    if (newPlaylistNameEdit.trim() && playlist.id.startsWith('local_')) {
      updatePlaylistName(playlist.id, newPlaylistNameEdit.trim());
      setCustomPlaylists(prev => 
        prev.map(p => p.id === playlist.id ? { ...p, name: newPlaylistNameEdit.trim() } : p)
      );
      // Force re-render by navigating to the updated playlist
      navigate('/playlist', { 
        state: { 
          playlist: { ...playlist, name: newPlaylistNameEdit.trim() } 
        } 
      });
    }
    setEditingPlaylistName(false);
    setNewPlaylistNameEdit('');
  };

  // Update playlist cover image
  const updateCoverImage = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && playlist.id.startsWith('local_')) {
      try {
        const base64 = await fileToBase64(file);
        updatePlaylistCover(playlist.id, base64);
        setCustomPlaylists(prev => 
          prev.map(p => p.id === playlist.id ? { ...p, images: [{ url: base64 }] } : p)
        );
        // Force re-render by navigating to the updated playlist
        navigate('/playlist', { 
          state: { 
            playlist: { ...playlist, images: [{ url: base64 }] } 
          } 
        });
      } catch (error) {
        alert('Failed to update cover image');
      }
    }
  };

  if (!playlist && !showCreateForm) {
    return (
      <div className="home-container">
        <Sidebar />
        
        <div className="home-content">
          {/* Header Section */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '60px 20px', 
            marginBottom: '40px',
            background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(29, 185, 84, 0.05) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(29, 185, 84, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#1DB954',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(29, 185, 84, 0.3)'
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <h1 style={{ 
                fontSize: '3.2rem', 
                margin: 0, 
                color: '#fff',
                fontFamily: 'Space Grotesk, system-ui',
                fontWeight: '700',
                letterSpacing: '-2px',
                background: 'linear-gradient(135deg, #fff 0%, #1DB954 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Playlists
              </h1>
            </div>
            
            <p style={{ 
              color: '#b3b3b3', 
              marginBottom: '32px', 
              fontSize: '1.3rem',
              fontFamily: 'Poppins, system-ui',
              fontWeight: '400',
              textAlign: 'center',
              maxWidth: '450px',
              lineHeight: '1.6',
              letterSpacing: '0.01em'
            }}>
              Create and manage your personal music collections
            </p>
            
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '18px 36px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(29, 185, 84, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                minWidth: '220px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1ed760';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(29, 185, 84, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1DB954';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(29, 185, 84, 0.4)';
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New Playlist
            </button>
          </div>

          {/* Local Custom Playlists */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: 0 }}>Your Created Playlists</h2>
              {customPlaylists.length > 0 && (
                <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>({customPlaylists.length} playlists)</span>
              )}
            </div>
            {customPlaylists.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#181818',
                borderRadius: '12px',
                border: '2px dashed #1DB954'
              }}>
                <p style={{ color: '#b3b3b3', fontSize: '1.1rem', marginBottom: '10px' }}>No created playlists yet</p>
                <p style={{ color: '#1DB954', fontSize: '0.9rem' }}>Create your first playlist to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {customPlaylists.map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      background: '#181818', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      transition: 'transform 0.2s', 
                      border: '2px solid #1DB954',
                      position: 'relative'
                    }} 
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} 
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div onClick={() => navigate('/playlist', { state: { playlist: p } })} style={{ cursor: 'pointer' }}>
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />
                      ) : (
                        <div style={{ width: '100%', height: '130px', background: '#333', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                          </svg>
                        </div>
                      )}
                      <p style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <p style={{ color: '#1DB954', fontSize: '0.8rem', marginTop: '4px' }}>{p.tracks?.length || 0} songs • Local</p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(p.id, p.name);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(244, 67, 54, 0.8)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        opacity: 0.8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 1)';
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.8)';
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Delete playlist"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spotify Playlists (Visited/Created) */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: 0 }}>Your Spotify Playlists</h2>
              {visitedPlaylists.length > 0 && (
                <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>({visitedPlaylists.length} playlists)</span>
              )}
            </div>
            {visitedPlaylists.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#181818',
                borderRadius: '12px',
                border: '2px dashed #1DB954'
              }}>
                <p style={{ color: '#b3b3b3', fontSize: '1.1rem', marginBottom: '10px' }}>No Spotify playlists yet</p>
                <p style={{ color: '#1DB954', fontSize: '0.9rem' }}>Visit playlists from your Spotify account to see them here!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {visitedPlaylists.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => navigate('/playlist', { state: { playlist: p } })} 
                    style={{ 
                      background: '#181818', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s',
                      border: '2px solid #1DB954'
                    }} 
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} 
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '130px', background: '#333', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18V5l12-2v13"/>
                          <circle cx="6" cy="18" r="3"/>
                          <circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                    )}
                    <p style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ color: '#1DB954', fontSize: '0.8rem', marginTop: '4px' }}>Spotify Playlist</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#282828',
                padding: '30px',
                borderRadius: '12px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center'
              }}>
                <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.5rem' }}>
                  Delete Playlist?
                </h2>
                <p style={{ color: '#b3b3b3', marginBottom: '30px', lineHeight: '1.5' }}>
                  Are you sure you want to delete <strong style={{ color: '#fff' }}>"{playlistToDelete?.name}"</strong>? This action cannot be undone and will remove all songs from this playlist.
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setPlaylistToDelete(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'transparent',
                      color: '#b3b3b3',
                      border: '2px solid #b3b3b3',
                      borderRadius: '24px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeletePlaylist}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '24px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#d32f2f';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f44336';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Delete Playlist
                  </button>
                </div>
              </div>
            </div>
          )}
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
                rows="4"
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                Cover Image
              </label>
              
              <label style={{
                display: 'block',
                padding: '16px 24px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
                width: '100%'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Upload Cover Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
              
              {newPlaylistCoverImage && (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <img
                    src={newPlaylistCoverImage}
                    alt="Cover preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      border: '2px solid #282828',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <p style={{ color: '#b3b3b3', marginTop: '5px', fontSize: '0.9rem' }}>
                    Cover image preview
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={createLocalPlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  padding: '16px 32px',
                  backgroundColor: newPlaylistName.trim() ? '#1DB954' : '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: newPlaylistName.trim() ? '0 4px 12px rgba(29, 185, 84, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (newPlaylistName.trim()) {
                    e.currentTarget.style.backgroundColor = '#1ed760';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newPlaylistName.trim()) {
                    e.currentTarget.style.backgroundColor = '#1DB954';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                Create Playlist
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
          position: 'relative'
        }}>
          <div style={{ position: 'relative' }}>
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
                background: '#333',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '4rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}>
                🎵
              </div>
            )}
            {/* Image Upload for Local Playlists */}
            {playlist.id.startsWith('local_') && (
              <label style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.2rem',
                transition: 'all 0.2s'
              }}>
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={updateCoverImage}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <p style={{ 
              fontSize: '0.8rem', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              marginBottom: '8px',
              color: '#fff'
            }}>
              Playlist
            </p>
            
            {/* Editable Title for Local Playlists */}
            {editingPlaylistName && playlist.id.startsWith('local_') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={newPlaylistNameEdit}
                  onChange={(e) => setNewPlaylistNameEdit(e.target.value)}
                  style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    background: 'transparent',
                    border: '2px solid #7B68EE',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    outline: 'none',
                    flex: 1
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') savePlaylistName();
                    if (e.key === 'Escape') setEditingPlaylistName(false);
                  }}
                  autoFocus
                />
                <button onClick={savePlaylistName} style={{ padding: '8px 12px', background: '#1DB954', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setEditingPlaylistName(false)} style={{ padding: '8px 12px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <h1 style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: '#fff',
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  {playlist.name}
                </h1>
                {playlist.id.startsWith('local_') && (
                  <button
                    onClick={startEditingName}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#7B68EE',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    title="Edit playlist name"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b3b3b3', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>
                {playlist.owner?.display_name || (playlist.id.startsWith('local_') ? 'Local Playlist' : 'Unknown')}
              </span>
              <span>•</span>
              <span>{tracks.length} songs</span>
              {playlist.id.startsWith('local_') && (
                <>
                  <span>•</span>
                  <span style={{ color: '#7B68EE' }}>Local</span>
                </>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={playPlaylist}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#1DB954',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '1rem',
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                Play Playlist
              </button>
              
              {/* Delete Button for Local Playlists */}
              {playlist.id.startsWith('local_') && (
                <button
                  onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d32f2f';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f44336';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Delete Playlist
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
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
          
          {playlist.id.startsWith('local_') && (
            <button
              onClick={() => navigate('/browse')}
              style={{
                padding: '10px 24px',
                backgroundColor: '#7B68EE',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#9370DB';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#7B68EE';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Songs
            </button>
          )}
        </div>

        {/* Track List */}
        {loading ? (
          <p style={{ color: '#b3b3b3' }}>Loading tracks...</p>
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
              {playlist.id.startsWith('local_') && (
                <span style={{ width: '60px', textAlign: 'center' }}>REMOVE</span>
              )}
            </div>
            
            {tracks.map((track, index) => (
              <div
                key={track.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#121212',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  marginBottom: '2px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#121212'}
              >
                <span 
                  onClick={() => playTrack(track)}
                  style={{ 
                    width: '40px', 
                    color: '#b3b3b3',
                    textAlign: 'center',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  {index + 1}
                </span>
                
                <div 
                  onClick={() => playTrack(track)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <p style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '3px', 
                    fontSize: '0.95rem',
                    color: '#fff'
                  }}>
                    {track.name}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                    {track.artists?.map(a => a.name).join(', ')}
                  </p>
                </div>
                
                {/* Delete button for local playlists */}
                {playlist.id.startsWith('local_') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrackFromPlaylist(index);
                    }}
                    style={{
                      width: '60px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Remove from playlist"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#282828',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}>
              <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.5rem' }}>
                Delete Playlist?
              </h2>
              <p style={{ color: '#b3b3b3', marginBottom: '30px', lineHeight: '1.5' }}>
                Are you sure you want to delete <strong style={{ color: '#fff' }}>"{playlistToDelete?.name}"</strong>? This action cannot be undone and will remove all songs from this playlist.
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPlaylistToDelete(null);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    color: '#b3b3b3',
                    border: '2px solid #b3b3b3',
                    borderRadius: '24px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlaylist}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d32f2f';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f44336';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Delete Playlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Playlist;
