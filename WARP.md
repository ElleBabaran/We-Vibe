# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

We-Vibe is a React-based music platform that allows users to play, browse, and share music through the Spotify Web API and Web Playback SDK. The application provides a Spotify-like interface with custom playlist management and queue functionality.

## Technology Stack

- **Frontend Framework**: React 18.2.0 with Vite 5.4.20
- **Routing**: React Router DOM 7.9.3  
- **Styling**: Custom CSS with Tailwind CSS 3.3.6 (configured but mixed with inline styles)
- **Icons**: Lucide React 0.545.0
- **Build Tool**: Vite with React plugin
- **Linting**: ESLint with React Hooks and React Refresh plugins
- **Authentication**: Spotify OAuth2 with PKCE flow

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts Vite dev server on http://127.0.0.1:5173 (configured to auto-open browser)

### Build for Production
```bash
npm run build
```
Builds optimized production bundle to `dist/` directory

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

### Linting
```bash
npx eslint src/
```
Runs ESLint on source files (no npm script configured)

## Architecture Overview

### Core Architecture Patterns

**Context-Based State Management**: The app uses React Context for global state management rather than Redux or other external libraries:

1. **MusicQueueContext** (`src/MusicQueueContext.jsx`): Manages the music queue, playback state, and queue operations (add, remove, reorder tracks)
2. **AuthContext** (`src/AuthContext.jsx`): Handles Spotify authentication, access tokens, and user profile data

**Route-Based Navigation**: Single-page application with React Router handling different views:
- `/` - Login page
- `/home` - Main dashboard with featured albums and user playlists  
- `/browse` - Music discovery and search
- `/playback` - Full-screen music player
- `/album` - Album detail view
- `/playlist` - Playlist management
- `/callback` - Spotify OAuth callback handler

### Key Components

**Layout Components**:
- `App.jsx`: Main router setup and MusicQueueProvider wrapper
- `Sidebar.jsx`: Navigation sidebar (persistent across routes)
- `MiniPlayer.jsx`: Bottom persistent mini-player (hidden on playback route)

**Feature Components**:
- `Home.jsx`: Dashboard with featured albums, new releases, and user playlists
- `browse.jsx`: Search and discovery interface
- `Playback.jsx`: Full-screen music player
- `AlbumView.jsx`: Album details and track listing
- `Playlist.jsx`: Playlist management and track organization

### Data Management

**Spotify Integration**: 
- OAuth2 authentication with required scopes for streaming and playback control
- Direct Spotify Web API calls for fetching music data
- Spotify Web Playback SDK integration for music playback

**Local Storage Usage**:
- Spotify access tokens (persistent across sessions)
- Custom playlists via `localPlaylists.js` utility
- Storage key: `'wv_custom_playlists'` and `'spotify_access_token'`

**State Flow**:
1. User authenticates via Spotify OAuth
2. Access token stored in AuthContext and localStorage
3. Music data fetched from Spotify API using token
4. Queue state managed through MusicQueueContext
5. Navigation via React Router with state passed through location.state

### Styling Architecture

**Mixed Styling Approach**:
- Tailwind CSS configured but underutilized
- Primary styling via component-specific CSS files (`App.css`, `Account.css`, `browse.css`)
- Extensive inline styles for dynamic/interactive elements
- Custom CSS variables and dark theme implementation

### File Organization

```
src/
├── Context providers (MusicQueueContext.jsx, AuthContext.jsx)
├── Route components (Home.jsx, browse.jsx, Playback.jsx, etc.)
├── UI components (Sidebar.jsx, MiniPlayer.jsx)
├── Utilities (SpotifyAuth.js, localPlaylists.js)
├── Styling (App.css, Account.css, browse.css)
└── main.jsx (app entry point)
```

## Development Notes

### Spotify Configuration
- Client ID and redirect URI are hardcoded in `SpotifyAuth.js`
- Development server configured to match OAuth redirect URI (127.0.0.1:5173)
- Required Spotify scopes include streaming, playback control, and playlist management

### State Management Patterns
- Use `useMusicQueue()` hook to access queue operations
- Use `useAuth()` hook for authentication state
- Navigation state passed via `useNavigate(path, { state: data })`

### Local Development
- Server runs on port 5173 (non-negotiable due to Spotify OAuth configuration)
- Auto-opens browser on start
- Hot reloading enabled via Vite React plugin

### Code Style
- ESLint configured with React Hooks rules
- Custom rule: unused variables ignored if uppercase (for constants)
- Mix of function declarations and arrow functions
- Inline styles prevalent for dynamic styling