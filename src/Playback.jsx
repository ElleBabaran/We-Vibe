import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./App.css";

function Playback() {
  const location = useLocation();
  const navigate = useNavigate();
  const track = location.state?.track;
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!track) {
      navigate("/home");
      return;
    }

    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      navigate("/");
      return;
    }

    // Mock queue data - you can replace this with actual queue from your app
    setQueue([
      { title: "Detox", artist: "The Weeknd" },
      { title: "Lose Control", artist: "Meduza" },
      { title: "Mind Of Me", artist: "aelhad" },
      { title: "Sunset Lover", artist: "Petit Biscuit" },
    ]);
  }, [track, navigate]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (!track) {
    return null;
  }

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="home-content" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '60px', 
          alignItems: 'center',
          maxWidth: '1200px',
          width: '100%'
        }}>
          {/* iPod-style Player */}
          <div style={{
            background: 'linear-gradient(145deg, #e8e8f0 0%, #d4d4e0 100%)',
            borderRadius: '32px',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            width: '380px',
            border: '8px solid #b8b8c8',
            position: 'relative',
          }}>
            {/* Screen */}
            <div style={{
              background: 'linear-gradient(180deg, #f5f5f8 0%, #e8e8f0 100%)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '30px',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.15)',
              border: '3px solid #a8a8b8',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Album Art */}
              {track.album?.images?.[0]?.url && (
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
                  style={{
                    width: '140px',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
                />
              )}
              
              {/* Track Info */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <h2 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  color: '#2c2c3c',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {track.name}
                </h2>
                <p style={{ 
                  fontSize: '0.9rem',
                  color: '#6c6c7c',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {track.album?.name || track.artists?.map(a => a.name).join(', ')}
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', marginTop: '8px' }}>
                <div style={{
                  height: '6px',
                  background: '#c8c8d8',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    width: '40%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #7c7cf0 0%, #9c9cff 100%)',
                    borderRadius: '3px',
                  }}></div>
                </div>
              </div>
            </div>

            {/* Controls Wheel */}
            <div style={{
              position: 'relative',
              width: '280px',
              height: '280px',
              margin: '0 auto',
              background: 'linear-gradient(145deg, #f8f8fc 0%, #e0e0ec 100%)',
              borderRadius: '50%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Center Button */}
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(145deg, #f0f0f8 0%, #d8d8e8 100%)',
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 10,
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ fontSize: '2rem', color: '#7c7cf0' }}>❚❚</div>
              </div>

              {/* Top Button - Next */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
              }}>
                <div style={{ fontSize: '1.5rem', color: '#8c8c9c' }}>⏭</div>
              </div>

              {/* Bottom Button - Previous */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
              }}>
                <div style={{ fontSize: '1.5rem', color: '#8c8c9c' }}>⏮</div>
              </div>

              {/* Left Button - Volume Down */}
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
              }}>
                <div style={{ fontSize: '1.5rem', color: '#8c8c9c' }}>⏪</div>
              </div>

              {/* Right Button - Volume Up */}
              <div style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
              }}>
                <div style={{ fontSize: '1.5rem', color: '#8c8c9c' }}>⏩</div>
              </div>

              {/* Small dot at bottom */}
              <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%) translateY(50px)',
                width: '12px',
                height: '12px',
                background: '#b8b8c8',
                borderRadius: '50%',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
              }}></div>
            </div>
          </div>

          {/* Up Next Queue */}
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              marginBottom: '30px',
              color: '#fff',
              letterSpacing: '-0.5px'
            }}>
              Up Next
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {queue.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  backgroundColor: '#181818',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}>
                  {/* Album placeholder */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, 
                      ${index === 0 ? '#7c9fff, #a8b8ff' : 
                        index === 1 ? '#d896ff, #f0a8ff' : 
                        index === 2 ? '#b8a8ff, #d8c0ff' : 
                        '#ffa8c8, #ffc0d8'})`,
                    flexShrink: 0,
                  }}></div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      color: '#fff',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </p>
                    <p style={{ 
                      fontSize: '0.9rem',
                      color: '#b3b3b3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                marginTop: '40px',
                padding: '12px 32px',
                backgroundColor: 'transparent',
                color: '#b3b3b3',
                border: '2px solid #b3b3b3',
                borderRadius: '24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#b3b3b3';
                e.currentTarget.style.borderColor = '#b3b3b3';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← Back to Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Playback;