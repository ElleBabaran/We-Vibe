import React, { useState } from 'react';
import { 
  hashData, 
  md5, 
  sha1, 
  generateRandomString, 
  generateSalt, 
  hashPassword,
  HASH_ALGORITHMS 
} from './cryptoUtils';
import ImageGallery from './ImageGallery';

/**
 * Crypto Demo Component
 * Demonstrates various hashing algorithms and cryptographic functions
 */
export default function CryptoDemo() {
  const [inputText, setInputText] = useState('Hello, World!');
  const [password, setPassword] = useState('');
  const [salt, setSalt] = useState('');
  const [results, setResults] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const handleHash = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    const newResults = {};

    try {
      // MD5
      newResults.md5 = md5(inputText);

      // SHA-1
      newResults.sha1 = sha1(inputText);

      // Web Crypto API hashes
      newResults.sha256 = await hashData(inputText, 'SHA-256');
      newResults.sha384 = await hashData(inputText, 'SHA-384');
      newResults.sha512 = await hashData(inputText, 'SHA-512');

      // Random string generation
      newResults.randomString = generateRandomString(32);
      newResults.randomSalt = generateSalt(16);

      setResults(newResults);
    } catch (error) {
      console.error('Error generating hashes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordHash = async () => {
    if (!password.trim()) return;

    setIsProcessing(true);
    try {
      const generatedSalt = salt || generateSalt(16);
      const hashedPassword = await hashPassword(password, generatedSalt);
      
      setResults(prev => ({
        ...prev,
        passwordSalt: generatedSalt,
        hashedPassword: hashedPassword
      }));
    } catch (error) {
      console.error('Error hashing password:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#121212',
      borderRadius: '8px',
      color: '#fff'
    }}>
      <h2 style={{ 
        fontSize: '2rem', 
        marginBottom: '20px', 
        textAlign: 'center',
        background: 'linear-gradient(45deg, #1DB954, #1ed760)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🔐 Cryptographic Algorithms Demo
      </h2>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '30px',
        borderBottom: '2px solid #282828'
      }}>
        <button
          onClick={() => setActiveTab('text')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'text' ? '#1DB954' : 'transparent',
            color: activeTab === 'text' ? '#fff' : '#b3b3b3',
            border: 'none',
            borderBottom: activeTab === 'text' ? '2px solid #1DB954' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
        >
          Text Hashing
        </button>
        <button
          onClick={() => setActiveTab('images')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'images' ? '#1DB954' : 'transparent',
            color: activeTab === 'images' ? '#fff' : '#b3b3b3',
            border: 'none',
            borderBottom: activeTab === 'images' ? '2px solid #1DB954' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
        >
          Image Hashing
        </button>
      </div>

      {activeTab === 'text' && (
        <div>

      {/* Text Input Section */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold',
          color: '#fff'
        }}>
          Text to Hash:
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to hash..."
          rows="3"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#181818',
            border: '2px solid #282828',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            resize: 'vertical',
          }}
        />
        <button
          onClick={handleHash}
          disabled={isProcessing || !inputText.trim()}
          style={{
            marginTop: '10px',
            padding: '12px 24px',
            backgroundColor: inputText.trim() && !isProcessing ? '#1DB954' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: inputText.trim() && !isProcessing ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {isProcessing ? 'Processing...' : 'Generate Hashes'}
        </button>
      </div>

      {/* Password Hashing Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>Password Hashing (PBKDF2)</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#181818',
              border: '2px solid #282828',
              borderRadius: '6px',
              color: '#fff',
            }}
          />
          <input
            type="text"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="Salt (optional)"
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#181818',
              border: '2px solid #282828',
              borderRadius: '6px',
              color: '#fff',
            }}
          />
        </div>
        <button
          onClick={handlePasswordHash}
          disabled={isProcessing || !password.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: password.trim() && !isProcessing ? '#1DB954' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: password.trim() && !isProcessing ? 'pointer' : 'not-allowed',
          }}
        >
          Hash Password
        </button>
      </div>

      {/* Results Section */}
      {Object.keys(results).length > 0 && (
        <div>
          <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>Results:</h3>
          
          {results.md5 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>MD5:</strong>
                <button
                  onClick={() => copyToClipboard(results.md5)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#b3b3b3'
              }}>
                {results.md5}
              </div>
            </div>
          )}

          {results.sha1 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>SHA-1:</strong>
                <button
                  onClick={() => copyToClipboard(results.sha1)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#b3b3b3'
              }}>
                {results.sha1}
              </div>
            </div>
          )}

          {results.sha256 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>SHA-256:</strong>
                <button
                  onClick={() => copyToClipboard(results.sha256)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#b3b3b3'
              }}>
                {results.sha256}
              </div>
            </div>
          )}

          {results.sha384 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>SHA-384:</strong>
                <button
                  onClick={() => copyToClipboard(results.sha384)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#b3b3b3'
              }}>
                {results.sha384}
              </div>
            </div>
          )}

          {results.sha512 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>SHA-512:</strong>
                <button
                  onClick={() => copyToClipboard(results.sha512)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#b3b3b3'
              }}>
                {results.sha512}
              </div>
            </div>
          )}

          {results.hashedPassword && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>Hashed Password (PBKDF2):</strong>
                <button
                  onClick={() => copyToClipboard(results.hashedPassword)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#b3b3b3'
              }}>
                {results.hashedPassword}
              </div>
              {results.passwordSalt && (
                <div style={{ marginTop: '10px' }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Salt:</strong>
                  <div style={{ 
                    backgroundColor: '#181818', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    wordBreak: 'break-all',
                    color: '#b3b3b3',
                    marginTop: '5px'
                  }}>
                    {results.passwordSalt}
                  </div>
                </div>
              )}
            </div>
          )}

          {results.randomString && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <strong style={{ color: '#fff' }}>Random String (32 chars):</strong>
                <button
                  onClick={() => copyToClipboard(results.randomString)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#282828',
                    color: '#1DB954',
                    border: '1px solid #1DB954',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ 
                backgroundColor: '#181818', 
                padding: '10px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#b3b3b3'
              }}>
                {results.randomString}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Algorithm Info */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#181818', 
        borderRadius: '8px',
        border: '1px solid #282828'
      }}>
        <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>Algorithm Information:</h4>
        <ul style={{ color: '#b3b3b3', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <li><strong>MD5:</strong> 128-bit hash, fast but cryptographically broken</li>
          <li><strong>SHA-1:</strong> 160-bit hash, deprecated for security purposes</li>
          <li><strong>SHA-256:</strong> 256-bit hash, widely used and secure</li>
          <li><strong>SHA-384:</strong> 384-bit hash, more secure than SHA-256</li>
          <li><strong>SHA-512:</strong> 512-bit hash, highest security level</li>
          <li><strong>PBKDF2:</strong> Password-based key derivation function with salt</li>
        </ul>
      </div>
        </div>
      )}

      {activeTab === 'images' && (
        <ImageGallery />
      )}
    </div>
  );
}