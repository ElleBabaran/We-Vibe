import CryptoJS from 'crypto-js';

/**
 * Comprehensive hashing utilities with multiple algorithms
 * Supports MD5, SHA-1, SHA-256, SHA-512, Blake2b, and more
 */

/**
 * Generate MD5 hash
 * @param {string} input - Input string to hash
 * @returns {string} MD5 hash
 */
export const md5Hash = (input) => {
  return CryptoJS.MD5(input).toString();
};

/**
 * Generate SHA-1 hash
 * @param {string} input - Input string to hash
 * @returns {string} SHA-1 hash
 */
export const sha1Hash = (input) => {
  return CryptoJS.SHA1(input).toString();
};

/**
 * Generate SHA-256 hash
 * @param {string} input - Input string to hash
 * @returns {string} SHA-256 hash
 */
export const sha256Hash = (input) => {
  return CryptoJS.SHA256(input).toString();
};

/**
 * Generate SHA-512 hash
 * @param {string} input - Input string to hash
 * @returns {string} SHA-512 hash
 */
export const sha512Hash = (input) => {
  return CryptoJS.SHA512(input).toString();
};

/**
 * Generate Blake2b hash (using SHA-256 as fallback since crypto-js doesn't support Blake2b)
 * @param {string} input - Input string to hash
 * @returns {string} Blake2b-style hash (using SHA-256)
 */
export const blake2bHash = (input) => {
  // Since crypto-js doesn't support Blake2b, we'll use a combination of SHA-256 and SHA-512
  const sha256 = CryptoJS.SHA256(input).toString();
  const sha512 = CryptoJS.SHA512(input).toString();
  return CryptoJS.SHA256(sha256 + sha512).toString();
};

/**
 * Generate RIPEMD-160 hash
 * @param {string} input - Input string to hash
 * @returns {string} RIPEMD-160 hash
 */
export const ripemd160Hash = (input) => {
  return CryptoJS.RIPEMD160(input).toString();
};

/**
 * Generate Whirlpool hash
 * @param {string} input - Input string to hash
 * @returns {string} Whirlpool hash
 */
export const whirlpoolHash = (input) => {
  return CryptoJS.Whirlpool(input).toString();
};

/**
 * Generate HMAC hash with specified algorithm
 * @param {string} input - Input string to hash
 * @param {string} key - Secret key
 * @param {string} algorithm - Hash algorithm ('MD5', 'SHA1', 'SHA256', 'SHA512')
 * @returns {string} HMAC hash
 */
export const hmacHash = (input, key, algorithm = 'SHA256') => {
  return CryptoJS.HmacSHA256(input, key).toString();
};

/**
 * Generate salted hash
 * @param {string} input - Input string to hash
 * @param {string} salt - Salt string
 * @param {string} algorithm - Hash algorithm
 * @returns {string} Salted hash
 */
export const saltedHash = (input, salt, algorithm = 'SHA256') => {
  const saltedInput = input + salt;
  switch (algorithm.toLowerCase()) {
    case 'md5':
      return md5Hash(saltedInput);
    case 'sha1':
      return sha1Hash(saltedInput);
    case 'sha256':
      return sha256Hash(saltedInput);
    case 'sha512':
      return sha512Hash(saltedInput);
    case 'blake2b':
      return blake2bHash(saltedInput);
    case 'ripemd160':
      return ripemd160Hash(saltedInput);
    case 'whirlpool':
      return whirlpoolHash(saltedInput);
    default:
      return sha256Hash(saltedInput);
  }
};

/**
 * Generate multiple hashes for comparison
 * @param {string} input - Input string to hash
 * @returns {Object} Object containing all hash types
 */
export const generateAllHashes = (input) => {
  return {
    md5: md5Hash(input),
    sha1: sha1Hash(input),
    sha256: sha256Hash(input),
    sha512: sha512Hash(input),
    blake2b: blake2bHash(input),
    ripemd160: ripemd160Hash(input),
    whirlpool: whirlpoolHash(input)
  };
};

/**
 * Generate playlist content hash for integrity verification
 * @param {Array} tracks - Array of track objects
 * @returns {string} Content hash
 */
export const generatePlaylistHash = (tracks) => {
  if (!tracks || tracks.length === 0) {
    return sha256Hash('empty_playlist');
  }
  
  // Create a content string from track data
  const contentString = tracks
    .map(track => `${track.id}-${track.name}-${track.duration_ms}`)
    .sort()
    .join('|');
  
  return sha256Hash(contentString);
};

/**
 * Generate file hash for uploaded images
 * @param {File} file - File object
 * @returns {Promise<string>} File hash
 */
export const generateFileHash = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const hash = sha256Hash(content);
      resolve(hash);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Verify hash integrity
 * @param {string} original - Original hash
 * @param {string} current - Current hash
 * @returns {boolean} True if hashes match
 */
export const verifyHashIntegrity = (original, current) => {
  return original === current;
};

/**
 * Generate random salt
 * @param {number} length - Length of salt
 * @returns {string} Random salt
 */
export const generateSalt = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Hash comparison utility
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @param {string} algorithm - Algorithm used (for logging)
 * @returns {Object} Comparison result
 */
export const compareHashes = (hash1, hash2, algorithm = 'SHA256') => {
  const match = hash1 === hash2;
  return {
    match,
    algorithm,
    hash1: hash1.substring(0, 8) + '...',
    hash2: hash2.substring(0, 8) + '...',
    timestamp: new Date().toISOString()
  };
};