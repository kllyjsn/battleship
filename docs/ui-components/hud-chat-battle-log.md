---
title: "HUD, Chat & Battle Log"
---

# HUD, Chat & Battle Log

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [public/tiki-music.mp3](https://github.com/kllyjsn/battleship/blob/main/public/tiki-music.mp3)
- [src/components/BattleLog.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/BattleLog.tsx)
- [src/components/Chat.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/Chat.tsx)
- [src/components/GameHUD.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/GameHUD.tsx)
- [src/components/MusicVisualizer.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/MusicVisualizer.tsx)
- [src/engine/types.ts](https://github.com/kllyjsn/battleship/blob/main/src/engine/types.ts)
- [src/hooks/useBackgroundMusic.ts](https://github.com/kllyjsn/battleship/blob/main/src/hooks/useBackgroundMusic.ts)
- [src/multiplayer/pubnub.ts](https://github.com/kllyjsn/battleship/blob/main/src/multiplayer/pubnub.ts)

</details>



This page details the implementation of the head-up display (HUD), the real-time communication system, and the turn-by-turn battle tracking. These components form the primary interface for game status, social interaction, and tactical history.

## Game HUD

The `GameHUD` component serves as the top-level status bar, providing context-sensitive information based on the current `GamePhase` `src/engine/types.ts:7-7`. It manages the turn indicator, audio toggles, and fleet health progress bars.

### Phase-Based Layout
The HUD adapts its visual output based on the `phase` prop:
*   **Placement:** Displays instructions for ship positioning.
*   **Battle:** Activates the `glow-pulse` turn indicator and the progress bar row `src/components/GameHUD.tsx:95-116`.
*   **GameOver:** Displays the final result message with an amber glow effect `src/components/GameHUD.tsx:53-54`.

### Turn Indicator & Progress Tracking
The turn indicator uses a `glow-pulse` animation when it is the player's turn to provide a strong visual cue `src/components/GameHUD.tsx:56-56`. 
Progress is tracked via two bars representing the "ALLY" (player) and "ENEMY" (opponent) fleet health. These bars calculate width based on `hits / totalShipCells` `src/components/GameHUD.tsx:102-110`.

### Audio & Music Integration
The HUD integrates with the `useBackgroundMusic` hook to provide a `MusicVisualizer`. It also provides a manual toggle for sound effects ("Sonar") which triggers the `onToggleSound` callback `src/components/GameHUD.tsx:34-37`.

**Sources:** `src/components/GameHUD.tsx:1-120`, `src/engine/types.ts:51-61`

---

## Chat & Communications

The `Chat` component provides a real-time "COMMS" panel for multiplayer interaction. It handles message history, unread notifications, and expressive reactions.

### Message Flow & State
Messages are received as an array of `ChatMessage` objects `src/engine/types.ts:93-99`. The component maintains an `unread` count that increments only when the panel is closed and new messages arrive from other players `src/components/Chat.tsx:49-56`.

### Reaction System
Users can react to any message using a predefined set of emojis (`REACTION_EMOJIS`) `src/components/Chat.tsx:5-5`. Reactions are grouped by emoji type before rendering to show which players sent which reaction `src/components/Chat.tsx:83-90`.

### Technical Implementation Details
*   **Auto-Scroll:** The `scrollToBottom` function uses `scrollIntoView` with a "smooth" behavior, triggered whenever the `messages` array or `isOpen` state changes `src/components/Chat.tsx:23-32`.
*   **Focus Management:** Upon opening, the input field is automatically focused after a 100ms delay to allow for the panel animation `src/components/Chat.tsx:35-40`.
*   **Reaction Picker:** A transient `reactionPickerMsgId` state controls the visibility of the emoji selector. It automatically closes via a window-level click listener `src/components/Chat.tsx:60-68`.

| Feature | Implementation |
| :--- | :--- |
| **Data Structure** | `ChatMessage` interface with `reactions` array |
| **Networking** | `onSend` and `onReaction` callbacks (typically via `useMultiplayer`) |
| **Styling** | `metal-panel` for the container, `font-mono-crt` for text |
| **Badge** | Pulse animation on `unread` count > 0 |

**Sources:** `src/components/Chat.tsx:1-113`, `src/engine/types.ts:88-99`

---

## Battle Log

The `BattleLog` component tracks every engagement in the match, providing a chronological history of shots fired, their coordinates, and their results.

### Log Entry Structure
Each move is represented by a `BattleLogEntry` `src/engine/types.ts:101-109`. The component converts raw `Position` data into naval coordinates (e.g., "A1", "J10") using the `coordLabel` utility `src/components/BattleLog.tsx:9-11`.

### UI Logic
*   **Unread Badge:** Similar to the Chat, the Battle Log tracks a `seen` count to display a notification badge for new moves that occurred while the log was closed `src/components/BattleLog.tsx:32-32`.
*   **Result Highlighting:** Entries are color-coded based on the result:
    *   `sunk`: Red text with `text-glow-red` `src/components/BattleLog.tsx:94-94`.
    *   `hit`: Red text `src/components/BattleLog.tsx:97-97`.
    *   `miss`: Slate/grey text `src/components/BattleLog.tsx:100-100`.

**Sources:** `src/components/BattleLog.tsx:1-123`, `src/engine/types.ts:101-110`

---

## System Integration Diagrams

### UI Data Flow
This diagram illustrates how game state and networking events propagate to the HUD, Chat, and Battle Log.

```mermaid
graph TD
    subgraph "State Management"
        GS["GameState (engine/types.ts)"]
        MS["MultiplayerState (useMultiplayer.ts)"]
    end

    subgraph "UI Components"
        HUD["GameHUD.tsx"]
        CHT["Chat.tsx"]
        LOG["BattleLog.tsx"]
    end

    GS -->| "phase, isPlayerTurn, message" | HUD
    GS -->| "playerHits, opponentHits" | HUD
    
    MS -->| "messages: ChatMessage[]" | CHT
    MS -->| "onSend, onReaction" | CHT
    
    GS -->| "lastAttack: AttackResult" | LOG
    LOG -.->| "generates" | BLE["BattleLogEntry"]
```
**Sources:** `src/engine/types.ts:51-110`, `src/components/GameHUD.tsx:5-31`, `src/components/Chat.tsx:7-12`

### Music & Visualization Pipeline
This diagram shows the relationship between the background music hook, the browser Audio API, and the HUD visualizer.

```mermaid
graph LR
    subgraph "useBackgroundMusic.ts"
        SA["sharedAudio (HTMLAudioElement)"]
        AC["sharedContext (AudioContext)"]
        AN["sharedAnalyser (AnalyserNode)"]
        FD["freqData (number[])"]
    end

    subgraph "Components"
        HUD["GameHUD.tsx"]
        MV["MusicVisualizer.tsx"]
    end

    SA -->| "Source" | AN
    AN -->| "getByteFrequencyData" | FD
    FD -->| "props.musicFreqData" | HUD
    HUD -->| "props.freqData" | MV
    MV -->| "render bars" | Canvas["UI Bars"]
```
**Sources:** `src/hooks/useBackgroundMusic.ts:5-42`, `src/components/MusicVisualizer.tsx:9-45`, `src/components/GameHUD.tsx:78-82`

---