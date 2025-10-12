# WeVibe Spotify - Enhanced with Algorithms & Hashing

A modern Spotify client with advanced algorithms and hashing utilities for enhanced music management and data processing.

## 🎵 New Features Added

### 1. Enhanced Playlist Management with Image Upload
- **Custom Playlist Images**: Upload custom cover images for playlists (max 256KB)
- **Image Preview**: Real-time preview of uploaded images
- **Drag & Drop Support**: Easy image upload with visual feedback
- **Automatic Validation**: File type and size validation

### 2. Advanced Sorting & Filtering
- **Multiple Sort Options**: 
  - Default order
  - Alphabetical by name
  - Duration (shortest to longest)
  - Popularity (highest to lowest)
  - Random shuffle
- **Real-time Search**: Search through tracks by name or artist
- **Smart Filtering**: Combine search and sort for precise results
- **Performance Optimized**: Uses efficient algorithms for large playlists

### 3. Comprehensive Algorithm Library

#### Sorting Algorithms
- **Quick Sort**: O(n log n) average case, efficient for large datasets
- **Merge Sort**: O(n log n) guaranteed, stable sorting
- **Heap Sort**: O(n log n) guaranteed, in-place sorting
- **Performance Comparison**: Built-in benchmarking tools

#### Search Algorithms
- **Binary Search**: O(log n) for sorted arrays
- **Linear Search**: O(n) for unsorted data
- **KMP String Matching**: Efficient pattern matching
- **Levenshtein Distance**: Find similar tracks by name

#### Graph Algorithms
- **Dijkstra's Algorithm**: Shortest path finding
- **Breadth-First Search (BFS)**: Graph traversal
- **Depth-First Search (DFS)**: Deep graph exploration

#### Mathematical Algorithms
- **GCD/LCM**: Greatest common divisor and least common multiple
- **Fast Exponentiation**: Efficient power calculations
- **Sieve of Eratosthenes**: Prime number generation
- **Statistical Functions**: Mean, median, mode, standard deviation

#### Dynamic Programming
- **Fibonacci Sequence**: Efficient calculation
- **Longest Common Subsequence**: String similarity
- **Knapsack Problem**: Optimization algorithms

### 4. Advanced Hashing Functions

#### Non-Cryptographic Hashes
- **DJB2 Hash**: Fast, simple hash function
- **FNV-1a Hash**: Good distribution properties
- **MurmurHash3**: High-quality non-cryptographic hash
- **CRC32**: Cyclic redundancy check

#### Cryptographic Hashes
- **SHA-256**: Modern secure hashing (Web Crypto API)
- **Educational Implementations**: Simplified versions for learning
- **Salt Generation**: Secure random salt creation
- **Password Hashing**: Salted password verification

### 5. Data Structures

#### Hash Table
- **Linear Probing**: Collision resolution
- **Dynamic Resizing**: Automatic capacity management
- **Load Factor Monitoring**: Performance optimization
- **Generic Key-Value Storage**: Flexible data storage

#### Hash Set
- **Fast Membership Testing**: O(1) average case
- **Duplicate Prevention**: Automatic deduplication
- **Set Operations**: Union, intersection, difference

#### Bloom Filter
- **Probabilistic Membership**: Space-efficient testing
- **Configurable False Positive Rate**: Customizable accuracy
- **Large Dataset Support**: Memory-efficient for massive collections
- **Track Caching**: Fast playlist membership checks

#### Consistent Hashing
- **Distributed Systems Support**: Load balancing
- **Virtual Nodes**: Improved distribution
- **Dynamic Node Management**: Add/remove nodes efficiently

### 6. Music-Specific Utilities

#### Playlist Operations
- **Smart Shuffling**: Fisher-Yates algorithm implementation
- **Intelligent Sorting**: Multiple criteria support
- **Search Integration**: Fast track finding
- **Statistics Calculation**: Playlist analytics

#### Recommendation System
- **Similarity Detection**: Find related tracks
- **Popularity-Based**: Trending track suggestions
- **Collaborative Filtering**: Basic recommendation engine

#### Performance Analytics
- **Algorithm Benchmarking**: Compare sorting performance
- **Hash Function Analysis**: Distribution quality metrics
- **Real-time Monitoring**: Performance tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Spotify Developer Account

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Spotify API credentials in `.env`
4. Start the development server: `npm run dev`

### Using the New Features

#### Playlist Image Upload
1. Navigate to Playlist creation
2. Click "Choose Image" or drag & drop
3. Preview and confirm your selection
4. Create playlist with custom cover

#### Advanced Sorting & Search
1. Open any playlist
2. Use the search bar to filter tracks
3. Select sorting options from dropdown
4. Clear filters with one click

#### Algorithm Utilities Demo
1. Navigate to "🧮 Algorithms & Hashing" in sidebar
2. Explore different algorithm categories
3. Run interactive demos with custom data
4. Compare performance metrics

## 🛠️ Developer Guide

### Using Algorithm Utilities in Your Code

```javascript
import { 
  MusicUtils, 
  quickSort, 
  sha256,
  HashTable,
  BloomFilter 
} from './utils/index.js';

// Shuffle playlist
const shuffled = MusicUtils.shufflePlaylist(tracks);

// Sort tracks by popularity
const sorted = MusicUtils.sortTracksByPopularity(tracks);

// Hash sensitive data
const hash = await sha256(userData);

// Fast data lookup
const hashTable = new HashTable();
hashTable.set('key', 'value');

// Membership testing
const filter = new BloomFilter(1000, 0.01);
filter.add('item');
const exists = filter.mightContain('item');
```

### Performance Considerations
- Use appropriate algorithms based on data size
- Consider memory usage for large datasets
- Monitor performance with built-in benchmarking
- Choose hash functions based on use case

### Security Notes
- Use Web Crypto API for production cryptographic needs
- Educational hash implementations are for learning only
- Always validate and sanitize user inputs
- Use proper salt generation for password hashing

## 📊 Algorithm Complexity Reference

| Algorithm | Time Complexity | Space Complexity | Use Case |
|-----------|----------------|------------------|----------|
| Quick Sort | O(n log n) avg | O(log n) | General purpose |
| Merge Sort | O(n log n) | O(n) | Stable sorting |
| Heap Sort | O(n log n) | O(1) | In-place sorting |
| Binary Search | O(log n) | O(1) | Sorted arrays |
| Hash Table | O(1) avg | O(n) | Key-value storage |
| Bloom Filter | O(k) | O(m) | Membership testing |

## 🎯 Use Cases

### Music Applications
- Playlist management and optimization
- Track recommendation systems
- Duplicate detection and removal
- Performance monitoring and analytics

### General Applications
- Data processing and analysis
- Caching and optimization
- Search and filtering systems
- Distributed system design

## 🔧 Configuration

### Algorithm Settings
```javascript
// Customize sorting behavior
const customSort = quickSort(data, (a, b) => {
  // Custom comparison function
  return a.customProperty - b.customProperty;
});

// Configure Bloom Filter
const filter = new BloomFilter(
  expectedElements: 10000,
  falsePositiveRate: 0.001
);
```

### Performance Tuning
- Adjust hash table initial size based on expected data
- Configure Bloom Filter parameters for optimal accuracy
- Use appropriate algorithms for different data sizes
- Monitor and profile performance regularly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new algorithms
4. Ensure performance benchmarks pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Spotify Web API for music data
- Computer science community for algorithm implementations
- Open source contributors and maintainers

---

**Note**: This enhanced version includes educational implementations of various algorithms and data structures. For production cryptographic needs, always use established libraries and the Web Crypto API.