import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./login";
import Callback from "./callback";
import Playback from "./Playback";
import AlbumView from "./AlbumView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/home" element={<Home />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="/album" element={<AlbumView />} />
      </Routes>
    </Router>
  );
}

export default App;