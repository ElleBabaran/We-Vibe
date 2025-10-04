import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Music, LogOut } from 'lucide-react';


const BACKEND_URL = 'https://we-vibe-pi.vercel.app/api'; 
const API_URL = 'https://api.spotify.com/v1';

const getHashParams = () => {
  const hashParams = {};
  const q = window.location.hash.substring(1); 
  const r = /([^&;=]+)=?([^&;]*)/g;
  let e;
  
  while (e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
};

const fetchUserProfile = async (token) => {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user data or token expired.');
    }
    const userData = await response.json(); 
    return { 
      name: userData.display_name || 'Spotify User',
      image: userData.images?.[0]?.url || 'https://placehold.co/100x100/1DB954/ffffff?text=U',
    };
  } catch (error) {
    console.error("Authentication Error:", error);
    // Fallback Mock Data for presentation
    return { name: 'User Display Name', image: 'https://placehold.co/100x100/1DB954/ffffff?text=U' };
  }
};

const AuthHandler = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to handle logout (clears state and storage)
    const handleLogout = () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        setAccessToken(null);
        setUserData(null);
        window.location.hash = '';
    };

    const checkTokensAndAuthenticate = useCallback(() => {
        const params = getHashParams();
        let token = params.access_token;
        const refresh = params.refresh_token;

        if (token) {
            // 1. Tokens found in URL hash (successful login from callback)
            localStorage.setItem('spotify_access_token', token);
            localStorage.setItem('spotify_refresh_token', refresh);
            window.history.pushState('', document.title, window.location.pathname + window.location.search);
        } else {
            // 2. Try to load tokens from local storage
            token = localStorage.getItem('spotify_access_token');
        }
        
        if (token) {
            setAccessToken(token);
            // Fetch user profile using the token
            fetchUserProfile(token).then(data => {
                setUserData(data);
                setLoading(false);
            }).catch(() => {
                // If fetching fails (e.g., token expired), clear tokens
                handleLogout(); 
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkTokensAndAuthenticate();
    }, [checkTokensAndAuthenticate]);


    if (loading) {
        // Show loading state while checking tokens
        return (
            <div className="flex items-center justify-center h-full text-white">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mr-2" />
                <p>Authenticating...</p>
            </div>
        );
    }

    if (accessToken && userData) {
        // --- LOGGED IN DASHBOARD VIEW ---
        // Here you would render the protected content of your Homepage
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-xl">
                    <h1 className="text-3xl font-bold text-green-500">
                        Welcome, {userData.name}!
                    </h1>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 p-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                        <LogOut className="w-5 h-5 text-white" />
                        <span className="text-white hidden sm:inline">Logout</span>
                    </button>
                </div>
                {/* Replace this div with your actual Homepage component content */}
                <div className="text-gray-300">
                    <p>You are successfully logged in and authenticated with Spotify.</p>
                    <p>Now you can use the access token ({accessToken.substring(0, 10)}...) to call the Spotify Web API.</p>
                </div>
                
            </div>
            // In a real app, you might use React Context here to pass userData and accessToken down.
            // <HomepageDashboard userData={userData} accessToken={accessToken} /> 
        );
    }

    // --- LOGOUT / INITIAL SCREEN VIEW ---
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Music className="w-16 h-16 text-white mb-4" />
            <h1 className="text-4xl font-extrabold text-white mb-3">wevibe</h1>
            <p className="text-lg text-gray-300 mb-8">
                The ultimate music experience. Log in to continue.
            </p>
            <a 
                href={`${BACKEND_URL}/login`} 
                className="inline-block"
            >
                <button className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full shadow-lg transition duration-200 transform hover:scale-105">
                    Log in with Spotify
                </button>
            </a>
            <p className="mt-6 text-sm text-gray-400">
                You must have your Node.js server running and deployed to {BACKEND_URL}.
            </p>
        </div>
    );
};

export default AuthHandler;
