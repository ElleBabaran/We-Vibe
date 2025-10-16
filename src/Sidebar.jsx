import './App.css'
import {Link} from "react-router-dom";

export default function Sidebar() {

  return (
    <div className='sidebar'>
      <div className='menu' style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2 className='Title'>WeVibe</h2>
      {/* Main Navigation */}
      <ul style={{ marginBottom: '32px' }}>
        <li>
          <img src="/Icons/home.png" alt="home" className='icon'/><Link to="/home">Home</Link></li>
        <li>
          <img src="/Icons/search.png" alt="browse" className='icon'/><Link to="/browse">Browse</Link></li>
        <li>
          <img src= "/Icons/antenna.png" alt="Podcast" className='icon'/><Link to="/podcast">Podcasts</Link></li>
      </ul>
      
      {/* Your Library Section */}
      <div style={{ flex: 1 }}>
        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '16px',
          paddingLeft: '16px',
          letterSpacing: '0.5px'
        }}>Your Library</h2>
        <ul style={{ margin: '0', padding: '0' }}>
          <li><Link to="/playlist">Playlists</Link></li>
          <li><Link to="/genre">Genres</Link></li>
          <li><Link to="/mdf">Made for you</Link></li>
          <li><Link to="/artist">Artists</Link></li>
        </ul>
      </div>
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '0'
        }}>
          <p className='Acc' style={{ margin: '0', paddingBottom: '10px' }}>
            <Link to="/acc">My Account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

