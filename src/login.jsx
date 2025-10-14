import React from "react";
import "./App.css";

// --- PKCE Helper Functions (Embedded to resolve dependency error) ---

/**
 * Generates a cryptographically random string (code_verifier) for PKCE.
 * @param {number} length - The desired length of the verifier.
 * @returns {string} The PKCE code verifier string.
 */
function generateCodeVerifier(length = 128) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Generates the code challenge by SHA-256 hashing and Base64Url encoding the verifier.
 * @param {string} codeVerifier - The PKCE code verifier.
 * @returns {Promise<string>} The PKCE code challenge string.
 */
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  // Convert to Base64url format
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Spotify Application Constants
const CLIENT_ID = "2bbf168c93cc42a792d17ed4d6739b72";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-modify-private",
  "streaming",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state"
].join(" ");

export default function Login() {
  const handleLogin = async () => {
    // 1) generate verifier + store it so we can use it later in callback
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem("spotify_code_verifier", codeVerifier);

    // 2) generate challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 3) build url and redirect
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      show_dialog: "true"
    });

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse at 20% 50%, rgba(29, 185, 84, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(30, 215, 96, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 40% 80%, rgba(29, 185, 84, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, #000000 0%, #0a0a0a 25%, #111111 50%, #0a0a0a 75%, #000000 100%)
      `,
      padding: '20px',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Grid Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(29, 185, 84, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(29, 185, 84, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.3
      }} />
      
      {/* Floating Music Elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'conic-gradient(from 0deg, #1DB954, #1ed760, #22e668, #1DB954)',
        borderRadius: '20px',
        filter: 'blur(60px)',
        opacity: 0.1,
        animation: 'float 12s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'conic-gradient(from 180deg, #1ed760, #4ecdc4, #45b7d1, #1ed760)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        opacity: 0.08,
        animation: 'float 15s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: '120px',
        height: '120px',
        background: 'linear-gradient(45deg, #1DB954, #1ed760)',
        borderRadius: '15px',
        filter: 'blur(40px)',
        opacity: 0.12,
        animation: 'float 10s ease-in-out infinite'
      }} />

      {/* Main Login Container */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: '32px',
        padding: '50px 35px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          0 32px 64px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(29, 185, 84, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `
      }}>
        {/* Logo with glow effect */}
        <div style={{
          position: 'relative',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '900',
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '-3px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textShadow: '0 0 30px rgba(29, 185, 84, 0.3), 0 0 60px rgba(29, 185, 84, 0.1)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>WeVibe</h1>
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #1DB954, #1ed760, transparent)',
            borderRadius: '2px'
          }} />
        </div>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '40px',
          fontWeight: '500',
          lineHeight: '1.6',
          letterSpacing: '0.3px'
        }}>Connect your Spotify account and discover<br />your perfect musical journey</p>
        {/* Premium Button */}
        <div style={{
          position: 'relative',
          marginBottom: '32px'
        }}>
          <button 
            onClick={handleLogin}
            style={{
              position: 'relative',
              padding: '18px 36px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#000000',
              background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 50%, #22e668 100%)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: `
                0 0 0 1px rgba(29, 185, 84, 0.2),
                0 8px 16px rgba(29, 185, 84, 0.25),
                0 16px 32px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              minWidth: '280px',
              letterSpacing: '0.5px',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-6px) scale(1.02)';
              e.target.style.boxShadow = `
                0 0 0 1px rgba(29, 185, 84, 0.4),
                0 12px 24px rgba(29, 185, 84, 0.35),
                0 24px 48px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3)
              `;
              e.target.style.background = 'linear-gradient(135deg, #1ed760 0%, #22e668 50%, #26ef6f 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = `
                0 0 0 1px rgba(29, 185, 84, 0.2),
                0 8px 16px rgba(29, 185, 84, 0.25),
                0 16px 32px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `;
              e.target.style.background = 'linear-gradient(135deg, #1DB954 0%, #1ed760 50%, #22e668 100%)';
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.01)';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'translateY(-6px) scale(1.02)';
            }}
          >
            {/* Button shimmer effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              animation: 'shimmer 3s ease-in-out infinite'
            }} />
            
            {/* Spotify icon */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Continue with Spotify
            </span>
          </button>
        </div>
        {/* Features List */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '18px' }}>🎵</span>
            </div>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>Discover</span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '18px' }}>📱</span>
            </div>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>Control</span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '18px' }}>✨</span>
            </div>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>Vibe</span>
          </div>
        </div>
        
        {/* Footer */}
        <p style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.4)',
          margin: '0',
          lineHeight: '1.4',
          textAlign: 'center'
        }}>By continuing, you agree to WeVibe's Terms of Service<br />and acknowledge our Privacy Policy</p>
      </div>
    </div>
  );
}