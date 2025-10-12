import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import { MusicUtils, quickSort, shuffle } from "./utils/index.js";
import Sidebar from "./Sidebar";
import "./App.css";

function Playlist() {
  const location = useLocation();
  const navigate = useNavigate();
  const playlist = location.state?.playlist;
  const { addTrackToQueue, clearQueue, playTrackFromQueue, queue } = useMusicQueue();
  
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistImage, setNewPlaylistImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTracks, setFilteredTracks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    if (playlist) {
      // Fetch playlist tracks
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
    } else {
      setLoading(false);
    }
  }, [playlist, navigate]);

  // Handle filtering and sorting
  useEffect(() => {
    if (!tracks.length) {
      setFilteredTracks([]);
      return;
    }

    let processed = [...tracks];

    // Apply search filter
    if (searchQuery.trim()) {
      processed = MusicUtils.searchTracks(processed, searchQuery);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        processed = MusicUtils.sortTracksByName(processed);
        break;
      case 'duration':
        processed = MusicUtils.sortTracksByDuration(processed);
        break;
      case 'popularity':
        processed = MusicUtils.sortTracksByPopularity(processed);
        break;
      case 'shuffle':
        processed = shuffle(processed);
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredTracks(processed);
  }, [tracks, searchQuery, sortBy]);

  const playTrack = (track) => {
    // Add this track to the queue (don't clear existing queue)
    addTrackToQueue(track);
    navigate('/playback');
    playTrackFromQueue(queue.length); // Play the newly added track
  };

  const playPlaylist = () => {
    const tracksToPlay = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (tracksToPlay.length === 0) return;
    
    // Clear current queue and add entire playlist
    clearQueue();
    tracksToPlay.forEach(track => addTrackToQueue(track));
    navigate('/playback');
    playTrackFromQueue(0);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 256KB as per Spotify API)
      if (file.size > 256 * 1024) {
        alert('Image size must be less than 256KB');
        return;
      }
      
      setNewPlaylistImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
        
        // Upload image if provided
        if (newPlaylistImage) {
          try {
            // Convert image to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Image = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
              
              const imageResponse = await fetch(
                `https://api.spotify.com/v1/playlists/${newPlaylist.id}/images`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "image/jpeg",
                  },
                  body: base64Image,
                }
              );
              
              if (imageResponse.ok) {
                alert(`Playlist "${newPlaylistName}" created with custom image!`);
              } else {
                alert(`Playlist "${newPlaylistName}" created, but image upload failed.`);
              }
            };
            reader.readAsDataURL(newPlaylistImage);
          } catch (imageError) {
            console.error("Error uploading image:", imageError);
            alert(`Playlist "${newPlaylistName}" created, but image upload failed.`);
          }
        } else {
          alert(`Playlist "${newPlaylistName}" created successfully!`);
        }
        
        // Reset form
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setNewPlaylistImage(null);
        setImagePreview(null);
        setShowCreateForm(false);
      } else {
        alert('Failed to create playlist');
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert('Error creating playlist');
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
          <div style={{ textAlign: 'center', padding: '40px' }}>
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
            
            {/* Image Upload Section */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '12px', color: '#fff', fontWeight: 'bold' }}>
                Playlist Cover Image (Optional)
              </label>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '15px' 
              }}>
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={imagePreview}
                      alt="Playlist cover preview"
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #282828'
                      }}
                    />
                    <button
                      onClick={() => {
                        setNewPlaylistImage(null);
                        setImagePreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#e22134',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '200px',
                      height: '200px',
                      border: '2px dashed #282828',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#181818',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onClick={() => document.getElementById('imageUpload').click()}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1DB954'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#282828'}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
                    <p style={{ color: '#b3b3b3', fontSize: '0.9rem', textAlign: 'center' }}>
                      Click to upload<br/>
                      <span style={{ fontSize: '0.8rem' }}>(Max 256KB)</span>
                    </p>
                  </div>
                )}
                
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                
                <button
                  onClick={() => document.getElementById('imageUpload').click()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#1DB954',
                    border: '2px solid #1DB954',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1DB954';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1DB954';
                  }}
                >
                  Choose Image
                </button>
              </div>
            </div>
            
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
            
            <div style={{ marginBottom: '30px' }}>
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
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
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
        }}>
          {playlist.images?.[0]?.url && (
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
          )}
          <div>
            <p style={{ 
              fontSize: '0.8rem', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              marginBottom: '8px',
              color: '#fff'
            }}>
              Playlist
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b3b3b3', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>
                {playlist.owner?.display_name}
              </span>
              <span>•</span>
              <span>{tracks.length} songs</span>
              {tracks.length > 0 && (
                <>
                  <span>•</span>
                  <span>ID: {MusicUtils.generatePlaylistId(playlist.name, playlist.owner?.id || 'unknown')}</span>
                </>
              )}
            </div>
            
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
              ▶️ Play Playlist
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
        ) : tracks.length > 0 ? (
          <div style={{ marginBottom: '40px' }}>
            {/* Search and Sort Controls */}
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              alignItems: 'center', 
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#181818',
              borderRadius: '8px',
              border: '1px solid #282828'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="🔍 Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#282828',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#b3b3b3', 
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#282828',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  <option value="default">Default Order</option>
                  <option value="name">📝 Name (A-Z)</option>
                  <option value="duration">⏱️ Duration</option>
                  <option value="popularity">⭐ Popularity</option>
                  <option value="shuffle">🔀 Shuffle</option>
                </select>
              </div>
              
              {(searchQuery || sortBy !== 'default') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSortBy('default');
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#e22134',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
            
            {/* Results Summary */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                Showing {filteredTracks.length > 0 ? filteredTracks.length : tracks.length} of {tracks.length} tracks
                {searchQuery && (
                  <span style={{ color: '#1DB954', fontWeight: 'bold' }}>
                    {' '}• Search: "{searchQuery}"
                  </span>
                )}
                {sortBy !== 'default' && (
                  <span style={{ color: '#1DB954', fontWeight: 'bold' }}>
                    {' '}• Sorted by: {sortBy}
                  </span>
                )}
              </p>
            </div>
            
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
            
            {(filteredTracks.length > 0 ? filteredTracks : tracks).map((track, index) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#121212',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
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
                    {track.name}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                    {track.artists?.map(a => a.name).join(', ')}
                  </p>
                </div>
                
                <span style={{ 
                  width: '80px', 
                  color: '#b3b3b3', 
                  fontSize: '0.9rem',
                  textAlign: 'right'
                }}>
                  {formatDuration(track.duration_ms)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#b3b3b3' }}>
            <h3>No tracks found</h3>
            <p>This playlist is empty or no tracks match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Playlist;
