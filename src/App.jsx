import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MusicQueueProvider } from "./MusicQueueContext";
import Home from "./Home";
import Login from "./login";
import Callback from "./callback";
import Playback from "./Playback";
import AlbumView from "./AlbumView";
import Browse from "./browse";
import Account from "./Account";
import Playlist from "./Playlist";
import UtilsDemo from "./UtilsDemo";
import MiniPlayer from "./MiniPlayer";

function App() {
  return (
    <MusicQueueProvider>
      <Router>
        <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '90px' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/home" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/acc" element={<Account />} />
            <Route path="/playback" element={<Playback />} />
            <Route path="/album" element={<AlbumView />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/utils" element={<UtilsDemo />} />
          </Routes>
          <MiniPlayer />
        </div>
      </Router>
    </MusicQueueProvider>
  );
}

export default App;