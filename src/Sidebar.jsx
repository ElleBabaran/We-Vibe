import './App.css'
import {Link} from "react-router-dom";

export default function Sidebar() {

  return (
    <div className='sidebar'>
      <div className='menu'>
        <h2 className='Title'>WeVibe</h2>
      <ul>
        <li>
          <img src="/Icons/home.png" alt="home" className='icon'/><Link to="/home">Home</Link></li>
        <li> 
          <img src="/Icons/search.png" alt="browse" className='icon'/><Link to="/browse">Browse</Link></li>
        <li>
          <img src= "/Icons/antenna.png" alt="radio" className='icon'/><Link to="/radio">Radio</Link></li>
        <h2>Your Library</h2>
        <li><Link to="/playlist">Playlist</Link></li>
        <li><Link to="/recents">Recents</Link></li>
        <li><Link to="mdf">Made for you</Link></li>
        <li><Link to="artist">Artists</Link></li>
        <h2>Developer Tools</h2>
        <li><Link to="/utils">🧮 Algorithms & Hashing</Link></li>
      </ul>
      </div>
      <p className='Acc'><Link to="/acc">My Account</Link></p>
    </div>
  )
}

