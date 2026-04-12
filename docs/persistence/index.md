---
title: "Persistence & Backend Services"
---

# Persistence & Backend Services

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [api/leaderboard.ts](https://github.com/kllyjsn/battleship/blob/main/api/leaderboard.ts)
- [src/components/StatsPanel.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/StatsPanel.tsx)
- [src/lib/achievements.ts](https://github.com/kllyjsn/battleship/blob/main/src/lib/achievements.ts)
- [src/lib/gameResults.ts](https://github.com/kllyjsn/battleship/blob/main/src/lib/gameResults.ts)
- [src/lib/leaderboard.ts](https://github.com/kllyjsn/battleship/blob/main/src/lib/leaderboard.ts)
- [src/lib/stats.ts](https://github.com/kllyjsn/battleship/blob/main/src/lib/stats.ts)

</details>



The Battleship application employs a multi-tiered persistence strategy to ensure player progress, combat history, and competitive rankings are maintained. This system combines local storage for immediate personal data with a remote serverless backend for global leaderboards.

### Data Flow Overview

Persistence is triggered primarily at the conclusion of a game session. The system simultaneously updates local statistics, evaluates achievement criteria, and synchronizes with both local and remote leaderboard registries.

**Persistence Pipeline Architecture**
```mermaid
graph TD
    subgraph "Game Logic"
        [GameOver.tsx] -- "GameResultInput" --> [saveGameResult]
    end

    subgraph "Local Persistence (localStorage)"
        [saveGameResult] -- "updates" --> [stats.ts]
        [stats.ts] -- "battleship-stats" --> DB1[("Local Stats")]
        
        [GameOver.tsx] -- "GameEndContext" --> [checkAchievements]
        [checkAchievements] -- "battleship-achievements" --> DB2[("Local Achievements")]
        
        [GameOver.tsx] -- "addLeaderboardEntry" --> [leaderboard.ts]
        [leaderboard.ts] -- "battleship-leaderboard" --> DB3[("Local Leaderboard")]
    end

    subgraph "Remote Backend (Vercel)"
        [leaderboard.ts] -- "POST /api/leaderboard" --> [api/leaderboard.ts]
        [api/leaderboard.ts] -- "In-Memory/Store" --> DB4[("Global Leaderboard")]
    end

    [StatsPanel.tsx] -- "getStatsOverview" --> DB1
    [AchievementsPanel.tsx] -- "getUnlockedAchievements" --> DB2
```
**Sources:** `src/lib/gameResults.ts:13-24`, `src/lib/stats.ts:39-54`, `src/lib/achievements.ts:85-155`, `src/lib/leaderboard.ts:29-59`, `api/leaderboard.ts:35-76`

---

## Stats & Game Results
The statistics system tracks every game played, categorizing results by mode (Single Player vs. Multiplayer) and difficulty level. Data is stored locally under the `battleship-stats` key `src/lib/stats.ts:18`.

*   **Data Structure:** The `Stats` interface maintains an array of `GameRecord` objects alongside streak counters `src/lib/stats.ts:1-16`.
*   **Aggregation:** The `getStatsOverview` function processes raw records into display-ready metrics like win rate, accuracy, and per-difficulty breakdowns `src/lib/stats.ts:69-108`.
*   **Visualization:** The `StatsPanel` component utilizes `recharts` to render these metrics, providing a visual "Combat Stats" dashboard for the player `src/components/StatsPanel.tsx:11-124`.

For details, see [Stats & Game Results](#6.1).

**Sources:** `src/lib/stats.ts:1-113`, `src/components/StatsPanel.tsx:1-124`

---

## Achievements System
The Achievements system provides long-term goals across four categories: Combat, Skill, Social, and Milestone `src/lib/achievements.ts:17-35`. 

*   **Evaluation:** Upon game completion, a `GameEndContext` is passed to `checkAchievements` `src/lib/achievements.ts:85`. This function runs a pipeline of logic checks (e.g., checking if `playerShipsLost === 0` for the "Perfect Game" achievement) `src/lib/achievements.ts:101-104`.
*   **Persistence:** Unlocked achievements are stored in `battleship-achievements` `src/lib/achievements.ts:37`.
*   **Integration:** The system tracks both immediate game performance (accuracy, duration) and cumulative stats (total wins, streaks) to trigger unlocks `src/lib/achievements.ts:90-152`.

For details, see [Achievements System](#6.2).

**Sources:** `src/lib/achievements.ts:1-160`

---

## Leaderboard (Local & Online)
The leaderboard provides a competitive layer by ranking players based on accuracy (score) and efficiency (shots taken) `src/lib/leaderboard.ts:93-97`.

*   **Hybrid Storage:** When a score is submitted via `addLeaderboardEntry`, it is saved to `localStorage` immediately and then sent to the remote API via a "fire-and-forget" fetch call `src/lib/leaderboard.ts:51-56`.
*   **Filtering:** Both local and remote systems support temporal filtering by `day`, `week`, or `month` `src/lib/leaderboard.ts:61-85`.
*   **Backend Service:** A Vercel Serverless Function (`api/leaderboard.ts`) handles remote submissions. It includes basic rate-limiting by IP address and CORS headers to allow cross-origin requests from the web client `api/leaderboard.ts:20-43`.

For details, see [Leaderboard (Local & Online)](#6.3).

**Sources:** `src/lib/leaderboard.ts:1-138`, `api/leaderboard.ts:1-110`

---