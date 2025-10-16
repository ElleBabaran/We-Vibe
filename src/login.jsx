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
    <div className="login-container">
      {/* Background video */}
      <video autoPlay muted loop className="background-video" aria-hidden>
        <source src="/Banner/bg.mp4" type="video/mp4" />
      </video>
      {/* Decorative background */}
      <div className="login-bg" aria-hidden>
      </div>

      <img src="/Banner/title.png" alt="WeVibe" className="login-logo" style={{ width: 'auto', height: '21rem', objectFit: 'contain', position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }} />

      <div className="login-card login-content" style={{ zIndex: 1, marginTop: '15%' }}>
        <p className="login-subtitle">Connect your Spotify account and discover your perfect musical journey.</p>

        <button className="login-button" onClick={handleLogin}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Continue with Spotify
          </span>
        </button>

        <div style={{ height: 24 }} />

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
          By continuing, you agree to WeVibe's Terms of Service and acknowledge our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
