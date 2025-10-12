/**
 * Comprehensive Algorithms Library
 * Contains sorting, searching, and data structure algorithms
 */

// ================================
// SORTING ALGORITHMS
// ================================

/**
 * Quick Sort - Divide and conquer sorting algorithm
 * Time Complexity: O(n log n) average, O(n²) worst case
 * Space Complexity: O(log n)
 */
export function quickSort(arr, compareFn = (a, b) => a - b) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const right = [];
  const equal = [];
  
  for (const element of arr) {
    const comparison = compareFn(element, pivot);
    if (comparison < 0) left.push(element);
    else if (comparison > 0) right.push(element);
    else equal.push(element);
  }
  
  return [...quickSort(left, compareFn), ...equal, ...quickSort(right, compareFn)];
}

/**
 * Merge Sort - Stable divide and conquer sorting
 * Time Complexity: O(n log n)
 * Space Complexity: O(n)
 */
export function mergeSort(arr, compareFn = (a, b) => a - b) {
  if (arr.length <= 1) return arr;
  
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
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}

/**
 * Heap Sort - In-place sorting using binary heap
 * Time Complexity: O(n log n)
 * Space Complexity: O(1)
 */
export function heapSort(arr, compareFn = (a, b) => a - b) {
  const sorted = [...arr];
  
  // Build max heap
  for (let i = Math.floor(sorted.length / 2) - 1; i >= 0; i--) {
    heapify(sorted, sorted.length, i, compareFn);
  }
  
  // Extract elements from heap one by one
  for (let i = sorted.length - 1; i > 0; i--) {
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

/**
 * Bubble Sort - Simple comparison-based sorting
 * Time Complexity: O(n²)
 * Space Complexity: O(1)
 */
export function bubbleSort(arr, compareFn = (a, b) => a - b) {
  const sorted = [...arr];
  const n = sorted.length;
  
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (compareFn(sorted[j], sorted[j + 1]) > 0) {
        [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  
  return sorted;
}

/**
 * Insertion Sort - Builds sorted array one element at a time
 * Time Complexity: O(n²)
 * Space Complexity: O(1)
 */
export function insertionSort(arr, compareFn = (a, b) => a - b) {
  const sorted = [...arr];
  
  for (let i = 1; i < sorted.length; i++) {
    const key = sorted[i];
    let j = i - 1;
    
    while (j >= 0 && compareFn(sorted[j], key) > 0) {
      sorted[j + 1] = sorted[j];
      j--;
    }
    sorted[j + 1] = key;
  }
  
  return sorted;
}

// ================================
// SEARCHING ALGORITHMS
// ================================

/**
 * Binary Search - Search in sorted array
 * Time Complexity: O(log n)
 * Space Complexity: O(1)
 */
export function binarySearch(arr, target, compareFn = (a, b) => a - b) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compareFn(arr[mid], target);
    
    if (comparison === 0) return mid;
    else if (comparison < 0) left = mid + 1;
    else right = mid - 1;
  }
  
  return -1;
}

/**
 * Linear Search - Simple sequential search
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
export function linearSearch(arr, target, compareFn = (a, b) => a - b) {
  for (let i = 0; i < arr.length; i++) {
    if (compareFn(arr[i], target) === 0) {
      return i;
    }
  }
  return -1;
}

/**
 * Jump Search - Search by jumping ahead by fixed steps
 * Time Complexity: O(√n)
 * Space Complexity: O(1)
 */
export function jumpSearch(arr, target, compareFn = (a, b) => a - b) {
  const n = arr.length;
  const step = Math.floor(Math.sqrt(n));
  let prev = 0;
  
  // Jump ahead until we find a larger element
  while (arr[Math.min(step, n) - 1] < target) {
    prev = step;
    step += Math.floor(Math.sqrt(n));
    if (prev >= n) return -1;
  }
  
  // Linear search in the identified block
  while (arr[prev] < target) {
    prev++;
    if (prev === Math.min(step, n)) return -1;
  }
  
  return compareFn(arr[prev], target) === 0 ? prev : -1;
}

/**
 * Interpolation Search - Better than binary for uniformly distributed data
 * Time Complexity: O(log log n) average, O(n) worst case
 * Space Complexity: O(1)
 */
export function interpolationSearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  
  while (low <= high && target >= arr[low] && target <= arr[high]) {
    if (low === high) {
      return arr[low] === target ? low : -1;
    }
    
    // Interpolation formula
    const pos = low + Math.floor(((target - arr[low]) / (arr[high] - arr[low])) * (high - low));
    
    if (arr[pos] === target) return pos;
    else if (arr[pos] < target) low = pos + 1;
    else high = pos - 1;
  }
  
  return -1;
}

// ================================
// GRAPH ALGORITHMS
// ================================

/**
 * Breadth-First Search - Graph traversal algorithm
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
export function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  visited.add(start);
  
  while (queue.length > 0) {
    const vertex = queue.shift();
    result.push(vertex);
    
    for (const neighbor of graph[vertex] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  return result;
}

/**
 * Depth-First Search - Graph traversal algorithm
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
export function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  const result = [start];
  
  for (const neighbor of graph[start] || []) {
    if (!visited.has(neighbor)) {
      result.push(...dfs(graph, neighbor, visited));
    }
  }
  
  return result;
}

/**
 * Dijkstra's Algorithm - Shortest path from single source
 * Time Complexity: O((V + E) log V)
 * Space Complexity: O(V)
 */
export function dijkstra(graph, start) {
  const distances = {};
  const previous = {};
  const unvisited = new Set();
  
  // Initialize distances
  for (const vertex in graph) {
    distances[vertex] = vertex === start ? 0 : Infinity;
    previous[vertex] = null;
    unvisited.add(vertex);
  }
  
  while (unvisited.size > 0) {
    // Find unvisited vertex with minimum distance
    let current = null;
    for (const vertex of unvisited) {
      if (current === null || distances[vertex] < distances[current]) {
        current = vertex;
      }
    }
    
    unvisited.delete(current);
    
    // Update distances to neighbors
    for (const neighbor in graph[current] || {}) {
      const alt = distances[current] + graph[current][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }
  
  return { distances, previous };
}

// ================================
// DYNAMIC PROGRAMMING
// ================================

/**
 * Longest Common Subsequence
 * Time Complexity: O(mn)
 * Space Complexity: O(mn)
 */
export function longestCommonSubsequence(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Knapsack Problem - 0/1 variant
 * Time Complexity: O(nW)
 * Space Complexity: O(nW)
 */
export function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  return dp[n][capacity];
}

/**
 * Fibonacci with memoization
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */
export function fibonacciMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 2) return 1;
  
  memo[n] = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo);
  return memo[n];
}

// ================================
// STRING ALGORITHMS
// ================================

/**
 * KMP String Search Algorithm
 * Time Complexity: O(n + m)
 * Space Complexity: O(m)
 */
export function kmpSearch(text, pattern) {
  const lps = computeLPS(pattern);
  const result = [];
  let i = 0; // index for text
  let j = 0; // index for pattern
  
  while (i < text.length) {
    if (pattern[j] === text[i]) {
      i++;
      j++;
    }
    
    if (j === pattern.length) {
      result.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && pattern[j] !== text[i]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }
  
  return result;
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
 * Rabin-Karp String Search Algorithm
 * Time Complexity: O(nm) worst case, O(n + m) average
 * Space Complexity: O(1)
 */
export function rabinKarpSearch(text, pattern) {
  const d = 256; // number of characters in alphabet
  const q = 101; // a prime number
  const m = pattern.length;
  const n = text.length;
  let patternHash = 0;
  let textHash = 0;
  let h = 1;
  const result = [];
  
  // Calculate h = pow(d, m-1) % q
  for (let i = 0; i < m - 1; i++) {
    h = (h * d) % q;
  }
  
  // Calculate hash value of pattern and first window of text
  for (let i = 0; i < m; i++) {
    patternHash = (d * patternHash + pattern.charCodeAt(i)) % q;
    textHash = (d * textHash + text.charCodeAt(i)) % q;
  }
  
  // Slide the pattern over text one by one
  for (let i = 0; i <= n - m; i++) {
    // Check if hash values match
    if (patternHash === textHash) {
      // Check characters one by one
      let j;
      for (j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) break;
      }
      if (j === m) result.push(i);
    }
    
    // Calculate hash for next window
    if (i < n - m) {
      textHash = (d * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
      if (textHash < 0) textHash += q;
    }
  }
  
  return result;
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Generate random array for testing
 */
export function generateRandomArray(size, min = 0, max = 100) {
  return Array.from({ length: size }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

/**
 * Check if array is sorted
 */
export function isSorted(arr, compareFn = (a, b) => a - b) {
  for (let i = 1; i < arr.length; i++) {
    if (compareFn(arr[i - 1], arr[i]) > 0) {
      return false;
    }
  }
  return true;
}

/**
 * Measure algorithm performance
 */
export function measurePerformance(fn, ...args) {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  return {
    result,
    duration: end - start,
    iterations: 1
  };
}

/**
 * Compare sorting algorithms
 */
export function compareSortingAlgorithms(arr) {
  const algorithms = {
    quickSort,
    mergeSort,
    heapSort,
    bubbleSort,
    insertionSort
  };
  
  const results = {};
  
  for (const [name, algorithm] of Object.entries(algorithms)) {
    const performance = measurePerformance(algorithm, arr);
    results[name] = {
      duration: performance.duration,
      sorted: isSorted(performance.result)
    };
  }
  
  return results;
}