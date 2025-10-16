import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MusicQueueProvider } from "./MusicQueueContext";
import Home from "./Home";
import Login from "./login";
import Callback from "./callback";
import Playback from "./Playback";
import AlbumView from "./AlbumView";
import MadeForYou from "./MadeForYou";
import Browse from "./browse";
import Account from "./Account";
import Playlist from "./Playlist";
import Podcast from "./Podcast";
import Genres from "./Genre";
import MiniPlayer from "./MiniPlayer";
import Artists from "./Artists";
import ArtistView from "./ArtistView";


function App() {
  console.log('🚀 App component rendering...');
  return (
    <MusicQueueProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/home" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/acc" element={<Account />} />
          <Route path="/playback" element={<Playback />} />
          <Route path="/album" element={<AlbumView />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/genre" element={<Genres />} />
          {/* Library */}
          <Route path="/mdf" element={<MadeForYou />} />
          <Route path="/artist" element={<Artists />} />
          <Route path="/artist/:id" element={<ArtistView />} />

        </Routes>
        {/* Persistent bottom mini-player (hidden on /playback internally) */}
        <MiniPlayer />
      </Router>
    </MusicQueueProvider>
  );
}

export default App;
