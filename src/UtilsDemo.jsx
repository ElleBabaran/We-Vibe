import { useState } from 'react';
import { 
  MusicUtils, 
  PerformanceUtils, 
  DataStructures, 
  Examples,
  djb2Hash,
  fnv1aHash,
  murmurHash3,
  crc32Hash,
  quickSort,
  mergeSort,
  heapSort,
  shuffle,
  levenshteinDistance,
  calculateStats,
  HashTable,
  BloomFilter
} from './utils/index.js';
import Sidebar from './Sidebar';
import './App.css';

function UtilsDemo() {
  const [activeTab, setActiveTab] = useState('algorithms');
  const [testInput, setTestInput] = useState('Hello, World!');
  const [testArray, setTestArray] = useState('64,34,25,12,22,11,90');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const demoTracks = [
    { id: '1', name: 'Bohemian Rhapsody', duration_ms: 355000, popularity: 95, artists: [{ name: 'Queen' }] },
    { id: '2', name: 'Stairway to Heaven', duration_ms: 482000, popularity: 92, artists: [{ name: 'Led Zeppelin' }] },
    { id: '3', name: 'Hotel California', duration_ms: 391000, popularity: 89, artists: [{ name: 'Eagles' }] },
    { id: '4', name: 'Imagine', duration_ms: 183000, popularity: 88, artists: [{ name: 'John Lennon' }] },
    { id: '5', name: 'Sweet Child O Mine', duration_ms: 356000, popularity: 87, artists: [{ name: 'Guns N Roses' }] }
  ];

  const runHashDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const hashResults = {
        djb2: djb2Hash(testInput),
        fnv1a: fnv1aHash(testInput),
        murmur3: murmurHash3(testInput),
        crc32: crc32Hash(testInput),
        performance: PerformanceUtils.testHashPerformance(testInput, 1000)
      };
      setResults({ type: 'hash', data: hashResults });
      setLoading(false);
    }, 100);
  };

  const runSortDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const array = testArray.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      const sortResults = {
        original: array,
        quickSort: quickSort(array),
        mergeSort: mergeSort(array),
        heapSort: heapSort(array),
        shuffled: shuffle(array),
        stats: calculateStats(array),
        performance: PerformanceUtils.compareSortPerformance(array, 100)
      };
      
      setResults({ type: 'sort', data: sortResults });
      setLoading(false);
    }, 100);
  };

  const runMusicDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const musicResults = {
        originalTracks: demoTracks,
        shuffledPlaylist: MusicUtils.shufflePlaylist(demoTracks),
        sortedByPopularity: MusicUtils.sortTracksByPopularity(demoTracks),
        sortedByDuration: MusicUtils.sortTracksByDuration(demoTracks),
        searchResults: MusicUtils.searchTracks(demoTracks, 'heaven'),
        playlistStats: MusicUtils.calculatePlaylistStats(demoTracks),
        playlistId: MusicUtils.generatePlaylistId('My Demo Playlist', 'user123'),
        recommendations: MusicUtils.recommendTracks(demoTracks.slice(0, 2), demoTracks, 3)
      };
      
      setResults({ type: 'music', data: musicResults });
      setLoading(false);
    }, 100);
  };

  const runDataStructureDemo = () => {
    setLoading(true);
    setTimeout(() => {
      // Hash Table demo
      const hashTable = new HashTable();
      ['apple', 'banana', 'cherry', 'date'].forEach((fruit, i) => {
        hashTable.set(fruit, `Value ${i + 1}`);
      });

      // Bloom Filter demo
      const bloomFilter = new BloomFilter(100, 0.01);
      demoTracks.forEach(track => bloomFilter.add(track.id));

      const dsResults = {
        hashTable: {
          size: hashTable.count,
          loadFactor: hashTable.getLoadFactor(),
          hasApple: hashTable.has('apple'),
          getBanana: hashTable.get('banana'),
          items: ['apple', 'banana', 'cherry', 'date'].map(key => ({
            key,
            value: hashTable.get(key),
            exists: hashTable.has(key)
          }))
        },
        bloomFilter: {
          expectedElements: bloomFilter.expectedElements,
          bitArraySize: bloomFilter.bitArraySize,
          hashFunctions: bloomFilter.hashFunctions,
          trackTests: demoTracks.map(track => ({
            trackId: track.id,
            trackName: track.name,
            mightContain: bloomFilter.mightContain(track.id)
          })),
          falseTest: {
            testId: 'nonexistent-track',
            mightContain: bloomFilter.mightContain('nonexistent-track')
          },
          estimatedCount: Math.round(bloomFilter.getEstimatedCount())
        }
      };

      setResults({ type: 'dataStructure', data: dsResults });
      setLoading(false);
    }, 100);
  };

  const renderResults = () => {
    if (!results) return null;

    const containerStyle = {
      backgroundColor: '#181818',
      border: '1px solid #282828',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px',
      maxHeight: '400px',
      overflowY: 'auto'
    };

    const headingStyle = {
      color: '#1DB954',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      marginBottom: '10px',
      borderBottom: '1px solid #282828',
      paddingBottom: '5px'
    };

    switch (results.type) {
      case 'hash':
        return (
          <div style={containerStyle}>
            <h3 style={headingStyle}>Hash Functions Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>DJB2 Hash:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>{results.data.djb2}</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>FNV-1a Hash:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>{results.data.fnv1a}</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Murmur3 Hash:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>{results.data.murmur3}</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>CRC32 Hash:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>{results.data.crc32}</p>
              </div>
            </div>
            
            <h4 style={{ ...headingStyle, marginTop: '20px' }}>Performance Comparison</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {Object.entries(results.data.performance).map(([name, perf]) => (
                <div key={name} style={{ backgroundColor: '#282828', padding: '10px', borderRadius: '4px' }}>
                  <p style={{ color: '#fff', fontWeight: 'bold' }}>{name}</p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                    {perf.timeMs.toFixed(2)}ms
                  </p>
                  <p style={{ color: '#1DB954', fontSize: '0.8rem' }}>
                    {perf.hashesPerSecond.toLocaleString()} ops/sec
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'sort':
        return (
          <div style={containerStyle}>
            <h3 style={headingStyle}>Sorting Algorithms Results</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#fff', fontWeight: 'bold' }}>Original Array:</p>
              <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>[{results.data.original.join(', ')}]</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Quick Sort:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>[{results.data.quickSort.join(', ')}]</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Merge Sort:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>[{results.data.mergeSort.join(', ')}]</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Heap Sort:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>[{results.data.heapSort.join(', ')}]</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Shuffled:</p>
                <p style={{ color: '#b3b3b3', fontFamily: 'monospace' }}>[{results.data.shuffled.join(', ')}]</p>
              </div>
            </div>

            <h4 style={headingStyle}>Array Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <div>
                <p style={{ color: '#fff' }}>Mean: <span style={{ color: '#1DB954' }}>{results.data.stats.mean.toFixed(2)}</span></p>
              </div>
              <div>
                <p style={{ color: '#fff' }}>Median: <span style={{ color: '#1DB954' }}>{results.data.stats.median}</span></p>
              </div>
              <div>
                <p style={{ color: '#fff' }}>Std Dev: <span style={{ color: '#1DB954' }}>{results.data.stats.stdDev.toFixed(2)}</span></p>
              </div>
            </div>

            <h4 style={headingStyle}>Performance Comparison</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {Object.entries(results.data.performance).map(([name, perf]) => (
                <div key={name} style={{ backgroundColor: '#282828', padding: '10px', borderRadius: '4px' }}>
                  <p style={{ color: '#fff', fontWeight: 'bold' }}>{name}</p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                    {perf.timeMs.toFixed(2)}ms
                  </p>
                  <p style={{ color: '#1DB954', fontSize: '0.8rem' }}>
                    {perf.itemsPerSecond.toLocaleString()} items/sec
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'music':
        return (
          <div style={containerStyle}>
            <h3 style={headingStyle}>Music Utilities Demo</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Playlist Operations</h4>
              <p style={{ color: '#fff' }}>Generated Playlist ID: <span style={{ color: '#1DB954', fontFamily: 'monospace' }}>{results.data.playlistId}</span></p>
              
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Playlist Statistics:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '5px' }}>
                  <p style={{ color: '#b3b3b3' }}>Avg Duration: <span style={{ color: '#1DB954' }}>{Math.round(results.data.playlistStats.mean / 1000)}s</span></p>
                  <p style={{ color: '#b3b3b3' }}>Total Duration: <span style={{ color: '#1DB954' }}>{Math.round(results.data.originalTracks.reduce((sum, t) => sum + t.duration_ms, 0) / 60000)}m</span></p>
                  <p style={{ color: '#b3b3b3' }}>Track Count: <span style={{ color: '#1DB954' }}>{results.data.originalTracks.length}</span></p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Search Results (query: "heaven")</h4>
              {results.data.searchResults.map((track, i) => (
                <div key={i} style={{ backgroundColor: '#282828', padding: '8px', borderRadius: '4px', marginBottom: '5px' }}>
                  <span style={{ color: '#fff' }}>{track.name}</span> - <span style={{ color: '#b3b3b3' }}>{track.artists[0].name}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Sorted by Popularity</h4>
              {results.data.sortedByPopularity.slice(0, 3).map((track, i) => (
                <div key={i} style={{ backgroundColor: '#282828', padding: '8px', borderRadius: '4px', marginBottom: '5px' }}>
                  <span style={{ color: '#fff' }}>{track.name}</span> - 
                  <span style={{ color: '#b3b3b3' }}> {track.artists[0].name}</span> - 
                  <span style={{ color: '#1DB954' }}> {track.popularity}% popular</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dataStructure':
        return (
          <div style={containerStyle}>
            <h3 style={headingStyle}>Data Structures Demo</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Hash Table</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <p style={{ color: '#fff' }}>Size: <span style={{ color: '#1DB954' }}>{results.data.hashTable.size}</span></p>
                  <p style={{ color: '#fff' }}>Load Factor: <span style={{ color: '#1DB954' }}>{results.data.hashTable.loadFactor.toFixed(3)}</span></p>
                </div>
                <div>
                  <p style={{ color: '#fff' }}>Has 'apple': <span style={{ color: '#1DB954' }}>{results.data.hashTable.hasApple ? 'Yes' : 'No'}</span></p>
                  <p style={{ color: '#fff' }}>Get 'banana': <span style={{ color: '#1DB954' }}>{results.data.hashTable.getBanana}</span></p>
                </div>
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Stored Items:</p>
                {results.data.hashTable.items.map((item, i) => (
                  <div key={i} style={{ backgroundColor: '#282828', padding: '5px', borderRadius: '4px', margin: '2px 0' }}>
                    <span style={{ color: '#fff' }}>{item.key}</span> → <span style={{ color: '#1DB954' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Bloom Filter</h4>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  <p style={{ color: '#fff' }}>Expected Elements: <span style={{ color: '#1DB954' }}>{results.data.bloomFilter.expectedElements}</span></p>
                  <p style={{ color: '#fff' }}>Bit Array Size: <span style={{ color: '#1DB954' }}>{results.data.bloomFilter.bitArraySize}</span></p>
                  <p style={{ color: '#fff' }}>Hash Functions: <span style={{ color: '#1DB954' }}>{results.data.bloomFilter.hashFunctions}</span></p>
                  <p style={{ color: '#fff' }}>Est. Count: <span style={{ color: '#1DB954' }}>{results.data.bloomFilter.estimatedCount}</span></p>
                </div>
              </div>
              
              <div>
                <p style={{ color: '#fff', fontWeight: 'bold' }}>Track Membership Tests:</p>
                {results.data.bloomFilter.trackTests.map((test, i) => (
                  <div key={i} style={{ backgroundColor: '#282828', padding: '5px', borderRadius: '4px', margin: '2px 0' }}>
                    <span style={{ color: '#fff' }}>{test.trackName}</span> - 
                    <span style={{ color: test.mightContain ? '#1DB954' : '#e22134' }}>
                      {test.mightContain ? ' ✓ Might contain' : ' ✗ Not found'}
                    </span>
                  </div>
                ))}
                
                <div style={{ backgroundColor: '#282828', padding: '5px', borderRadius: '4px', margin: '5px 0' }}>
                  <span style={{ color: '#fff' }}>Non-existent track</span> - 
                  <span style={{ color: results.data.bloomFilter.falseTest.mightContain ? '#e22134' : '#1DB954' }}>
                    {results.data.bloomFilter.falseTest.mightContain ? ' ⚠ False positive!' : ' ✓ Correctly rejected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#1DB954' : 'transparent',
    color: isActive ? '#fff' : '#b3b3b3',
    border: 'none',
    borderRadius: '20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginRight: '10px'
  });

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#181818',
    border: '2px solid #282828',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem',
    marginBottom: '15px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    backgroundColor: '#1DB954',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    opacity: loading ? 0.7 : 1,
    pointerEvents: loading ? 'none' : 'auto'
  };

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="home-content">
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#fff' }}>
            🧮 Algorithms & Hashing Utilities
          </h1>
          <p style={{ color: '#b3b3b3', fontSize: '1.1rem', marginBottom: '30px' }}>
            Explore various algorithms, hashing functions, and data structures with interactive demos
          </p>
          
          {/* Tab Navigation */}
          <div style={{ marginBottom: '30px', borderBottom: '1px solid #282828', paddingBottom: '20px' }}>
            <button 
              style={tabStyle(activeTab === 'algorithms')}
              onClick={() => setActiveTab('algorithms')}
            >
              🔄 Sorting & Algorithms
            </button>
            <button 
              style={tabStyle(activeTab === 'hashing')}
              onClick={() => setActiveTab('hashing')}
            >
              🔐 Hashing Functions
            </button>
            <button 
              style={tabStyle(activeTab === 'music')}
              onClick={() => setActiveTab('music')}
            >
              🎵 Music Utilities
            </button>
            <button 
              style={tabStyle(activeTab === 'datastructures')}
              onClick={() => setActiveTab('datastructures')}
            >
              🗂️ Data Structures
            </button>
          </div>
          
          {/* Tab Content */}
          <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '8px' }}>
            {activeTab === 'algorithms' && (
              <div>
                <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>Sorting Algorithms Demo</h3>
                <p style={{ color: '#b3b3b3', marginBottom: '15px' }}>
                  Test various sorting algorithms with custom data. Enter comma-separated numbers:
                </p>
                
                <input
                  type="text"
                  value={testArray}
                  onChange={(e) => setTestArray(e.target.value)}
                  placeholder="Enter numbers separated by commas (e.g., 64,34,25,12,22,11,90)"
                  style={inputStyle}
                />
                
                <button style={buttonStyle} onClick={runSortDemo} disabled={loading}>
                  {loading ? '⏳ Processing...' : '▶️ Run Sort Demo'}
                </button>
              </div>
            )}
            
            {activeTab === 'hashing' && (
              <div>
                <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>Hash Functions Demo</h3>
                <p style={{ color: '#b3b3b3', marginBottom: '15px' }}>
                  Test different hashing algorithms with custom input and compare their performance:
                </p>
                
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter text to hash"
                  style={inputStyle}
                />
                
                <button style={buttonStyle} onClick={runHashDemo} disabled={loading}>
                  {loading ? '⏳ Processing...' : '🔐 Run Hash Demo'}
                </button>
              </div>
            )}
            
            {activeTab === 'music' && (
              <div>
                <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>Music Utilities Demo</h3>
                <p style={{ color: '#b3b3b3', marginBottom: '15px' }}>
                  Demonstrate music-specific algorithms including playlist shuffling, sorting, searching, and recommendations:
                </p>
                
                <div style={{ backgroundColor: '#282828', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '10px' }}>Demo Playlist:</h4>
                  {demoTracks.map((track, i) => (
                    <div key={i} style={{ color: '#b3b3b3', marginBottom: '5px' }}>
                      {track.name} - {track.artists[0].name} ({Math.round(track.duration_ms / 1000)}s, {track.popularity}% popular)
                    </div>
                  ))}
                </div>
                
                <button style={buttonStyle} onClick={runMusicDemo} disabled={loading}>
                  {loading ? '⏳ Processing...' : '🎵 Run Music Demo'}
                </button>
              </div>
            )}
            
            {activeTab === 'datastructures' && (
              <div>
                <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>Data Structures Demo</h3>
                <p style={{ color: '#b3b3b3', marginBottom: '15px' }}>
                  Explore Hash Tables, Bloom Filters, and other data structures with practical examples:
                </p>
                
                <div style={{ backgroundColor: '#282828', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '10px' }}>What this demo shows:</h4>
                  <ul style={{ color: '#b3b3b3', paddingLeft: '20px' }}>
                    <li>Hash Table operations (set, get, delete)</li>
                    <li>Bloom Filter for fast membership testing</li>
                    <li>Performance characteristics and use cases</li>
                    <li>Real-world applications in music data</li>
                  </ul>
                </div>
                
                <button style={buttonStyle} onClick={runDataStructureDemo} disabled={loading}>
                  {loading ? '⏳ Processing...' : '🗂️ Run Data Structures Demo'}
                </button>
              </div>
            )}
          </div>
          
          {/* Results Section */}
          {renderResults()}
          
          {/* Usage Examples */}
          <div style={{ marginTop: '40px', backgroundColor: '#181818', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>💡 Usage Examples</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: '#282828', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#fff', marginBottom: '10px' }}>Import in your components:</h4>
                <pre style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '4px', color: '#1DB954', fontSize: '0.9rem', overflow: 'auto' }}>
{`import { 
  MusicUtils, 
  quickSort, 
  sha256 
} from './utils/index.js';`}
                </pre>
              </div>
              
              <div style={{ backgroundColor: '#282828', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#fff', marginBottom: '10px' }}>Shuffle a playlist:</h4>
                <pre style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '4px', color: '#1DB954', fontSize: '0.9rem', overflow: 'auto' }}>
{`const shuffled = 
  MusicUtils.shufflePlaylist(tracks);`}
                </pre>
              </div>
              
              <div style={{ backgroundColor: '#282828', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#fff', marginBottom: '10px' }}>Hash user data:</h4>
                <pre style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '4px', color: '#1DB954', fontSize: '0.9rem', overflow: 'auto' }}>
{`const hash = await sha256(userData);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UtilsDemo;