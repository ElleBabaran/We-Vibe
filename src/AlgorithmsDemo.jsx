import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './App.css';

// Import our utility modules
import {
  quickSort,
  mergeSort,
  heapSort,
  bubbleSort,
  insertionSort,
  binarySearch,
  linearSearch,
  jumpSearch,
  bfs,
  dfs,
  dijkstra,
  longestCommonSubsequence,
  knapsack,
  fibonacciMemo,
  kmpSearch,
  rabinKarpSearch,
  generateRandomArray,
  isSorted,
  measurePerformance,
  compareSortingAlgorithms
} from './utils/algorithms';

import {
  djb2Hash,
  fnv1aHash,
  sdbmHash,
  simpleHash256,
  simpleMD5,
  ConsistentHash,
  BloomFilter,
  HashTable,
  hashPassword,
  verifyPassword,
  crc32,
  compareHashFunctions,
  testHashDistribution,
  generateTestStrings
} from './utils/hashing';

function AlgorithmsDemo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sorting');
  const [sortingResults, setSortingResults] = useState({});
  const [searchResults, setSearchResults] = useState({});
  const [hashResults, setHashResults] = useState({});
  const [testArray, setTestArray] = useState([]);
  const [searchArray, setSearchArray] = useState([]);
  const [searchTarget, setSearchTarget] = useState(42);
  const [testString, setTestString] = useState('Hello, World!');

  useEffect(() => {
    // Generate test data on component mount
    const newTestArray = generateRandomArray(1000, 1, 1000);
    const newSearchArray = quickSort([...newTestArray]);
    setTestArray(newTestArray);
    setSearchArray(newSearchArray);
  }, []);

  const runSortingTests = () => {
    if (testArray.length === 0) return;
    
    const results = compareSortingAlgorithms(testArray);
    setSortingResults(results);
  };

  const runSearchTests = () => {
    if (searchArray.length === 0) return;
    
    const results = {};
    
    // Binary search
    const binaryResult = measurePerformance(binarySearch, searchArray, searchTarget);
    results.binarySearch = {
      found: binaryResult.result !== -1,
      index: binaryResult.result,
      duration: binaryResult.duration
    };
    
    // Linear search
    const linearResult = measurePerformance(linearSearch, searchArray, searchTarget);
    results.linearSearch = {
      found: linearResult.result !== -1,
      index: linearResult.result,
      duration: linearResult.duration
    };
    
    // Jump search
    const jumpResult = measurePerformance(jumpSearch, searchArray, searchTarget);
    results.jumpSearch = {
      found: jumpResult.result !== -1,
      index: jumpResult.result,
      duration: jumpResult.duration
    };
    
    setSearchResults(results);
  };

  const runHashTests = () => {
    const results = {};
    
    // Basic hash functions comparison
    results.basicHashes = compareHashFunctions(testString);
    
    // Cryptographic-style hashes
    results.sha256Like = simpleHash256(testString);
    results.md5Like = simpleMD5(testString);
    
    // CRC32 checksum
    results.crc32 = crc32(testString);
    
    // Password hashing
    const passwordHash = hashPassword('mySecretPassword123');
    results.passwordHash = passwordHash;
    results.passwordVerification = verifyPassword('mySecretPassword123', passwordHash.combined);
    
    // Hash distribution test
    const testStrings = generateTestStrings(1000);
    results.distribution = testHashDistribution(djb2Hash, testStrings);
    
    setHashResults(results);
  };

  const TabButton = ({ tabName, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        backgroundColor: isActive ? '#1DB954' : 'transparent',
        color: isActive ? '#fff' : '#b3b3b3',
        border: `2px solid ${isActive ? '#1DB954' : '#b3b3b3'}`,
        borderRadius: '20px',
        fontSize: '0.95rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginRight: '10px'
      }}
    >
      {label}
    </button>
  );

  const SortingTab = () => (
    <div>
      <h2 style={{ color: '#fff', marginBottom: '20px' }}>🔢 Sorting Algorithms</h2>
      <p style={{ color: '#b3b3b3', marginBottom: '20px' }}>
        Compare performance of different sorting algorithms on an array of {testArray.length} random numbers.
      </p>
      
      <button
        onClick={runSortingTests}
        style={{
          padding: '12px 24px',
          backgroundColor: '#1DB954',
          color: '#fff',
          border: 'none',
          borderRadius: '20px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🚀 Run Sorting Tests
      </button>
      
      {Object.keys(sortingResults).length > 0 && (
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '15px' }}>Results:</h3>
          {Object.entries(sortingResults).map(([algorithm, result]) => (
            <div key={algorithm} style={{ 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#282828',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{algorithm}</span>
              <div>
                <span style={{ color: result.sorted ? '#1DB954' : '#ff4444', marginRight: '15px' }}>
                  {result.sorted ? '✓ Sorted' : '✗ Failed'}
                </span>
                <span style={{ color: '#b3b3b3' }}>
                  {result.duration.toFixed(2)}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SearchingTab = () => (
    <div>
      <h2 style={{ color: '#fff', marginBottom: '20px' }}>🔍 Searching Algorithms</h2>
      <p style={{ color: '#b3b3b3', marginBottom: '20px' }}>
        Compare performance of different search algorithms on a sorted array.
      </p>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
          Search Target:
        </label>
        <input
          type="number"
          value={searchTarget}
          onChange={(e) => setSearchTarget(parseInt(e.target.value) || 0)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#181818',
            border: '2px solid #282828',
            borderRadius: '4px',
            color: '#fff',
            marginRight: '10px'
          }}
        />
        <button
          onClick={runSearchTests}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1DB954',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔎 Search
        </button>
      </div>
      
      {Object.keys(searchResults).length > 0 && (
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '15px' }}>Search Results:</h3>
          {Object.entries(searchResults).map(([algorithm, result]) => (
            <div key={algorithm} style={{ 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#282828',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{algorithm}</span>
              <div>
                <span style={{ color: result.found ? '#1DB954' : '#ff4444', marginRight: '15px' }}>
                  {result.found ? `Found at index ${result.index}` : 'Not found'}
                </span>
                <span style={{ color: '#b3b3b3' }}>
                  {result.duration.toFixed(3)}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const HashingTab = () => (
    <div>
      <h2 style={{ color: '#fff', marginBottom: '20px' }}>🔐 Hashing Algorithms</h2>
      <p style={{ color: '#b3b3b3', marginBottom: '20px' }}>
        Test various hash functions and their properties.
      </p>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
          Test String:
        </label>
        <input
          type="text"
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#181818',
            border: '2px solid #282828',
            borderRadius: '4px',
            color: '#fff',
            marginRight: '10px',
            width: '300px'
          }}
        />
        <button
          onClick={runHashTests}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1DB954',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧮 Hash
        </button>
      </div>
      
      {Object.keys(hashResults).length > 0 && (
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '15px' }}>Hash Results:</h3>
          
          {/* Basic Hash Functions */}
          {hashResults.basicHashes && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Basic Hash Functions:</h4>
              {Object.entries(hashResults.basicHashes).map(([name, result]) => (
                <div key={name} style={{ 
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#282828',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{name}:</span>
                  <span style={{ color: '#b3b3b3', marginLeft: '10px' }}>
                    {result.hash.toString(16).padStart(8, '0')}
                  </span>
                  <span style={{ color: '#888', marginLeft: '10px', fontSize: '0.8rem' }}>
                    ({result.duration.toFixed(3)}ms)
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Cryptographic-style Hashes */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Cryptographic-style Hashes:</h4>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#282828',
              borderRadius: '4px',
              fontFamily: 'monospace',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>SHA256-like:</span>
              <div style={{ color: '#b3b3b3', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {hashResults.sha256Like}
              </div>
            </div>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#282828',
              borderRadius: '4px',
              fontFamily: 'monospace',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>MD5-like:</span>
              <div style={{ color: '#b3b3b3', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {hashResults.md5Like}
              </div>
            </div>
          </div>
          
          {/* Checksums */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Checksums:</h4>
            <div style={{ 
              padding: '8px',
              backgroundColor: '#282828',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>CRC32:</span>
              <span style={{ color: '#b3b3b3', marginLeft: '10px' }}>
                {hashResults.crc32.toString(16).padStart(8, '0').toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Password Hashing */}
          {hashResults.passwordHash && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Password Hashing:</h4>
              <div style={{ 
                padding: '8px',
                backgroundColor: '#282828',
                borderRadius: '4px',
                fontFamily: 'monospace',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Salt:</span>
                <span style={{ color: '#b3b3b3', marginLeft: '10px', fontSize: '0.8rem' }}>
                  {hashResults.passwordHash.salt}
                </span>
              </div>
              <div style={{ 
                padding: '8px',
                backgroundColor: '#282828',
                borderRadius: '4px'
              }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Verification:</span>
                <span style={{ 
                  color: hashResults.passwordVerification ? '#1DB954' : '#ff4444',
                  marginLeft: '10px'
                }}>
                  {hashResults.passwordVerification ? '✓ Valid' : '✗ Invalid'}
                </span>
              </div>
            </div>
          )}
          
          {/* Distribution Quality */}
          {hashResults.distribution && (
            <div>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Hash Distribution Quality:</h4>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#282828',
                borderRadius: '4px'
              }}>
                <div style={{ color: '#fff', marginBottom: '5px' }}>
                  <strong>Uniformity Score:</strong> 
                  <span style={{ marginLeft: '10px', color: '#b3b3b3' }}>
                    {(hashResults.distribution.uniformity * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ color: '#fff', marginBottom: '5px' }}>
                  <strong>Standard Deviation:</strong> 
                  <span style={{ marginLeft: '10px', color: '#b3b3b3' }}>
                    {hashResults.distribution.standardDeviation.toFixed(2)}
                  </span>
                </div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>
                  (Higher uniformity and lower std deviation indicate better distribution)
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const DataStructuresTab = () => {
    const [hashTable] = useState(() => new HashTable());
    const [bloomFilter] = useState(() => new BloomFilter());
    const [consistentHash] = useState(() => new ConsistentHash(['server1', 'server2', 'server3']));
    
    return (
      <div>
        <h2 style={{ color: '#fff', marginBottom: '20px' }}>🏗️ Data Structures</h2>
        <p style={{ color: '#b3b3b3', marginBottom: '20px' }}>
          Advanced data structures with hashing.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Hash Table Demo */}
          <div style={{ 
            backgroundColor: '#181818', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <h4 style={{ color: '#1DB954', marginBottom: '15px' }}>Hash Table</h4>
            <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '15px' }}>
              Custom hash table with separate chaining for collision resolution.
            </p>
            <div style={{ 
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#b3b3b3'
            }}>
              <div>Load Factor: {hashTable.getLoadFactor().toFixed(2)}</div>
              <div>Collisions: {hashTable.getCollisionCount()}</div>
              <div>Capacity: {hashTable.capacity}</div>
            </div>
          </div>
          
          {/* Bloom Filter Demo */}
          <div style={{ 
            backgroundColor: '#181818', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <h4 style={{ color: '#1DB954', marginBottom: '15px' }}>Bloom Filter</h4>
            <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '15px' }}>
              Probabilistic data structure for set membership testing.
            </p>
            <div style={{ 
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#b3b3b3'
            }}>
              <div>Expected Elements: {bloomFilter.expectedElements}</div>
              <div>Filter Size: {bloomFilter.size} bits</div>
              <div>Hash Functions: {bloomFilter.hashCount}</div>
              <div>False Positive Rate: {(bloomFilter.getFalsePositiveRate() * 100).toFixed(2)}%</div>
            </div>
          </div>
          
          {/* Consistent Hash Demo */}
          <div style={{ 
            backgroundColor: '#181818', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <h4 style={{ color: '#1DB954', marginBottom: '15px' }}>Consistent Hashing</h4>
            <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '15px' }}>
              Distributed hash table for load balancing.
            </p>
            <div style={{ 
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#b3b3b3'
            }}>
              <div>Virtual Nodes: {consistentHash.virtualNodes}</div>
              <div>Total Nodes: {consistentHash.ring.size}</div>
              <div>Example: key "user123" → {consistentHash.getNode('user123')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="home-content">
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>
            🧮 Algorithms & Hashing Demo
          </h1>
          <p style={{ color: '#b3b3b3', fontSize: '1.1rem' }}>
            Explore sorting, searching, and hashing algorithms with interactive demonstrations
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <TabButton 
            tabName="sorting" 
            label="Sorting" 
            isActive={activeTab === 'sorting'} 
            onClick={() => setActiveTab('sorting')} 
          />
          <TabButton 
            tabName="searching" 
            label="Searching" 
            isActive={activeTab === 'searching'} 
            onClick={() => setActiveTab('searching')} 
          />
          <TabButton 
            tabName="hashing" 
            label="Hashing" 
            isActive={activeTab === 'hashing'} 
            onClick={() => setActiveTab('hashing')} 
          />
          <TabButton 
            tabName="datastructures" 
            label="Data Structures" 
            isActive={activeTab === 'datastructures'} 
            onClick={() => setActiveTab('datastructures')} 
          />
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '500px' }}>
          {activeTab === 'sorting' && <SortingTab />}
          {activeTab === 'searching' && <SearchingTab />}
          {activeTab === 'hashing' && <HashingTab />}
          {activeTab === 'datastructures' && <DataStructuresTab />}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '40px',
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#b3b3b3',
            border: '2px solid #b3b3b3',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#b3b3b3';
            e.currentTarget.style.borderColor = '#b3b3b3';
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default AlgorithmsDemo;