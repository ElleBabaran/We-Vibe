import React from "react";
import "./App.css";
import { generateCodeVerifier, generatePkceChallenge } from "./utils/crypto";

// Spotify Application Constants
const CLIENT_ID = "2bbf168c93cc42a792d17ed4d6739b72";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-modify-private",
  // Needed to upload custom playlist cover images
  "ugc-image-upload",
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
    const codeChallenge = await generatePkceChallenge(codeVerifier);

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