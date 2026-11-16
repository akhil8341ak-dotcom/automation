# CreatorFlow AI — Implementation Plan & Architecture Blueprint

## Executive Overview
CreatorFlow AI is a production-grade, extensible, n8n-style visual workflow automation platform designed specifically for AI-assisted YouTube video production and channel monetization readiness. It balances autonomous automation with essential human editorial approval gates.

---

## System Architecture

```
+-----------------------------------------------------------------------------------+
|                                CREATORFLOW AI                                     |
+-----------------------------------------------------------------------------------+
|  FRONTEND (React + Vite + Tailwind + @xyflow/react)                               |
|  - Visual DAG Workflow Canvas (Nodes, Ports, Execution Status, Step Inspector)   |
|  - AI YouTube Studio (Topic Scout, Script Lab, Storyboard, Asset Deck, QA Viewer)|
|  - Human Approval Inbox (Diff review, Script approval, Video & Meta sign-off)    |
|  - Analytics & Monetization Hub (Real YouTube KPIs, Watch-time, Retention loops)  |
|  - Content Library & Credential Vault (Secure API keys, OAuth tokens)            |
+-----------------------------------------------------------------------------------+
                                         │  REST / WebSocket (SSE)
                                         ▼
+-----------------------------------------------------------------------------------+
|  BACKEND API SERVER (Node.js + TypeScript + Express / Fastify)                    |
|  - Workflow Lifecycle API (CRUD, versioning, export/import JSON)                  |
|  - Real-Time Execution Dispatcher & Event Stream                                  |
|  - YouTube OAuth2 & Channel Sync Controller                                       |
|  - Media Storage & Asset Manager                                                  |
|  - Persistent SQLite / PostgreSQL Database with schema migrations                 |
+-----------------------------------------------------------------------------------+
                                         │  Jobs & Pipeline Events
                                         ▼
+-----------------------------------------------------------------------------------+
|  WORKFLOW EXECUTION ENGINE (packages/engine)                                      |
|  - DAG Resolver: Cycle detection (Kahn's algo), dependency graph, topological sort |
|  - Execution State Machine: Node states (idle, queued, running, done, error, held)|
|  - Node Runners: General Purpose + YouTube Production Domain Nodes                 |
|  - Approval Gate Manager: Pauses execution safely, persists state, resumes on sign|
|  - Resilient Queue & Timezone-aware Scheduler                                     |
+-----------------------------------------------------------------------------------+
                                         │  Service Adapters
                                         ▼
+-----------------------------------------------------------------------------------+
|  SPECIALIZED PRODUCTION ENGINES                                                   |
|  1. AI Adapter Service: Gemini, OpenAI, Claude, Local/Ollama, Mock/Zero-Cost Mode |
|  2. Research & Fact-Check Engine: Claim extraction, citation check, scoring       |
|  3. Voiceover TTS Engine: Edge-TTS, Web Audio, OpenAI TTS, Audio Normalization    |
|  4. Visual Asset Engine: Pexels/Pixabay API, Generative SVG/Canvas, Fallback deck|
|  5. FFmpeg Video Renderer: 9:16 Shorts & 16:9 Long-form, subtitles, audio ducking |
|  6. Automated QA Engine: Black frame, silence, duration & resolution scorecards  |
|  7. YouTube Publisher: Resumable upload, private-by-default, metadata, disclosure|
|  8. Monetization Policy Engine: YouTube reuse, spam & AI disclosure compliance    |
+-----------------------------------------------------------------------------------+
```

---

## 9 Implementation Phases

- [x] **Phase 1: Foundation & Project Setup**
  - Monorepo structure (`packages/shared`, `packages/engine`, `packages/server`, `packages/client`).
  - TypeScript, ESLint, package dependencies, SQLite database layer with full migration support.
  - Environment configuration (`.env.example`) and security guidelines.

- [ ] **Phase 2: Core Workflow Execution Engine**
  - Workflow schema & Zod validation.
  - Node definitions (Triggers, Flow logic, Data manipulation, AI, Media, YouTube).
  - DAG engine with topological sorting, cycle detection, branching (IF/ELSE, Switch, Merge).
  - Persistent execution logs, step outputs, retries, cancellation, and human approval holds.
  - Unit and integration tests for engine correctness.

- [ ] **Phase 3: Visual Workflow Builder Canvas (n8n-Style UI)**
  - Interactive canvas with `@xyflow/react`.
  - Node library palette with category filters and search.
  - Custom node cards with dynamic status badges, input/output port types, configuration drawer.
  - Live execution playback with active node highlighting, timing, and error inspector.
  - Workflow save, duplicate, JSON export/import, and templates catalog.

- [ ] **Phase 4: AI & Research Infrastructure**
  - Multi-provider AI adapter (Gemini, OpenAI, Claude, Local Ollama, Mock provider).
  - Topic discovery & scoring engine (novelty, intent, audience interest).
  - Script generation engine (Shorts & Long-form, hook options, section regeneration).
  - Automated claim extraction & fact-checking audit.

- [ ] **Phase 5: Media Production & FFmpeg Rendering Pipeline**
  - TTS audio synthesis (Edge-TTS / Node speech synthesis / Audio stitcher).
  - Storyboard generator & visual asset collection (Pexels, Pixabay, algorithmic visual cards).
  - FFmpeg rendering engine (9:16 vertical Shorts & 16:9 widescreen, transitions, synced captions, audio ducking).
  - Automated Quality Assurance (Black frame detection, silence detection, duration check, QA scorecard).

- [ ] **Phase 6: End-to-End YouTube Studio & Publishing**
  - Production studio view (Topic -> Script -> Storyboard -> Render -> QA -> Metadata).
  - YouTube Data API v3 OAuth2 authorization flow & Channel sync.
  - Resumable video upload with UNLISTED/PRIVATE default safety enforcement.
  - Human approval gates at critical checkpoints (Script, Render, Publishing).

- [ ] **Phase 7: Analytics, Monetization Readiness & Feedback Loop**
  - YouTube Analytics integration & KPI tracking (views, retention, watch time, CTR).
  - Monetization readiness checklist & YouTube policy auditor (AI disclosure, reused content check).
  - Content feedback loop: analytics driving future topic recommendations.

- [ ] **Phase 8: 10 Real Reusable Workflow Templates**
  - YouTube Shorts Automated Pipeline
  - Long-Form Documentary / Explainer Pipeline
  - Topic Research & Viral Angle Generator
  - Script Fact-Checking & Policy Verification Gate
  - Automated Voiceover & Audio Mastering
  - Storyboard & Asset Fetching
  - Full FFmpeg Render & QA Scorecard
  - Private YouTube Upload with Human Sign-off
  - Scheduled Weekly Production Loop
  - Analytics-Driven Topic Optimization

- [ ] **Phase 9: Comprehensive Testing, Documentation & Audit**
  - Unit, integration, and E2E validation tests.
  - Complete documentation suite (README, ARCHITECTURE, SECURITY, DEPLOYMENT, etc.).
  - Verification against Definition of Done.
