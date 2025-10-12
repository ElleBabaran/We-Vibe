# WeVibe Spotify - Enhanced with Images & Algorithms

This project has been enhanced with two major feature sets:

## 🖼️ Playlist Image Upload Feature

### What's New
- **Custom Playlist Cover Images**: Users can now upload custom images when creating new playlists
- **Image Preview**: Real-time preview of uploaded images before playlist creation
- **Drag & Drop UI**: Intuitive interface for image selection and management
- **Spotify API Integration**: Automatically uploads images to Spotify using their playlist image API

### How It Works
1. Navigate to the Playlist section
2. Click "Create New Playlist"
3. Upload an image by clicking the image area or "Upload Image" button
4. Fill in playlist name and description
5. Create playlist - the image will be automatically uploaded to Spotify

### Technical Implementation
- Base64 image conversion for Spotify API compatibility
- File validation and preview functionality
- Seamless integration with existing playlist creation workflow

## 🧮 Comprehensive Algorithms & Hashing Library

### Algorithms Module (`src/utils/algorithms.js`)

#### Sorting Algorithms
- **Quick Sort**: O(n log n) average case, divide and conquer
- **Merge Sort**: O(n log n) stable sorting algorithm
- **Heap Sort**: O(n log n) in-place sorting using binary heap
- **Bubble Sort**: O(n²) simple comparison-based sorting
- **Insertion Sort**: O(n²) builds sorted array incrementally

#### Searching Algorithms
- **Binary Search**: O(log n) search in sorted arrays
- **Linear Search**: O(n) sequential search
- **Jump Search**: O(√n) search by jumping fixed steps
- **Interpolation Search**: O(log log n) for uniformly distributed data

#### Graph Algorithms
- **Breadth-First Search (BFS)**: Level-order graph traversal
- **Depth-First Search (DFS)**: Recursive graph traversal
- **Dijkstra's Algorithm**: Shortest path from single source

#### Dynamic Programming
- **Longest Common Subsequence**: String similarity algorithm
- **Knapsack Problem**: Optimization problem solver
- **Fibonacci with Memoization**: Efficient recursive computation

#### String Algorithms
- **KMP Search**: O(n + m) pattern matching algorithm
- **Rabin-Karp Search**: Rolling hash-based string search

### Hashing Module (`src/utils/hashing.js`)

#### Simple Hash Functions
- **djb2 Hash**: Fast string hashing with good distribution
- **FNV-1a Hash**: General-purpose hash function
- **SDBM Hash**: Simple and effective hash function
- **Lose Lose Hash**: Educational example (poor distribution)

#### Cryptographic-Style Hashes
- **Simple SHA-256**: SHA-256 inspired hash function
- **Simple MD5**: MD5 inspired hash function
- **CRC32**: Cyclic redundancy check for error detection

#### Advanced Data Structures
- **Consistent Hashing**: For distributed systems and load balancing
- **Bloom Filter**: Probabilistic set membership testing
- **Hash Table**: Custom implementation with collision resolution
- **Password Hashing**: Secure password storage with salt

#### Utility Functions
- Hash distribution quality testing
- Performance comparison tools
- Checksum utilities
- Test data generation

### Interactive Demo (`src/AlgorithmsDemo.jsx`)

#### Features
- **Sorting Performance Tests**: Compare all sorting algorithms on random data
- **Search Algorithm Tests**: Test different search methods on sorted arrays
- **Hash Function Analysis**: Compare hash functions and test distribution quality
- **Data Structure Demos**: Interactive examples of advanced data structures

#### How to Use
1. Navigate to the "🧮 Algorithms Demo" section in the sidebar
2. Choose from four tabs:
   - **Sorting**: Test and compare sorting algorithm performance
   - **Searching**: Test search algorithms on different datasets  
   - **Hashing**: Analyze hash functions and their properties
   - **Data Structures**: Explore advanced data structures

#### Performance Metrics
- Execution time measurements
- Algorithm correctness verification
- Hash distribution quality analysis
- Memory usage insights

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- Spotify Developer account and API credentials

### Installation
```bash
npm install
npm run dev
```

### Usage
1. Set up Spotify API credentials in `.env` file
2. Run the development server
3. Navigate to the Playlist section to test image uploads
4. Visit the Algorithms Demo to explore the algorithm implementations

## 📁 File Structure

```
src/
├── utils/
│   ├── algorithms.js      # Comprehensive algorithms library
│   └── hashing.js         # Hashing functions and data structures
├── AlgorithmsDemo.jsx     # Interactive algorithm demonstration
├── Playlist.jsx          # Enhanced with image upload functionality
├── App.jsx               # Updated routing
└── Sidebar.jsx           # Added algorithms demo link
```

## 🔧 Technical Notes

### Spotify API Integration
- Requires `playlist-modify-private` scope for image uploads
- Images are converted to base64 format for API compatibility
- Error handling for failed image uploads

### Performance Considerations
- Algorithm implementations optimized for educational and practical use
- Memory-efficient data structures
- Comprehensive performance measurement tools

### Browser Compatibility
- Modern JavaScript features used (ES6+)
- File API for image handling
- Performance API for timing measurements

## 🎯 Use Cases

### Educational
- Learn algorithm complexity and behavior
- Compare different approaches to common problems
- Understand hash function properties and trade-offs

### Practical
- Custom playlist organization with images
- Algorithm selection based on data characteristics
- Hash function selection for different use cases

## 🔮 Future Enhancements

- Additional sorting algorithms (Tim Sort, Radix Sort)
- More graph algorithms (A*, Floyd-Warshall)
- Advanced hashing (SHA-3, Blake2)
- Machine learning algorithm implementations
- Real-time algorithm visualization