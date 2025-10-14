import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMusicQueue } from './MusicQueueContext';

function MiniPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    queue,
    currentTrackIndex,
    getCurrentTrack,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
  } = useMusicQueue();

  // Hide on the dedicated playback page
  const hidden = location.pathname === '/playback';

  const [currentTrack, setCurrentTrack] = useState(null);

  useEffect(() => {
    setCurrentTrack(getCurrentTrack());
  }, [getCurrentTrack, queue, currentTrackIndex, isPlaying]);

  const togglePlayPause = async () => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    const deviceId = localStorage.getItem('spotify_device_id');
    try {
      if (isPlaying) {
        const res = await fetch(`https://api.spotify.com/v1/me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}` , {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsPlaying(false);
      } else {
        const res = await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsPlaying(true);
      }
    } catch (_) {}
  };

  const next = async () => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    const deviceId = localStorage.getItem('spotify_device_id');
    try {
      // Try SDK endpoint first via Web API
      const res = await fetch(`https://api.spotify.com/v1/me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Fallback to local queue pointer
        playNext();
      }
    } catch (_) {
      playNext();
    }
  };

  const prev = async () => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    const deviceId = localStorage.getItem('spotify_device_id');
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        playPrevious();
      }
    } catch (_) {
      playPrevious();
    }
  };

  if (hidden || !currentTrack) return null;

  return (
    <div style={{
      position: 'fixed',
      left: '240px', // Same as sidebar width
      right: 0,
      bottom: 0,
      zIndex: 98,
      padding: '12px 24px',
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98), rgba(26, 26, 26, 0.95))',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
        {currentTrack.album?.images?.[0]?.url && (
          <img 
            src={currentTrack.album.images[0].url} 
            alt={currentTrack.name} 
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 8, 
              objectFit: 'cover',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }} 
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ 
            color: '#fff', 
            fontWeight: '700', 
            fontSize: '1rem', 
            fontFamily: 'Plus Jakarta Sans, system-ui',
            overflow: 'hidden', 
            whiteSpace: 'nowrap', 
            textOverflow: 'ellipsis', 
            maxWidth: 320,
            marginBottom: '2px'
          }}>
            {currentTrack.name}
          </div>
          <div style={{ 
            color: '#b3b3b3', 
            fontSize: '0.9rem', 
            fontWeight: '500',
            overflow: 'hidden', 
            whiteSpace: 'nowrap', 
            textOverflow: 'ellipsis', 
            maxWidth: 320
          }}>
            {currentTrack.artists?.map(a => a.name).join(', ')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1 }}>
        <button 
          onClick={prev} 
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
          style={{
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            border: 'none', 
            background: 'rgba(255, 255, 255, 0.1)', 
            color: '#fff', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            backdropFilter: 'blur(5px)'
          }}>
          ⏮
        </button>
        <button 
          onClick={togglePlayPause} 
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.08)';
            e.target.style.boxShadow = '0 6px 16px rgba(29, 185, 84, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.3)';
          }}
          style={{
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            border: 'none', 
            background: 'linear-gradient(135deg, #1DB954, #1ed760)', 
            color: '#fff', 
            cursor: 'pointer', 
            fontWeight: 700,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          onClick={next} 
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
          style={{
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            border: 'none', 
            background: 'rgba(255, 255, 255, 0.1)', 
            color: '#fff', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            backdropFilter: 'blur(5px)'
          }}>
          ⏭
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/playback')} style={{
          border: 'none', background: 'transparent', color: '#b3b3b3', cursor: 'pointer', fontWeight: 600
        }}>
          Open Player
        </button>
      </div>
    </div>
  );
}

export default MiniPlayer;


