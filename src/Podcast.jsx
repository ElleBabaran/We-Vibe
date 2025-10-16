import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMusicQueue } from "./MusicQueueContext";
import Sidebar from "./Sidebar";
import "./App.css";

export default function Podcast() {
  const navigate = useNavigate();
  const { clearAndPlayPlaylist } = useMusicQueue();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [podcastSortBy, setPodcastSortBy] = useState('name');
  const [episodeSortBy, setEpisodeSortBy] = useState('release_date');

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");

    if (!token) {
      console.error("No access token found – please log in again.");
      navigate("/");
      return;
    }

    fetchPodcasts(token);
  }, [navigate]);

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

  const playEpisode = (episode, index) => {
    if (episode.uri) {
      const tracks = episodes.map(ep => ({
        id: ep.id,
        name: ep.name,
        artists: [{ name: selectedPodcast?.name || "Unknown Podcast" }],
        album: { images: ep.images ? [{ url: ep.images[0].url }] : [] },
        uri: ep.uri,
        duration_ms: ep.duration_ms
      }));

      clearAndPlayPlaylist(tracks, index);

    } else {
      alert("Episode not available for playback.");
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

                {episodes.map((episode, index) => (
                  <div
                    key={episode.id}
                    onClick={() => playEpisode(episode, index)}
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
                      <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '0.95rem', color: '#fff' }}>
                        {episode.name}
                      </p>
                      <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                        {episode.description?.substring(0, 100)}...
                      </p>
                    </div>

                    <span style={{
                      width: '80px',
                      color: '#b3b3b3',
                      fontSize: '0.9rem',
                      textAlign: 'right'
                    }}>
                      {formatDuration(episode.duration_ms)}
                    </span>
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
      </div>
    </div>
  );
}

