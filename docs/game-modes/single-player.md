---
title: "Single Player Mode"
---

# Single Player Mode

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/components/ShipRoster.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/ShipRoster.tsx)
- [src/engine/ai.ts](https://github.com/kllyjsn/battleship/blob/main/src/engine/ai.ts)
- [src/pages/SinglePlayer.tsx](https://github.com/kllyjsn/battleship/blob/main/src/pages/SinglePlayer.tsx)

</details>



The `SinglePlayer` component serves as the primary orchestrator for a local game session against an AI opponent. It manages the transition between game phases, handles user input across multiple modalities (mouse, touch, keyboard), and executes the AI turn logic with simulated delays to mimic human decision-making.

## Game Lifecycle Orchestration

The game flows through a state machine defined by the `GamePhase` type: `placement` → `battle` → `gameover`.

### 1. Placement Phase
In this phase, the player positions their fleet on a 10x10 grid. 
*   **Ship Selection**: Players select ships from the `ShipRoster` `src/components/ShipRoster.tsx:109-155`.
*   **Placement Logic**: Ships are placed using `handlePlaceShip`, which validates coordinates via the `placeShip` engine function `src/pages/SinglePlayer.tsx:80-117`.
*   **Manipulation**: Players can rotate ships (toggling `orientation` state), undo the last placement via `handleUndoShip` `src/pages/SinglePlayer.tsx:128-137`, or use `handleRandomize` to fill the board instantly `src/pages/SinglePlayer.tsx:119-126`.
*   **Transition**: Once all ships are placed, the "Ready" button becomes available, transitioning the phase to `battle` `src/pages/SinglePlayer.tsx:199-205`.

### 2. Battle Phase
The battle phase follows a turn-based loop between the player and the AI.
*   **Player Turn**: Triggered by `handlePlayerAttack`. It validates if the cell has already been targeted and processes the attack result `src/pages/SinglePlayer.tsx:216-271`.
*   **AI Turn**: Initiated automatically via a `useEffect` hook when `isPlayerTurn` becomes false `src/pages/SinglePlayer.tsx:340-344`.
*   **Concurrency Control**: The `isProcessingRef` acts as a mutex to prevent rapid-fire inputs or overlapping turn logic during animations/delays `src/pages/SinglePlayer.tsx:54`.

### 3. Game Over Phase
The game ends when `allShipsSunk` returns true for either fleet `src/pages/SinglePlayer.tsx:254`.
*   **Results**: The component calculates final stats (accuracy, duration) and invokes `saveGameResult` `src/pages/SinglePlayer.tsx:294-307`.
*   **Achievements**: `checkAchievements` is called to evaluate if the player unlocked any trophies `src/pages/SinglePlayer.tsx:310-317`.

**Sources:**
*   `src/pages/SinglePlayer.tsx:33-72` (Initial State)
*   `src/pages/SinglePlayer.tsx:80-137` (Placement logic)
*   `src/pages/SinglePlayer.tsx:216-271` (Attack logic)
*   `src/engine/board.ts:7-11` (Engine imports)

---

## AI Turn Sequencing

The AI behavior is managed through a combination of the AI Engine and `setTimeout` delays in the UI layer to provide a natural pace.

### AI Processing Flow
1.  **Trigger**: The AI turn starts after a 600ms delay once the player's turn ends `src/pages/SinglePlayer.tsx:348`.
2.  **Decision**: The component calls `getAIMove`, passing the current `aiStateRef`, board, and difficulty level `src/pages/SinglePlayer.tsx:352-357`.
3.  **Execution**: The attack is processed via `processAttack`, updating the player's board state `src/pages/SinglePlayer.tsx:359-360`.
4.  **State Update**: The AI's internal memory (hunt vs. target mode) is updated using `updateAIAfterResult` and persisted in `aiStateRef` `src/pages/SinglePlayer.tsx:365-371`.

### AI Logic Diagram
Title: AI Turn Execution Pipeline
```mermaid
graph TD
    "StartAI"["isPlayerTurn == false"] --> "Delay"["setTimeout (600ms)"]
    "Delay" --> "Decision"["getAIMove(difficulty, aiStateRef)"]
    "Decision" --> "Process"["processAttack(playerBoard, pos)"]
    "Process" --> "Feedback"["play('miss' | 'hit' | 'sunk')"]
    "Feedback" --> "UpdateAI"["updateAIAfterResult(aiStateRef, result)"]
    "UpdateAI" --> "CheckWin"["allShipsSunk?"]
    "CheckWin" -- "No" --> "EndTurn"["setIsPlayerTurn(true)"]
    "CheckWin" -- "Yes" --> "GameOver"["setWinner('opponent')"]
```
**Sources:**
*   `src/pages/SinglePlayer.tsx:340-401` (AI Turn implementation)
*   `src/engine/ai.ts:149-154` (AI Decision engine)

---

## Input Abstraction

`SinglePlayer.tsx` provides a unified interface for various input methods, ensuring accessibility and platform parity.

| Input Type | Mechanism | Implementation |
| :--- | :--- | :--- |
| **Mouse/Touch** | `onClick` on Cells | Standard interaction for selecting targets or placing ships. |
| **Keyboard** | `handleKeyDown` | `R` to rotate during placement; Arrow keys to move `cursorPos` and `Enter` to fire during battle `src/pages/SinglePlayer.tsx:141-197`. |
| **Gestures** | `useSwipe` | Allows mobile users to rotate ships via swipe gestures `src/pages/SinglePlayer.tsx:18-19`. |

### Mutex and State Protection
The `isProcessingRef` is critical for input stability. It is set to `true` at the start of `handlePlayerAttack` and cleared only after all animations and state updates are complete `src/pages/SinglePlayer.tsx:217-270`. This prevents "double-tap" bugs where a player might fire twice before the AI turn begins.

**Sources:**
*   `src/pages/SinglePlayer.tsx:140-197` (Keyboard Event Listeners)
*   `src/pages/SinglePlayer.tsx:217` (Mutex usage)

---

## System Integration

The `SinglePlayer` component acts as the glue for several sub-systems:

### Audio and Haptics
*   **Sound**: Uses the `useSound` hook to trigger `play('fire')`, `play('hit')`, and procedural ambient effects `src/pages/SinglePlayer.tsx:51`.
*   **Haptics**: Triggers physical vibration on mobile devices during impactful events (hits/sinks) via the `haptics` utility `src/pages/SinglePlayer.tsx:53`.

### Persistence and Replay
*   **Replay System**: Every move is recorded into `replayMovesRef` `src/pages/SinglePlayer.tsx:60`. At game end, these are bundled into a `ReplayData` object, allowing the player to watch a frame-by-frame reconstruction of the match `src/pages/SinglePlayer.tsx:283-292`.
*   **Stats**: Final game data is sent to `saveGameResult` to update local storage and global leaderboards `src/pages/SinglePlayer.tsx:294-307`.

### Data Flow Diagram
Title: Single Player System Integration
```mermaid
graph LR
    subgraph "Engine"
        "board.ts"["board.ts"]
        "ai.ts"["ai.ts"]
    end

    subgraph "UI Component"
        "SinglePlayer.tsx"["SinglePlayer.tsx"]
        "GameBoard.tsx"["GameBoard.tsx"]
        "ShipRoster.tsx"["ShipRoster.tsx"]
    end

    subgraph "Services"
        "useSound.ts"["useSound.ts"]
        "useHaptics.ts"["useHaptics.ts"]
        "gameResults.ts"["gameResults.ts"]
        "achievements.ts"["achievements.ts"]
    end

    "SinglePlayer.tsx" -- "Validates" --> "board.ts"
    "SinglePlayer.tsx" -- "Queries" --> "ai.ts"
    "SinglePlayer.tsx" -- "Renders" --> "GameBoard.tsx"
    "SinglePlayer.tsx" -- "Renders" --> "ShipRoster.tsx"
    "SinglePlayer.tsx" -- "Triggers" --> "useSound.ts"
    "SinglePlayer.tsx" -- "Triggers" --> "useHaptics.ts"
    "SinglePlayer.tsx" -- "Persists" --> "gameResults.ts"
    "SinglePlayer.tsx" -- "Evaluates" --> "achievements.ts"
```

**Sources:**
*   `src/pages/SinglePlayer.tsx:17-26` (Hook/Service imports)
*   `src/pages/SinglePlayer.tsx:283-320` (Post-game processing)
*   `src/components/ShipRoster.tsx:42-98` (Fleet status rendering)

---