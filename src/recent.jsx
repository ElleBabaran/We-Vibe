import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import "./App.css";


const STORAGE_KEY = "wevibe_recent";
const MAX_RECENT = 50;

function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash >>> 0;
}

export function addToRecent(track) {
    if (!track || !track.id || !track.src) return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((t) => t.id !== track.id);
        const entry = { ...track, addedAt: Date.now() };
        filtered.unshift(entry);
        const truncated = filtered.slice(0, MAX_RECENT);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(truncated));
    } catch (e) {
        console.error("Failed to add to recent:", e);
    }
}

export default function Recent() {
    const [recent, setRecent] = useState([]);
    const [playingId, setPlayingId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');
    const audioRef = useRef(null);

    useEffect(() => {
        loadRecent();
        
        function onStorage(e) {
            if (e.key === STORAGE_KEY) loadRecent();
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    function loadRecent() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            setRecent(list);
        } catch {
            setRecent([]);
        }
    }

    async function playTrack(track) {
        setError(null);
        try {
            if (playingId === track.id && isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
                return;
            }
            
            if (audioRef.current) {
                audioRef.current.src = track.src;
                audioRef.current.play();
                setPlayingId(track.id);
                setIsPlaying(true);
                addToRecent(track);
                loadRecent();
            }
        } catch (err) {
            setError("Unable to play this track.");
        }
    }

    function onEnded() {
        setIsPlaying(false);
    }

    function removeItem(id) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            const filtered = list.filter((t) => t.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            loadRecent();
            if (playingId === id) {
                audioRef.current.pause();
                setPlayingId(null);
                setIsPlaying(false);
            }
        } catch {}
    }

    function clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setRecent([]);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setPlayingId(null);
            setIsPlaying(false);
        } catch {}
    }


    function quickSort(arr, compareFn) {
        if (arr.length <= 1) return arr;
        const pivot = arr[Math.floor(arr.length / 2)];
        const left = arr.filter(item => compareFn(item, pivot) < 0);
        const middle = arr.filter(item => compareFn(item, pivot) === 0);
        const right = arr.filter(item => compareFn(item, pivot) > 0);
        return [...quickSort(left, compareFn), ...middle, ...quickSort(right, compareFn)];
    }

    function mergeSort(arr, compareFn) {
        if (arr.length <= 1) return arr;
        const mid = Math.floor(arr.length / 2);
        const left = mergeSort(arr.slice(0, mid), compareFn);
        const right = mergeSort(arr.slice(mid), compareFn);
        return merge(left, right, compareFn);
    }

    function merge(left, right, compareFn) {
        const result = [];
        let i = 0, j = 0;
        while (i < left.length && j < right.length) {
            if (compareFn(left[i], right[j]) <= 0) {
                result.push(left[i++]);
            } else {
                result.push(right[j++]);
            }
        }
        return result.concat(left.slice(i)).concat(right.slice(j));
    }

    function getSortedTracks() {
        let sorted = [...recent];
        const compareFn = (a, b) => {
           
            const result = (a.addedAt || 0) - (b.addedAt || 0);
            return sortOrder === 'asc' ? result : -result;
        };


        sorted = mergeSort(sorted, compareFn);
        return sorted;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return (
        <div className="home-container">
            <Sidebar />
            <div className="home-content">
                <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#fff' }}>
                    Recently Played
                </h2>
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={loadRecent}
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
                        Refresh
                    </button>
                    <button
                        onClick={clearAll}
                        disabled={recent.length === 0}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: recent.length === 0 ? '#333' : '#ff4757',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: recent.length === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Clear All
                    </button>

                    {/* Sorting Controls */}
                    <div style={{ marginLeft: 'auto' }}>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#1DB954',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                            }}
                        >
                            {sortOrder === 'asc' ? '↑ Oldest First' : '↓ Newest First'}
                        </button>
                    </div>
                </div>

                {recent.length === 0 ? (
                    <p style={{ color: '#b3b3b3', fontSize: '1.1rem' }}>No recently played tracks.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {getSortedTracks().map((t) => (
                            <div
                                key={t.id}
                                style={{
                                    backgroundColor: '#181818',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s, transform 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#282828';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.querySelector('.play-overlay').style.opacity = '1';
                                    e.currentTarget.querySelector('.hover-actions').style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#181818';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.querySelector('.play-overlay').style.opacity = '0';
                                    e.currentTarget.querySelector('.hover-actions').style.opacity = '0';
                                }}
                                onClick={() => playTrack(t)}
                            >
                                {/* Album Art */}
                                {t.album?.images?.[0]?.url ? (
                                    <img
                                        src={t.album.images[0].url}
                                        alt={t.name}
                                        style={{
                                            width: '100%',
                                            height: '160px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            marginBottom: '12px',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '160px',
                                            backgroundColor: '#333',
                                            borderRadius: '4px',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#b3b3b3',
                                            fontSize: '2rem',
                                        }}
                                    >
                                        🎵
                                    </div>
                                )}

                                {/* Track Info */}
                                <div style={{ marginBottom: '12px' }}>
                                    <p
                                        style={{
                                            fontWeight: 'bold',
                                            marginBottom: '4px',
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t.name || "Untitled"}
                                    </p>
                                    <p
                                        style={{
                                            color: '#b3b3b3',
                                            fontSize: '0.85rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t.artists?.map(a => a.name).join(', ') || "Unknown artist"}
                                    </p>
                                </div>

                                {/* Play Button Overlay */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: '#1DB954',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        pointerEvents: 'none',
                                    }}
                                    className="play-overlay"
                                >
                                    <span style={{ color: '#fff', fontSize: '1.2rem' }}>
                                        {playingId === t.id && isPlaying ? '❚❚' : '▶️'}
                                    </span>
                                </div>

                                {/* Hover Actions */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                    }}
                                    className="hover-actions"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(t.id);
                                        }}
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '40px' }}>
                    {/* Custom Audio Player */}
                    <div style={{
                        backgroundColor: '#181818',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        {/* Play/Pause Button */}
                        <button
                            onClick={() => {
                                if (isPlaying) {
                                    audioRef.current?.pause();
                                } else {
                                    audioRef.current?.play();
                                }
                            }}
                            style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#1DB954',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                color: '#fff',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>

                        {/* Track Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                color: '#fff',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                fontSize: '1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {playingId ? recent.find(t => t.id === playingId)?.name || 'Unknown Track' : 'No track selected'}
                            </p>
                            <p style={{
                                color: '#b3b3b3',
                                fontSize: '0.9rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {playingId ? recent.find(t => t.id === playingId)?.artists?.map(a => a.name).join(', ') || 'Unknown Artist' : ''}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#b3b3b3', fontSize: '0.8rem', minWidth: '35px' }}>
                                {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
                            </span>
                            <input
                                type="range"
                                min="0"
                                max={audioRef.current?.duration || 0}
                                value={audioRef.current?.currentTime || 0}
                                onChange={(e) => {
                                    if (audioRef.current) {
                                        audioRef.current.currentTime = e.target.value;
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    height: '4px',
                                    background: '#535353',
                                    borderRadius: '2px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                }}
                            />
                            <span style={{ color: '#b3b3b3', fontSize: '0.8rem', minWidth: '35px' }}>
                                {audioRef.current ? formatTime(audioRef.current.duration) : '0:00'}
                            </span>
                        </div>

                        {/* Volume Control */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#b3b3b3', fontSize: '1.2rem' }}>🔊</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                defaultValue="0.7"
                                onChange={(e) => {
                                    if (audioRef.current) {
                                        audioRef.current.volume = e.target.value;
                                    }
                                }}
                                style={{
                                    width: '80px',
                                    height: '4px',
                                    background: '#535353',
                                    borderRadius: '2px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                }}
                            />
                        </div>
                    </div>

                    {/* Hidden Audio Element */}
                    <audio
                        ref={audioRef}
                        onEnded={onEnded}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        style={{ display: 'none' }}
                    />

                    {error && (
                        <div style={{
                            color: '#ff4757',
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: '#2d1b1b',
                            borderRadius: '8px',
                            border: '1px solid #ff4757'
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

