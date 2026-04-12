---
title: "Background Music & Visualizer"
---

# Background Music & Visualizer

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [public/tiki-music.mp3](https://github.com/kllyjsn/battleship/blob/main/public/tiki-music.mp3)
- [src/components/BoardToggle.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/BoardToggle.tsx)
- [src/components/MusicVisualizer.tsx](https://github.com/kllyjsn/battleship/blob/main/src/components/MusicVisualizer.tsx)
- [src/hooks/useBackgroundMusic.ts](https://github.com/kllyjsn/battleship/blob/main/src/hooks/useBackgroundMusic.ts)
- [src/hooks/useHaptics.ts](https://github.com/kllyjsn/battleship/blob/main/src/hooks/useHaptics.ts)

</details>



The Battleship application features an integrated audio system that provides ambient background music and real-time frequency visualization. This system is built using the Web Audio API and is designed to be globally accessible while maintaining efficient resource management through a reference-counted singleton pattern.

## useBackgroundMusic.ts

The `useBackgroundMusic` hook manages the lifecycle of the background music, including the initialization of the `AudioContext`, the connection of the audio processing pipeline, and the extraction of frequency data for visual feedback.

### Singleton Architecture
To ensure that only one instance of the audio element and its associated context exists—even if the hook is mounted in multiple components—the implementation uses shared module-level variables:

| Variable | Type | Purpose |
| :--- | :--- | :--- |
| `sharedAudio` | `HTMLAudioElement` | The underlying audio player for `tiki-music.mp3` `src/hooks/useBackgroundMusic.ts:5-5`. |
| `sharedContext` | `AudioContext` | The Web Audio API context `src/hooks/useBackgroundMusic.ts:6-6`. |
| `sharedAnalyser` | `AnalyserNode` | Node used to extract real-time frequency data `src/hooks/useBackgroundMusic.ts:7-7`. |
| `refCount` | `number` | Tracks how many components are currently using the hook `src/hooks/useBackgroundMusic.ts:9-9`. |

### Audio Pipeline
The pipeline connects the audio source to an analyzer and finally to the hardware output. The `getOrCreateAudio` function handles this setup `src/hooks/useBackgroundMusic.ts:12-42`.

#### Audio Processing Flow
The diagram below illustrates how the system connects the raw MP3 data to the visualizer and the speakers.

**Audio Pipeline Diagram**
```mermaid
graph LR
    subgraph "Audio Source"
        ["sharedAudio (HTMLAudioElement)"] -- "createMediaElementSource" --> ["sharedSource (MediaElementAudioSourceNode)"]
    end

    subgraph "Processing Node"
        ["sharedSource"] --> ["sharedAnalyser (AnalyserNode)"]
        ["sharedAnalyser"] -- "getByteFrequencyData" --> ["freqData (State)"]
    end

    subgraph "Output"
        ["sharedAnalyser"] --> ["sharedContext.destination"]
    end

    ["freqData (State)"] -. "Prop Drilling" .-> ["MusicVisualizer.tsx"]
```
Sources: `src/hooks/useBackgroundMusic.ts:21-42`, `src/hooks/useBackgroundMusic.ts:80-87`

### Frequency Data Extraction
The hook runs a `requestAnimationFrame` loop when music is playing `src/hooks/useBackgroundMusic.ts:79-89`. It extracts frequency data into 8 discrete bars:
1.  **FFT Configuration**: The `fftSize` is set to 64 `src/hooks/useBackgroundMusic.ts:24-24`, providing a low-resolution but high-performance frequency map.
2.  **Bin Selection**: It skips the DC component (index 0) and samples the frequency spectrum at calculated intervals to fill an 8-element array `src/hooks/useBackgroundMusic.ts:81-87`.
3.  **Normalization**: Values are normalized to a 0.0 - 1.0 range by dividing the byte frequency data by 255 `src/hooks/useBackgroundMusic.ts:85-85`.

### Resource Management
The hook uses `refCount` to ensure resources are cleaned up only when the last consumer unmounts.
*   **Mount**: Increments `refCount` `src/hooks/useBackgroundMusic.ts:50-50`.
*   **Unmount**: Decrements `refCount`. If it reaches zero, the audio is paused, the context is closed, and all shared variables are nulled `src/hooks/useBackgroundMusic.ts:52-64`.

Sources: `src/hooks/useBackgroundMusic.ts:1-132`

---

## MusicVisualizer.tsx

The `MusicVisualizer` component is a functional UI element that renders a compact bar-graph representation of the frequency data provided by the hook. It also serves as the primary toggle button for playback.

### Implementation Details
*   **Dynamic Scaling**: The height of the 5 rendered bars (a subset of the 8 bars extracted by the hook) is calculated using `Math.max(2, level * 14)` pixels `src/components/MusicVisualizer.tsx:35-35`.
*   **Color Transition**: The bars use a green glow (`rgba(57, 255, 20, ...)`) when active, with opacity tied to the frequency intensity `src/components/MusicVisualizer.tsx:36-37`.
*   **State Handling**: When `isPlaying` is false, the visualizer renders flat 2px bars in a muted slate color `src/components/MusicVisualizer.tsx:35-38`.

**Component Relationship Diagram**
```mermaid
graph TD
    subgraph "Logic Layer (useBackgroundMusic.ts)"
        [useBackgroundMusic] -- "isPlaying" --> [MusicVisualizer]
        [useBackgroundMusic] -- "freqData" --> [MusicVisualizer]
        [useBackgroundMusic] -- "toggle()" --> [MusicVisualizer]
    end

    subgraph "UI Layer (MusicVisualizer.tsx)"
        [MusicVisualizer] -- "onClick" --> [toggle]
        [MusicVisualizer] -- "Render" --> [SVG Icons: Music/Music2]
        [MusicVisualizer] -- "Map" --> [CSS Animated Bars]
    end
```
Sources: `src/components/MusicVisualizer.tsx:9-45`, `src/hooks/useBackgroundMusic.ts:123-131`

---

## Technical Constraints & Browser Compatibility

### Autoplay Policy
Modern browsers prevent `AudioContext` from starting automatically. The `play` function in `useBackgroundMusic.ts` explicitly calls `sharedContext.resume()` within a user-initiated event (the `toggle` click) to satisfy these security requirements `src/hooks/useBackgroundMusic.ts:103-105`.

### Haptic Feedback Integration
While the visualizer handles audio, the application uses a separate `useHaptics` hook to provide tactile feedback during game events (hits, misses, and victories) using the `navigator.vibrate` API `src/hooks/useHaptics.ts:6-14`.

| Event | Pattern (ms) | File Reference |
| :--- | :--- | :--- |
| **Tap** | 15 | `src/hooks/useHaptics.ts:19-19` |
| **Hit** | 40 | `src/hooks/useHaptics.ts:21-21` |
| **Sunk** | [60, 50, 80] | `src/hooks/useHaptics.ts:23-23` |
| **Win** | [30, 40, 30, 40, 100] | `src/hooks/useHaptics.ts:25-25` |

Sources: `src/hooks/useBackgroundMusic.ts:100-111`, `src/hooks/useHaptics.ts:16-31`

---