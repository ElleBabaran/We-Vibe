import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMusicQueue } from './MusicQueueContext';

function MiniPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
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
  }, [getCurrentTrack]);

  const togglePlayPause = async () => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) return;
    try {
      if (isPlaying) {
        const res = await fetch('https://api.spotify.com/v1/me/player/pause', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsPlaying(false);
      } else {
        const res = await fetch('https://api.spotify.com/v1/me/player/play', {
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
    try {
      // Try SDK endpoint first via Web API
      const res = await fetch('https://api.spotify.com/v1/me/player/next', {
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
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/previous', {
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
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 98,
      padding: '10px 16px',
      background: 'rgba(24,24,24,0.95)',
      borderTop: '1px solid #333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {currentTrack.album?.images?.[0]?.url && (
          <img src={currentTrack.album.images[0].url} alt={currentTrack.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 280 }}>
            {currentTrack.name}
          </div>
          <div style={{ color: '#b3b3b3', fontSize: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 280 }}>
            {currentTrack.artists?.map(a => a.name).join(', ')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={prev} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#2a2a2a', color: '#fff', cursor: 'pointer'
        }}>
          ◀
        </button>
        <button onClick={togglePlayPause} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#1DB954', color: '#fff', cursor: 'pointer', fontWeight: 700
        }}>
          {isPlaying ? 'II' : '▶'}
        </button>
        <button onClick={next} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#2a2a2a', color: '#fff', cursor: 'pointer'
        }}>
          ▶
        </button>
      </div>

      <button onClick={() => navigate('/playback')} style={{
        border: 'none', background: 'transparent', color: '#b3b3b3', cursor: 'pointer', fontWeight: 600
      }}>
        Open Player
      </button>
    </div>
  );
}

export default MiniPlayer;


