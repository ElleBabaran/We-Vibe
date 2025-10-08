import React from "react";

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
const CLIENT_ID = "ddf0c76f108e48229461ed6a31574a9f"; // <-- your client id
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-modify-private"
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
      backgroundColor: '#121212', // Dark background inspired by Spotify
    }}>
      <button 
        onClick={handleLogin}
        style={{
          padding: '12px 30px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#1DB954', // Spotify Green
          border: 'none',
          borderRadius: '9999px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(29, 185, 84, 0.4)',
          transition: 'transform 0.2s, background-color 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Login with Spotify
      </button>
    </div>
  );
}
