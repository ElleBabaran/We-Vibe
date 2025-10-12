import React, { useState, useEffect } from 'react';
import { hashImage, generatePerceptualHash, areImagesSimilar } from './cryptoUtils';

/**
 * Image Gallery Component
 * Demonstrates image hashing and duplicate detection
 */
export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [similarImages, setSimilarImages] = useState([]);

  // Load sample images from public folder
  useEffect(() => {
    const sampleImages = [
      { name: 'Bt90s.jpg', path: '/Banner/Bt90s.jpg' },
      { name: 'fujiKaze.jpg', path: '/Banner/fujiKaze.jpg' },
      { name: 'illit.jpg', path: '/Banner/illit.jpg' },
      { name: 'katseye.jpg', path: '/Banner/katseye.jpg' },
      { name: 'nelly.jpg', path: '/Banner/nelly.jpg' },
      { name: 'Njz.jpg', path: '/Banner/Njz.jpg' }
    ];

    const loadImages = async () => {
      const loadedImages = [];
      
      for (const img of sampleImages) {
        try {
          const response = await fetch(img.path);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          // Generate hashes
          const hash = await hashImage(arrayBuffer, 'SHA-256');
          
          // Generate perceptual hash
          const imgElement = new Image();
          imgElement.src = img.path;
          
          await new Promise((resolve) => {
            imgElement.onload = resolve;
          });
          
          const perceptualHash = await generatePerceptualHash(imgElement);
          
          loadedImages.push({
            ...img,
            hash,
            perceptualHash,
            loaded: true
          });
        } catch (error) {
          console.error(`Error loading image ${img.name}:`, error);
          loadedImages.push({
            ...img,
            loaded: false,
            error: error.message
          });
        }
      }
      
      setImages(loadedImages);
    };

    loadImages();
  }, []);

  const findSimilarImages = (targetImage) => {
    if (!targetImage || !targetImage.perceptualHash) return;
    
    const similar = images.filter(img => {
      if (img.name === targetImage.name || !img.perceptualHash) return false;
      return areImagesSimilar(targetImage.perceptualHash, img.perceptualHash, 10);
    });
    
    setSimilarImages(similar);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    findSimilarImages(image);
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
        🖼️ Image Gallery with Hashing
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => handleImageClick(image)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              border: selectedImage?.name === image.name ? '3px solid #1DB954' : '2px solid #282828',
              transition: 'all 0.2s',
              backgroundColor: '#181818'
            }}
            onMouseEnter={(e) => {
              if (selectedImage?.name !== image.name) {
                e.currentTarget.style.borderColor = '#1DB954';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedImage?.name !== image.name) {
                e.currentTarget.style.borderColor = '#282828';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {image.loaded ? (
              <>
                <img
                  src={image.path}
                  alt={image.name}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ padding: '10px' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold', 
                    marginBottom: '5px',
                    color: '#fff'
                  }}>
                    {image.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#b3b3b3',
                    wordBreak: 'break-all'
                  }}>
                    Hash: {image.hash?.substring(0, 16)}...
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#b3b3b3',
                    marginTop: '2px'
                  }}>
                    pHash: {image.perceptualHash?.substring(0, 16)}...
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                color: '#ff6b6b'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❌</div>
                <div style={{ fontSize: '0.9rem' }}>Failed to load</div>
                <div style={{ fontSize: '0.7rem', color: '#b3b3b3' }}>
                  {image.error}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedImage && (
        <div style={{ 
          backgroundColor: '#181818', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #282828',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#1DB954', marginBottom: '15px' }}>
            Selected Image: {selectedImage.name}
          </h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <img
              src={selectedImage.path}
              alt={selectedImage.name}
              style={{
                width: '200px',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #282828'
              }}
            />
            
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#fff' }}>SHA-256 Hash:</strong>
                <div style={{ 
                  backgroundColor: '#121212', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                  color: '#b3b3b3',
                  marginTop: '5px'
                }}>
                  {selectedImage.hash}
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#fff' }}>Perceptual Hash:</strong>
                <div style={{ 
                  backgroundColor: '#121212', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#b3b3b3',
                  marginTop: '5px'
                }}>
                  {selectedImage.perceptualHash}
                </div>
              </div>
            </div>
          </div>

          {similarImages.length > 0 && (
            <div>
              <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>
                Similar Images Found:
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {similarImages.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '2px solid #ffa500',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleImageClick(img)}
                  >
                    <img
                      src={img.path}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        backgroundColor: '#181818', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #282828'
      }}>
        <h4 style={{ color: '#1DB954', marginBottom: '10px' }}>How it works:</h4>
        <ul style={{ color: '#b3b3b3', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <li><strong>SHA-256 Hash:</strong> Unique fingerprint for exact duplicate detection</li>
          <li><strong>Perceptual Hash:</strong> Detects visually similar images even if they're different files</li>
          <li><strong>Similarity Detection:</strong> Uses Hamming distance to find similar images</li>
          <li><strong>Click any image</strong> to see its hashes and find similar images</li>
        </ul>
      </div>
    </div>
  );
}