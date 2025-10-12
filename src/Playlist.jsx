import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
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
  const [playlistImage, setPlaylistImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  const playTrack = (track) => {
    // Add this track to the queue (don't clear existing queue)
    addTrackToQueue(track);
    navigate('/playback');
    playTrackFromQueue(queue.length); // Play the newly added track
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPlaylistImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
        
        // Upload playlist image if provided
        if (playlistImage) {
          try {
            const base64Image = await convertImageToBase64(playlistImage);
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
            
            if (!imageResponse.ok) {
              console.warn("Failed to upload playlist image");
            }
          } catch (imageError) {
            console.error("Error uploading playlist image:", imageError);
          }
        }
        
        alert(`Playlist "${newPlaylistName}" created successfully!`);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setPlaylistImage(null);
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
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
                        setPlaylistImage(null);
                        setImagePreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ×
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
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#181818',
                      color: '#b3b3b3',
                      fontSize: '48px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('image-upload').click()}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1DB954';
                      e.currentTarget.style.color = '#1DB954';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#282828';
                      e.currentTarget.style.color = '#b3b3b3';
                    }}
                  >
                    🖼️
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => document.getElementById('image-upload').click()}
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
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
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
        )}
      </div>
    </div>
  );
}

export default Playlist;
