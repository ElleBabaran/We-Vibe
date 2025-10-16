const STORAGE_KEY = "wevibe_recent";
const MAX_RECENT = 50;

export function addToRecent(track) {
    if (!track || !track.id) return;
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

export { STORAGE_KEY };
