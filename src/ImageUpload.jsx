import React, { useState, useRef } from 'react';
import { hashImage, generatePerceptualHash, areImagesSimilar } from './cryptoUtils';

/**
 * Image Upload Component for Playlists
 * Supports image upload, preview, and duplicate detection
 */
export default function ImageUpload({ 
  onImageSelect, 
  onImageHash, 
  existingImages = [], 
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageHash, setImageHash] = useState('');
  const [perceptualHash, setPerceptualHash] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setDuplicateWarning('');
    setIsUploading(true);

    try {
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`);
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Generate hashes for duplicate detection
      const arrayBuffer = await file.arrayBuffer();
      const hash = await hashImage(arrayBuffer, 'SHA-256');
      setImageHash(hash);

      // Generate perceptual hash for similarity detection
      const img = new Image();
      img.onload = async () => {
        const pHash = await generatePerceptualHash(img);
        setPerceptualHash(pHash);

        // Check for duplicates
        const isDuplicate = existingImages.some(existing => {
          return existing.hash === hash || 
                 (existing.perceptualHash && areImagesSimilar(pHash, existing.perceptualHash));
        });

        if (isDuplicate) {
          setDuplicateWarning('⚠️ This image appears to be a duplicate or very similar to an existing image.');
        }

        setIsUploading(false);
        onImageSelect?.(file, hash, pHash);
        onImageHash?.(hash, pHash);
      };
      img.src = URL.createObjectURL(file);

    } catch (err) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const syntheticEvent = {
        target: { files: [files[0]] }
      };
      handleFileSelect(syntheticEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const clearImage = () => {
    setPreview(null);
    setImageHash('');
    setPerceptualHash('');
    setError('');
    setDuplicateWarning('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '2px dashed #666',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#181818',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderColor: preview ? '#1DB954' : '#666',
        }}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          if (!preview) {
            e.currentTarget.style.borderColor = '#1DB954';
            e.currentTarget.style.backgroundColor = '#282828';
          }
        }}
        onMouseLeave={(e) => {
          if (!preview) {
            e.currentTarget.style.borderColor = '#666';
            e.currentTarget.style.backgroundColor = '#181818';
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '200px',
                borderRadius: '4px',
                marginBottom: '10px',
                objectFit: 'cover',
              }}
            />
            <div style={{ color: '#1DB954', fontSize: '0.9rem', marginBottom: '10px' }}>
              ✓ Image selected
            </div>
            {imageHash && (
              <div style={{ color: '#b3b3b3', fontSize: '0.8rem', marginBottom: '5px' }}>
                Hash: {imageHash.substring(0, 16)}...
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#b3b3b3',
                border: '1px solid #b3b3b3',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📷</div>
            <div style={{ color: '#fff', marginBottom: '5px' }}>
              {isUploading ? 'Processing...' : 'Click to upload or drag & drop'}
            </div>
            <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
              {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {Math.round(maxSize / (1024 * 1024))}MB
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          color: '#ff6b6b', 
          fontSize: '0.9rem', 
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#2d1b1b',
          borderRadius: '4px',
          border: '1px solid #ff6b6b'
        }}>
          {error}
        </div>
      )}

      {duplicateWarning && (
        <div style={{ 
          color: '#ffa500', 
          fontSize: '0.9rem', 
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#2d241b',
          borderRadius: '4px',
          border: '1px solid #ffa500'
        }}>
          {duplicateWarning}
        </div>
      )}
    </div>
  );
}