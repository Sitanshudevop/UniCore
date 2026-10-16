# UniCore — Evaluator & Student User Manual

Welcome to the **UniCore (Student Life OS)** user guide. This manual walks students and academic evaluators through setting up, navigating, and testing all core features of the platform.

---

## 🚀 1. System Requirements & Setup

### 1.1 Prerequisites
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Java Runtime:** JDK 17 or higher (tested with standard `java.exe`).
- **Web Browser:** Any modern browser (Google Chrome, Microsoft Edge, Brave, Firefox, or Safari).
- **Dependencies:** **Zero external npm packages or database engines required.**

### 1.2 Quick Start (Windows)
1. Double-click [`run.bat`](../run.bat) in the project root.
2. The native Java server will start immediately on port `8000`:
   ```
   UniCore running at http://localhost:8000
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:8000/
   ```

### 1.3 Quick Start (Command Line / Linux / macOS)
```bash
java --add-modules jdk.httpserver src/Server.java
```
Then visit `http://localhost:8000/`.

---

## 🧭 2. Getting Started: Demo Mode vs Account Mode

When you first open `http://localhost:8000/`, you will see the **Authentication Screen**:
*(Refer to screenshot: [`screenshots/01_auth_screen.png`](../screenshots/01_auth_screen.png))*

### Option A: Explore Demo Mode (Recommended for Evaluators)
- Click the **"◈ Explore demo mode"** button.
- Instant, zero-friction access.
- Pre-populated with realistic, varied student data across all seven days of the week:
  - 41 distinct daily scheduled class and study blocks (Mon–Sun).
  - 5 pre-loaded study notes with lecture summaries.
  - Realistic monthly student expenses across categories.
  - Active study streak and Pomodoro focus queue.
- Stored safely in browser `localStorage` and `IndexedDB`.

### Option B: Create an Account / Sign In
- Switch to the **"Create account"** tab.
- Enter your name, email, and a password (minimum 8 characters).
- Your workspace will be privately encrypted and stored atomically on the server via PBKDF2 HMAC-SHA256.

---

## 📱 3. Core Feature Walkthrough

### 3.1 Overview Dashboard
*(Refer to screenshot: [`screenshots/02_dashboard_overview.png`](../screenshots/02_dashboard_overview.png))*
The student command center displays:
- **Focus Time Card:** Shows total weekly focus time and mini-bar visualization.
- **Tasks Completed:** Real-time goal progress bar.
- **Spending This Week:** Weekly student expenditure against monthly targets.
- **Study Streak:** Daily momentum counter.
- **Today's Schedule:** Chronologically ordered timeline for the current day.
- **Focus Session Ring:** Visual Pomodoro countdown timer.
- **Upcoming Deadlines:** Prioritized deadline alerts powered by a Binary Min-Heap.
- **Quick Capture:** Instant task/thought entry box.

---

### 3.2 Study Notes & Built-In PDF Reader
*(Refer to screenshots: [`screenshots/03_study_notes_lru.png`](../screenshots/03_study_notes_lru.png) & [`screenshots/04_pdf_viewer_modal.png`](../screenshots/04_pdf_viewer_modal.png))*
- **Note Library:** Browse course notes with folder tags and star toggles.
- **LRU Cache Aside:** Tracks the 5 most recently opened notes with sub-millisecond $O(1)$ recall.
- **Prefix Keyword Search:** Instant search filter across note titles and content.
- **Interactive PDF Viewer:**
  - Click on any PDF note or click **"Upload PDF"** to import university lecture slides.
  - Read lecture slides directly inside the modal dialog.
  - Download or export notes to clean `.txt` or `.pdf`.
- **Semester Archive:** Generates a formatted, multi-page study notes digest.

---

### 3.3 Planner: Week View, Day View & Knapsack DP
*(Refer to screenshots: [`screenshots/05_planner_week_view.png`](../screenshots/05_planner_week_view.png) & [`screenshots/06_planner_day_view.png`](../screenshots/06_planner_day_view.png))*
- **View Switcher:** Seamlessly toggle between **"Week"** and **"Day"** views in `.view-tabs`:
  - **Week View:** Displays the full 7-day strip (`Mon`–`Sun`). Use `←` and `→` to jump week-by-week.
  - **Day View:** Focuses on a single day with an expanded timeline and day-by-day navigation arrows.
- **Interactive Task Checkmarks:** Click the circle (`○`) next to any scheduled time block to mark it complete (`✓`), crossing out the title and updating goal statistics.
- **Inline Block Creation:** Click **"＋ Add block for [Day]"** to quickly schedule study or break periods for the selected date.
- **Make the Most of Today (Knapsack DP Optimizer):**
  - Select candidate tasks from the checklist.
  - Click **"Optimize my time →"**.
  - UniCore executes an exact 0/1 Knapsack dynamic programming algorithm to find the highest-priority tasks that fit into 4 free hours (240 min).
- **Focus Queue (Circular Ring Buffer):**
  - Add study sessions using **"＋ Add study block"**.
  - Rotate blocks seamlessly with **"Next block →"**.
  - Remove blocks anytime with the red cross button (`×`).

---

### 3.4 Expenses, Multi-Color Budget Gauge & Group Splits
*(Refer to screenshot: [`screenshots/07_expenses_budget_gauge.png`](../screenshots/07_expenses_budget_gauge.png))*
- **Spent This Month:** Monthly spending trend bar graph.
- **Multi-Colored Category Budget Track:**
  - Visual segmented progress bar matching category dot colors:
    - 🟢 **Food & drink** (`#70a67b`)
    - 🟠 **Travel** (`#dda473`)
    - 🟣 **Study** (`#9989bb`)
    - ⚪ **Other** (`#889f91`)
  - Hover over any segment to see its exact rupee amount and percentage of budget.
- **Monthly Target Edit:** Click the `＋` symbol next to "Monthly budget" to open the budget target modal.
- **Recent Transactions (AVL Tree Search):**
  - Enter Min ₹ and Max ₹ (e.g., `50` to `200`) and click **"Filter"**.
  - The self-balancing AVL Tree searches its indexed BST in $O(\log N)$ time.
- **Group Debt Simplification:**
  - Click **"Simplify group debts →"**.
  - Dual min/max heaps calculate optimal cash settlements, reducing multi-person debts to the absolute minimum number of transfers.

---

### 3.5 Global Command Palette (`Ctrl + K`)
*(Refer to screenshot: [`screenshots/08_command_palette_trie.png`](../screenshots/08_command_palette_trie.png))*
- Press `Ctrl + K` (or `Cmd + K` on Mac) anywhere in the application.
- Type to search notes, planner tasks, or trigger quick actions.
- Uses an in-memory **Character Prefix Trie** for instant results, with fallback to **Levenshtein Edit Distance** for typo tolerance.

---

### 3.6 Notifications & Cloud Sync Center
*(Refer to screenshot: [`screenshots/09_notifications_and_sync.png`](../screenshots/09_notifications_and_sync.png))*
- Click the cloud icon (`☁`) in the top-right corner.
- View live workspace sync status (Local storage engine vs Cloud sync).
- Inspect upcoming deadlines, today's study rhythm, and budget remaining.
- Click **"Clear all"** to dismiss notifications and clear the badge.

---

## 🛠 4. Troubleshooting & FAQs

### Q1: The server doesn't start when double-clicking `run.bat`
- Ensure you have Java 17+ installed. Open PowerShell and run: `java -version`.
- If Java is not found, download JDK 17 or higher from [Adoptium / Eclipse Temurin](https://adoptium.net/).

### Q2: How do I switch back from Account Mode to Demo Mode?
- Click the student profile card in the bottom-left sidebar.
- Click **"Log out"**.
- On the welcome screen, click **"◈ Explore demo mode"**.

### Q3: Are changes saved offline?
- Yes! In Demo Mode, all data is instantly saved to your browser's local storage and IndexedDB. You can refresh or close the tab without losing your work.
