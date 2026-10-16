# UniCore: Data Structures & Algorithms (DSA) Technical Specification

This document provides a deep-dive algorithmic specification for all **twelve classical Data Structures and Algorithms** implemented in UniCore. Each unit is documented with its problem context, theoretical invariants, step-by-step logic, pseudocode, JavaScript implementation, and asymptotic complexity analysis.

---

## Index of DSA Units

1. [Unit 1: Least Recently Used (LRU) Cache](#unit-1-least-recently-used-lru-cache)
2. [Unit 2: Dual-Stack Undo/Redo Engine](#unit-2-dual-stack-undoredo-engine)
3. [Unit 3: Circular Queue (Ring Buffer)](#unit-3-circular-queue-ring-buffer)
4. [Unit 4: Self-Balancing AVL Search Tree](#unit-4-self-balancing-avl-search-tree)
5. [Unit 5: Binary Min-Heap Priority Queue & Greedy Debt Simplification](#unit-5-binary-min-heap-priority-queue--greedy-debt-simplification)
6. [Unit 6: Prefix Trie for Real-Time Autocomplete](#unit-6-prefix-trie-for-real-time-autocomplete)
7. [Unit 7: Inverted Hash Table & Bloom Filter](#unit-7-inverted-hash-table--bloom-filter)
8. [Unit 8: Weighted Graph & Dijkstra's Shortest Path Algorithm](#unit-8-weighted-graph--dijkstras-shortest-path-algorithm)
9. [Unit 9: Directed Acyclic Graph (DAG) & Kahn's Topological Sort](#unit-9-directed-acyclic-graph-dag--kahns-topological-sort)
10. [Unit 10: Disjoint Set Union (Union-Find) with Rank & Path Compression](#unit-10-disjoint-set-union-union-find-with-rank--path-compression)
11. [Unit 11: 0/1 Knapsack Dynamic Programming Optimizer](#unit-11-01-knapsack-dynamic-programming-optimizer)
12. [Unit 12: Levenshtein Edit Distance & Huffman Prefix Coding](#unit-12-levenshtein-edit-distance--huffman-prefix-coding)

---

## Unit 1: Least Recently Used (LRU) Cache

### Context & Purpose
When students browse through their library of study notes, repeatedly querying the storage engine causes redundant rendering cycles. The LRU Cache maintains the most frequently accessed notes in fast volatile memory while strictly capping memory footprint at capacity $C = 5$.

### Data Structure Architecture
- **Doubly Linked List:** Two sentinel nodes (`head` and `tail`).
- **Hash Map:** Maps note `id` to the Doubly Linked List node reference.
- **Invariants:**
  - `head.next` always points to the Most Recently Used (MRU) item.
  - `tail.prev` always points to the Least Recently Used (LRU) item.
  - Every eviction removes `tail.prev` in $O(1)$ operations.

```
[head] <-> [Node: OS Notes] <-> [Node: DBMS] <-> [Node: Graphs] <-> [tail]
 (MRU)                                                               (LRU)
```

### Algorithmic Mechanics
```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = { next: null };
    this.tail = { prev: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  detach(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  front(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
  get(key) {
    const node = this.map.get(key);
    if (!node) return null;
    this.detach(node);
    this.front(node);
    return node.value;
  }
  put(key, value) {
    let node = this.map.get(key);
    if (node) {
      node.value = value;
      this.detach(node);
    } else {
      node = { key, value, prev: null, next: null };
      this.map.set(key, node);
    }
    this.front(node);
    if (this.map.size > this.capacity) {
      const old = this.tail.prev;
      this.detach(old);
      this.map.delete(old.key);
    }
  }
}
```

### Complexity
- **Time:** `get(k)`: $O(1)$, `put(k, v)`: $O(1)$, `evict()`: $O(1)$.
- **Space:** $O(C)$ where $C$ is the maximum cache size.

---

## Unit 2: Dual-Stack Undo/Redo Engine

### Context & Purpose
Provides non-destructive editing throughout the student OS. If a student mistakenly deletes an expense, completes a task, or updates note text, they can instantly revert state via `Ctrl + Z` or redo via `Ctrl + Shift + Z`.

### Invariants & State Transitions
- Stacks: `undo = []` and `redo = []`.
- When an action is committed:
  - `undo.push(serialize(stateBefore))`
  - `redo.length = 0` (history branching is truncated).
- On Undo:
  - `redo.push(serialize(currentState))`
  - `currentState = deserialize(undo.pop())`
- On Redo:
  - `undo.push(serialize(currentState))`
  - `currentState = deserialize(redo.pop())`

### Complexity
- **Time:** $O(1)$ amortized per push/pop.
- **Space:** $O(S \cdot K)$ where $S$ is history depth and $K$ is state size.

---

## Unit 3: Circular Queue (Ring Buffer)

### Context & Purpose
Students using the Pomodoro technique rotate between study sessions and breaks (e.g., *Study 25m* $\to$ *Short Break 5m* $\to$ *Study 25m* $\to$ *Long Break 15m*). Standard array shift operations take $O(N)$ time. The circular queue achieves $O(1)$ rotation without reallocating or shifting array elements.

### Mathematical Formulation
Given an array `items` of length $N$ and a `head` index:
$$\text{rotate}(): \quad \text{head} \leftarrow (\text{head} + 1) \pmod N$$
$$\text{itemAt}(i): \quad \text{items}[(\text{head} + i) \pmod N]$$

```javascript
class CircularQueue {
  constructor(items = []) {
    this.items = items.slice();
    this.head = 0;
  }
  size() { return this.items.length; }
  peek() { return this.size() ? this.items[this.head] : null; }
  rotate() {
    if (this.size()) this.head = (this.head + 1) % this.size();
    return this.peek();
  }
  enqueue(item) { this.items.push(item); return this.size(); }
  removeAt(i) {
    if (i < 0 || i >= this.items.length) return null;
    const actual = (this.head + i) % this.items.length;
    const item = this.items.splice(actual, 1)[0];
    if (!this.items.length) this.head = 0;
    else if (actual < this.head) this.head--;
    else if (this.head >= this.items.length) this.head = 0;
    return item;
  }
}
```

### Complexity
- **Rotate / Peek / Enqueue:** $O(1)$
- **Remove At Arbitrary Index:** $O(N)$

---

## Unit 4: Self-Balancing AVL Search Tree

### Context & Purpose
The student expenses module allows filtering transactions by minimum and maximum currency amounts (e.g. ₹50 to ₹350). In an unindexed array, range queries require an $O(N)$ linear scan. The AVL tree guarantees strict height balance:
$$\text{height} \le 1.44 \log_2(N + 2)$$
ensuring all search and insert operations execute in $O(\log N)$ time.

### Tree Balancing Invariant
$$\text{Balance Factor } BF(Node) = \text{height}(Node.left) - \text{height}(Node.right) \in \{-1, 0, +1\}$$

### Rotation Cases
1. **Left-Left (LL):** Single Right Rotation on $Y$:
   ```
       Y                X
      / \              / \
     X   c   ==>      a   Y
    / \                  / \
   a   b                b   c
   ```
2. **Right-Right (RR):** Single Left Rotation on $X$.
3. **Left-Right (LR):** Left Rotation on $X$, then Right Rotation on $Y$.
4. **Right-Left (RL):** Right Rotation on $Y$, then Left Rotation on $X$.

### Range Query Algorithm
```javascript
range(node, low, high, results = []) {
  if (!node) return results;
  if (node.key > low) this.range(node.left, low, high, results);
  if (node.key >= low && node.key <= high) results.push(...node.values);
  if (node.key < high) this.range(node.right, low, high, results);
  return results;
}
```

### Complexity
- **Insert:** $O(\log N)$
- **Range Search:** $O(\log N + K)$ where $K$ is the number of results found.
- **Space:** $O(N)$

---

## Unit 5: Binary Min-Heap Priority Queue & Greedy Debt Simplification

### Context & Purpose
1. **Deadlines Queue:** Finding the earliest due date in $O(1)$ time.
2. **Group Debt Settlement:** When a student group shares expenses (canteen meals, hostel groceries, trip cabs), debts create complex cycles. UniCore simplifies balances using two priority heaps.

### Min-Heap Mechanics
Array representation:
- Parent: $\lfloor (i - 1) / 2 \rfloor$
- Left Child: $2i + 1$
- Right Child: $2i + 2$
- Sift-Up on `push`: $O(\log N)$
- Sift-Down on `pop`: $O(\log N)$

### Greedy Debt Simplification Algorithm
1. Compute net balance $B_i$ for each student:
   $$B_i = \text{total\_paid}_i - \text{fair\_share}_i$$
2. Separate into two sets:
   - **Creditors:** $B_i > 0$ (inserted into Max-Heap by amount).
   - **Debtors:** $B_i < 0$ (inserted into Min-Heap by absolute debt).
3. While both heaps are non-empty:
   - Pop maximum creditor $C$ and maximum debtor $D$.
   - Settle transfer $T = \min(C.\text{amount}, D.\text{amount})$.
   - Output: `$D.name pays $C.name ₹$T`.
   - Re-insert any remainder back into the appropriate heap.
4. **Result:** Reduces arbitrary complex web of debts among $P$ people to at most $P - 1$ simple payments.

---

## Unit 6: Prefix Trie for Real-Time Autocomplete

### Context & Purpose
Powers the global command palette (`Ctrl + K`). As the user types each character, the Trie navigates character edges directly, returning matching notes and actions with zero noticeable delay.

### Architecture
Each `TrieNode` contains:
- `children`: JavaScript `Map<Character, TrieNode>`
- `items`: Array of document references matching this prefix.

### Algorithm
```javascript
search(prefix) {
  let node = this.root;
  for (const char of prefix.toLowerCase()) {
    node = node.children.get(char);
    if (!node) return [];
  }
  return node.items;
}
```

### Complexity
- **Search Time:** $O(L)$ where $L = \text{prefix length}$. Completely independent of catalog size $N$.
- **Space:** $O(\Sigma \cdot N \cdot \bar{L})$ where $\Sigma$ is alphabet size and $\bar{L}$ is average word length.

---

## Unit 7: Inverted Hash Table & Bloom Filter

### Context & Purpose
Enables full-text keyword search across all notes while preventing duplicate keyword indexing using a probabilistic Bloom filter filter-gate.

### Hash Table Architecture
- Bucket count: $M = 53$ (prime number to distribute bucket collisions).
- FNV-1a Hash Algorithm:
  $$h \leftarrow 2166136261$$
  $$\forall c \in \text{key}: \quad h \leftarrow (h \oplus \text{code}(c)) \times 16777619$$
  $$\text{bucket} = (h \ggg 0) \pmod M$$

### Bloom Filter Mathematics
- Bit array size $m = 256$ bits.
- Number of independent hash functions $k = 2$.
- Zero False Negatives: If `has(word)` is `false`, the keyword is guaranteed not to exist.

---

## Unit 8: Weighted Graph & Dijkstra's Shortest Path Algorithm

### Context & Purpose
Computes the optimal walking route between campus landmarks (Hostel $\to$ Library $\to$ Engineering Block $\to$ Cafeteria).

### Algorithm
1. Initialize $\text{dist}[\text{start}] = 0$, all other distances $\infty$.
2. Maintain a Min-Priority Heap storing `{vertex, distance}`.
3. Extract minimum distance vertex $u$. For each neighbor $v$ connected via edge weight $w$:
   $$\text{if } \text{dist}[u] + w < \text{dist}[v]: \quad \text{dist}[v] \leftarrow \text{dist}[u] + w, \quad \text{prev}[v] \leftarrow u$$
4. Reconstruct path by following `prev` pointers backwards.

### Complexity
- **Time:** $O((V + E) \log V)$ using MinHeap.
- **Space:** $O(V + E)$ for adjacency list.

---

## Unit 9: Directed Acyclic Graph (DAG) & Kahn's Topological Sort

### Context & Purpose
University syllabi have strict prerequisites (e.g., *Data Structures* requires *Programming Basics*, *Algorithms* requires *Data Structures*). Kahn's algorithm outputs a valid sequence to study topics without prerequisite violations.

### Algorithm
1. Calculate in-degree for all vertices $v \in V$:
   $$\text{in\_degree}[v] = |\{u \mid (u, v) \in E\}|$$
2. Initialize queue $Q$ with all vertices having $\text{in\_degree} = 0$.
3. While $Q$ is not empty:
   - Dequeue $u$, append $u$ to `order`.
   - For each neighbor $v$ of $u$: decrement $\text{in\_degree}[v]$. If $\text{in\_degree}[v] = 0$, enqueue $v$.
4. **Cycle Detection:** If $\text{order.length} \neq |V|$, the syllabus graph has a cyclic dependency.

### Complexity
- **Time:** $O(V + E)$
- **Space:** $O(V + E)$

---

## Unit 10: Disjoint Set Union (Union-Find) with Rank & Path Compression

### Context & Purpose
Manages student study groups and project teams, determining whether two students belong to the same collaborative cluster.

### Two Key Optimizations
1. **Path Compression (during `find`):**
   ```javascript
   find(x) {
     if (this.parent.get(x) !== x) {
       this.parent.set(x, this.find(this.parent.get(x))); // flattens tree
     }
     return this.parent.get(x);
   }
   ```
2. **Union by Rank (during `union`):** Attaches smaller tree to the root of the larger tree.

### Complexity
- **Amortized Time per Operation:** $O(\alpha(N))$ where $\alpha$ is the Inverse Ackermann Function ($\alpha(10^{80}) < 5$). Practically $O(1)$.

---

## Unit 11: 0/1 Knapsack Dynamic Programming Optimizer

### Context & Purpose
When planning a day, a student often has a fixed window of free time (e.g., $W = 240$ minutes) and many competing tasks. Each task has:
- Time cost: $w_i$ (minutes)
- Value / Priority: $v_i$ (points)

### DP Formulation
$$\text{DP}[w] = \max_{i} (\text{DP}[w], \text{DP}[w - w_i] + v_i) \quad \text{for } w = W \text{ down to } w_i$$

By iterating backwards, UniCore optimizes space to a single 1D array of size $W + 1$. A parallel boolean matrix `take[i][w]` reconstructs the exact subset of chosen tasks.

### Complexity
- **Time:** $O(N \cdot W)$ where $N$ is task count and $W = 240$.
- **Space:** $O(N \cdot W)$ for backtracking selection matrix.

---

## Unit 12: Levenshtein Edit Distance & Huffman Prefix Coding

### 12.1 Levenshtein Distance (Typo Tolerance)
When prefix trie search returns no exact matches, the system calculates the minimum character insertions, deletions, and substitutions to find closest matches:
$$D[i, j] = \begin{cases} 
\max(i, j) & \text{if } \min(i, j) = 0 \\
\min \begin{cases} D[i-1, j] + 1 \\ D[i, j-1] + 1 \\ D[i-1, j-1] + [a_i \neq b_j] \end{cases} & \text{otherwise}
\end{cases}$$

### 12.2 Huffman Prefix Coding (Lossless Note Archive)
Compresses text notes into variable-length binary prefix codes based on character frequencies:
1. Build frequency map of characters.
2. Insert characters into binary priority queue.
3. Iteratively pop two lowest-frequency nodes, merge into a parent node, and reinsert.
4. Walk tree to assign `'0'` (left) and `'1'` (right) prefix codes.

---

## Big-O Complexity Comparison Matrix

| Module | Data Structure / Algorithm | Access / Peek | Search | Insert / Enqueue | Delete / Dequeue | Space |
|---|---|---|---|---|---|---|
| **Unit 1** | LRU Cache | $O(1)$ | $O(1)$ | $O(1)$ | $O(1)$ | $O(C)$ |
| **Unit 2** | Dual-Stack UndoStack | $O(1)$ | — | $O(1)$ amortized | $O(1)$ | $O(S)$ |
| **Unit 3** | Circular Queue | $O(1)$ | $O(N)$ | $O(1)$ amortized | $O(1)$ | $O(N)$ |
| **Unit 4** | AVL Tree | — | $O(\log N)$ | $O(\log N)$ | $O(\log N)$ | $O(N)$ |
| **Unit 5** | Binary Min-Heap | $O(1)$ | $O(N)$ | $O(\log N)$ | $O(\log N)$ | $O(N)$ |
| **Unit 6** | Character Prefix Trie | — | $O(L)$ | $O(L)$ | $O(L)$ | $O(\Sigma \cdot N)$ |
| **Unit 7** | Hash Table + Bloom Filter | — | $O(1)$ avg | $O(1)$ avg | $O(1)$ avg | $O(W + m)$ |
| **Unit 8** | Dijkstra + Min-Heap | — | $O((V+E)\log V)$| — | — | $O(V + E)$ |
| **Unit 9** | Kahn's TopoSort | — | $O(V + E)$ | — | — | $O(V + E)$ |
| **Unit 10**| Disjoint Set Union | $O(1)$ | $O(\alpha(N))$ | $O(\alpha(N))$ | — | $O(N)$ |
| **Unit 11**| 0/1 Knapsack DP | — | $O(N \cdot W)$ | — | — | $O(W)$ |
| **Unit 12**| Levenshtein + Huffman | — | $O(M \cdot N)$ | $O(K \log K)$ | — | $O(M \cdot N)$ |
