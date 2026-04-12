---
title: "Multiplayer Networking"
---

# Multiplayer Networking

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/components/BattleLog.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/BattleLog.tsx)
- [src/engine/types.ts](https://github.com/kllyjsn/battleship/blob/main/src/engine/types.ts)
- [src/multiplayer/pubnub.ts](https://github.com/kllyjsn/battleship/blob/main/src/multiplayer/pubnub.ts)
- [src/multiplayer/useMultiplayer.ts](https://github.com/kllyjsn/battleship/blob/main/src/multiplayer/useMultiplayer.ts)

</details>



The Battleship multiplayer architecture is built on a real-time messaging layer powered by the **PubNub SDK**. This system enables low-latency game state synchronization, lobby management, and spectator support without a dedicated backend server. The networking layer is abstracted into a specialized hook that manages the lifecycle of a room and the exchange of game-critical signals.

### System Overview

The networking stack is divided into three primary layers:
1.  **Infrastructure Layer**: Handles the PubNub SDK initialization, room code generation, and low-level channel subscriptions.
2.  **State & Logic Layer**: A custom React hook (`useMultiplayer`) that maintains the network status, handles heartbeats, and processes incoming messages.
3.  **Protocol Layer**: A strictly typed message union (`MultiplayerMessage`) that defines the "language" of the game, from handshakes to attack results.

### Networking Architecture

The following diagram illustrates how the frontend components interact with the PubNub infrastructure and the message processing pipeline.

**Network Data Flow**
```mermaid
graph TD
    subgraph "React UI Space"
        [Multiplayer.tsx] -- "Calls actions" --> [useMultiplayer.ts]
        [useMultiplayer.ts] -- "Updates state" --> [Multiplayer.tsx]
    end

    subgraph "Code Entity Space: useMultiplayer"
        [useMultiplayer.ts] -- "publish()" --> [pubnub.ts]
        [pubnub.ts] -- "getPubNub()" --> PN_SDK["PubNub SDK Instance"]
        PN_SDK -- "message event" --> [listenerRef]
        [listenerRef] -- "filter & parse" --> [onMessageRef]
    end

    subgraph "Network Space"
        PN_SDK <--> PN_Cloud["PubNub Global Network"]
        PN_Cloud <--> Peer["Opponent / Spectator"]
    end
```
**Sources:** `src/multiplayer/useMultiplayer.ts:30-61`, `src/multiplayer/pubnub.ts:13-28`

---

### Subsystems

#### 4.1 PubNub Integration & Room Management
The system uses a singleton pattern to manage the PubNub client instance. It handles environment variable validation and provides utility functions for generating unique 6-character room codes. Configuration includes specific `presenceTimeout` and `heartbeatInterval` settings to ensure the "Occupancy" count (number of users in a room) remains accurate even during brief mobile network fluctuations.

For details, see [PubNub Integration & Room Management](#4.1).

**Sources:** `src/multiplayer/pubnub.ts:9-54`

#### 4.2 useMultiplayer Hook
The `useMultiplayer` hook is the central nervous system for networked play. It manages the `MultiplayerState`, which tracks whether the user is a host, guest, or spectator. It implements an application-level heartbeat mechanism (`PING`/`PONG`) to detect peer disconnects that might be missed by the lower-level SDK presence events. It also enforces game security by ensuring ship positions are only shared when a ship is fully sunk.

For details, see [useMultiplayer Hook](#4.2).

**Sources:** `src/multiplayer/useMultiplayer.ts:6-23`, `src/multiplayer/useMultiplayer.ts:105-124`

#### 4.3 Multiplayer Message Protocol
Communication between peers is governed by the `MultiplayerMessage` interface. This protocol handles the entire game lifecycle:
*   **Handshake**: `JOIN`, `READY`, `SPECTATE`.
*   **Game Loop**: `ATTACK`, `ATTACK_RESULT`, `GAME_OVER`.
*   **Social**: `CHAT`, `REACTION`.
*   **Maintenance**: `PING`, `PONG`, `LEAVE`, `REMATCH`.

For details, see [Multiplayer Message Protocol](#4.3).

**Sources:** `src/engine/types.ts:63-86`

---

### Entity Mapping: Protocol to Logic

This diagram bridges the natural language concepts of game phases to the specific message types and state properties used in the code.

**Message to State Mapping**
```mermaid
table
    "Game Action" --> "Message Type" --> "State Property Updated"
    "Player joins room" --> "JOIN" --> "opponentName / occupancy"
    "Player ready to start" --> "READY" --> "opponentReady"
    "Firing at enemy" --> "ATTACK" --> "isPlayerTurn"
    "Reporting hit/miss" --> "ATTACK_RESULT" --> "lastAttack / gameStarted"
    "Sending emoji" --> "REACTION" --> "chatMessages"
```

**Sources:** `src/engine/types.ts:63-86`, `src/multiplayer/useMultiplayer.ts:179-240`

### Connection Lifecycle

| Phase | Code Entity / Function | Description |
| :--- | :--- | :--- |
| **Initialization** | `hasPubNubKeys` | Validates `VITE_PUBNUB_PUBLISH_KEY` presence. |
| **Room Creation** | `generateRoomCode` | Creates a random 6-char string for the channel name. |
| **Subscription** | `subscribe(channel)` | Attaches the `listenerRef` to the PubNub instance. |
| **Heartbeat** | `startPingInterval` | Fires `PING` every 15s; expects `PONG` within 10s. |
| **Teardown** | `resetPubNub` | Removes listeners, unsubscribes, and destroys the instance. |

**Sources:** `src/multiplayer/pubnub.ts:9-11`, `src/multiplayer/pubnub.ts:43-50`, `src/multiplayer/useMultiplayer.ts:105-124`, `src/multiplayer/pubnub.ts:30-41`

---