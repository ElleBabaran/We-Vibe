import { useEffect, useState } from 'react';

function Lyrics({ track }) {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!track) return;
    
    setLoading(true);
    setError(null);
    
    // Mock lyrics for demonstration - in a real app, you'd use a lyrics API
    const mockLyrics = [
      "This is the first line of the song",
      "And this is the second line",
      "The melody flows through the night",
      "Like stars in the sky so bright",
      "",
      "Chorus:",
      "We're dancing in the moonlight",
      "Everything feels so right",
      "In this moment, we're free",
      "Just you and me",
      "",
      "Verse 2:",
      "The rhythm takes us higher",
      "Setting our hearts on fire",
      "No need to understand",
      "Just take my hand",
      "",
      "Chorus:",
      "We're dancing in the moonlight",
      "Everything feels so right",
      "In this moment, we're free",
      "Just you and me"
    ];
    
    // Simulate API call delay
    setTimeout(() => {
      setLyrics(mockLyrics);
      setLoading(false);
    }, 1000);
  }, [track]);

  if (!track) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#b3b3b3'
      }}>
        <p>No track selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#b3b3b3'
      }}>
        <p>Loading lyrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#ff6b6b'
      }}>
        <p>Could not load lyrics</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        marginBottom: '20px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '15px'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1.2rem',
          marginBottom: '5px'
        }}>
          {track.name}
        </h3>
        <p style={{
          color: '#b3b3b3',
          fontSize: '0.9rem'
        }}>
          {track.artists?.map(a => a.name).join(', ')}
        </p>
      </div>
      
      <div style={{
        lineHeight: '1.8',
        fontSize: '0.95rem',
        color: '#fff'
      }}>
        {lyrics?.map((line, index) => (
          <p 
            key={index}
            style={{
              margin: line === '' ? '10px 0' : '5px 0',
              color: line.startsWith('Chorus:') || line.startsWith('Verse') 
                ? '#1DB954' 
                : line === '' 
                  ? 'transparent' 
                  : '#fff',
              fontWeight: line.startsWith('Chorus:') || line.startsWith('Verse') 
                ? 'bold' 
                : 'normal'
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default Lyrics;
