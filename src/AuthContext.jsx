// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [codeVerifier, setCodeVerifier] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Optionally sync with localStorage for persistence across page refreshes
  // Remove this if you don't want localStorage at all
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
    } else {
      localStorage.removeItem('spotify_access_token');
    }
  }, [accessToken]);

  const login = (verifier) => {
    setCodeVerifier(verifier);
  };

  const setToken = (token) => {
    setAccessToken(token);
  };

  const logout = () => {
    setAccessToken(null);
    setProfile(null);
    setCodeVerifier(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_code_verifier');
  };

  const fetchProfile = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      // 🔥 FIXED: Use the correct Spotify Profile Endpoint 🔥
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    accessToken,
    codeVerifier,
    profile,
    loading,
    login,
    setToken,
    logout,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}