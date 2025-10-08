import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import "./App.css";

function Home() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");

    if (!token) {
      console.error("No access token found — please log in again.");
      return;
    }

    // Fetch the user's Spotify profile
    fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Spotify user data:", data);
        setProfile(data);
      })
      .catch(err => console.error("Error fetching user data:", err));
  }, []);

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="home-content">
        <div className="welcome-header">
          <h1 className="welcome-title">
            Welcome to WeVibe 🎶
          </h1>
          {profile && (
            <div className="profile-info">
              {profile.images?.[0]?.url && (
                <img
                  src={profile.images[0].url}
                  alt="Profile"
                  className="profile-image"
                />
              )}
              <div>
                <p className="profile-label">Logged in as</p>
                <p className="profile-name">{profile.display_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Empty content area - ready for your content */}
        <div className="empty-content">
          <p>Your content goes here</p>
        </div>
      </div>
    </div>
  );
}

export default Home;