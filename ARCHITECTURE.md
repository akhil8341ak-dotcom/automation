# CreatorFlow AI — Architectural Blueprint & Technical Specification

## 1. System Overview

CreatorFlow AI is structured as a modular TypeScript monorepo with clean separation between shared contracts, the workflow execution engine, the backend REST/SSE server, and the React visual frontend.

```
+------------------------------------------------------------------------------------+
|                                  @creatorflow/client                               |
|   React 18 + Vite + Tailwind + @xyflow/react                                       |
|   - Visual Node Canvas, MiniMap, Controls, Background                              |
|   - Node Library Palette & Configuration Drawer                                    |
|   - Execution Inspector (Step Telemetry, Outputs, Logs)                            |
|   - AI YouTube Studio (Topics, Script, Storyboard, Voice, Video, QA, Publish)      |
|   - Human Approval Inbox (Diff & Payload Review, Sign-Off)                         |
|   - Analytics & Monetization Readiness Dashboard                                   |
+------------------------------------------------------------------------------------+
                                           │  HTTP REST / SSE (/api/events)
                                           ▼
+------------------------------------------------------------------------------------+
|                                  @creatorflow/server                               |
|   Express 4 + Node.js 26 (ESM)                                                     |
|   - SQLite DatabaseSync (Persistent DB: workflows, executions, gates, channels)    |
|   - Server-Sent Events (SSE) Dispatcher                                            |
|   - Static Media Server (/media/... renders, audio, scene cards)                   |
|   - REST API Route Controllers                                                     |
+------------------------------------------------------------------------------------+
                                           │  Method Calls & Event Emitters
                                           ▼
+------------------------------------------------------------------------------------+
|                                  @creatorflow/engine                               |
|   Execution Engine & Domain Services                                               |
|   - DependencyGraph: Kahn's topological sort & cycle detection                     |
|   - WorkflowEngine: DAG dispatcher, branch router, retry & pause manager           |
|   - Node Executors: 22 extensible general-purpose & YouTube domain nodes           |
|   - Specialized Services:                                                          |
|       * AiProviderService: Gemini, OpenAI, Claude, Ollama, Mock                    |
|       * TtsService: Edge-TTS (Neural), OpenAI, Loudnorm filter                     |
|       * AssetService: Pexels API, Pixabay API, Procedural SVG Cards                |
|       * FfmpegRenderService: 9:16 Shorts & 16:9 MP4, Subtitles, Audio Ducking      |
|       * QaService: FFprobe, Blackdetect, Silencedetect, QA Scorecard               |
|       * YouTubeService: Resumable uploads, OAuth2, Monetization policy auditor     |
|   - WorkflowScheduler: 5-field cron matcher with timezone support                  |
+------------------------------------------------------------------------------------+
                                           │  Types, Schemas & Templates
                                           ▼
+------------------------------------------------------------------------------------+
|                                  @creatorflow/shared                               |
|   Zod Schemas, Domain Interfaces, Master Node Catalog, 10 Production Templates     |
+------------------------------------------------------------------------------------+
```

---

## 2. DAG Execution Engine Architecture

### 2.1 Cycle Detection & Topological Sort (Kahn's Algorithm)
Located in `packages/engine/src/dag/graph.ts`:
1. Constructs an in-degree map for all active nodes in the workflow.
2. Nodes with in-degree 0 (triggers or starting nodes) are enqueued.
3. As each node is dequeued, in-degree values for all connected dependents are decremented.
4. If all nodes are visited, a valid linear execution queue is produced.
5. If any nodes remain with in-degree > 0, an error specifying the exact cycle participants is thrown before execution starts.

### 2.2 Branch Routing & Deactivation
In `packages/engine/src/execution/engine.ts`:
- Nodes returning specific handle IDs (e.g. `IfElseExecutor` returning `condition-true` or `condition-false`, or `SwitchExecutor` returning `case-shorts`):
- Any outgoing edge whose `sourceHandle` does **not** match the returned active handle marks its target node and all downstream children as `skipped`.
- Skipped nodes do not execute and do not consume API tokens or compute resources.

### 2.3 Human Approval Gate State Machine
When an `approval-gate` node executes:
1. It records an `ApprovalGate` record in the database with payload, gate title, category, and creation timestamp.
2. The node state is set to `paused`.
3. The overall execution record status is set to `paused`.
4. An `execution:paused` event is broadcast via SSE to the frontend, illuminating the amber badge in the top navigation.
5. Execution safely suspends without holding active process threads.
6. When the human reviewer approves the gate via `/api/approvals/:id/decide`, `engine.resumeExecution()` marks the gate node as `success` and immediately resumes the remaining nodes in the topological queue.

---

## 3. Media Production & FFmpeg Pipeline

### 3.1 Audio Synthesis & Volume Normalization
Located in `packages/engine/src/services/tts/ttsService.ts`:
- Executes Microsoft Edge Neural TTS CLI (`edge-tts --voice ... --text ... --write-media ...`).
- Applies FFmpeg audio normalization using the **EBU R128** standard (`loudnorm=I=-16:TP=-1.5:LRA=11`), ensuring uniform broadcast loudness across all scenes.

### 3.2 Visual Asset Acquisition & Procedural Generation
Located in `packages/engine/src/services/media/assetService.ts`:
- **Stock Footage**: Adapters for Pexels and Pixabay query licensed commercial-use media.
- **Procedural Scene Cards**: If external stock APIs are unconfigured or fail, a zero-cost procedural generator constructs high-resolution 1080x1920 (Shorts) or 1920x1080 (Landscape) SVG visual cards with glowing accents, scene markers, and typography, ensuring zero copyright or license risk.

### 3.3 FFmpeg Rendering Engine
Located in `packages/engine/src/services/render/ffmpegService.ts`:
- **Standardized Scene Fragments**: Each scene asset is converted into an MP4 fragment scaled to target resolution (`scale=w:h:force_original_aspect_ratio=increase,crop=w:h`) with subtle cinematic zoom animation (`zoompan`).
- **Concatenation**: Scene fragments are concatenated using FFmpeg's concat demuxer.
- **Subtitles**: Formatted `.srt` files are generated from storyboard scene timings and burnt into the video stream with bold styling, black outline, and responsive vertical margins.
- **Audio Ducking**: Primary narration audio is mixed with background music using sidechain compression or ducking filters so music drops by ~80% during narration.
- **Thumbnail Capture**: An automatic cover frame is captured at the midpoint of the video.

### 3.4 Automated QA Inspection
Located in `packages/engine/src/services/qa/qaService.ts`:
- **Integrity**: Verifies file existence and minimum size.
- **Format Match**: Validates duration (< 60s for Shorts, > 60s for Long-form).
- **Aspect Ratio**: Verifies vertical 9:16 vs landscape 16:9 container dimensions.
- **Black Frames**: Uses FFmpeg filter `blackdetect=d=0.5:pix_th=0.10` to detect black screen dropouts.
- **Silence**: Uses `silencedetect=noise=-30dB:d=1.5` to identify dropped narration.

---

## 4. YouTube Publishing & Policy Architecture

Located in `packages/engine/src/services/youtube/youtubeService.ts`:
1. **OAuth2 Flow**: Manages authorization code exchange for access and refresh tokens.
2. **Resumable Upload Protocol**: Sends chunked PUT requests to `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable`.
3. **Safety Enforcement**:
   - Enforces default privacy status of `private` or `unlisted`.
   - Injects mandatory AI Synthetic Media disclosures into description and video snippet data.
4. **Monetization Readiness Audit**: Scores channel content against YouTube Partner Program guidelines for originality, advertiser suitability, and reused content.

---

## 5. Database Layer (`node:sqlite`)

Located in `packages/server/src/db/index.ts`:
- Powered by modern Node 26 native `DatabaseSync` (zero node-gyp native compilation needed).
- WAL mode (`PRAGMA journal_mode = WAL;`) for concurrent read/write throughput.
- Automatic table migration on server launch.
- Automatic seeding of all 10 production workflow templates and default channel configuration.
