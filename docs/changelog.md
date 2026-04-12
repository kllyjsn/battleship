# Changelog

A complete log of every pull request merged into the project, listed from newest to oldest.

---

## [PR #37 — Fix MongoDB connection retry on transient failures](https://github.com/kllyjsn/battleship/pull/37)

**Status:** Merged | **Changes:** +8 / -4 | **Files changed:** 1

Fixes a bug in `api/lib/mongodb.ts` where a failed MongoDB connection attempt permanently poisons the cached promise. If `client.connect()` throws (e.g., transient network issue, MongoDB temporarily unavailable), `cachedPromise` remained set to the rejected promise and was never reset. All subsequent `getDb()` calls would immediately re-throw the same stale error, making all API endpoints permanently broken until a Vercel cold start.

The fix wraps the connection logic in a `try/catch` that resets `cachedPromise` to `null` on failure, allowing subsequent requests to retry the connection. Follow-up to #36 which introduced the promise-caching pattern.

---

## [PR #36 — Add MongoDB for leaderboard and player state persistence](https://github.com/kllyjsn/battleship/pull/36)

**Status:** Merged | **Changes:** +544 / -72 | **Files changed:** 9

Replaces the in-memory leaderboard API (which reset on every Vercel cold start) with MongoDB-backed persistent storage. Also adds two new API endpoints (`/api/stats`, `/api/achievements`) so player stats and achievements can be synced server-side by callsign, enabling cross-device persistence.

**Key changes:**
- `api/lib/mongodb.ts` — shared MongoDB connection utility with cached client/db
- `api/leaderboard.ts` — rewired from in-memory array to MongoDB `leaderboard` collection
- `api/stats.ts` — new endpoint: GET by player name, POST upserts full stats document
- `api/achievements.ts` — new endpoint: GET by player name, POST merges new achievements

---

## [PR #35 — Game persistence, accessibility, mobile touch targets & code quality improvements](https://github.com/kllyjsn/battleship/pull/35)

**Status:** Merged | **Changes:** +358 / -42 | **Files changed:** 9

Four improvement areas identified after a full codebase audit:

1. **Game State Persistence** — saves/loads the full battle state to `localStorage` with a "Resume Mission" dialog on reload
2. **Accessibility** — ARIA labels on grid cells, `aria-live` region for screen readers, visible `:focus-visible` indicators
3. **Mobile Responsiveness** — cell minimum sizes bumped for better tap targets
4. **Code Quality** — `getAIName()` helper, named timing constants, `BOARD_MAX_INDEX` constant, `ErrorBoundary` component

---

## [PR #34 — Ensure docs build runs on Vercel for shipbattle.dev/docs](https://github.com/kllyjsn/battleship/pull/34)

**Status:** Merged | **Changes:** +5 / -8 | **Files changed:** 3

`shipbattle.dev/docs` was serving the main SPA instead of the VitePress documentation. Root cause: the Vercel build command ran `npx vitepress build` inside `docs/` without first installing the docs subdirectory's own dependencies. Fix adds `npm install` before `npx vitepress build` in the root build script, and adds `"type": "module"` to `docs/package.json`.

---

## [PR #33 — Ocean shimmer reveals ship positions on opponent board](https://github.com/kllyjsn/battleship/pull/33)

**Status:** Merged | **Changes:** +1 / -1 | **Files changed:** 1

One-line fix for a gameplay bug introduced by the ocean shimmer feature (PR #27). Hidden ship cells on the opponent's board used a flat background while empty cells had shimmer, allowing players to visually distinguish ship positions before attacking. The fix applies `cell-ocean-shimmer` to hidden ship cells so they look identical to empty cells.

---

## [PR #32 — Fix docs build: add npm install step and ESM module type](https://github.com/kllyjsn/battleship/pull/32)

**Status:** Merged | **Changes:** +5 / -8 | **Files changed:** 3

Fixes the Vercel deployment failure introduced in #30 by addressing two issues in the docs build pipeline:
1. **Missing dependency install**: Added `npm install` before the VitePress build step
2. **ESM module resolution**: Added `"type": "module"` to `docs/package.json` to fix ESM import errors

---

## [PR #31 — Add missing `relative` class to AttackHeatmap modal panel](https://github.com/kllyjsn/battleship/pull/31)

**Status:** Merged | **Changes:** +1 / -1 | **Files changed:** 1

Adds the missing `relative` class to the `AttackHeatmap` modal's inner panel div. Without it, the absolutely-positioned close button was anchored to the viewport instead of the panel. Identified by Devin Review on PR #27.

---

## [PR #30 — Add VitePress documentation site with all wiki pages](https://github.com/kllyjsn/battleship/pull/30)

**Status:** Merged | **Changes:** +8663 / -3 | **Files changed:** 40

Adds a complete VitePress documentation site under `docs/`, converting all 34 internal wiki pages into organized markdown files with mermaid diagram support and dark theme.

**Key changes:**
- 34 markdown files organized into 10 sections
- VitePress config with full sidebar, nav, local search, and `vitepress-plugin-mermaid`
- `docs:dev` and `docs:build` scripts in `package.json`
- "DOCS" button added to the main menu
- Vercel rewrite rule for `/docs/:path*`

---

## [PR #29 — Show which ship was hit and celebrate sunk ships](https://github.com/kllyjsn/battleship/pull/29)

**Status:** Merged | **Changes:** +201 / -5 | **Files changed:** 5

Adds ship-specific notifications when a ship is hit or sunk, for both single-player and multiplayer modes.

- **Engine change:** `processAttack` now returns `shipName` and `shipId` on hit results (previously only on sunk)
- **Hit banner** — compact toast showing "Hit their Destroyer!" with amber/red styling
- **Sunk banner** — larger celebration toast with glowing border, anchor icons, sparkle particles

---

## [PR #28 — iPhone 16 Pro (393x852) responsive polish](https://github.com/kllyjsn/battleship/pull/28)

**Status:** Merged | **Changes:** +130 / -123 | **Files changed:** 8

Fixes the 10x10 game board and surrounding UI overflowing on iPhone 16 Pro (393x852 viewport). Core fix: cell sizing reduced from `w-[11vw]` to `w-[8.2vw]` with responsive breakpoints.

**Other changes:**
- ShipRoster restructured to horizontal row layout
- MainMenu uses smaller logo/title on mobile, 2x2 button grid
- GameHUD tighter padding on mobile
- GameOver smaller icon/text on mobile

---

## [PR #27 — Military ranks, attack heatmap, danger zone alert, ocean shimmer](https://github.com/kllyjsn/battleship/pull/27)

**Status:** Merged | **Changes:** +616 / -17 | **Files changed:** 12

Four polish features across both SinglePlayer and Multiplayer modes:

1. **Military Rank System** — Ensign to Fleet Admiral based on total wins, with animated rank-up celebration
2. **Post-Game Attack Heatmap** — color-coded 10x10 grid showing all attacks with accuracy stats
3. **Danger Zone Alert** — pulsing "HULL CRITICAL" / "ENEMY FINAL SHIP" warning
4. **Animated Ocean Cells** — subtle CSS shimmer gradient on empty board cells

---

## [PR #26 — Post-game stats, confirm dialog, score popups, and streak badge](https://github.com/kllyjsn/battleship/pull/26)

**Status:** Merged | **Changes:** +248 / -7 | **Files changed:** 7

Four quality-of-life UI improvements:

1. **Post-game stats summary** — 2x2 grid: shots fired, accuracy %, duration, surviving fleet count
2. **Confirm dialog on back navigation** — modal instead of immediately leaving during battle
3. **Floating score popups** — `+10 HIT`, `+60 SUNK`, `+1 MISS` animations
4. **Win streak badge** — flame icon with streak count when streak >= 2

---

## [PR #25 — Reset loading state when switching leaderboard tabs](https://github.com/kllyjsn/battleship/pull/25)

**Status:** Merged | **Changes:** +4 / -1 | **Files changed:** 1

Fixes a bug where the leaderboard loading spinner gets stuck permanently when switching from "Global" to "Local" while a global fetch is in-flight. The `useEffect` early-return path was not resetting `loading` to `false`.

---

## [PR #24 — Show numerical scores on top bar](https://github.com/kllyjsn/battleship/pull/24)

**Status:** Merged | **Changes:** +10 / -3 | **Files changed:** 1

Adds numerical hit-count scores to the battle HUD's top bar next to ALLY/ENEMY labels alongside existing progress bars. ALLY score shows hits you've landed (green, glowing), ENEMY score shows hits on you (red, glowing). Progress bars slightly narrower to accommodate.

---

## [PR #23 — Achievements System, Online Leaderboard, and Mobile UX Polish](https://github.com/kllyjsn/battleship/pull/23)

**Status:** Merged | **Changes:** +6453 / -3853 | **Files changed:** 17

Three major features:

1. **Achievements / Medals System** — 10 achievements across 4 categories, toast notifications, MEDALS panel
2. **Online Leaderboard** — Vercel serverless function with POST/GET, Local/Global tabs, period filters
3. **Mobile UX Polish** — haptic feedback, swipe-to-rotate, board toggle on small screens, responsive touch targets

---

## [PR #22 — Add move-based scoring to HUD and leaderboard](https://github.com/kllyjsn/battleship/pull/22)

**Status:** Merged | **Changes:** +82 / -9 | **Files changed:** 8

Adds a point-based scoring system that tracks score per player move, displays it live in the HUD, and persists to leaderboard.

**Scoring rules:** Hit: 10 pts, Sunk: 60 pts (10 + 50 bonus), Miss: 1 pt

Game-over prompt now appears for all players (win or loss). Leaderboard adds Score column (primary sort) and W/L indicator.

---

## [PR #21 — Fix comms messages stacking vertically](https://github.com/kllyjsn/battleship/pull/21)

**Status:** Merged | **Changes:** +2 / -2 | **Files changed:** 1

Chat messages in the COMMS panel were rendering each character on a separate line. Root cause: the message bubble's `max-w-[85%]` resolved against a shrink-wrapped parent, collapsing to near-zero width. Fix: moved `max-w-[85%]` to the outer wrapper div.

---

## [PR #20 — Diagnostic PubNub error messages, graceful disconnect handling, and early key validation](https://github.com/kllyjsn/battleship/pull/20)

**Status:** Merged | **Changes:** +51 / -15 | **Files changed:** 3

Adds diagnostic error messages for PubNub failures, graceful disconnect handling, and early key validation to improve multiplayer reliability and debugging.

---

## [PR #19 — Add waiting-for-host state to join UI and comprehensive PubNub error handling](https://github.com/kllyjsn/battleship/pull/19)

**Status:** Merged | **Changes:** +25 / -2 | **Files changed:** 2

Adds a waiting-for-host state to the join UI and comprehensive PubNub error handling for a smoother multiplayer join flow.

---

## [PR #18 — Improve PubNub presence detection and connection reliability](https://github.com/kllyjsn/battleship/pull/18)

**Status:** Merged | **Changes:** +259 / -49 | **Files changed:** 5

Improves PubNub presence detection and connection reliability for more stable multiplayer sessions.

---

## [PR #17 — Add opponent timeout and PubNub error handling for join flow](https://github.com/kllyjsn/battleship/pull/17)

**Status:** Merged | **Changes:** +44 / -0 | **Files changed:** 1

Adds opponent timeout handling and PubNub error handling specifically for the multiplayer join flow to prevent infinite waiting states.

---

## [PR #16 — Use shipbattle.dev production domain for shareable room links](https://github.com/kllyjsn/battleship/pull/16)

**Status:** Merged | **Changes:** +1 / -1 | **Files changed:** 1

Updates shareable room links to use the `shipbattle.dev` production domain instead of localhost or other development URLs.

---

## [PR #15 — Fix ship placement auto-select, R-to-rotate visibility, and duplicate leaderboard submissions](https://github.com/kllyjsn/battleship/pull/15)

**Status:** Merged | **Changes:** +35 / -10 | **Files changed:** 3

Fixes three issues: ship placement auto-select behavior, R-to-rotate instruction visibility, and duplicate leaderboard submissions.

---

## [PR #14 — Shareable /join/CODE room links + emoji reactions in chat](https://github.com/kllyjsn/battleship/pull/14)

**Status:** Merged | **Changes:** +282 / -57 | **Files changed:** 6

Adds shareable room links (`/join/CODE`) for easy multiplayer invites and emoji reactions in the in-game chat system.

---

## [PR #13 — Capture game duration at end-time to prevent inflation on re-renders](https://github.com/kllyjsn/battleship/pull/13)

**Status:** Merged | **Changes:** +12 / -6 | **Files changed:** 2

Fixes game duration tracking by capturing the duration at the moment the game ends, preventing timer inflation from component re-renders.

---

## [PR #12 — Remove Supabase auth, add localStorage leaderboard with session-name prompt](https://github.com/kllyjsn/battleship/pull/12)

**Status:** Merged | **Changes:** +338 / -536 | **Files changed:** 8

Removes Supabase authentication in favor of a simpler localStorage-based leaderboard with a session-name prompt for player identification.

---

## [PR #11 — Add naval-themed OG image and social media meta tags](https://github.com/kllyjsn/battleship/pull/11)

**Status:** Merged | **Changes:** +18 / -0 | **Files changed:** 1

Adds a naval-themed Open Graph image and social media meta tags for better link preview appearance when sharing.

---

## [PR #10 — Add PKCE code exchange and error handling for Google OAuth flow](https://github.com/kllyjsn/battleship/pull/10)

**Status:** Merged | **Changes:** +29 / -9 | **Files changed:** 2

Adds PKCE code exchange and error handling to the Google OAuth flow for more secure authentication.

---

## [PR #9 — UX improvements from user feedback (mobile, undo, AI, turn indicator)](https://github.com/kllyjsn/battleship/pull/9)

**Status:** Merged | **Changes:** +94 / -11 | **Files changed:** 4

UX improvements based on user feedback covering mobile layout, undo functionality, AI behavior, and turn indicators.

---

## [PR #8 — Add 8 gameplay features (animations, stats, battle log, timer, replay, keyboard nav, themes, spectator)](https://github.com/kllyjsn/battleship/pull/8)

**Status:** Merged | **Changes:** +1916 / -49 | **Files changed:** 16

Major feature drop adding 8 gameplay enhancements:
- Hit/miss/sunk animations
- Player stats tracking
- Battle log
- Game timer
- Replay system
- Keyboard navigation
- Theme system (4 themes)
- Spectator mode framework

---

## [PR #7 — Integrate Supabase for Google auth and persistent game stats DB](https://github.com/kllyjsn/battleship/pull/7)

**Status:** Merged | **Changes:** +692 / -7 | **Files changed:** 8

Integrates Supabase for Google authentication and persistent game statistics database storage.

---

## [PR #6 — Add connection timeout to prevent infinite spinner & fix cramped GameOver buttons](https://github.com/kllyjsn/battleship/pull/6)

**Status:** Merged | **Changes:** +29 / -2 | **Files changed:** 2

Adds connection timeout handling to prevent infinite loading spinners and fixes cramped button layout on the GameOver screen.

---

## [PR #5 — Add AI algorithm synopsis and gameplay enjoyment sections to homepage](https://github.com/kllyjsn/battleship/pull/5)

**Status:** Merged | **Changes:** +104 / -2 | **Files changed:** 1

Adds AI algorithm synopsis and gameplay enjoyment sections to the main menu homepage for a richer landing experience.

---

## [PR #4 — Move music visualizer to top nav and fix playback on mobile](https://github.com/kllyjsn/battleship/pull/4)

**Status:** Merged | **Changes:** +77 / -50 | **Files changed:** 3

Moves the music visualizer component to the top navigation bar and fixes audio playback issues on mobile devices.

---

## [PR #3 — Merge pull request #1](https://github.com/kllyjsn/battleship/pull/3)

**Status:** Merged | **Changes:** +12592 / -0 | **Files changed:** 44

Merge of the initial game implementation from the feature branch into main.

---

## [PR #2 — Mobile-optimize HUD/chat + add Hawaiian tiki background music](https://github.com/kllyjsn/battleship/pull/2)

**Status:** Merged | **Changes:** +273 / -64 | **Files changed:** 6

Mobile-optimizes the HUD and chat panels, and adds Hawaiian tiki background music to the game.

---

## [PR #1 — Battleship: Naval Combat Game with Underwater Command Center Theme](https://github.com/kllyjsn/battleship/pull/1)

**Status:** Merged | **Changes:** +12592 / -0 | **Files changed:** 44

The initial full game implementation featuring:
- 10x10 grid-based naval combat
- Single-player with 3 AI difficulty levels (Hunt/Target algorithm)
- Real-time multiplayer via PubNub
- Underwater Command Center UI theme with CRT effects
- Ship placement with drag-and-drop and click-to-place
- Sound effects and background music
- Responsive design for mobile and desktop
