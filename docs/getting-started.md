---
title: "Getting Started & Configuration"
---

# Getting Started & Configuration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [.env.example](https://github.com/kllyjsn/battleship/blob/main/.env.example)
- [package.json](https://github.com/kllyjsn/battleship/blob/main/package.json)
- [tsconfig.app.json](https://github.com/kllyjsn/battleship/blob/main/tsconfig.app.json)
- [tsconfig.json](https://github.com/kllyjsn/battleship/blob/main/tsconfig.json)
- [tsconfig.node.json](https://github.com/kllyjsn/battleship/blob/main/tsconfig.node.json)
- [vercel.json](https://github.com/kllyjsn/battleship/blob/main/vercel.json)
- [vite.config.ts](https://github.com/kllyjsn/battleship/blob/main/vite.config.ts)

</details>



This page provides the technical requirements and procedures for setting up the Battleship development environment, configuring external service integrations, and deploying the application to production.

## Environment Requirements

The project is built as a modern Single Page Application (SPA) using React and Vite. It requires Node.js for dependency management and build orchestration.

### Key Dependencies
- **Vite**: Used as the frontend build tool and development server `package.json:41`.
- **TypeScript**: The codebase is strictly typed using TypeScript 5.6+ `package.json:39`.
- **PubNub**: Provides the real-time messaging infrastructure for multiplayer functionality `package.json:16`.
- **Tailwind CSS**: Utilized for styling with custom CRT and nautical themes `package.json:38`.

## Installation & Local Development

To initialize the project locally, follow the standard Node.js workflow.

1.  **Clone and Install**:
    ```bash
    git clone https://github.com/kllyjsn/battleship
    cd battleship
    npm install
    ```
2.  **Run Development Server**:
    Execute `npm run dev` `package.json:7` to start the Vite development server. This provides Hot Module Replacement (HMR).
3.  **Production Build**:
    Run `npm run build` `package.json:8`, which executes `tsc -b` for type checking followed by `vite build` for asset minification.

### Development Workflow Diagram
The following diagram illustrates the relationship between the local development environment and the build tools.

**Local Development Lifecycle**
```mermaid
graph TD
  subgraph "DevEnvironment"
    ["package.json"] --> ["npm install"]
    ["npm run dev"] --> ["Vite Dev Server"]
    ["Vite Dev Server"] -- "HMR" --> ["Browser"]
  end

  subgraph "BuildPipeline"
    ["npm run build"] --> ["tsc -b"]
    ["tsc -b"] -- "Type Check" --> ["vite build"]
    ["vite build"] -- "Bundle" --> ["dist/"]
  end

  ["tsconfig.app.json"] -- "Config" --> ["tsc -b"]
  ["vite.config.ts"] -- "Alias: @/*" --> ["vite build"]
```
Sources: `package.json:6-11`, `tsconfig.app.json:11-14`, `vite.config.ts:5-12`

## Environment Configuration

The application relies on environment variables for external service integration. These are managed via `.env` files and prefixed with `VITE_` to be accessible in the client-side code.

### Supabase Configuration
The application uses Supabase for persistent data storage, such as the global leaderboard.
- `VITE_SUPABASE_URL`: The API URL for your Supabase project `.env.example:1`.
- `VITE_SUPABASE_ANON_KEY`: The anonymous public key for client-side interactions `.env.example:2`.

### PubNub Configuration
While not explicitly in the `.env.example`, the `pubnub` package is a core dependency `package.json:16`. Keys must be configured to enable the multiplayer signaling layer.

| Variable | Purpose |
| :--- | :--- |
| `VITE_PUBNUB_PUBLISH_KEY` | Allows the client to send game signals (ATTACK, JOIN, etc.) |
| `VITE_PUBNUB_SUBSCRIBE_KEY` | Allows the client to listen for peer game events |

Sources: `.env.example:1-3`, `package.json:16`

## Deployment & Routing

The application is optimized for deployment on **Vercel**. It includes specific configurations to handle the SPA routing and API serverless functions.

### Vercel Configuration (`vercel.json`)
Since the application uses `react-router-dom` `package.json:19`, all non-API requests must be redirected to the root `index.html` to allow client-side routing to take over.

- **API Rewrites**: Requests to `/api/*` are routed to the corresponding serverless functions in the `/api` directory `vercel.json:3`.
- **SPA Fallback**: All other paths are rewritten to `/` to support deep-linking (e.g., direct navigation to a multiplayer room) `vercel.json:4`.

### Deployment Data Flow
This diagram shows how the deployment configuration maps network requests to the codebase structure.

**Vercel Routing & Deployment Architecture**
```mermaid
graph LR
  ["User Request"] -- "/api/leaderboard" --> ["Rewriter"]
  ["User Request"] -- "/room/ABCD" --> ["Rewriter"]

  subgraph "vercel.json"
    ["Rewriter"] -- "source: /api/(.*)" --> ["/api/$1"]
    ["Rewriter"] -- "source: /(.*)" --> ["/ (index.html)"]
  end

  subgraph "Application"
    ["/api/$1"] --> ["Serverless Functions"]
    ["/ (index.html)"] --> ["App.tsx"]
    ["App.tsx"] -- "react-router-dom" --> ["Multiplayer.tsx"]
  end
```
Sources: `vercel.json:1-6`, `package.json:19`

## TypeScript Configuration

The project uses a project reference architecture for TypeScript, separating the application code from the build tool configuration.

- **`tsconfig.json`**: The root configuration that references the app and node configs `tsconfig.json:3-10`.
- **`tsconfig.app.json`**: Configures the browser environment (ES2020, DOM) and sets up the `@/*` path alias to the `src/` directory `tsconfig.app.json:4-14`.
- **`tsconfig.node.json`**: Configures the environment for `vite.config.ts` using ES2022 `tsconfig.node.json:4-23`.

### Path Aliasing
The codebase uses absolute imports via the `@` prefix. This is defined in both the TypeScript configuration and the Vite configuration to ensure consistency between type-checking and bundling.
- **TS**: `"@/*": ["./src/*"]` `tsconfig.app.json:13`.
- **Vite**: `resolve: { alias: { "@": path.resolve(__dirname, "./src") } }` `vite.config.ts:8-10`.

Sources: `tsconfig.json:1-17`, `tsconfig.app.json:1-32`, `tsconfig.node.json:1-24`, `vite.config.ts:1-12`

---