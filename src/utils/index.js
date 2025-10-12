/**
 * Utility modules for algorithms and hashing
 * 
 * This module provides a comprehensive collection of algorithms and hashing utilities
 * for use in music applications, data processing, and general computation tasks.
 */

// Export all algorithm functions
export * from './algorithms.js';

// Export all hashing functions and classes
export * from './hashing.js';

// Export convenience objects for organized access
import * as algorithms from './algorithms.js';
import * as hashing from './hashing.js';

export const Algorithms = algorithms;
export const Hashing = hashing;

// Common utility combinations for music applications
export const MusicUtils = {
  // Shuffle playlist
  shufflePlaylist: algorithms.shuffle,
  
  // Sort tracks by various criteria
  sortTracksByName: (tracks) => algorithms.quickSort(tracks, (a, b) => a.name.localeCompare(b.name)),
  sortTracksByDuration: (tracks) => algorithms.quickSort(tracks, (a, b) => a.duration_ms - b.duration_ms),
  sortTracksByPopularity: (tracks) => algorithms.quickSort(tracks, (a, b) => (b.popularity || 0) - (a.popularity || 0)),
  
  // Search for tracks
  searchTracks: (tracks, query) => {
    return tracks.filter(track => 
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artists?.some(artist => 
        artist.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  },
  
  // Find similar tracks using string distance
  findSimilarTracks: (targetTrack, allTracks, threshold = 3) => {
    return allTracks.filter(track => {
      if (track.id === targetTrack.id) return false;
      const distance = algorithms.levenshteinDistance(
        targetTrack.name.toLowerCase(),
        track.name.toLowerCase()
      );
      return distance <= threshold;
    });
  },
  
  // Generate unique playlist IDs
  generatePlaylistId: (playlistName, userId) => {
    const input = `${playlistName}-${userId}-${Date.now()}`;
    return hashing.djb2Hash(input).toString(36);
  },
  
  // Create bloom filter for fast track lookup
  createTrackFilter: (tracks) => {
    const filter = new hashing.BloomFilter(tracks.length * 2, 0.01);
    tracks.forEach(track => filter.add(track.id));
    return filter;
  },
  
  // Hash track for caching
  hashTrack: (track) => {
    const trackString = `${track.id}-${track.name}-${track.duration_ms}`;
    return hashing.djb2Hash(trackString);
  },
  
  // Calculate playlist statistics
  calculatePlaylistStats: (tracks) => {
    const durations = tracks.map(track => track.duration_ms || 0);
    return algorithms.calculateStats(durations);
  },
  
  // Recommend tracks using simple collaborative filtering
  recommendTracks: (userTracks, allTracks, limit = 10) => {
    const userTrackIds = new Set(userTracks.map(t => t.id));
    const candidates = allTracks.filter(track => !userTrackIds.has(track.id));
    
    // Simple popularity-based recommendation
    const sorted = algorithms.quickSort(candidates, (a, b) => (b.popularity || 0) - (a.popularity || 0));
    return sorted.slice(0, limit);
  }
};

// Performance testing utilities
export const PerformanceUtils = {
  // Compare sorting algorithm performance
  compareSortPerformance: (data, iterations = 100) => {
    const results = {};
    const algorithms = ['quickSort', 'mergeSort', 'heapSort'];
    
    algorithms.forEach(algName => {
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const testData = [...data];
        switch (algName) {
          case 'quickSort':
            algorithms.quickSort(testData);
            break;
          case 'mergeSort':
            algorithms.mergeSort(testData);
            break;
          case 'heapSort':
            algorithms.heapSort(testData);
            break;
        }
      }
      
      const end = performance.now();
      results[algName] = {
        timeMs: end - start,
        itemsPerSecond: Math.round((data.length * iterations) / ((end - start) / 1000))
      };
    });
    
    return results;
  },
  
  // Test hash function performance
  testHashPerformance: hashing.compareHashPerformance,
  
  // Analyze hash distribution
  analyzeHashDistribution: hashing.analyzeHashDistribution
};

// Data structure utilities
export const DataStructures = {
  HashTable: hashing.HashTable,
  HashSet: hashing.HashSet,
  BloomFilter: hashing.BloomFilter,
  ConsistentHash: hashing.ConsistentHash
};

// Common constants
export const Constants = {
  HASH_FUNCTIONS: {
    DJB2: 'djb2',
    FNV1A: 'fnv1a',
    MURMUR3: 'murmur3',
    CRC32: 'crc32'
  },
  
  SORT_ALGORITHMS: {
    QUICK: 'quick',
    MERGE: 'merge',
    HEAP: 'heap'
  },
  
  SEARCH_ALGORITHMS: {
    BINARY: 'binary',
    LINEAR: 'linear',
    KMP: 'kmp'
  }
};

// Example usage and demos
export const Examples = {
  // Demonstrate various sorting algorithms
  sortingDemo: () => {
    const testData = [64, 34, 25, 12, 22, 11, 90, 88, 76, 50, 42];
    console.log('Original array:', testData);
    
    console.log('Quick Sort:', algorithms.quickSort(testData));
    console.log('Merge Sort:', algorithms.mergeSort(testData));
    console.log('Heap Sort:', algorithms.heapSort(testData));
  },
  
  // Demonstrate hash functions
  hashingDemo: () => {
    const testString = 'Hello, World!';
    console.log(`Testing string: "${testString}"`);
    
    console.log('DJB2 Hash:', hashing.djb2Hash(testString));
    console.log('FNV-1a Hash:', hashing.fnv1aHash(testString));
    console.log('Murmur3 Hash:', hashing.murmurHash3(testString));
    console.log('CRC32 Hash:', hashing.crc32Hash(testString));
    console.log('Simple MD5-like:', hashing.simpleMD5Like(testString));
  },
  
  // Demonstrate data structures
  dataStructuresDemo: () => {
    // Hash Table demo
    const hashTable = new hashing.HashTable();
    hashTable.set('key1', 'value1');
    hashTable.set('key2', 'value2');
    console.log('Hash Table get key1:', hashTable.get('key1'));
    
    // Bloom Filter demo
    const bloomFilter = new hashing.BloomFilter(1000, 0.01);
    bloomFilter.add('test1');
    bloomFilter.add('test2');
    console.log('Bloom Filter contains test1:', bloomFilter.mightContain('test1'));
    console.log('Bloom Filter contains test3:', bloomFilter.mightContain('test3'));
    
    // Consistent Hash demo
    const consistentHash = new hashing.ConsistentHash();
    consistentHash.addNode('node1');
    consistentHash.addNode('node2');
    consistentHash.addNode('node3');
    console.log('Key "mykey" maps to node:', consistentHash.getNode('mykey'));
  },
  
  // Music-specific examples
  musicDemo: () => {
    const sampleTracks = [
      { id: '1', name: 'Song A', duration_ms: 180000, popularity: 85 },
      { id: '2', name: 'Song B', duration_ms: 210000, popularity: 92 },
      { id: '3', name: 'Song C', duration_ms: 195000, popularity: 78 }
    ];
    
    console.log('Original tracks:', sampleTracks);
    console.log('Shuffled:', MusicUtils.shufflePlaylist(sampleTracks));
    console.log('Sorted by popularity:', MusicUtils.sortTracksByPopularity(sampleTracks));
    console.log('Playlist stats:', MusicUtils.calculatePlaylistStats(sampleTracks));
  }
};