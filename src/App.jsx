import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./login";
import Callback from "./callback";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/home" element={<Home />} />
        

      </Routes>
    </Router>
  );
}

export default App;
