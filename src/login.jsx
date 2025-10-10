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
const CLIENT_ID = "ddf0c76f108e48229461ed6a31574a9f";
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
      <div className="login-content">
        <h1 className="login-logo">WeVibe</h1>
        <p className="login-subtitle">Your music, your vibe 🎵</p>
        <button 
          onClick={handleLogin}
          className="login-button"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
}