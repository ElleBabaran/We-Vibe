import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useMusicQueue } from "./MusicQueueContext";
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
    const navigate = useNavigate();
    const { clearAndPlayPlaylist } = useMusicQueue();
    const [recent, setRecent] = useState([]);
    const [sortOrder, setSortOrder] = useState('desc');

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
        const sortedTracks = getSortedTracks();
        const startIndex = sortedTracks.findIndex(t => t.id === track.id);
        if (startIndex !== -1) {
            clearAndPlayPlaylist(sortedTracks, startIndex);
            addToRecent(track);
            loadRecent();
        }
    }

    function removeItem(id) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            const filtered = list.filter((t) => t.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            loadRecent();
        } catch {}
    }

    function clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setRecent([]);
        } catch {}
    }


    function getSortedTracks() {
        let sorted = [...recent];
        const compareFn = (a, b) => {
            const result = (a.addedAt || 0) - (b.addedAt || 0);
            return sortOrder === 'asc' ? result : -result;
        };
        sorted.sort(compareFn);
        return sorted;
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
                                onClick={(e) => {
                                    if (e.target.closest('.hover-actions')) return;
                                    playTrack(t);
                                }}
                                onDoubleClick={() => {
                                    if (t.album?.id) {
                                        navigate('/album', { state: { album: t.album } });
                                    }
                                }}
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
                                        ▶️
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
            </div>
        </div>
    );
}

