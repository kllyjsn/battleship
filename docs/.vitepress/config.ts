import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'ShipBattle Docs',
    description: 'Technical documentation for the Battleship web application',
    base: '/docs/',
    themeConfig: {
      nav: [
        { text: 'Play', link: 'https://shipbattle.dev' }
      ],
      sidebar: [
        {
          text: 'Overview',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Getting Started', link: '/getting-started' },
            { text: 'App Entry Point', link: '/app-entry-point' },
          ]
        },
        {
          text: 'Game Engine',
          items: [
            { text: 'Overview', link: '/game-engine/' },
            { text: 'Types & Data Model', link: '/game-engine/types-data-model' },
            { text: 'Board Engine', link: '/game-engine/board-engine' },
            { text: 'AI Engine', link: '/game-engine/ai-engine' },
          ]
        },
        {
          text: 'Game Modes',
          items: [
            { text: 'Overview', link: '/game-modes/' },
            { text: 'Single Player', link: '/game-modes/single-player' },
            { text: 'Multiplayer', link: '/game-modes/multiplayer' },
          ]
        },
        {
          text: 'Multiplayer Networking',
          items: [
            { text: 'Overview', link: '/multiplayer-networking/' },
            { text: 'PubNub Integration', link: '/multiplayer-networking/pubnub-integration' },
            { text: 'useMultiplayer Hook', link: '/multiplayer-networking/use-multiplayer-hook' },
            { text: 'Message Protocol', link: '/multiplayer-networking/message-protocol' },
          ]
        },
        {
          text: 'UI Components',
          items: [
            { text: 'Overview', link: '/ui-components/' },
            { text: 'Board & Cell Rendering', link: '/ui-components/board-cell-rendering' },
            { text: 'HUD, Chat & Battle Log', link: '/ui-components/hud-chat-battle-log' },
            { text: 'Ship Roster & Placement', link: '/ui-components/ship-roster-placement' },
            { text: 'Game Over & Replay', link: '/ui-components/game-over-replay' },
            { text: 'Main Menu & Overlays', link: '/ui-components/main-menu-overlays' },
          ]
        },
        {
          text: 'Persistence',
          items: [
            { text: 'Overview', link: '/persistence/' },
            { text: 'Stats & Game Results', link: '/persistence/stats-game-results' },
            { text: 'Achievements', link: '/persistence/achievements' },
            { text: 'Leaderboard', link: '/persistence/leaderboard' },
          ]
        },
        {
          text: 'Audio',
          items: [
            { text: 'Overview', link: '/audio/' },
            { text: 'Sound Effects', link: '/audio/sound-effects' },
            { text: 'Background Music', link: '/audio/background-music' },
          ]
        },
        {
          text: 'Theming',
          items: [
            { text: 'Overview', link: '/theming/' },
            { text: 'Theme Config', link: '/theming/theme-config' },
            { text: 'Global Styles', link: '/theming/global-styles' },
          ]
        },
        {
          text: 'Hooks & Utilities',
          items: [
            { text: 'Overview', link: '/hooks-utilities/' },
            { text: 'Input & Gesture Hooks', link: '/hooks-utilities/input-gesture-hooks' },
            { text: 'Utility Functions', link: '/hooks-utilities/utility-functions' },
          ]
        },
        {
          text: 'Reference',
          items: [
            { text: 'Glossary', link: '/glossary' },
            { text: 'Changelog', link: '/changelog' },
          ]
        },
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/kllyjsn/battleship' }
      ],
      search: {
        provider: 'local'
      }
    },
    appearance: 'dark',
    mermaid: {},
  })
)
