/* UniCore: small, readable DSA implementations powering a local-first student OS. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];const uid=()=>Math.random().toString(36).slice(2,9);const today=new Date();const dateLabel=today.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric',year:'numeric'});$('#today-date').textContent=dateLabel;$('#dashboard-date').innerHTML=`<span class="sun-icon">✳</span> ${today.toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'}).toUpperCase()}`;// Unit 1: doubly linked list + hash map gives O(1) LRU lookups and eviction.
class LRUCache{constructor(capacity){this.capacity=capacity;this.map=new Map();this.head={next:null};this.tail={prev:null};this.head.next=this.tail;this.tail.prev=this.head}detach(n){n.prev.next=n.next;n.next.prev=n.prev}front(n){n.next=this.head.next;n.prev=this.head;this.head.next.prev=n;this.head.next=n}get(key){const n=this.map.get(key);if(!n)return null;this.detach(n);this.front(n);return n.value}put(key,value){let n=this.map.get(key);if(n){n.value=value;this.detach(n)}else{n={key,value,prev:null,next:null};this.map.set(key,n)}this.front(n);if(this.map.size>this.capacity){const old=this.tail.prev;this.detach(old);this.map.delete(old.key)}}keys(){let out=[],n=this.head.next;while(n!==this.tail){out.push(n.key);n=n.next}return out}clear(){this.map.clear();this.head.next=this.tail;this.tail.prev=this.head}}// Unit 2: dual-stack undo/redo history. Each meaningful mutation snapshots local state.
class UndoStack{constructor(){this.undo=[];this.redo=[]}push(snapshot){this.undo.push(snapshot);this.redo=[]}stepBack(current){if(!this.undo.length)return null;this.redo.push(current);return this.undo.pop()}stepForward(current){if(!this.redo.length)return null;this.undo.push(current);return this.redo.pop()}}// Unit 3: circular queue rotates focus blocks without shifting array contents.
class CircularQueue{constructor(items=[]){this.items=items.slice();this.head=0}size(){return this.items.length}peek(){return this.size()?this.items[this.head]:null}rotate(){if(this.size())this.head=(this.head+1)%this.size();return this.peek()}enqueue(item){this.items.push(item);return this.size()}remove(){if(!this.size())return null;const item=this.items.splice(this.head,1)[0];if(this.head>=this.size())this.head=0;return item}removeAt(i){if(i<0||i>=this.items.length)return null;const actual=(this.head+i)%this.items.length;const item=this.items.splice(actual,1)[0];if(!this.items.length)this.head=0;else if(actual<this.head)this.head--;else if(this.head>=this.items.length)this.head=0;return item}toArray(){return this.items.map((_,i)=>this.items[(this.head+i)%this.items.length])}}// Unit 4: AVL index maintains ordered expense amounts for O(log N) insert/search.
class AVLNode{constructor(key,value){this.key=key;this.values=[value];this.height=1;this.left=null;this.right=null}}class AVLTree{height(n){return n?n.height:0}fix(n){n.height=1+Math.max(this.height(n.left),this.height(n.right));return n}rotateRight(y){const x=y.left,t=x.right;x.right=y;y.left=t;this.fix(y);return this.fix(x)}rotateLeft(x){const y=x.right,t=y.left;y.left=x;x.right=t;this.fix(x);return this.fix(y)}insert(n,key,value){if(!n)return new AVLNode(key,value);if(key<n.key)n.left=this.insert(n.left,key,value);else if(key>n.key)n.right=this.insert(n.right,key,value);else{n.values.push(value);return n}this.fix(n);const b=this.height(n.left)-this.height(n.right);if(b>1&&key<n.left.key)return this.rotateRight(n);if(b< -1&&key>n.right.key)return this.rotateLeft(n);if(b>1&&key>n.left.key){n.left=this.rotateLeft(n.left);return this.rotateRight(n)}if(b< -1&&key<n.right.key){n.right=this.rotateRight(n.right);return this.rotateLeft(n)}return n}range(n,lo,hi,out=[]){if(!n)return out;if(n.key>lo)this.range(n.left,lo,hi,out);if(n.key>=lo&&n.key<=hi)out.push(...n.values);if(n.key<hi)this.range(n.right,lo,hi,out);return out}}// Unit 5: binary min-heap for nearest due dates; heap operations are O(log N).
class MinHeap{constructor(cmp=(a,b)=>a-b){this.a=[];this.cmp=cmp}push(x){this.a.push(x);let i=this.a.length-1;while(i){let p=(i-1)>>1;if(this.cmp(this.a[p],x)<=0)break;this.a[i]=this.a[p];i=p}this.a[i]=x}pop(){if(!this.a.length)return null;const root=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(true){let l=2*i+1,r=l+1,m=i;if(l<this.a.length&&this.cmp(this.a[l],this.a[m])<0)m=l;if(r<this.a.length&&this.cmp(this.a[r],this.a[m])<0)m=r;if(m===i)break;this.a[i]=this.a[m];i=m}this.a[i]=last}return root}sorted(){return this.a.slice().sort(this.cmp)}}// Unit 6: prefix trie supports character-by-character command autocomplete.
class TrieNode{constructor(){this.children=new Map();this.items=[]}}class Trie{constructor(){this.root=new TrieNode()}insert(word,item){let n=this.root;for(const c of word.toLowerCase()){if(!n.children.has(c))n.children.set(c,new TrieNode());n=n.children.get(c);if(!n.items.some(x=>x.id===item.id))n.items.push(item)}}search(prefix){let n=this.root;for(const c of prefix.toLowerCase()){n=n.children.get(c);if(!n)return []}return n.items}}// Unit 7: chained hash table inverted index, paired with a tiny Bloom filter.
class HashTable{constructor(size=53){this.buckets=Array.from({length:size},()=>[])}hash(key){let h=2166136261;for(const c of key){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0)%this.buckets.length}set(k,v){const b=this.buckets[this.hash(k)],p=b.find(x=>x[0]===k);if(p)p[1]=v;else b.push([k,v])}get(k){const p=this.buckets[this.hash(k)].find(x=>x[0]===k);return p?p[1]:null}}class BloomFilter{constructor(size=256){this.bits=new Uint8Array(size);this.size=size}indexes(s){const h1=this.hash(s,2166136261),h2=this.hash(s,2246822519);return[h1%this.size,h2%this.size]}hash(s,seed){let h=seed;for(const c of s.toLowerCase()){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}add(s){this.indexes(s).forEach(i=>this.bits[i]=1)}has(s){return this.indexes(s).every(i=>this.bits[i])}}// Unit 8: weighted graph + Dijkstra with a min-priority heap.
class Graph{constructor(){this.edges=new Map()}add(a,b,w){if(!this.edges.has(a))this.edges.set(a,[]);if(!this.edges.has(b))this.edges.set(b,[]);this.edges.get(a).push({to:b,w});this.edges.get(b).push({to:a,w})}shortest(start,end){const dist=new Map([[start,0]]),prev=new Map(),heap=new MinHeap((a,b)=>a.d-b.d);heap.push({v:start,d:0});let visits=0;while(heap.a.length){const cur=heap.pop();if(cur.d!==dist.get(cur.v))continue;visits++;if(cur.v===end)break;for(const e of this.edges.get(cur.v)||[]){const nd=cur.d+e.w;if(nd<(dist.get(e.to)??Infinity)){dist.set(e.to,nd);prev.set(e.to,cur.v);heap.push({v:e.to,d:nd})}}}if(!dist.has(end))return null;let path=[end],p=end;while(p!==start){p=prev.get(p);if(!p)return null;path.unshift(p)}return{path,distance:dist.get(end),visits}}}// Unit 9: Kahn's topological sort orders prerequisite-dependent chapters.
function topological(nodes,edges){const indegree=new Map(nodes.map(n=>[n,0])),adj=new Map(nodes.map(n=>[n,[]]));for(const[a,b]of edges){adj.get(a).push(b);indegree.set(b,indegree.get(b)+1)}const q=nodes.filter(n=>indegree.get(n)===0),out=[];while(q.length){const n=q.shift();out.push(n);for(const m of adj.get(n)){indegree.set(m,indegree.get(m)-1);if(indegree.get(m)===0)q.push(m)}}return{order:out,hasCycle:out.length!==nodes.length}}// Unit 10: union-find with path compression and union by rank for group checks.
class UnionFind{constructor(items){this.parent=new Map(items.map(x=>[x,x]));this.rank=new Map(items.map(x=>[x,0]))}find(x){if(!this.parent.has(x)){this.parent.set(x,x);this.rank.set(x,0)}if(this.parent.get(x)!==x)this.parent.set(x,this.find(this.parent.get(x)));return this.parent.get(x)}union(a,b){let x=this.find(a),y=this.find(b);if(x===y)return false;if(this.rank.get(x)<this.rank.get(y))[x,y]=[y,x];this.parent.set(y,x);if(this.rank.get(x)===this.rank.get(y))this.rank.set(x,this.rank.get(x)+1);return true}connected(a,b){return this.find(a)===this.find(b)}}// Unit 11: 0/1 knapsack finds the highest-value selection within free minutes.
function knapsack(items,capacity){let dp=Array(capacity+1).fill(0),take=Array.from({length:items.length},()=>Array(capacity+1).fill(false));items.forEach((it,i)=>{for(let w=capacity;w>=it.time;w--)if(dp[w-it.time]+it.value>dp[w]){dp[w]=dp[w-it.time]+it.value;take[i][w]=true}});let chosen=[],w=capacity;for(let i=items.length-1;i>=0;i--)if(take[i][w]){chosen.push(items[i]);w-=items[i].time}return{chosen:chosen.reverse(),value:dp[capacity]}}// Edit distance gives fuzzy title matching when prefix search has no exact hits.
function editDistance(a,b){a=a.toLowerCase();b=b.toLowerCase();let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length]}// Unit 12: Huffman prefix codes; archive download is a compact JSON .huff payload.
function huffman(text){if(!text)return{data:'',codes:{},bits:0};const freq=new Map();for(const c of text)freq.set(c,(freq.get(c)||0)+1);let nodes=[...freq].map(([ch,f])=>({ch,f,left:null,right:null}));while(nodes.length>1){nodes.sort((a,b)=>a.f-b.f);const l=nodes.shift(),r=nodes.shift();nodes.push({ch:null,f:l.f+r.f,left:l,right:r})}const codes={};function walk(n,p){if(n.ch!==null){codes[n.ch]=p||'0';return}walk(n.left,p+'0');walk(n.right,p+'1')}walk(nodes[0],'');let bits='';for(const c of text)bits+=codes[c];return{data:bits,codes,bits:bits.length}}
function toDateKey(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDemoWeekTasks() {
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const d = (dayOffset) => {
    const target = new Date(monday);
    target.setDate(monday.getDate() + dayOffset);
    return toDateKey(target);
  };

  return [
    // Monday
    { id: 't-mon-1', title: 'Computer Networks Lecture', time: '08:30', duration: 60, date: d(0), tag: 'Class', done: true },
    { id: 't-mon-2', title: 'Data Structures Lab — Trees & Graphs', time: '10:00', duration: 90, date: d(0), tag: 'Class', done: true },
    { id: 't-mon-3', title: 'Cafeteria Lunch', time: '12:00', duration: 45, date: d(0), tag: 'Break', done: true },
    { id: 't-mon-4', title: 'Operating Systems: Process Synchronization', time: '13:30', duration: 60, date: d(0), tag: 'Study', done: true },
    { id: 't-mon-5', title: 'Library Reading: DBMS Chapter 3', time: '15:30', duration: 45, date: d(0), tag: 'Study', done: true },
    { id: 't-mon-6', title: 'Evening Walk & Coffee', time: '17:00', duration: 30, date: d(0), tag: 'Break', done: true },

    // Tuesday
    { id: 't-tue-1', title: 'Discrete Mathematics — Combinatorics', time: '09:00', duration: 50, date: d(1), tag: 'Class', done: true },
    { id: 't-tue-2', title: 'DBMS Lecture — Relational Algebra & SQL', time: '10:30', duration: 60, date: d(1), tag: 'Class', done: true },
    { id: 't-tue-3', title: 'Lunch with Study Group', time: '12:00', duration: 50, date: d(1), tag: 'Break', done: true },
    { id: 't-tue-4', title: 'Algorithm Practice — LeetCode Trees', time: '13:45', duration: 75, date: d(1), tag: 'Study', done: true },
    { id: 't-tue-5', title: 'Software Engineering Discussion', time: '15:30', duration: 45, date: d(1), tag: 'Class', done: true },
    { id: 't-tue-6', title: 'Review Discrete Math Formulas', time: '17:00', duration: 40, date: d(1), tag: 'Study', done: true },

    // Wednesday
    { id: 't-wed-1', title: 'Operating Systems Lecture — Memory Management', time: '09:30', duration: 60, date: d(2), tag: 'Class', done: true },
    { id: 't-wed-2', title: 'Computer Networks — TCP Socket Lab', time: '11:00', duration: 75, date: d(2), tag: 'Class', done: true },
    { id: 't-wed-3', title: 'Lunch Break at Central Lawn', time: '12:45', duration: 45, date: d(2), tag: 'Break', done: true },
    { id: 't-wed-4', title: 'DBMS Assignment Coding — Normalization', time: '14:00', duration: 90, date: d(2), tag: 'Study', done: true },
    { id: 't-wed-5', title: 'Peer Review Session: OS Checkpoint', time: '16:00', duration: 50, date: d(2), tag: 'Study', done: true },
    { id: 't-wed-6', title: 'Badminton with Nikhil & Kabir', time: '18:00', duration: 60, date: d(2), tag: 'Personal', done: true },

    // Thursday
    { id: 't-thu-1', title: 'Theory of Computation & Automata', time: '08:45', duration: 60, date: d(3), tag: 'Class', done: true },
    { id: 't-thu-2', title: 'Data Structures — AVL Rotations & Heaps', time: '10:15', duration: 60, date: d(3), tag: 'Class', done: true },
    { id: 't-thu-3', title: 'Quick Canteen Snack', time: '11:45', duration: 30, date: d(3), tag: 'Break', done: true },
    { id: 't-thu-4', title: 'Revise Graph Algorithms — Dijkstra & Prim\'s', time: '13:00', duration: 70, date: d(3), tag: 'Study', done: true },
    { id: 't-thu-5', title: 'Web Dev & API Design Workshop', time: '15:00', duration: 60, date: d(3), tag: 'Study', done: true },
    { id: 't-thu-6', title: 'Club Meeting: Techfest Organizing Team', time: '17:00', duration: 60, date: d(3), tag: 'Personal', done: true },

    // Friday (Today)
    { id: 't1', title: 'Review Operating Systems', time: '09:00', duration: 50, date: d(4), tag: 'Study', done: true },
    { id: 't2', title: 'Data Structures lecture', time: '10:00', duration: 60, date: d(4), tag: 'Class', done: false },
    { id: 't3', title: 'Finish DBMS assignment', time: '11:30', duration: 60, date: d(4), tag: 'Study', done: false },
    { id: 't4', title: 'Lunch break', time: '13:00', duration: 45, date: d(4), tag: 'Break', done: false },
    { id: 't5', title: 'Revise graph algorithms', time: '14:30', duration: 50, date: d(4), tag: 'Study', done: false },
    { id: 't-fri-6', title: 'Hackathon Prep & Team Sync', time: '16:00', duration: 60, date: d(4), tag: 'Study', done: false },

    // Saturday
    { id: 't-sat-1', title: 'Weekend Deep Work — OS Checkpoint Project', time: '10:00', duration: 90, date: d(5), tag: 'Study', done: false },
    { id: 't-sat-2', title: 'Brunch & Recharge', time: '12:00', duration: 60, date: d(5), tag: 'Break', done: false },
    { id: 't-sat-3', title: 'Data Structures Quiz Preparation', time: '13:30', duration: 75, date: d(5), tag: 'Study', done: false },
    { id: 't-sat-4', title: 'Competitive Programming Contest Practice', time: '15:30', duration: 90, date: d(5), tag: 'Study', done: false },
    { id: 't-sat-5', title: 'Campus Walk & Evening Chill', time: '18:00', duration: 60, date: d(5), tag: 'Personal', done: false },

    // Sunday
    { id: 't-sun-1', title: 'Weekly Review & Semester Goal Planning', time: '10:30', duration: 45, date: d(6), tag: 'Personal', done: false },
    { id: 't-sun-2', title: 'DBMS Assignment Final Submission Polish', time: '11:30', duration: 60, date: d(6), tag: 'Study', done: false },
    { id: 't-sun-3', title: 'Family Call & Sunday Lunch', time: '13:00', duration: 60, date: d(6), tag: 'Break', done: false },
    { id: 't-sun-4', title: 'Discrete Math Midterm Formula Sheet Compilation', time: '15:00', duration: 75, date: d(6), tag: 'Study', done: false },
    { id: 't-sun-5', title: 'Organize Study Notes & Plan Week Ahead', time: '17:00', duration: 40, date: d(6), tag: 'Study', done: false },
    { id: 't-sun-6', title: 'Read Sci-Fi Novel / Relax', time: '19:00', duration: 50, date: d(6), tag: 'Personal', done: false }
  ];
}

const STORE='unicore-v1',DEMO_STORE='unicore-demo-v1';const seed={notes:[{id:'n1',title:'Data Structures — Trees',folder:'Data Structures',color:'green',text:'Binary search trees keep values in sorted order. AVL trees maintain balance by rotations after insertions and deletions. Balance factor is height(left) − height(right).',updated:'12 min ago',star:true},{id:'n2',title:'Operating Systems · Unit 3',folder:'Operating Systems',color:'purple',text:'Processes, threads, scheduling algorithms, and synchronization notes. Compare FCFS, SJF and round robin.',updated:'Yesterday',star:false},{id:'n3',title:'DBMS — Normalization',folder:'Database Systems',color:'orange',text:'Normal forms reduce redundancy. 1NF atomic values, 2NF no partial dependency, 3NF no transitive dependency.',updated:'Oct 14',star:false},{id:'n4',title:'Discrete Math formulas',folder:'Mathematics',color:'blue',text:'Relations, functions, graph theory and combinatorics formula sheet for the midterm.',updated:'Oct 12',star:true},{id:'n5',title:'Computer Networks — TCP/IP',folder:'Computer Networks',color:'teal',text:'TCP is reliable and connection oriented. UDP is connectionless. Layers: application, transport, internet, link.',updated:'Oct 10',star:false}],tasks:buildDemoWeekTasks(),monthlyBudget:8000,expenses:[{id:'e1',title:'Lunch at Green Bowl',category:'Food & drink',date:'2026-10-16',amount:180,icon:'♨'},{id:'e2',title:'Auto to campus',category:'Travel',date:'2026-10-15',amount:90,icon:'↗'},{id:'e3',title:'Lab record notebook',category:'Study',date:'2026-10-14',amount:240,icon:'▤'},{id:'e4',title:'Coffee with Riya',category:'Food & drink',date:'2026-10-13',amount:120,icon:'☕'},{id:'e5',title:'Metro card recharge',category:'Travel',date:'2026-10-12',amount:500,icon:'↗'},{id:'e6',title:'Print assignment',category:'Study',date:'2026-10-10',amount:65,icon:'▤'}],deadlines:[{id:'d1',title:'DBMS assignment due',date:'2026-10-18',meta:'Database Systems · 11:59 PM',priority:1},{id:'d2',title:'Data Structures quiz',date:'2026-10-20',meta:'Trees & Graphs · 10:00 AM',priority:2},{id:'d3',title:'OS project checkpoint',date:'2026-10-23',meta:'Operating Systems · 5:00 PM',priority:3}],queue:[{name:'Study · Operating Systems',minutes:25,type:'focus'},{name:'Short break',minutes:5,type:'break'},{name:'Study · Data Structures',minutes:25,type:'focus'}]};let data;try{const legacy=localStorage.getItem(STORE);if(legacy&&!localStorage.getItem(DEMO_STORE))localStorage.setItem(DEMO_STORE,legacy);data=JSON.parse(localStorage.getItem(DEMO_STORE))||structuredClone(seed)}catch{data=structuredClone(seed)}if(!data.tasks||!data.tasks.some(t=>t.date)||data.tasks.length<=6){data.tasks=buildDemoWeekTasks();try{localStorage.setItem(DEMO_STORE,JSON.stringify(data))}catch{}}
// PDF storage and viewer helpers
const pdfDb = {
  _db: null,
  async getDb() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('unicore_pdf_files', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs');
      };
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onerror = () => reject(req.error);
    });
  },
  async get(id) {
    try {
      const db = await this.getDb();
      return new Promise(resolve => {
        const tx = db.transaction('pdfs', 'readonly');
        const req = tx.objectStore('pdfs').get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch { return null; }
  },
  async set(id, val) {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('pdfs', 'readwrite');
        const req = tx.objectStore('pdfs').put(val, id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch { return false; }
  },
  async delete(id) {
    try {
      const db = await this.getDb();
      return new Promise(resolve => {
        const tx = db.transaction('pdfs', 'readwrite');
        const req = tx.objectStore('pdfs').delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch { return false; }
  }
};

function download(name, content, type = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function dataUrlToBlobUrl(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('blob:')) return dataUrl;
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Blob URL creation error:', e);
    return null;
  }
}

function downloadPdf(fileName, dataUrlOrBlob) {
  let url = '';
  let revoke = false;
  if (typeof dataUrlOrBlob === 'string' && dataUrlOrBlob.startsWith('data:')) {
    url = dataUrlToBlobUrl(dataUrlOrBlob);
    revoke = true;
  } else if (typeof dataUrlOrBlob === 'string') {
    url = dataUrlOrBlob;
  } else if (dataUrlOrBlob instanceof Blob) {
    url = URL.createObjectURL(dataUrlOrBlob);
    revoke = true;
  }
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function isPdfNote(n) {
  if (!n) return false;
  if (n.isPdf) return true;
  if (n.folder === 'Uploaded PDFs') return true;
  if (n.fileName && n.fileName.toLowerCase().endsWith('.pdf')) return true;
  if (n.title && n.title.toLowerCase().endsWith('.pdf')) return true;
  if (n.text && n.text.toLowerCase().startsWith('pdf note uploaded:')) return true;
  return false;
}

async function openPdfNote(n) {
  cache.put(n.id, n);
  renderRecent();
  log('LRU CACHE', `Opened PDF note "${n.title}" · ${cache.keys().length}/5 notes in memory`);
  let pdfData = n.fileData || (await pdfDb.get(n.id));
  let blobUrl = pdfData ? (pdfData.startsWith('blob:') ? pdfData : dataUrlToBlobUrl(pdfData)) : null;
  const fileName = n.fileName || (n.title.toLowerCase().endsWith('.pdf') ? n.title : `${n.title}.pdf`);
  const sizeText = n.fileSize ? ` · ${(n.fileSize / 1024).toFixed(1)} KB` : '';

  function renderView(hasFile, currentUrl) {
    const preview = hasFile && currentUrl
      ? `<div class="pdf-embed-wrap"><iframe class="pdf-embed-frame" src="${currentUrl}#toolbar=1" title="${esc(fileName)}"></iframe></div>`
      : `<div class="pdf-placeholder-box"><div class="pdf-big-icon">📄</div><h3 style="margin:0 0 6px;font:700 15px Manrope,sans-serif;">${esc(fileName)}</h3><p style="margin:0 0 14px;color:#88948c;font-size:12px;">The original PDF file was uploaded in a previous session without persistent binary caching.</p><label class="primary-button" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:9px 15px;"><span>📁 Select & Link ${esc(fileName)}</span><input type="file" id="pdf-reattach-input" accept="application/pdf,.pdf" style="display:none" /></label></div>`;
    const actions = `<div class="modal-actions pdf-modal-actions"><button class="cancel-button" id="close-modal">Close</button>${hasFile && currentUrl ? `<button class="secondary-button" id="open-tab-pdf">Open in new tab ↗</button>` : ''}${hasFile && currentUrl ? `<button class="secondary-button" id="download-pdf-btn">Download PDF ⇩</button>` : ''}<button class="secondary-button" id="delete-pdf-btn" style="color:#b34f48;border-color:#f1d5d3;margin-left:auto;">Delete note</button></div>`;
    return `<div class="pdf-modal-container"><div class="pdf-modal-head"><h2>${esc(n.title)}</h2><div class="pdf-meta-pills"><span class="pdf-badge-tag">PDF DOCUMENT</span><span>${esc(fileName)}</span><span>${sizeText}</span><span>· ${esc(n.updated)}</span></div></div>${preview}${actions}</div>`;
  }

  showModal(renderView(Boolean(blobUrl), blobUrl), true);

  function bindHandlers(currentUrl) {
    $('#close-modal').onclick = closeModal;
    const openTabBtn = $('#open-tab-pdf');
    if (openTabBtn && currentUrl) openTabBtn.onclick = () => window.open(currentUrl, '_blank', 'noopener,noreferrer');
    const downloadBtn = $('#download-pdf-btn');
    if (downloadBtn && currentUrl) downloadBtn.onclick = () => downloadPdf(fileName, currentUrl);
    const deleteBtn = $('#delete-pdf-btn');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        const before = snapshot();
        data.notes = data.notes.filter(x => x.id !== n.id);
        await pdfDb.delete(n.id);
        closeModal();
        commit(before, 'PDF note deleted');
        toast('PDF note deleted');
      };
    }
    const reattachInput = $('#pdf-reattach-input');
    if (reattachInput) {
      reattachInput.onchange = e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result;
          n.fileData = dataUrl;
          n.fileName = file.name;
          n.fileSize = file.size;
          await pdfDb.set(n.id, dataUrl);
          const newBlobUrl = dataUrlToBlobUrl(dataUrl);
          showModal(renderView(true, newBlobUrl), true);
          bindHandlers(newBlobUrl);
          persist();
          toast('PDF loaded successfully!');
        };
        reader.readAsDataURL(file);
      };
    }
  }

  bindHandlers(blobUrl);
}

let activeMode=null,activeUser=null,saveTimer=null;const cache=new LRUCache(5),history=new UndoStack(),expensesTree=new AVLTree(),urgent=new MinHeap((a,b)=>a.date.localeCompare(b.date)),trie=new Trie(),inverted=new HashTable(),bloom=new BloomFilter(),graph=new Graph(),timer={mode:'focus',seconds:1500,interval:null,running:false},command={items:[],active:0};let focusQueue=new CircularQueue(data.queue||[]);let telemetry=[],noteFilter='all',noteSort='recent';function log(tag,msg,ms=(Math.random()*.35+.08).toFixed(2)){telemetry.unshift({tag,msg,ms});telemetry=telemetry.slice(0,4);renderTelemetry()}function renderTelemetry(){const feed=$('#telemetry-feed');feed.innerHTML=telemetry.map(x=>`<div class="telemetry-entry"><b>[${esc(x.tag)}]</b> ${esc(x.msg)} <span class="ms">${x.ms} ms</span></div>`).join('')}function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function persist(){if(activeMode==='demo'){localStorage.setItem(DEMO_STORE,JSON.stringify(data));return}if(activeMode==='account'){clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{try{const r=await fetch('/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({data})});if(!r.ok)throw new Error('Could not save to your account. Check your connection and sign in again.')}catch(e){toast(e.message||'Your changes could not be synced.')}} ,250)}}function snapshot(){return JSON.stringify(data)}function commit(before,label){history.push(before);persist();renderAll();log('UNDO STACK',`${label} saved · Undo depth ${history.undo.length}`)}function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2400)}function relativeDate(s){const d=new Date(`${s}T00:00:00`);return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}function rebuildIndexes(){expensesTree.root=null;data.expenses.forEach(e=>expensesTree.root=expensesTree.insert(expensesTree.root,e.amount,e));urgent.a=[];data.deadlines.forEach(d=>urgent.push(d));trie.root=new TrieNode();inverted.buckets=Array.from({length:53},()=>[]);bloom.bits.fill(0);for(const n of data.notes){const item={id:n.id,title:n.title,type:'note',page:'notes'};for(const token of `${n.title} ${n.folder} ${n.text}`.toLowerCase().match(/[a-z0-9]+/g)||[])trie.insert(token,item);const words=(n.title+' '+n.folder+' '+n.text).toLowerCase().match(/[a-z0-9]+/g)||[];for(const w of new Set(words)){const ids=inverted.get(w)||[];ids.push(n.id);inverted.set(w,ids);bloom.add(w)}}for(const t of data.tasks)for(const token of t.title.toLowerCase().match(/[a-z0-9]+/g)||[])trie.insert(token,{id:t.id,title:t.title,type:'task',page:'planner'});for(const d of data.deadlines)for(const token of d.title.toLowerCase().match(/[a-z0-9]+/g)||[])trie.insert(token,{id:d.id,title:d.title,type:'deadline',page:'planner'})}function renderAll(){rebuildIndexes();renderSchedule();renderDeadlines();renderNotes($('#notes-search')?.value||'');renderRecent();renderTransactions();renderBudget();renderPersonalizedDashboard();renderPlanner();renderQueue();renderOptimize();renderCommand('')}function setMobileMenu(open){const sidebar=$('.sidebar'),toggle=$('#mobile-menu-toggle');sidebar.classList.toggle('mobile-nav-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')}$('#mobile-menu-toggle').addEventListener('click',()=>setMobileMenu(!$('.sidebar').classList.contains('mobile-nav-open')));document.addEventListener('click',e=>{if(!e.target.closest('.sidebar'))setMobileMenu(false)});document.addEventListener('keydown',e=>{if(e.key==='Escape')setMobileMenu(false)});function openPage(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.page===page));setMobileMenu(false);const names={dashboard:'Overview',notes:'Study notes',planner:'Planner',expenses:'Expenses'};$('#page-crumb').textContent=names[page]||'Overview';window.location.hash=page;window.scrollTo(0,0)}$$('.nav-item').forEach(n=>n.addEventListener('click',()=>openPage(n.dataset.page)));$$('[data-go]').forEach(n=>n.addEventListener('click',()=>openPage(n.dataset.go)));function renderSchedule(){const host=$('#dashboard-schedule');const todayKey=toDateKey(today);const todayTasks=data.tasks.filter(t=>t.date===todayKey);const list=todayTasks.length?todayTasks:data.tasks.slice(0,4);host.innerHTML=list.slice(0,4).map(t=>`<div class="schedule-row"><span class="schedule-time">${esc(t.time)}</span><span class="schedule-dot"></span><span class="schedule-info"><b>${esc(t.title)}</b><small>${t.duration} min · ${t.done?'Completed':esc(t.tag)}</small></span><span class="schedule-tag ${t.tag.toLowerCase()}">${esc(t.tag)}</span></div>`).join('')||'<div class="command-empty">No schedule for today.</div>'}function renderDeadlines(){const list=urgent.sorted().slice(0,3);$('#deadline-list').innerHTML=list.map(d=>`<div class="deadline-row"><span class="deadline-date"><small>${new Date(d.date+'T00:00:00').toLocaleDateString('en-IN',{month:'short'}).toUpperCase()}</small>${new Date(d.date+'T00:00:00').getDate()}</span><span class="deadline-info"><b>${esc(d.title)}</b><small>${esc(d.meta)}</small></span><i class="deadline-priority"></i></div>`).join('')}function renderNotes(filter=''){let notes=data.notes.filter(n=>(n.title+' '+n.folder+' '+n.text).toLowerCase().includes(filter.toLowerCase()));if(noteFilter==='starred')notes=notes.filter(n=>n.star);if(noteFilter==='recent'){const opened=cache.keys();notes=notes.filter(n=>opened.includes(n.id)).sort((a,b)=>opened.indexOf(a.id)-opened.indexOf(b.id))}if(noteSort==='title')notes.sort((a,b)=>a.title.localeCompare(b.title));$('#notes-grid').innerHTML=notes.map(n=>{const isPdf=isPdfNote(n);return `<article class="note-card ${isPdf?'note-card-pdf':''}" data-note="${n.id}"><div class="note-card-top"><span class="note-folder">${isPdf?'📄 ':''}${esc(n.folder||(isPdf?'Uploaded PDFs':'Study notes'))}</span><button class="note-star ${n.star?'on':''}" data-star="${n.id}" title="Star note">${n.star?'★':'☆'}</button></div><h3>${esc(n.title)}</h3><p>${isPdf?esc(n.fileName||n.text||'PDF document'):esc(n.text)}</p><div class="note-card-foot"><span>${esc(n.updated)}</span><span>${isPdf?'<span class="pdf-pill-link">View PDF ↗</span>':`${Math.max(1,Math.ceil(n.text.split(/\\s+/).length/200))} min read`}</span></div></article>`;}).join('')||'<div class="command-empty">No notes found. Try another search.</div>';$('#notes-count').textContent=data.notes.length;$('#all-notes-count').textContent=data.notes.length;$$('.note-card').forEach(c=>c.addEventListener('click',e=>{if(!e.target.closest('[data-star]'))openNote(c.dataset.note)}));$$('[data-star]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const before=snapshot(),n=data.notes.find(x=>x.id===b.dataset.star);n.star=!n.star;commit(before,'Note star updated')}))}function renderRecent(){const ids=cache.keys();$('#recent-notes').innerHTML=(ids.length?ids.map(id=>data.notes.find(n=>n.id===id)).filter(Boolean):data.notes.slice(0,3)).map(n=>`<div class="recent-note" data-open-note="${n.id}"><span class="recent-note-icon">${isPdfNote(n)?'📄':'▤'}</span><span><b>${esc(n.title)}</b><small>${esc(n.folder)}</small></span><span>→</span></div>`).join('');$$('[data-open-note]').forEach(n=>n.onclick=()=>openNote(n.dataset.openNote))}function openNote(id){const n=data.notes.find(x=>x.id===id);if(!n)return;if(isPdfNote(n)){openPdfNote(n);return;}cache.put(id,n);renderRecent();log('LRU CACHE',`Accessed "${n.title}" · ${cache.keys().length}/5 notes in memory`);showModal(`<h2>${esc(n.title)}</h2><p>${esc(n.folder)} · ${esc(n.updated)}</p><div class="modal-field"><textarea id="edit-note-text">${esc(n.text)}</textarea></div><div class="modal-actions"><button class="cancel-button" id="close-modal">Close</button><button class="secondary-button" id="export-note">Export .txt</button><button class="primary-button" id="save-note">Save changes</button></div>`);$('#close-modal').onclick=closeModal;$('#save-note').onclick=()=>{const before=snapshot();n.text=$('#edit-note-text').value;n.updated='Just now';closeModal();commit(before,'Note edited')};$('#export-note').onclick=()=>download(`${n.title.replace(/[^a-z0-9]/gi,'_')}.txt`,n.text,'text/plain')}$('#notes-search').addEventListener('input',e=>{const q=e.target.value;const t=performance.now();renderNotes(q);const result=q?trie.search(q):[];log('TRIE',`Prefix "${q||'—'}" matched ${result.length} note titles` ,(performance.now()-t).toFixed(2))});$$('[data-note-filter]').forEach(b=>b.onclick=()=>{$$('[data-note-filter]').forEach(x=>x.classList.toggle('selected',x===b));noteFilter=b.dataset.noteFilter;renderNotes($('#notes-search').value);if(noteFilter==='recent')log('LRU CACHE',`Showing ${cache.keys().length} recently opened notes`)});$('#sort-notes').onclick=()=>{noteSort=noteSort==='recent'?'title':'recent';$('#sort-notes').title=noteSort==='title'?'Sorted alphabetically':'Sorted by recent';renderNotes($('#notes-search').value);toast(noteSort==='title'?'Notes sorted by title':'Notes returned to recent order')};function renderTransactions(items=data.expenses){const rows=items.slice().sort((a,b)=>b.date.localeCompare(a.date));$('#transactions').innerHTML=rows.map(e=>`<div class="transaction-row"><span class="transaction-name"><i class="transaction-icon">${esc(e.icon||'₹')}</i><span><b>${esc(e.title)}</b><small>${esc(e.category)}</small></span></span><span class="transaction-category">${esc(e.category)}</span><span class="transaction-date">${relativeDate(e.date)}</span><span class="transaction-amount">₹${Number(e.amount).toLocaleString('en-IN')}</span><button class="transaction-more" data-expense="${e.id}">···</button></div>`).join('')||'<div class="command-empty">No expenses in this range.</div>';$$('[data-expense]').forEach(b=>b.onclick=()=>{const e=data.expenses.find(x=>x.id===b.dataset.expense);showModal(`<h2>${esc(e.title)}</h2><p>Expense details</p><p>₹${e.amount} · ${esc(e.category)} · ${relativeDate(e.date)}</p><div class="modal-actions"><button class="cancel-button" id="close-modal">Close</button><button class="primary-button" id="delete-expense">Delete expense</button></div>`);$('#close-modal').onclick=closeModal;$('#delete-expense').onclick=()=>{const before=snapshot();data.expenses=data.expenses.filter(x=>x.id!==e.id);closeModal();commit(before,'Expense removed')}})}function renderBudget(){const now=new Date(today),months=Array.from({length:12},(_,i)=>new Date(now.getFullYear(),now.getMonth()-11+i,1)),monthTotals=months.map(m=>data.expenses.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getFullYear()===m.getFullYear()&&d.getMonth()===m.getMonth()}).reduce((s,e)=>s+Number(e.amount),0)),total=monthTotals[11],monthly=Number(data.monthlyBudget)||0,max=Math.max(...monthTotals,1),previous=monthTotals[10],categoryTotals=new Map();$('#month-spend').textContent=`₹${total.toLocaleString('en-IN')}`;$('#spend-bars').innerHTML=monthTotals.map((amount,i)=>`<i class="${i===11?'bar-active':''}" style="height:${amount?Math.max(8,amount/max*100):0}%" title="${months[i].toLocaleDateString('en-IN',{month:'long',year:'numeric'})}: ₹${amount.toLocaleString('en-IN')}"></i>`).join('');$('#month-labels').innerHTML=months.map(m=>`<span>${m.toLocaleDateString('en-IN',{month:'short'})}</span>`).join('');$('#spend-trend').textContent=previous?`${total>=previous?'↗':'↘'} ${Math.round(Math.abs(total-previous)/previous*100)}% ${total>=previous?'more':'less'} than last month`:'Add expenses to see your monthly trend';$('#monthly-budget').textContent=monthly?`₹${monthly.toLocaleString('en-IN')}`:'Not set';$('#edit-monthly-budget').setAttribute('aria-label',monthly?'Change monthly budget':'Set monthly budget');const pct=monthly?Math.min(100,Math.round(total/monthly*100)):0;$('#budget-percent').textContent=monthly?`${pct}%`:'—';$('.budget-gauge').style.setProperty('--budget-fill',`${pct}%`);$('#budget-remaining').textContent=monthly?`₹${Math.max(0,monthly-total).toLocaleString('en-IN')}`:'Set a monthly budget';thisMonthExpenses().forEach(e=>categoryTotals.set(e.category,(categoryTotals.get(e.category)||0)+Number(e.amount)));$('.budget-category').innerHTML=['Food & drink','Travel','Study','Other'].map((name,i)=>`<span><i class="cat-dot ${['food','travel','study','food'][i]}"></i>${esc(name)}</span><b>₹${(categoryTotals.get(name)||0).toLocaleString('en-IN')}</b>`).join('')}function thisMonthExpenses(){return data.expenses.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getFullYear()===today.getFullYear()&&d.getMonth()===today.getMonth()})}function renderPersonalizedDashboard(){const completed=data.tasks.filter(t=>t.done).length,total=data.tasks.length,pct=total?Math.round(completed/total*100):0;$('#tasks-stat').innerHTML=`${completed} <small>/ ${total}</small>`;$('#tasks-percent').textContent=`${pct}%`;$('#tasks-progress').style.width=`${pct}%`;const focus=data.tasks.filter(t=>t.tag==='Study').reduce((sum,t)=>sum+Number(t.duration||0),0);$('#focus-stat').textContent=focus>=60?`${Math.floor(focus/60)}h ${focus%60}m`:`${focus}m`;const focusTasks=data.tasks.filter(t=>t.tag==='Study').slice(0,7),mini=$('.mini-bars'),maxFocus=Math.max(...focusTasks.map(t=>Number(t.duration)||0),1);mini.classList.toggle('hidden',!focusTasks.length);mini.innerHTML=focusTasks.map((t,i)=>`<i class="${i===focusTasks.length-1?'current':''}" style="height:${Math.max(8,Number(t.duration||0)/maxFocus*30)}px"></i>`).join('');const cutoff=new Date(today);cutoff.setDate(today.getDate()-6);const weekly=data.expenses.filter(e=>{const d=new Date(e.date+'T00:00:00');return d>=cutoff&&d<=today}).reduce((s,e)=>s+Number(e.amount),0),monthly=Number(data.monthlyBudget)||0;$('#weekly-spend-stat').textContent=`₹${weekly.toLocaleString('en-IN')}`;$('#weekly-left-stat').textContent=monthly?`₹${Math.max(0,Math.round(monthly/4.3-weekly)).toLocaleString('en-IN')} left`:'';$('#weekly-budget-progress').style.width=`${monthly?Math.min(100,weekly/(monthly/4.3)*100):0}%`;$('#split-card').classList.toggle('hidden',activeMode!=='demo');$('.expense-summary').classList.toggle('account-view',activeMode!=='demo');const recent=data.notes[0],activity=$('.activity-note');if(recent){activity.querySelector('b').textContent=`Pick up: ${recent.title}`;activity.querySelector('small').textContent=`${recent.folder} · ${recent.updated}`;activity.querySelector('button').onclick=()=>openNote(recent.id)}else{activity.querySelector('b').textContent='Create your first study note';activity.querySelector('small').textContent='Capture a class note or idea';activity.querySelector('button').onclick=()=>{openPage('notes');$('#new-note').click()}}const focusTask=data.tasks.find(t=>!t.done);if(focusTask){$('.timer-task b').textContent=focusTask.title;$('.timer-task small').textContent=`${focusTask.tag} · ${focusTask.duration} min`}else{$('.timer-task b').textContent=activeMode==='demo'?'All caught up':'No task selected';$('.timer-task small').textContent=activeMode==='demo'?'Add a new block when ready':'Create a time block in your planner'}if(activeMode!=='demo'){$('.streak-dots').innerHTML='Your focus rhythm starts here';$('#streak-stat').innerHTML='0 <small>days</small>';$('#streak-message').textContent='Start a streak';$('#semester-label').textContent='MY SEMESTER';$('#semester-progress').style.width=`${pct}%`;$('#semester-progress-label').textContent=`${pct}%`}else{$('.streak-dots').innerHTML='● ● ● ● ● ● <i>○</i>';$('#streak-stat').innerHTML='6 <small>days</small>';$('#streak-message').textContent='Personal best!';$('#semester-label').textContent='SEMESTER 4';$('#semester-progress').style.width='68%';$('#semester-progress-label').textContent='68%'}}let weekOffset=0;function renderPlanner(){const strip=$('#week-strip'),monday=new Date(today);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7)+weekOffset*7);const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];const dates=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d});const selectedIndex=Math.min(6,Math.max(0,Math.floor((selectedPlannerDate-monday)/86400000)));strip.innerHTML=dates.map((d,i)=>{const dKey=toDateKey(d);const count=data.tasks.filter(t=>t.date===dKey).length;return `<button class="week-day ${i===selectedIndex?'selected':''}" data-day="${i}"><span>${days[i]}</span><b>${d.getDate()}</b>${(i===selectedIndex||count>0)?'<i></i>':''}</button>`;}).join('');const end=dates[6];$('#week-range').textContent=`${monday.toLocaleDateString('en-IN',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}`;$('#selected-day-title').textContent=selectedPlannerDate.toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'});$('.week-day').forEach(b=>b.onclick=()=>{selectedPlannerDate=new Date(dates[Number(b.dataset.day)]);renderPlanner()});const selKey=toDateKey(selectedPlannerDate);const dayTasks=data.tasks.filter(t=>t.date?t.date===selKey:selKey===toDateKey(today)).sort((a,b)=>a.time.localeCompare(b.time));$('#planner-timeline').innerHTML=dayTasks.length?dayTasks.map(t=>`<div class="timeline-row"><span class="timeline-hour">${esc(t.time)}</span><span class="timeline-marker"></span><span class="timeline-event"><b>${esc(t.title)} <i class="event-tag ${t.tag.toLowerCase()}">${esc(t.tag)}</i></b><small>${t.duration} minutes ${t.done?'· completed':''}</small></span></div>`).join(''):`<div class="command-empty" style="padding:32px 14px;text-align:center;">No time blocks scheduled for ${selectedPlannerDate.toLocaleDateString('en-IN',{weekday:'long'})}.<br><small style="color:#8a968f;">Click "+ Add time block" above to plan this day.</small></div>`}let selectedPlannerDate=new Date(today);function renderQueue(){const q=focusQueue.toArray();$('#queue-size').textContent=`${q.length} block${q.length===1?'':'s'}`;$('#focus-queue').innerHTML=q.map((x,i)=>`<div class="queue-item"><span>${i===0?'◉':'○'}</span><b>${esc(x.name)}</b><small>${x.minutes} min</small><button type="button" class="queue-item-remove" data-queue-del="${i}" title="Remove block" aria-label="Remove block">×</button></div>`).join('')||'<div class="command-empty">Queue is empty. Add a study block.</div>';$('[data-queue-del]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();e.preventDefault();const idx=Number(btn.dataset.queueDel);const before=snapshot();const removed=focusQueue.removeAt(idx);data.queue=focusQueue.toArray();commit(before,'Block removed from queue');toast(`Removed ${removed?.name||'block'}`);});}const optimizeTasks=[{title:'Review OS notes',time:45,value:8},{title:'Practice graph problems',time:60,value:10},{title:'Read DBMS chapter 4',time:35,value:6},{title:'Check in with study group',time:30,value:5},{title:'Revise discrete math',time:55,value:7}];function renderOptimize(){ $('#optimize-tasks').innerHTML=optimizeTasks.map((t,i)=>`<label class="pick-task"><input type="checkbox" checked data-opt="${i}" />${esc(t.title)}<small>${t.time}m</small></label>`).join('')}function renderRoadmap(){if(activeMode!=='demo'){$('#roadmap-track').innerHTML='<div class="command-empty">Add syllabus topics and prerequisites to build your roadmap.</div>';return}const nodes=['Arrays & complexity','Linked lists','Stacks & queues','Trees','Graphs','Dynamic programming'];const edges=[[nodes[0],nodes[1]],[nodes[1],nodes[2]],[nodes[1],nodes[3]],[nodes[2],nodes[4]],[nodes[3],nodes[4]],[nodes[4],nodes[5]]];const result=topological(nodes,edges);$('#roadmap-track').innerHTML=result.order.map((n,i)=>`<div class="roadmap-step"><span class="roadmap-node">${i<2?'✓':i+1}</span><span class="roadmap-copy"><b>${esc(n)}</b><small>${i<2?'Completed':i===2?'Up next':'Prerequisite linked'}</small></span></div>`).join('');log('TOPO SORT',`Ordered ${result.order.length} chapters across prerequisite graph`)}const groupMembers=['User','Riya','Kabir','Priya','Nikhil','Meera'];const groups=new UnionFind(groupMembers);groups.union('User','Riya');groups.union('Kabir','Priya');groups.union('Priya','Nikhil');groups.union('User','Meera');function renderGroups(){if(activeMode!=='demo'){$('#group-chips').innerHTML='<span class="command-empty">Create a study group to see your connections here.</span>';return}const out=[['User','Riya','Meera','Algorithms project'],['Kabir','Priya','Nikhil','DBMS project']];$('#group-chips').innerHTML=out.map(g=>`<span class="group-chip"><i></i><b>${esc(g[0])} · ${esc(g[1])} · ${esc(g[2])}</b><small>${g[3]}</small></span>`).join('');log('UNION-FIND',`Clustered ${groupMembers.length} students into ${out.length} study groups`)}function showModal(html,isPdf=false){const m=$('#modal');m.classList.toggle('modal-pdf',Boolean(isPdf));m.innerHTML=html;$('#modal-backdrop').classList.add('open');$('#modal-backdrop').onclick=e=>{if(e.target.id==='modal-backdrop')closeModal()}}function closeModal(){$('#modal-backdrop').classList.remove('open');$('#modal').classList.remove('modal-pdf')}function modalForm(title,subtitle,fields,onSave){showModal(`<h2>${title}</h2><p>${subtitle}</p><form class="modal-form">${fields}<div class="modal-actions"><button type="button" class="cancel-button" id="close-modal">Cancel</button><button type="submit" class="primary-button">Save</button></div></form>`);$('#close-modal').onclick=closeModal;$('.modal-form').onsubmit=e=>{e.preventDefault();closeModal();try{onSave()}catch(err){console.error('Modal submit error:',err)}}}$('#new-note').onclick=()=>modalForm('Create a note','Capture an idea while it is fresh.',`<div class="modal-field"><label>TITLE</label><input id="f-title" required placeholder="e.g. Graph traversal patterns" /></div><div class="modal-field"><label>SUBJECT</label><input id="f-folder" required placeholder="e.g. Data Structures" /></div><div class="modal-field"><label>NOTE</label><textarea id="f-text" placeholder="Start writing..."></textarea></div>`,()=>{const before=snapshot(),title=$('#f-title').value.trim(),folder=$('#f-folder').value.trim();const word=(title+' '+folder+' '+$('#f-text').value).toLowerCase().match(/[a-z0-9]+/g)||[];if(word.some(w=>bloom.has(w)&&data.notes.some(n=>(n.title+' '+n.folder+' '+n.text).toLowerCase().includes(w)))){toast('Similar keywords found — saved as a new note.')}data.notes.unshift({id:uid(),title,folder,color:'green',text:$('#f-text').value,updated:'Just now',star:false});commit(before,'New note created');log('HASH + BLOOM',`Indexed ${new Set(word).size} terms · duplicate screen passed`)});$('#new-expense').onclick=()=>modalForm('Add an expense','A quick entry keeps your budget useful.',`<div class="modal-field"><label>WHAT WAS IT?</label><input id="f-title" required placeholder="e.g. Lunch at the canteen" /></div><div class="modal-field"><label>AMOUNT (₹)</label><input id="f-amount" required type="number" min="1" placeholder="0" /></div><div class="modal-field"><label>CATEGORY</label><select id="f-category"><option>Food & drink</option><option>Travel</option><option>Study</option><option>Other</option></select></div><div class="modal-field"><label>DATE</label><input id="f-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>`,()=>{const before=snapshot(),amount=Number($('#f-amount').value);data.expenses.push({id:uid(),title:$('#f-title').value,amount,category:$('#f-category').value,date:$('#f-date').value,icon:'₹'});commit(before,'Expense added');log('AVL TREE',`Inserted Expense ₹${amount} · balanced index updated`)});$('#new-block').onclick=()=>modalForm('Add a time block','Make space for one intentional thing.',`<div class="modal-field"><label>WHAT ARE YOU DOING?</label><input id="f-title" required placeholder="e.g. Revise graph algorithms" /></div><div class="modal-field"><label>START TIME</label><input id="f-time" required type="time" value="15:30" /></div><div class="modal-field"><label>DURATION (MINUTES)</label><input id="f-duration" required type="number" min="5" value="45" /></div><div class="modal-field"><label>DATE</label><input id="f-date" required type="date" value="${toDateKey(selectedPlannerDate||today)}" /></div><div class="modal-field"><label>TYPE</label><select id="f-tag"><option>Study</option><option>Class</option><option>Break</option><option>Personal</option></select></div>`,()=>{const before=snapshot();const taskDate=$('#f-date')?.value||toDateKey(selectedPlannerDate||today);data.tasks.push({id:uid(),title:$('#f-title').value.trim(),time:$('#f-time').value,duration:Number($('#f-duration').value),date:taskDate,tag:$('#f-tag').value,done:false});data.tasks.sort((a,b)=>a.time.localeCompare(b.time));commit(before,'Schedule updated')});$('#quick-add').onclick=()=>{const input=$('#quick-task'),title=input.value.trim();if(!title)return;const before=snapshot();data.tasks.push({id:uid(),title,time:'16:00',duration:30,tag:'Study',done:false});input.value='';commit(before,'Quick task added');toast('Added to your planner')};$('#quick-task').addEventListener('keydown',e=>{if(e.key==='Enter')$('#quick-add').click()});$$('[data-capture]').forEach(b=>b.onclick=()=>{$('#quick-task').value=b.dataset.capture;$('#quick-add').click()});$('#range-filter').onclick=()=>{const lo=Number($('#range-min').value)||0,hi=Number($('#range-max').value)||Infinity,t=performance.now(),matches=expensesTree.range(expensesTree.root,lo,hi);renderTransactions(matches);log('AVL TREE',`Range ₹${lo}–${hi===Infinity?'∞':hi} · ${matches.length} expenses matched`,(performance.now()-t).toFixed(2))};$('#clear-filter').onclick=()=>{$('#range-min').value='';$('#range-max').value='';renderTransactions()};$('#settle-splits').onclick=()=>{const balances=[{name:'User',amount:840},{name:'Riya',amount:420},{name:'Kabir',amount:-600},{name:'Priya',amount:-360},{name:'Nikhil',amount:-300}];const creditors=new MinHeap((a,b)=>b.amount-a.amount),debtors=new MinHeap((a,b)=>a.amount-b.amount);balances.forEach(x=>x.amount>0?creditors.push({...x}):debtors.push({...x,amount:-x.amount}));let settlements=[];while(creditors.a.length&&debtors.a.length){const c=creditors.pop(),d=debtors.pop(),v=Math.min(c.amount,d.amount);settlements.push(`${d.name} pays ${c.name} ₹${v}`);if(c.amount>v)creditors.push({...c,amount:c.amount-v});if(d.amount>v)debtors.push({...d,amount:d.amount-v})}$('#split-output').innerHTML=settlements.map(esc).join('<br>');log('GREEDY + HEAP',`Simplified group balances to ${settlements.length} transfers`)};$('#optimize-button').onclick=()=>{const chosen=$$('[data-opt]:checked').map(x=>optimizeTasks[Number(x.dataset.opt)]),res=knapsack(chosen,240);$('#optimize-result').innerHTML=`<span>✨</span><span><b>${res.value} priority points</b><br>${res.chosen.map(x=>esc(x.title)).join(' · ')||'Select a task to build your plan'}</span>`;log('KNAPSACK DP',`Selected ${res.chosen.length} tasks · ${res.chosen.reduce((s,x)=>s+x.time,0)} of 240 min`)};$('#queue-next').onclick=()=>{const item=focusQueue.rotate();data.queue=focusQueue.toArray();persist();renderQueue();if(item){setTimerMode(item.type==='break'?'short':'focus');log('CIRCULAR QUEUE',`Rotated focus pipeline · Next: ${item.name}`);toast(`Up next: ${item.name}`)}};$('#queue-add').onclick=()=>modalForm('Add study block','Name your study or break session and set the duration.',
  `<div class="modal-field"><label>BLOCK NAME</label><input id="q-title" required autofocus placeholder="e.g. Operating Systems revision" /></div>
   <div class="modal-field"><label>DURATION (MINUTES)</label><input id="q-duration" required type="number" min="5" max="180" value="25" /></div>
   <div class="modal-field"><label>TYPE</label><select id="q-type"><option value="focus" selected>Study session</option><option value="break">Break</option></select></div>`,
  ()=>{
    const rawName=$('#q-title').value.trim()||'Study block';
    const minutes=Number($('#q-duration').value)||25;
    const type=$('#q-type').value||'focus';
    const prefix=type==='break'?'Break · ':'Study · ';
    const name=rawName.toLowerCase().startsWith('study')||rawName.toLowerCase().startsWith('break')?rawName:`${prefix}${rawName}`;
    const before=snapshot();
    focusQueue.enqueue({name,minutes,type});
    data.queue=focusQueue.toArray();
    commit(before,'Study block added to queue');
    renderQueue();
    log('CIRCULAR QUEUE',`Enqueued "${name}" (${minutes}m) · ${focusQueue.size()} blocks in rotation`);
    toast(`Added "${name}" to focus queue`);
  }
);function setTimerMode(mode){timer.mode=mode;timer.seconds=mode==='focus'?1500:mode==='short'?300:900;$$('[data-timer-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.timerMode===mode));renderTimer()}$$('[data-timer-mode]').forEach(b=>b.onclick=()=>setTimerMode(b.dataset.timerMode));function renderTimer(){const mm=String(Math.floor(timer.seconds/60)).padStart(2,'0'),ss=String(timer.seconds%60).padStart(2,'0');$('#timer-display').textContent=`${mm}:${ss}`;$('#timer-state').textContent=timer.running?'IN SESSION':'READY TO FOCUS';$('#timer-toggle').innerHTML=timer.running?'Pause session <span>Ⅱ</span>':'Start focus session <span>→</span>';$('.timer-ring').style.background=`conic-gradient(#60946e ${timer.running?165:72}deg,#ebf0eb 0deg)`}$('#timer-toggle').onclick=()=>{if(timer.running){clearInterval(timer.interval);timer.running=false;log('TIMER QUEUE','Focus timer paused')}else{timer.running=true;timer.interval=setInterval(()=>{timer.seconds--;if(timer.seconds<=0){timer.seconds=0;clearInterval(timer.interval);timer.running=false;toast('Session complete. Take a short break.');log('TIMER QUEUE','Focus interval complete · Break queued')}renderTimer()},1000);log('TIMER QUEUE',`Started ${timer.mode} session · Circular queue ready`)}renderTimer()};function searchable(q){const trimmed=q.trim();if(!trimmed)return[];const exact=trie.search(trimmed);if(exact.length)return exact.slice(0,8);const titles=data.notes.map(n=>({id:n.id,title:n.title,type:'note',page:'notes'})).concat(data.tasks.map(n=>({id:n.id,title:n.title,type:'task',page:'planner'})));const fuzz=titles.map(x=>({...x,d:editDistance(trimmed,x.title)})).filter(x=>x.d<=Math.max(2,Math.floor(trimmed.length/3))).sort((a,b)=>a.d-b.d).slice(0,6);log('EDIT DISTANCE',`Fuzzy query "${trimmed}" · ${fuzz.length} close matches`);return fuzz}function renderCommand(q){const results=searchable(q);const defaults=[{title:'Open Study notes',type:'Navigate',page:'notes',id:'act-notes',icon:'▤'},{title:'Open Planner',type:'Navigate',page:'planner',id:'act-planner',icon:'◷'},{title:'Add an expense',type:'Quick action',page:'expenses',id:'act-expense',icon:'₹'},];const items=q?results.map(x=>({...x,icon:x.type==='note'?'▤':x.type==='task'?'✓':'⌖'})):defaults;command.items=items;command.active=0;$('#command-results').innerHTML=items.length?items.map((x,i)=>`<div class="command-result ${i===0?'active':''}" data-cmd="${i}"><span>${x.icon||'⌕'}</span><b>${esc(x.title)}</b><small>${esc(x.type==='note'?'Study note':x.type==='task'?'Task':x.type)}</small></div>`).join(''):'<div class="command-empty">No matches. Try another word.</div>';$$('.command-result').forEach(r=>r.onclick=()=>selectCommand(items[Number(r.dataset.cmd)]))}function selectCommand(x){if(!x)return;$('#command-backdrop').classList.remove('open');if(x.id==='act-expense'){openPage('expenses');$('#new-expense').click();return}openPage(x.page||'dashboard');if(x.type==='note')openNote(x.id);if(x.type==='task')toast(`Found task: ${x.title}`)}function openCommand(){const b=$('#command-backdrop');b.classList.add('open');$('#command-input').value='';renderCommand('');$('#command-input').focus()}$('#open-command').onclick=openCommand;$('#note-search-open').onclick=openCommand;$('#command-input').addEventListener('input',e=>renderCommand(e.target.value));$('#command-input').addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();command.active=(command.active+(e.key==='ArrowDown'?1:-1)+command.items.length)%command.items.length;$$('.command-result').forEach((x,i)=>x.classList.toggle('active',i===command.active))}if(e.key==='Enter')selectCommand(command.items[command.active]);if(e.key==='Escape')$('#command-backdrop').classList.remove('open')});$('#command-backdrop').onclick=e=>{if(e.target.id==='command-backdrop')e.currentTarget.classList.remove('open')};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}if(e.key==='Escape'){closeModal();$('#command-backdrop').classList.remove('open')}});$('#clear-logs').onclick=()=>{telemetry=[];renderTelemetry()};$('#telemetry-toggle').onclick=()=>{$('#telemetry-feed').classList.toggle('hidden');$('#telemetry-toggle').textContent=$('#telemetry-feed').classList.contains('hidden')?'⌄':'⌃'};function undo(isRedo=false){const current=snapshot(),next=isRedo?history.stepForward(current):history.stepBack(current);if(!next){toast(isRedo?'Nothing to redo':'Nothing to undo');return}data=JSON.parse(next);persist();renderAll();log('UNDO STACK',isRedo?'Redid last change':`Undid last change · ${history.undo.length} actions left`)}// Keep keyboard shortcuts available throughout the workspace.
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo(e.shiftKey)}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}});$('#week-prev').onclick=()=>{weekOffset--;selectedPlannerDate=new Date(today);selectedPlannerDate.setDate(today.getDate()+weekOffset*7);renderPlanner()};$('#week-next').onclick=()=>{weekOffset++;selectedPlannerDate=new Date(today);selectedPlannerDate.setDate(today.getDate()+weekOffset*7);renderPlanner()};$('.today-button').onclick=()=>{weekOffset=0;selectedPlannerDate=new Date(today);renderPlanner()};const DEMO_FIXTURES={notes:new Set(['n1','n2','n3','n4','n5']),tasks:new Set(['t1','t2','t3','t4','t5']),expenses:new Set(['e1','e2','e3','e4','e5','e6']),deadlines:new Set(['d1','d2','d3'])};const DEMO_QUEUE_NAMES=new Set(['Study · Operating Systems','Short break','Study · Data Structures']);function removeDemoFixtures(workspace){let changed=false;for(const [key,ids] of Object.entries(DEMO_FIXTURES)){const before=(workspace[key]||[]).length;workspace[key]=(workspace[key]||[]).filter(item=>!ids.has(item.id));changed ||= workspace[key].length!==before}const queueBefore=(workspace.queue||[]).length;workspace.queue=(workspace.queue||[]).filter(item=>!DEMO_QUEUE_NAMES.has(item.name));return changed||workspace.queue.length!==queueBefore}function showWorkspace(payload,mode){if(timer.interval)clearInterval(timer.interval);timer.interval=null;timer.running=false;cache.clear();activeMode=mode;activeUser=payload.user||{name:mode==='demo'?'User':'Student',email:mode==='demo'?'demo@unicore.local':''};let cleaned=false;if(mode==='demo'){data=payload.data??structuredClone(seed);data.monthlyBudget??=8000}else{data={notes:[],tasks:[],expenses:[],deadlines:[],queue:[],...(payload.data||{})};cleaned=removeDemoFixtures(data)}data.notes??=[];data.tasks??=[];data.expenses??=[];data.deadlines??=[];data.queue??=[];focusQueue=new CircularQueue(data.queue);history.undo.length=0;history.redo.length=0;$('#auth-screen').classList.add('hidden');$('#app-shell').classList.remove('hidden');const name=activeUser.name||(mode==='demo'?'User':'Student');$('#profile-name').textContent=name;$('#profile-meta').textContent=mode==='demo'?'Demo workspace':activeUser.email;$('#greeting-name').textContent=name.split(/\s+/)[0];const avatarText=name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();const pictureUrl=activeUser.picture||(payload.user&&payload.user.picture)||'';const avatarMarkup=pictureUrl?`<img class="gmail-avatar-mark user-avatar-photo" src="${esc(pictureUrl)}" referrerpolicy="no-referrer" alt="${esc(name)} profile photo" />`:avatarText;$('#user-avatar').innerHTML=avatarMarkup;$('.avatar').innerHTML=avatarMarkup;$('#user-avatar').setAttribute('aria-label',pictureUrl?'Google account profile photo':'User avatar');$('.avatar').setAttribute('aria-label',pictureUrl?'Google account profile photo':'User avatar');$('#workspace-mode-badge').textContent=mode==='demo'?'DEMO MODE':'ACCOUNT';if(location.hash&&$('#page-'+location.hash.slice(1)))openPage(location.hash.slice(1));renderAll();if(cleaned)persist();log('SYSTEM',mode==='demo'?'Demo workspace ready · sample data loaded':'Account workspace ready · data synced securely');}function showAuth(){activeMode=null;activeUser=null;$('#app-shell').classList.add('hidden');$('#auth-screen').classList.remove('hidden');$('#auth-error').textContent=''}async function apiRequest(path,payload){const response=await fetch(path,{method:payload?'POST':'GET',credentials:'same-origin',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});let result={};try{result=await response.json()}catch{}if(!response.ok)throw new Error(result.error||'Request failed. Please try again.');return result}let authMode='login';function setAuthMode(mode){authMode=mode;$$('[data-auth-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.authMode===mode));$$('.register-only').forEach(x=>x.classList.toggle('hidden',mode!=='register'));$('input[name="name"]').required=mode==='register';$('input[name="password"]').autocomplete=mode==='register'?'new-password':'current-password';$('#auth-title').textContent=mode==='register'?'Create your UniCore account':'Welcome to UniCore';$('#auth-subtitle').textContent=mode==='register'?'Create your private workspace to keep your study life organized.':'Sign in or create an account to keep your study life organized.';$('#auth-submit').innerHTML=mode==='register'?'Create account <span>→</span>':'Sign in <span>→</span>';$('#auth-error').textContent=''}$$('[data-auth-mode]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authMode));$('#auth-form').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.currentTarget),button=$('#auth-submit');button.disabled=true;button.textContent=authMode==='register'?'Creating account…':'Signing in…';$('#auth-error').textContent='';try{const payload={email:form.get('email'),password:form.get('password')};if(authMode==='register')payload.name=form.get('name');const result=await apiRequest(authMode==='register'?'/api/register':'/api/login',payload);showWorkspace(result,'account')}catch(err){$('#auth-error').textContent=err.message.includes('Failed to fetch')?'Account sign-in needs the UniCore Java server. Start it with run.bat, then open http://localhost:8000.':err.message}finally{button.disabled=false;button.innerHTML=authMode==='register'?'Create account <span>→</span>':'Sign in <span>→</span>'}};$('#demo-mode').onclick=()=>{let saved;try{saved=JSON.parse(localStorage.getItem(DEMO_STORE))}catch{}showWorkspace({user:{name:'User',email:'demo@unicore.local'},data:saved||structuredClone(seed)},'demo')};$('#profile-menu').onclick=async()=>{if(activeMode==='account'){try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'})}catch{}}showAuth()};$('#google-button-fallback').onclick=()=>{$('#google-note').innerHTML='Google sign-in needs a Web OAuth client ID. Set <code>UNICORE_GOOGLE_CLIENT_ID</code> before starting the Java server.'};let googleScriptReady=false,googleResizeTimer=null;function renderGoogleButton(){if(!googleScriptReady||$('#auth-screen').classList.contains('hidden'))return;const host=$('#google-button');host.innerHTML='';const width=Math.floor(host.getBoundingClientRect().width)||320;window.google.accounts.id.renderButton(host,{theme:'outline',size:'large',shape:'rectangular',text:'continue_with',width:Math.max(120,Math.min(350,width))})}window.addEventListener('resize',()=>{clearTimeout(googleResizeTimer);googleResizeTimer=setTimeout(renderGoogleButton,120)});async function startGoogleSignIn(){try{const config=await apiRequest('/api/config');if(!config.googleClientId){$('#google-note').textContent='Google sign-in will be available after you configure a Google OAuth Web client ID.';return}const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.onload=()=>{window.google.accounts.id.initialize({client_id:config.googleClientId,callback:async response=>{try{const result=await apiRequest('/api/google',{credential:response.credential});showWorkspace(result,'account')}catch(err){$('#auth-error').textContent=err.message}}});googleScriptReady=true;renderGoogleButton();$('#google-button-fallback').classList.add('hidden')};script.onerror=()=>{$('#google-note').textContent='Could not load Google sign-in. Check your internet connection.'};document.head.append(script)}catch{$('#google-note').textContent='Google sign-in is available when UniCore is running with a configured OAuth client ID.'}}startGoogleSignIn();apiRequest('/api/me').then(result=>showWorkspace(result,'account')).catch(()=>{});

const uploadBtn = $('#upload-note');
const noteFileInput = $('#note-file-input');
if (uploadBtn && noteFileInput) {
  uploadBtn.onclick = () => noteFileInput.click();
  noteFileInput.onchange = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const noteId = 'pdf-' + Date.now();
      await pdfDb.set(noteId, dataUrl);
      const before = snapshot();
      const newNote = {
        id: noteId,
        title: file.name.replace(/\.pdf$/i, ''),
        folder: 'Uploaded PDFs',
        color: 'orange',
        text: 'PDF note uploaded: ' + file.name,
        updated: 'Just now',
        star: false,
        isPdf: true,
        fileName: file.name,
        fileSize: file.size
      };
      data.notes.unshift(newNote);
      commit(before, 'PDF note uploaded');
      toast('PDF added to Study notes');
      event.target.value = '';
      openPdfNote(newNote);
    };
    reader.readAsDataURL(file);
  };
}


function sanitizePdfText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u00B7]/g, '*')
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfWords(text, maxChars = 76) {
  if (!text) return [];
  const words = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!word) continue;
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function generateNotesPdf(notes, user = {}) {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 54;
  const marginTop = 54;
  const marginBottom = 54;

  const pages = [];
  let currentPageLines = [];
  let currentY = pageHeight - marginTop;

  function newPage() {
    currentPageLines = [];
    currentY = pageHeight - marginTop;
    pages.push(currentPageLines);
    currentPageLines.push({
      font: '/F2',
      size: 9,
      gray: 0.45,
      x: marginX,
      y: pageHeight - 36,
      text: 'UNICORE - STUDENT LIFE OS  |  SEMESTER STUDY ARCHIVE'
    });
    currentPageLines.push({
      type: 'line',
      x1: marginX,
      y1: pageHeight - 42,
      x2: pageWidth - marginX,
      y2: pageHeight - 42,
      gray: 0.85
    });
  }

  newPage();

  // Document Title banner on page 1
  currentPageLines.push({
    font: '/F2',
    size: 22,
    gray: 0.1,
    x: marginX,
    y: currentY - 10,
    text: 'Semester Study Notes'
  });
  currentY -= 32;

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const studentName = (user && user.name) ? user.name : 'Student';
  currentPageLines.push({
    font: '/F1',
    size: 10,
    gray: 0.4,
    x: marginX,
    y: currentY,
    text: `Exported on ${dateStr}  *  Student: ${studentName}  *  Total Notes: ${notes.length}`
  });
  currentY -= 28;

  currentPageLines.push({
    type: 'line',
    x1: marginX,
    y1: currentY + 10,
    x2: pageWidth - marginX,
    y2: currentY + 10,
    gray: 0.8
  });

  if (!notes || notes.length === 0) {
    currentPageLines.push({
      font: '/F3',
      size: 11,
      gray: 0.5,
      x: marginX,
      y: currentY - 20,
      text: 'No notes found in workspace.'
    });
  }

  notes.forEach((note, index) => {
    if (currentY < marginBottom + 80) {
      newPage();
    }

    currentY -= 14;
    const cardTop = currentY;

    const noteTitle = `${index + 1}. ${note.title || 'Untitled Note'}`;
    currentPageLines.push({
      font: '/F2',
      size: 13,
      gray: 0.12,
      x: marginX + 12,
      y: currentY,
      text: noteTitle
    });
    currentY -= 15;

    const metaParts = [];
    if (note.folder) metaParts.push(`Subject: ${note.folder}`);
    if (note.isPdf || note.folder === 'Uploaded PDFs') metaParts.push('Type: PDF Document');
    if (note.star) metaParts.push('* Starred');
    if (note.updated) metaParts.push(`Updated: ${note.updated}`);
    const metaText = metaParts.join('   |   ');

    currentPageLines.push({
      font: '/F2',
      size: 8.5,
      gray: 0.35,
      x: marginX + 12,
      y: currentY,
      text: metaText
    });
    currentY -= 15;

    const content = note.text || (note.fileName ? `Uploaded file: ${note.fileName}` : 'No content.');
    const wrapped = wrapPdfWords(content, 78);

    for (const line of wrapped) {
      if (currentY < marginBottom + 25) {
        newPage();
      }
      currentPageLines.push({
        font: '/F1',
        size: 9.5,
        gray: 0.22,
        x: marginX + 12,
        y: currentY,
        text: line
      });
      currentY -= 13;
    }

    const cardBottom = currentY + 5;
    currentPageLines.push({
      type: 'rect',
      x: marginX,
      y: cardBottom,
      w: 3,
      h: Math.max(16, cardTop - cardBottom + 12),
      r: 0.15,
      g: 0.46,
      b: 0.32
    });

    currentY -= 12;
    currentPageLines.push({
      type: 'line',
      x1: marginX,
      y1: currentY + 6,
      x2: pageWidth - marginX,
      y2: currentY + 6,
      gray: 0.92
    });
  });

  const totalPages = pages.length;
  pages.forEach((pageLines, pageIdx) => {
    pageLines.push({
      type: 'line',
      x1: marginX,
      y1: marginBottom - 12,
      x2: pageWidth - marginX,
      y2: marginBottom - 12,
      gray: 0.85
    });
    pageLines.push({
      font: '/F1',
      size: 8.5,
      gray: 0.5,
      x: marginX,
      y: marginBottom - 24,
      text: 'UniCore - Built for students  *  Local-First Academic OS'
    });
    pageLines.push({
      font: '/F2',
      size: 8.5,
      gray: 0.5,
      x: pageWidth - marginX - 55,
      y: marginBottom - 24,
      text: `Page ${pageIdx + 1} of ${totalPages}`
    });
  });

  const objects = [];
  const pageObjIds = [];

  for (let i = 0; i < totalPages; i++) {
    const pageId = 6 + i * 2;
    pageObjIds.push(`${pageId} 0 R`);
  }

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [ ${pageObjIds.join(' ')} ] /Count ${totalPages} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>';

  pages.forEach((pageItems, i) => {
    const pageId = 6 + i * 2;
    const contentId = 7 + i * 2;

    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`;

    let streamOps = [];
    pageItems.forEach(item => {
      if (item.type === 'line') {
        streamOps.push(`${item.gray.toFixed(2)} G`);
        streamOps.push(`${item.x1.toFixed(1)} ${item.y1.toFixed(1)} m`);
        streamOps.push(`${item.x2.toFixed(1)} ${item.y2.toFixed(1)} l`);
        streamOps.push('S');
      } else if (item.type === 'rect') {
        streamOps.push(`${item.r.toFixed(2)} ${item.g.toFixed(2)} ${item.b.toFixed(2)} rg`);
        streamOps.push(`${item.x.toFixed(1)} ${item.y.toFixed(1)} ${item.w.toFixed(1)} ${item.h.toFixed(1)} re`);
        streamOps.push('f');
      } else {
        streamOps.push('BT');
        streamOps.push(`${item.font} ${item.size} Tf`);
        streamOps.push(`${item.gray.toFixed(2)} g`);
        streamOps.push(`${item.x.toFixed(1)} ${item.y.toFixed(1)} Td`);
        streamOps.push(`(${sanitizePdfText(item.text)}) Tj`);
        streamOps.push('ET');
      }
    });

    const streamBody = streamOps.join('\n');
    let byteLen = 0;
    for (let c = 0; c < streamBody.length; c++) {
      const code = streamBody.charCodeAt(c);
      byteLen += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0xd800 || code >= 0xe000 ? 3 : 4;
    }
    objects[contentId] = `<< /Length ${byteLen} >>\nstream\n${streamBody}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  for (let id = 1; id < objects.length; id++) {
    let offset = 0;
    for (let c = 0; c < pdf.length; c++) {
      const code = pdf.charCodeAt(c);
      offset += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0xd800 || code >= 0xe000 ? 3 : 4;
    }
    offsets[id] = offset;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  let xrefOffset = 0;
  for (let c = 0; c < pdf.length; c++) {
    const code = pdf.charCodeAt(c);
    xrefOffset += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0xd800 || code >= 0xe000 ? 3 : 4;
  }

  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function exportNotesPdf() {
  const notes = (data && Array.isArray(data.notes)) ? data.notes : [];
  if (!notes.length) {
    toast('No notes found to export.');
    return;
  }
  const pdfString = generateNotesPdf(notes, activeUser || {});
  download('unicore-study-notes.pdf', pdfString, 'application/pdf');
  toast(`Exported ${notes.length} note${notes.length === 1 ? '' : 's'} to PDF archive!`);
}

window.exportNotesPdf = exportNotesPdf;
window.data = data;

const archiveBtn = $('#archive-notes');
if (archiveBtn) {
  archiveBtn.onclick = exportNotesPdf;
}
