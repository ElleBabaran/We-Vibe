# Playback Testing Guide

## Issues Fixed

1. **MusicQueueContext State Management**
   - Added proper stopping of current playback before starting new tracks
   - Added timeouts to ensure state updates are processed sequentially
   - Added debug logging to track state changes

2. **Playback Component SDK Integration**
   - Fixed player state change listener to avoid infinite loops
   - Added proper pausing before starting new tracks
   - Improved error handling and debug logging
   - Added delays to ensure API calls complete properly

3. **Component-Level Playback**
   - All components (Browse, Home, Playlist) now use the fixed context functions
   - Added debug logging to track when playback is triggered

## Testing Steps

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open browser dev tools** and go to the Console tab to see debug logs

3. **Test Browse Playback:**
   - Go to Browse page
   - Search for a song
   - Click on a song result
   - Check console logs for:
     - "🎵 Browse: playTrack called with: [song name]"
     - "🎵 clearAndPlayTrack called with: [song name]"
     - "🎵 Playback useEffect triggered"
     - "▶️ Starting playback: [song name]"

4. **Test Home Playback:**
   - Go to Home page
   - Click on any album
   - Check console logs for similar messages

5. **Test Playlist Playback:**
   - Go to Playlist page
   - Click on any playlist
   - Click the "Play Playlist" button or individual tracks
   - Check console logs

6. **Test Track Switching:**
   - Play one song
   - While it's playing, click another song
   - The first song should stop and the new one should start

## Expected Behavior

- ✅ Songs should start playing when clicked
- ✅ Switching between songs should work properly
- ✅ Songs should not keep stopping/starting randomly
- ✅ Only one song should play at a time
- ✅ Console logs should show the proper flow of function calls

## Debug Information

If issues persist, check:
1. Spotify access token is valid (localStorage)
2. Spotify Web Playback SDK loads properly
3. Device ID is set correctly
4. Network requests to Spotify API are successful

The fixes add proper state management, debugging, and error handling to make the playback system more reliable.