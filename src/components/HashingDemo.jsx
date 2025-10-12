import React, { useState } from 'react';
import { 
  md5Hash, 
  sha1Hash, 
  sha256Hash, 
  sha512Hash, 
  blake2bHash, 
  ripemd160Hash, 
  whirlpoolHash,
  hmacHash,
  saltedHash,
  generateAllHashes,
  generateSalt,
  compareHashes
} from '../utils/hashing';

const HashingDemo = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState({});
  const [hmacKey, setHmacKey] = useState('secret-key');
  const [salt, setSalt] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [hash1, setHash1] = useState('');
  const [hash2, setHash2] = useState('');

  const generateHashes = () => {
    if (!input.trim()) return;
    
    const allHashes = generateAllHashes(input);
    setHashes(allHashes);
  };

  const generateHmac = () => {
    if (!input.trim() || !hmacKey.trim()) return;
    
    const hmac = hmacHash(input, hmacKey);
    setHashes(prev => ({ ...prev, hmac }));
  };

  const generateSaltedHash = () => {
    if (!input.trim()) return;
    
    const currentSalt = salt || generateSalt();
    setSalt(currentSalt);
    
    const salted = saltedHash(input, currentSalt, 'sha256');
    setHashes(prev => ({ ...prev, salted }));
  };

  const compareHashesFunction = () => {
    if (!hash1.trim() || !hash2.trim()) return;
    
    const result = compareHashes(hash1, hash2, 'SHA256');
    setComparisonResult(result);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Hash copied to clipboard!');
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#121212', 
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '30px', 
        textAlign: 'center',
        background: 'linear-gradient(45deg, #1DB954, #1ed760)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🔐 Hashing Algorithms Demo
      </h1>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Input Section */}
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px' 
        }}>
          <h2 style={{ marginBottom: '15px', color: '#1DB954' }}>Input Text</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            style={{
              width: '100%',
              height: '100px',
              padding: '12px',
              backgroundColor: '#282828',
              border: '2px solid #333',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          <button
            onClick={generateHashes}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#1DB954',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Generate All Hashes
          </button>
        </div>

        {/* Hash Results */}
        {Object.keys(hashes).length > 0 && (
          <div style={{ 
            backgroundColor: '#181818', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '30px' 
          }}>
            <h2 style={{ marginBottom: '15px', color: '#1DB954' }}>Hash Results</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {Object.entries(hashes).map(([algorithm, hash]) => (
                <div key={algorithm} style={{ 
                  backgroundColor: '#282828', 
                  padding: '15px', 
                  borderRadius: '4px',
                  border: '1px solid #333'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: '#1DB954',
                      textTransform: 'uppercase',
                      fontSize: '0.9rem'
                    }}>
                      {algorithm}
                    </span>
                    <button
                      onClick={() => copyToClipboard(hash)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.8rem', 
                    color: '#b3b3b3',
                    wordBreak: 'break-all',
                    backgroundColor: '#121212',
                    padding: '8px',
                    borderRadius: '3px'
                  }}>
                    {hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HMAC Section */}
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px' 
        }}>
          <h2 style={{ marginBottom: '15px', color: '#1DB954' }}>HMAC (Hash-based Message Authentication Code)</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={hmacKey}
              onChange={(e) => setHmacKey(e.target.value)}
              placeholder="Enter HMAC key..."
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#282828',
                border: '2px solid #333',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <button
              onClick={generateHmac}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Generate HMAC
            </button>
          </div>
        </div>

        {/* Salted Hash Section */}
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px' 
        }}>
          <h2 style={{ marginBottom: '15px', color: '#1DB954' }}>Salted Hash</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="Enter salt (or leave empty for auto-generated)..."
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#282828',
                border: '2px solid #333',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <button
              onClick={generateSaltedHash}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Generate Salted Hash
            </button>
          </div>
        </div>

        {/* Hash Comparison Section */}
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px' 
        }}>
          <h2 style={{ marginBottom: '15px', color: '#1DB954' }}>Hash Comparison</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={hash1}
              onChange={(e) => setHash1(e.target.value)}
              placeholder="First hash..."
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#282828',
                border: '2px solid #333',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <input
              type="text"
              value={hash2}
              onChange={(e) => setHash2(e.target.value)}
              placeholder="Second hash..."
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#282828',
                border: '2px solid #333',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <button
              onClick={compareHashesFunction}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Compare
            </button>
          </div>
          
          {comparisonResult && (
            <div style={{ 
              backgroundColor: comparisonResult.match ? '#1a4d1a' : '#4d1a1a',
              padding: '15px',
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {comparisonResult.match ? '✅ Hashes Match!' : '❌ Hashes Do Not Match'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#b3b3b3' }}>
                Algorithm: {comparisonResult.algorithm} | 
                Timestamp: {new Date(comparisonResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Algorithm Information */}
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginBottom: '15px', color: '#1DB954' }}>Algorithm Information</h2>
          <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
            <div><strong>MD5:</strong> 128-bit hash, fast but cryptographically broken</div>
            <div><strong>SHA-1:</strong> 160-bit hash, deprecated for security purposes</div>
            <div><strong>SHA-256:</strong> 256-bit hash, widely used and secure</div>
            <div><strong>SHA-512:</strong> 512-bit hash, more secure but larger output</div>
            <div><strong>Blake2b:</strong> Fast, secure alternative to SHA-3</div>
            <div><strong>RIPEMD-160:</strong> 160-bit hash, used in Bitcoin</div>
            <div><strong>Whirlpool:</strong> 512-bit hash, based on AES</div>
            <div><strong>HMAC:</strong> Keyed-hash message authentication code</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashingDemo;