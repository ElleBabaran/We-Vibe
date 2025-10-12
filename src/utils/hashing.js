/**
 * Collection of hashing algorithms and utilities
 * Includes both cryptographic and non-cryptographic hash functions
 */

// ==================== SIMPLE HASH FUNCTIONS ====================

/**
 * Simple hash function using djb2 algorithm
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
export function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * FNV-1a hash algorithm
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
export function fnv1aHash(str) {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash;
}

/**
 * MurmurHash3 (simplified 32-bit version)
 * @param {string} str - String to hash
 * @param {number} seed - Seed value
 * @returns {number} Hash value
 */
export function murmurHash3(str, seed = 0) {
  let hash = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const r1 = 15;
  const r2 = 13;
  const m = 5;
  const n = 0xe6546b64;
  
  for (let i = 0; i < str.length; i++) {
    let k = str.charCodeAt(i);
    k = (k * c1) >>> 0;
    k = (k << r1) | (k >>> (32 - r1));
    k = (k * c2) >>> 0;
    
    hash ^= k;
    hash = (hash << r2) | (hash >>> (32 - r2));
    hash = ((hash * m) + n) >>> 0;
  }
  
  hash ^= str.length;
  hash ^= hash >>> 16;
  hash = (hash * 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = (hash * 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  
  return hash;
}

/**
 * CRC32 hash function
 * @param {string} str - String to hash
 * @returns {number} CRC32 hash value
 */
export function crc32Hash(str) {
  const table = generateCRC32Table();
  let crc = 0 ^ (-1);
  
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  
  return (crc ^ (-1)) >>> 0;
}

function generateCRC32Table() {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  return table;
}

// ==================== CRYPTOGRAPHIC HASH FUNCTIONS ====================
// Note: These are educational implementations. For production use, 
// consider using the Web Crypto API for better security and performance.

/**
 * Simple MD5-like hash (educational implementation)
 * @param {string} str - String to hash
 * @returns {string} Hex hash string
 */
export function simpleMD5Like(str) {
  // This is a simplified version for educational purposes
  // DO NOT use for cryptographic purposes
  let hash = 0;
  if (str.length === 0) return hash.toString(16).padStart(8, '0');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add some MD5-like transformations
  hash = hash ^ (hash >>> 16);
  hash = hash * 0x85ebca6b;
  hash = hash ^ (hash >>> 13);
  hash = hash * 0xc2b2ae35;
  hash = hash ^ (hash >>> 16);
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * SHA-1 like hash (simplified educational version)
 * @param {string} str - String to hash
 * @returns {string} Hex hash string
 */
export function simpleSHA1Like(str) {
  // Simplified SHA-1 like algorithm for educational purposes
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;
  
  // Convert string to bytes
  const bytes = new TextEncoder().encode(str);
  
  // Process in chunks
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = (bytes[i] || 0) << 24 | 
                  (bytes[i + 1] || 0) << 16 | 
                  (bytes[i + 2] || 0) << 8 | 
                  (bytes[i + 3] || 0);
    
    // Simple mixing
    const temp = (h0 << 5 | h0 >>> 27) + h4 + chunk + 0x5A827999;
    h4 = h3;
    h3 = h2;
    h2 = h1 << 30 | h1 >>> 2;
    h1 = h0;
    h0 = temp;
  }
  
  return (h0 >>> 0).toString(16).padStart(8, '0') +
         (h1 >>> 0).toString(16).padStart(8, '0') +
         (h2 >>> 0).toString(16).padStart(8, '0') +
         (h3 >>> 0).toString(16).padStart(8, '0') +
         (h4 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Modern SHA-256 using Web Crypto API (when available)
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex hash string
 */
export async function sha256(str) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback to simple hash for environments without Web Crypto API
    return simpleSHA256Like(str);
  }
}

/**
 * Simple SHA-256 like hash (fallback implementation)
 * @param {string} str - String to hash
 * @returns {string} Hex hash string
 */
function simpleSHA256Like(str) {
  // Simplified SHA-256 like algorithm
  let h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  
  const bytes = new TextEncoder().encode(str);
  
  // Simple compression function
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    h[0] = (h[0] + byte) >>> 0;
    h[1] = (h[1] ^ h[0]) >>> 0;
    h[2] = (h[2] + h[1]) >>> 0;
    h[3] = (h[3] ^ h[2]) >>> 0;
    h[4] = (h[4] + h[3]) >>> 0;
    h[5] = (h[5] ^ h[4]) >>> 0;
    h[6] = (h[6] + h[5]) >>> 0;
    h[7] = (h[7] ^ h[6]) >>> 0;
    
    // Rotate
    const temp = h[7];
    for (let j = 7; j > 0; j--) {
      h[j] = h[j - 1];
    }
    h[0] = temp;
  }
  
  return h.map(n => (n >>> 0).toString(16).padStart(8, '0')).join('');
}

// ==================== HASH TABLE IMPLEMENTATIONS ====================

/**
 * Hash Table with linear probing
 */
export class HashTable {
  constructor(size = 16) {
    this.size = size;
    this.keys = new Array(size);
    this.values = new Array(size);
    this.count = 0;
  }
  
  hash(key) {
    return djb2Hash(key.toString()) % this.size;
  }
  
  set(key, value) {
    let index = this.hash(key);
    
    // Linear probing for collision resolution
    while (this.keys[index] !== undefined && this.keys[index] !== key) {
      index = (index + 1) % this.size;
    }
    
    if (this.keys[index] === undefined) {
      this.count++;
    }
    
    this.keys[index] = key;
    this.values[index] = value;
    
    // Resize if load factor > 0.75
    if (this.count / this.size > 0.75) {
      this.resize();
    }
  }
  
  get(key) {
    let index = this.hash(key);
    
    while (this.keys[index] !== undefined) {
      if (this.keys[index] === key) {
        return this.values[index];
      }
      index = (index + 1) % this.size;
    }
    
    return undefined;
  }
  
  delete(key) {
    let index = this.hash(key);
    
    while (this.keys[index] !== undefined) {
      if (this.keys[index] === key) {
        this.keys[index] = undefined;
        this.values[index] = undefined;
        this.count--;
        
        // Rehash subsequent elements
        index = (index + 1) % this.size;
        while (this.keys[index] !== undefined) {
          const tempKey = this.keys[index];
          const tempValue = this.values[index];
          this.keys[index] = undefined;
          this.values[index] = undefined;
          this.count--;
          this.set(tempKey, tempValue);
          index = (index + 1) % this.size;
        }
        
        return true;
      }
      index = (index + 1) % this.size;
    }
    
    return false;
  }
  
  resize() {
    const oldKeys = this.keys;
    const oldValues = this.values;
    
    this.size *= 2;
    this.keys = new Array(this.size);
    this.values = new Array(this.size);
    this.count = 0;
    
    for (let i = 0; i < oldKeys.length; i++) {
      if (oldKeys[i] !== undefined) {
        this.set(oldKeys[i], oldValues[i]);
      }
    }
  }
  
  has(key) {
    return this.get(key) !== undefined;
  }
  
  clear() {
    this.keys = new Array(this.size);
    this.values = new Array(this.size);
    this.count = 0;
  }
  
  getLoadFactor() {
    return this.count / this.size;
  }
}

/**
 * Hash Set implementation
 */
export class HashSet {
  constructor(size = 16) {
    this.hashTable = new HashTable(size);
  }
  
  add(value) {
    this.hashTable.set(value, true);
  }
  
  has(value) {
    return this.hashTable.has(value);
  }
  
  delete(value) {
    return this.hashTable.delete(value);
  }
  
  clear() {
    this.hashTable.clear();
  }
  
  size() {
    return this.hashTable.count;
  }
  
  values() {
    const result = [];
    for (let i = 0; i < this.hashTable.size; i++) {
      if (this.hashTable.keys[i] !== undefined) {
        result.push(this.hashTable.keys[i]);
      }
    }
    return result;
  }
}

// ==================== BLOOM FILTER ====================

/**
 * Bloom Filter implementation for probabilistic membership testing
 */
export class BloomFilter {
  constructor(expectedElements = 1000, falsePositiveRate = 0.01) {
    this.expectedElements = expectedElements;
    this.falsePositiveRate = falsePositiveRate;
    
    // Calculate optimal bit array size and number of hash functions
    this.bitArraySize = Math.ceil(
      -(expectedElements * Math.log(falsePositiveRate)) / (Math.log(2) ** 2)
    );
    this.hashFunctions = Math.ceil((this.bitArraySize / expectedElements) * Math.log(2));
    
    this.bitArray = new Array(this.bitArraySize).fill(false);
  }
  
  add(item) {
    const hashes = this.getHashes(item);
    hashes.forEach(hash => {
      this.bitArray[hash % this.bitArraySize] = true;
    });
  }
  
  mightContain(item) {
    const hashes = this.getHashes(item);
    return hashes.every(hash => this.bitArray[hash % this.bitArraySize]);
  }
  
  getHashes(item) {
    const str = item.toString();
    const hashes = [];
    
    // Use different hash functions
    hashes.push(djb2Hash(str));
    hashes.push(fnv1aHash(str));
    hashes.push(murmurHash3(str, 42));
    
    // Generate additional hashes if needed
    for (let i = 3; i < this.hashFunctions; i++) {
      hashes.push(murmurHash3(str, i * 17));
    }
    
    return hashes.slice(0, this.hashFunctions);
  }
  
  clear() {
    this.bitArray = new Array(this.bitArraySize).fill(false);
  }
  
  getEstimatedCount() {
    const setBits = this.bitArray.filter(bit => bit).length;
    return Math.log(1 - setBits / this.bitArraySize) / 
           (this.hashFunctions * Math.log(1 - 1 / this.bitArraySize));
  }
}

// ==================== CONSISTENT HASHING ====================

/**
 * Consistent Hashing implementation for distributed systems
 */
export class ConsistentHash {
  constructor(virtualNodes = 150) {
    this.virtualNodes = virtualNodes;
    this.ring = new Map();
    this.nodes = new Set();
  }
  
  addNode(node) {
    this.nodes.add(node);
    
    // Add virtual nodes to the ring
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualNodeKey = `${node}:${i}`;
      const hash = djb2Hash(virtualNodeKey);
      this.ring.set(hash, node);
    }
    
    // Sort the ring
    this.ring = new Map([...this.ring.entries()].sort((a, b) => a[0] - b[0]));
  }
  
  removeNode(node) {
    this.nodes.delete(node);
    
    // Remove virtual nodes from the ring
    const keysToDelete = [];
    for (const [hash, nodeValue] of this.ring) {
      if (nodeValue === node) {
        keysToDelete.push(hash);
      }
    }
    
    keysToDelete.forEach(key => this.ring.delete(key));
  }
  
  getNode(key) {
    if (this.ring.size === 0) return null;
    
    const hash = djb2Hash(key.toString());
    const sortedHashes = [...this.ring.keys()].sort((a, b) => a - b);
    
    // Find the first node with hash >= key hash
    for (const ringHash of sortedHashes) {
      if (ringHash >= hash) {
        return this.ring.get(ringHash);
      }
    }
    
    // If no node found, wrap around to the first node
    return this.ring.get(sortedHashes[0]);
  }
  
  getNodes() {
    return [...this.nodes];
  }
  
  getRingDistribution() {
    const distribution = new Map();
    for (const node of this.nodes) {
      distribution.set(node, 0);
    }
    
    for (const node of this.ring.values()) {
      distribution.set(node, distribution.get(node) + 1);
    }
    
    return distribution;
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate a secure random salt
 * @param {number} length - Salt length in bytes
 * @returns {string} Hex encoded salt
 */
export function generateSalt(length = 16) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for environments without Web Crypto API
    let salt = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < length * 2; i++) {
      salt += chars[Math.floor(Math.random() * chars.length)];
    }
    return salt;
  }
}

/**
 * Hash with salt for password hashing
 * @param {string} password - Password to hash
 * @param {string} salt - Salt to use
 * @returns {Promise<string>} Salted hash
 */
export async function hashWithSalt(password, salt) {
  const saltedPassword = password + salt;
  return await sha256(saltedPassword);
}

/**
 * Verify password against hash
 * @param {string} password - Password to verify
 * @param {string} salt - Salt used
 * @param {string} hash - Hash to verify against
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, salt, hash) {
  const computedHash = await hashWithSalt(password, salt);
  return computedHash === hash;
}

/**
 * Compare hash performance
 * @param {string} input - Input string to hash
 * @param {number} iterations - Number of iterations
 * @returns {Object} Performance comparison
 */
export function compareHashPerformance(input, iterations = 10000) {
  const results = {};
  
  // Test different hash functions
  const hashFunctions = [
    { name: 'djb2Hash', func: djb2Hash },
    { name: 'fnv1aHash', func: fnv1aHash },
    { name: 'murmurHash3', func: (str) => murmurHash3(str) },
    { name: 'crc32Hash', func: crc32Hash },
    { name: 'simpleMD5Like', func: simpleMD5Like }
  ];
  
  hashFunctions.forEach(({ name, func }) => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      func(input + i);
    }
    
    const end = performance.now();
    results[name] = {
      timeMs: end - start,
      hashesPerSecond: Math.round(iterations / ((end - start) / 1000))
    };
  });
  
  return results;
}

/**
 * Calculate hash distribution quality
 * @param {Array} inputs - Array of input strings
 * @param {Function} hashFunc - Hash function to test
 * @param {number} buckets - Number of buckets for distribution test
 * @returns {Object} Distribution statistics
 */
export function analyzeHashDistribution(inputs, hashFunc = djb2Hash, buckets = 100) {
  const distribution = new Array(buckets).fill(0);
  
  inputs.forEach(input => {
    const hash = hashFunc(input.toString());
    const bucket = hash % buckets;
    distribution[bucket]++;
  });
  
  // Calculate statistics
  const mean = inputs.length / buckets;
  const variance = distribution.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / buckets;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...distribution);
  const max = Math.max(...distribution);
  
  return {
    distribution,
    mean,
    variance,
    stdDev,
    min,
    max,
    uniformity: 1 - (stdDev / mean) // Higher is more uniform
  };
}