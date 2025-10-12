/**
 * Collection of various algorithms for data processing and analysis
 * Useful for music recommendation, playlist analysis, and data manipulation
 */

// ==================== SORTING ALGORITHMS ====================

/**
 * Quick Sort implementation
 * @param {Array} arr - Array to sort
 * @param {Function} compareFn - Optional comparison function
 * @returns {Array} Sorted array
 */
export function quickSort(arr, compareFn = (a, b) => a - b) {
  if (arr.length <= 1) return [...arr];
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const right = [];
  const equal = [];
  
  for (const element of arr) {
    const comparison = compareFn(element, pivot);
    if (comparison < 0) {
      left.push(element);
    } else if (comparison > 0) {
      right.push(element);
    } else {
      equal.push(element);
    }
  }
  
  return [
    ...quickSort(left, compareFn),
    ...equal,
    ...quickSort(right, compareFn)
  ];
}

/**
 * Merge Sort implementation
 * @param {Array} arr - Array to sort
 * @param {Function} compareFn - Optional comparison function
 * @returns {Array} Sorted array
 */
export function mergeSort(arr, compareFn = (a, b) => a - b) {
  if (arr.length <= 1) return [...arr];
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), compareFn);
  const right = mergeSort(arr.slice(mid), compareFn);
  
  return merge(left, right, compareFn);
}

function merge(left, right, compareFn) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}

/**
 * Heap Sort implementation
 * @param {Array} arr - Array to sort
 * @param {Function} compareFn - Optional comparison function
 * @returns {Array} Sorted array
 */
export function heapSort(arr, compareFn = (a, b) => a - b) {
  const sorted = [...arr];
  const n = sorted.length;
  
  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(sorted, n, i, compareFn);
  }
  
  // Extract elements from heap one by one
  for (let i = n - 1; i > 0; i--) {
    [sorted[0], sorted[i]] = [sorted[i], sorted[0]];
    heapify(sorted, i, 0, compareFn);
  }
  
  return sorted;
}

function heapify(arr, n, i, compareFn) {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  
  if (left < n && compareFn(arr[left], arr[largest]) > 0) {
    largest = left;
  }
  
  if (right < n && compareFn(arr[right], arr[largest]) > 0) {
    largest = right;
  }
  
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest, compareFn);
  }
}

// ==================== SEARCH ALGORITHMS ====================

/**
 * Binary Search implementation
 * @param {Array} arr - Sorted array to search in
 * @param {*} target - Value to search for
 * @param {Function} compareFn - Optional comparison function
 * @returns {number} Index of target or -1 if not found
 */
export function binarySearch(arr, target, compareFn = (a, b) => a - b) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compareFn(arr[mid], target);
    
    if (comparison === 0) {
      return mid;
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

/**
 * Linear Search implementation
 * @param {Array} arr - Array to search in
 * @param {*} target - Value to search for
 * @param {Function} compareFn - Optional comparison function
 * @returns {number} Index of target or -1 if not found
 */
export function linearSearch(arr, target, compareFn = (a, b) => a === b) {
  for (let i = 0; i < arr.length; i++) {
    if (compareFn(arr[i], target)) {
      return i;
    }
  }
  return -1;
}

// ==================== STRING ALGORITHMS ====================

/**
 * Knuth-Morris-Pratt (KMP) string matching algorithm
 * @param {string} text - Text to search in
 * @param {string} pattern - Pattern to search for
 * @returns {Array} Array of starting positions where pattern is found
 */
export function kmpSearch(text, pattern) {
  if (!pattern.length) return [];
  
  const lps = computeLPS(pattern);
  const matches = [];
  let i = 0; // index for text
  let j = 0; // index for pattern
  
  while (i < text.length) {
    if (pattern[j] === text[i]) {
      i++;
      j++;
    }
    
    if (j === pattern.length) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && pattern[j] !== text[i]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }
  
  return matches;
}

function computeLPS(pattern) {
  const lps = new Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  
  return lps;
}

/**
 * Levenshtein Distance (Edit Distance) algorithm
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Minimum number of edits required
 */
export function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Create a 2D array to store distances
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Fill the dp table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // deletion
          dp[i][j - 1],    // insertion
          dp[i - 1][j - 1] // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

// ==================== GRAPH ALGORITHMS ====================

/**
 * Dijkstra's shortest path algorithm
 * @param {Object} graph - Graph represented as adjacency list
 * @param {*} start - Starting vertex
 * @returns {Object} Object containing distances and previous vertices
 */
export function dijkstra(graph, start) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const vertices = Object.keys(graph);
  
  // Initialize distances
  vertices.forEach(vertex => {
    distances[vertex] = vertex === start ? 0 : Infinity;
    previous[vertex] = null;
  });
  
  while (visited.size < vertices.length) {
    // Find unvisited vertex with minimum distance
    const current = vertices
      .filter(v => !visited.has(v))
      .reduce((min, v) => distances[v] < distances[min] ? v : min);
    
    visited.add(current);
    
    // Update distances to neighbors
    if (graph[current]) {
      Object.entries(graph[current]).forEach(([neighbor, weight]) => {
        const newDistance = distances[current] + weight;
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
          previous[neighbor] = current;
        }
      });
    }
  }
  
  return { distances, previous };
}

/**
 * Breadth-First Search (BFS) algorithm
 * @param {Object} graph - Graph represented as adjacency list
 * @param {*} start - Starting vertex
 * @returns {Array} Array of vertices in BFS order
 */
export function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  while (queue.length > 0) {
    const vertex = queue.shift();
    
    if (!visited.has(vertex)) {
      visited.add(vertex);
      result.push(vertex);
      
      if (graph[vertex]) {
        graph[vertex].forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        });
      }
    }
  }
  
  return result;
}

/**
 * Depth-First Search (DFS) algorithm
 * @param {Object} graph - Graph represented as adjacency list
 * @param {*} start - Starting vertex
 * @returns {Array} Array of vertices in DFS order
 */
export function dfs(graph, start) {
  const visited = new Set();
  const result = [];
  
  function dfsHelper(vertex) {
    visited.add(vertex);
    result.push(vertex);
    
    if (graph[vertex]) {
      graph[vertex].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfsHelper(neighbor);
        }
      });
    }
  }
  
  dfsHelper(start);
  return result;
}

// ==================== MATHEMATICAL ALGORITHMS ====================

/**
 * Greatest Common Divisor using Euclidean algorithm
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} GCD of a and b
 */
export function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return Math.abs(a);
}

/**
 * Least Common Multiple
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} LCM of a and b
 */
export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Fast exponentiation using binary exponentiation
 * @param {number} base - Base number
 * @param {number} exp - Exponent
 * @param {number} mod - Optional modulus
 * @returns {number} base^exp (mod mod if provided)
 */
export function fastPower(base, exp, mod = null) {
  let result = 1;
  base = base % (mod || Number.MAX_SAFE_INTEGER);
  
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % (mod || Number.MAX_SAFE_INTEGER);
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % (mod || Number.MAX_SAFE_INTEGER);
  }
  
  return result;
}

/**
 * Sieve of Eratosthenes for finding prime numbers
 * @param {number} n - Upper limit
 * @returns {Array} Array of prime numbers up to n
 */
export function sieveOfEratosthenes(n) {
  const primes = [];
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  
  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false;
      }
    }
  }
  
  for (let i = 2; i <= n; i++) {
    if (isPrime[i]) {
      primes.push(i);
    }
  }
  
  return primes;
}

// ==================== DYNAMIC PROGRAMMING ALGORITHMS ====================

/**
 * Fibonacci sequence using dynamic programming
 * @param {number} n - Position in sequence
 * @returns {number} nth Fibonacci number
 */
export function fibonacci(n) {
  if (n <= 1) return n;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  
  return b;
}

/**
 * Longest Common Subsequence
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {string} Longest common subsequence
 */
export function longestCommonSubsequence(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Reconstruct the LCS
  let lcs = '';
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      lcs = str1[i - 1] + lcs;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

/**
 * 0/1 Knapsack problem solver
 * @param {number} capacity - Knapsack capacity
 * @param {Array} weights - Array of item weights
 * @param {Array} values - Array of item values
 * @returns {Object} Object containing max value and selected items
 */
export function knapsack(capacity, weights, values) {
  const n = weights.length;
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weights[i - 1]] + values[i - 1]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  // Find selected items
  const selectedItems = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedItems.push(i - 1);
      w -= weights[i - 1];
    }
  }
  
  return {
    maxValue: dp[n][capacity],
    selectedItems: selectedItems.reverse()
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate random number within range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random number in range
 */
export function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate statistical measures
 * @param {Array} numbers - Array of numbers
 * @returns {Object} Object containing mean, median, mode, stdDev
 */
export function calculateStats(numbers) {
  if (!numbers.length) return null;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = numbers.length;
  
  // Mean
  const mean = numbers.reduce((sum, num) => sum + num, 0) / n;
  
  // Median
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  // Mode
  const frequency = {};
  numbers.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(frequency));
  const mode = Object.keys(frequency)
    .filter(key => frequency[key] === maxFreq)
    .map(Number);
  
  // Standard Deviation
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  return { mean, median, mode, stdDev, variance };
}