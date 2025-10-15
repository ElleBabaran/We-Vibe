import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { addToRecent } from "./recent";
import "./App.css";

export default function Podcast() {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [playingEpisode, setPlayingEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExpandedPlayer, setShowExpandedPlayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [podcastSortBy, setPodcastSortBy] = useState('name');
  const [episodeSortBy, setEpisodeSortBy] = useState('release_date');
  const audioRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");

    if (!token) {
      console.error("No access token found – please log in again.");
      navigate("/");
      return;
    }

    fetchPodcasts(token);
  }, [navigate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || 0);
      };
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateTime);
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateTime);
      };
    }
  }, [playingEpisode, volume, playbackRate]);

  const fetchPodcasts = async (token) => {
    try {
      
      const response = await fetch(
        "https://api.spotify.com/v1/search?q=podcast&type=show&limit=50",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      let fetchedPodcasts = data.shows?.items || [];

      
      if (podcastSortBy === 'name') {
        fetchedPodcasts.sort((a, b) => a.name.localeCompare(b.name));
      } else if (podcastSortBy === 'publisher') {
        fetchedPodcasts.sort((a, b) => a.publisher.localeCompare(b.publisher));
      } else if (podcastSortBy === 'popularity') {
        fetchedPodcasts.sort((a, b) => b.popularity - a.popularity);
      }

      setPodcasts(fetchedPodcasts);
    } catch (err) {
      console.error("Error fetching podcasts:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewPodcast = async (podcast) => {
    setSelectedPodcast(podcast);
    const token = localStorage.getItem("spotify_access_token");
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/shows/${podcast.id}/episodes?limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      let fetchedEpisodes = data.items || [];

      
      if (episodeSortBy === 'release_date') {
        fetchedEpisodes.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
      } else if (episodeSortBy === 'name') {
        fetchedEpisodes.sort((a, b) => a.name.localeCompare(b.name));
      } else if (episodeSortBy === 'duration') {
        fetchedEpisodes.sort((a, b) => b.duration_ms - a.duration_ms);
      }

      setEpisodes(fetchedEpisodes);
    } catch (err) {
      console.error("Error fetching episodes:", err);
    }
  };

  const playEpisode = (episode) => {
    if (!audioRef.current) return;
    if (playingEpisode?.id === episode.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setShowExpandedPlayer(false);
      return;
    }
    if (episode.audio_preview_url) {
      audioRef.current.src = episode.audio_preview_url;
      audioRef.current.play();
      setPlayingEpisode(episode);
      setIsPlaying(true);
      setShowExpandedPlayer(true);
      
      addToRecent({
        id: episode.id,
        name: episode.name,
        artists: [{ name: selectedPodcast?.name || "Unknown Podcast" }],
        album: { images: episode.images ? [{ url: episode.images[0].url }] : [] },
        src: episode.audio_preview_url
      });
    } else {
      alert("Preview not available for this episode.");
    }
  };

  const playNextEpisode = () => {
    if (!playingEpisode || !episodes.length) return;
    const currentIndex = episodes.findIndex(ep => ep.id === playingEpisode.id);
    const nextIndex = currentIndex + 1;
    if (nextIndex < episodes.length) {
      playEpisode(episodes[nextIndex]);
    }
  };

  const playPreviousEpisode = () => {
    if (!playingEpisode || !episodes.length) return;
    const currentIndex = episodes.findIndex(ep => ep.id === playingEpisode.id);
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      playEpisode(episodes[prevIndex]);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const backToPodcasts = () => {
    setSelectedPodcast(null);
    setEpisodes([]);
    setPlayingEpisode(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <div className="welcome-header">
          <h1 className="welcome-title">
            {selectedPodcast ? selectedPodcast.name : "Podcasts 🎙️"}
          </h1>
          {selectedPodcast ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <select
                value={episodeSortBy}
                onChange={(e) => {
                  setEpisodeSortBy(e.target.value);
                  
                  const sortedEpisodes = [...episodes];
                  if (e.target.value === 'release_date') {
                    sortedEpisodes.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                  } else if (e.target.value === 'name') {
                    sortedEpisodes.sort((a, b) => a.name.localeCompare(b.name));
                  } else if (e.target.value === 'duration') {
                    sortedEpisodes.sort((a, b) => b.duration_ms - a.duration_ms);
                  } else if (e.target.value === 'popularity') {
                    sortedEpisodes.sort((a, b) => b.popularity - a.popularity);
                  }
                  setEpisodes(sortedEpisodes);
                }}
                style={{
                  backgroundColor: '#282828',
                  color: '#fff',
                  border: '1px solid #535353',
                  borderRadius: '8px',
                  padding: '10px 15px',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1DB954'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#535353'}
              >
                <option value="release_date">📅 Sort by Date</option>
                <option value="name">🔤 Sort by Name</option>
                <option value="duration">⏱️ Sort by Duration</option>
                <option value="popularity">⭐ Sort by Popularity</option>
              </select>
              <button
                onClick={backToPodcasts}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1DB954',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ← Back to Podcasts
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '10px' }}>
              <select
                value={podcastSortBy}
                onChange={(e) => {
                  setPodcastSortBy(e.target.value);
                  
                  const sortedPodcasts = [...podcasts];
                  if (e.target.value === 'name') {
                    sortedPodcasts.sort((a, b) => a.name.localeCompare(b.name));
                  } else if (e.target.value === 'publisher') {
                    sortedPodcasts.sort((a, b) => a.publisher.localeCompare(b.publisher));
                  }
                  setPodcasts(sortedPodcasts);
                }}
                style={{
                  backgroundColor: '#282828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="name">Sort by Name</option>
                <option value="publisher">Sort by Publisher</option>
                <option value="popularity">Sort by Popularity</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#b3b3b3' }}>Loading podcasts...</p>
        ) : selectedPodcast ? (
          <>
            {episodes.length === 0 ? (
              <p style={{ color: '#b3b3b3' }}>No episodes available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {episodes.map((episode, index) => (
                  <div
                    key={episode.id}
                    onClick={() => playEpisode(episode)}
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
                      color: '#b3b3b3',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </span>

                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '0.95rem' }}>
                        {episode.name}
                      </p>
                      <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                        {episode.description?.substring(0, 100)}...
                      </p>
                    </div>

                    <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                      {formatDuration(episode.duration_ms)}
                    </span>

                    <div style={{
                      marginLeft: '15px',
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'transparent',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      color: playingEpisode?.id === episode.id && isPlaying ? '#1DB954' : '#fff',
                    }}>
                      {playingEpisode?.id === episode.id && isPlaying ? '⏸️' : '▶️'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {podcasts.length === 0 ? (
              <p style={{ color: '#b3b3b3' }}>No podcasts available</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {podcasts.map((podcast) => (
                  <div
                    key={podcast.id}
                    style={{
                      backgroundColor: '#181818',
                      padding: '15px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}
                    onClick={() => viewPodcast(podcast)}
                  >
                    {podcast.images?.[0]?.url && (
                      <img
                        src={podcast.images[0].url}
                        alt={podcast.name}
                        style={{
                          width: '100%',
                          height: '150px',
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
                      {podcast.name}
                    </p>
                    <p style={{
                      color: '#b3b3b3',
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {podcast.publisher}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Expanded Audio Player */}
        {showExpandedPlayer && playingEpisode && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '95%',
            maxWidth: '900px',
            backgroundColor: '#181818',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* Episode Image */}
            {playingEpisode.images?.[0]?.url && (
              <img
                src={playingEpisode.images[0].url}
                alt={playingEpisode.name}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            )}

            {/* Track Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                color: '#fff',
                fontWeight: 'bold',
                marginBottom: '4px',
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {playingEpisode.name}
              </p>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedPodcast?.name}
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ flex: 1, margin: '0 20px' }}>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#535353',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '5px',
                fontSize: '0.8rem',
                color: '#b3b3b3'
              }}>
                <span>{formatDuration(currentTime * 1000)}</span>
                <span>{formatDuration(duration * 1000)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Previous Track */}
              <button
                onClick={playPreviousEpisode}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#b3b3b3',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
              >
                ⏮️
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  if (isPlaying) {
                    audioRef.current?.pause();
                  } else {
                    audioRef.current?.play();
                  }
                }}
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#1DB954',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#1DB954',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              {/* Next Track */}
              <button
                onClick={playNextEpisode}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#b3b3b3',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
              >
                ⏭️
              </button>

              {/* Volume Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem', color: '#b3b3b3' }}>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    width: '60px',
                    height: '4px',
                    backgroundColor: '#535353',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                />
              </div>

              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                style={{
                  backgroundColor: '#282828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowExpandedPlayer(false);
                  audioRef.current?.pause();
                  setIsPlaying(false);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '5px',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Audio Player */}
        <audio
          ref={audioRef}
          onEnded={() => {
            setIsPlaying(false);
            setShowExpandedPlayer(false);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

