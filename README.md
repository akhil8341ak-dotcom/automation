# CreatorFlow AI — Autonomous AI YouTube Automation Platform

> **An extensible, visual n8n-style workflow automation platform purpose-built for producing high-retention AI-assisted YouTube videos, maintaining editorial quality, and helping channels work toward monetization.**

---

## 🌟 Overview & Core Principles

**CreatorFlow AI** combines the power of visual DAG workflow automation with an end-to-end AI video studio. Rather than generating low-quality repetitive spam, CreatorFlow AI is engineered for **originality, factual integrity, and policy compliance** with built-in human approval gates at key checkpoints.

- **Visual DAG Workflow Engine**: Drag-and-drop React Flow canvas, cycle detection (Kahn's algorithm), dependency resolution, branching (`if-else`, `switch`, `merge`), retries, and step-level telemetry.
- **₹0 / Zero-Cost Default Operation**: Built-in support for **Edge Neural TTS** (100+ natural human voices with zero API keys needed) and **FFmpeg 9.0.2** media rendering.
- **Multi-Provider AI Adapters**: Drop-in support for **Google Gemini** (generous free tier), OpenAI GPT-4o, Anthropic Claude, Local Ollama (`llama3:8b`), or an offline deterministic generator.
- **Human-in-the-Loop Approval Gates**: Execution pauses automatically before expensive rendering or public publishing, allowing creators to inspect scripts, claim citations, and video outputs.
- **Automated QA Scorecard**: FFprobe and FFmpeg filters automatically inspect rendered containers for black frames (`blackdetect`), audio clipping, silence dropouts (`silencedetect`), dimensions, and duration compliance.
- **Monetization & Policy Readiness**: Built-in checks against the official YouTube Partner Program (YPP) guidelines for synthetic media disclosure, reused content risk, and advertiser suitability.
- **10 Production-Ready Templates**: Pre-configured pipelines for Shorts, long-form documentary explainers, script drafting, fact-checking audits, and analytics improvement loops.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ (Node v26.1.0 tested and supported; uses native `node:sqlite`)
- **FFmpeg & FFprobe**: Installed and available on system PATH (FFmpeg 9.0.2 supported)
- **Python 3.10+** (Optional, for Edge TTS): `python -m pip install edge-tts`

### 2. Installation
```bash
# Clone or navigate to the repository
cd automation

# Install root & workspace dependencies
npm install

# Initialize local environment variables
cp .env.example .env
```

### 3. Build the Monorepo
```bash
# Compiles @creatorflow/shared, @creatorflow/engine, @creatorflow/server, and @creatorflow/client
npm run build
```

### 4. Run the Platform
```bash
# Option A: Single-port production mode (Express serves API + Web UI at http://localhost:3001)
npm start

# Option B: Concurrent development mode (Express on :3001 + Vite HMR on :5173)
npm run dev
```

Visit **`http://localhost:3001`** in your browser.

---

## 📂 Repository Architecture

```
creatorflow-ai/
├── packages/
│   ├── shared/         # Zod schemas, TypeScript types, 22-node catalog, 10 templates
│   ├── engine/         # DAG resolver, Kahn's cycle detector, node executors, scheduler
│   ├── server/         # Express REST API, SQLite DB (DatabaseSync), SSE live stream
│   └── client/         # React + Vite + Tailwind + @xyflow/react desktop UI
├── data/               # Persistent SQLite database (creatorflow.db) & media storage
├── scripts/            # Development runner scripts
└── docs/               # Architecture, Security, Deployment, and Setup Guides
```

---

## 🛠️ The 10 Production Workflow Templates

| # | Template Name | Category | Primary Nodes |
|---|---------------|----------|---------------|
| 1 | **AI-Assisted YouTube Shorts Production** | YouTube Production | Topic Scout → Script Lab → Fact Check → Script Gate → Edge TTS → Storyboard → FFmpeg 9:16 → QA Engine → Sign-Off Gate → SEO Meta → YouTube Upload |
| 2 | **Long-Form YouTube Explainer Production** | YouTube Production | 16:9 Scriptwriter → Claim Audit → Gate → Mastered Voice → Storyboard → Thumbnail Studio → FFmpeg 1080p → QA Check → Chapters |
| 3 | **Topic Research & Script Drafting** | Ideation & Scripting | Topic Seed → Viral Angle Scout → Draft Script → Title & Tag Generator |
| 4 | **Script Fact-Checking & Editorial Gate** | Quality & Safety | Input Script → Factual Claim Audit → Monetization Risk Filter → Editorial Sign-Off Gate |
| 5 | **Voiceover Synthesis & Audio Mastering** | Audio Production | Input Script → Edge TTS Engine → EBU R128 Loudness Normalizer |
| 6 | **Storyboard & Visual Asset Collection** | Visual Design | Script Input → Scene Decomposer → Pexels/Pixabay Search → Generative Scene Cards |
| 7 | **Video Rendering & Automated QA Engine** | Rendering & QA | Storyboard Input → FFmpeg Video Renderer → Blackdetect & Silence Check → QA Scorecard |
| 8 | **Private YouTube Upload & Release Approval** | Publishing | Video Package → YouTube Resumable Uploader → Public Release Gate |
| 9 | **Scheduled Weekly Production Cadence** | Automation | Monday 9 AM Cron Trigger → Topic Scout → Script Draft → Weekly Editorial Gate |
| 10| **YouTube Analytics & Feedback Loop** | Growth & Retention | Analytics Fetch → KPI Calculation → Retention Insights → Follow-up Topic Recommender |

---

## 🔒 Safety Defaults & Monetization Policy

1. **Private by Default**: All videos uploaded to YouTube are set to `private` or `unlisted`. A human must explicitly sign off before any video is published publicly.
2. **AI Synthetic Media Disclosures**: Videos generated with synthetic voices or generative visual assets automatically have YouTube's required synthetic media disclosures added to snippet metadata and video descriptions.
3. **Advertiser-Friendly**: Built-in claim screening evaluates whether scripts touch on restricted topics or violate advertiser guidelines.

---

## 🧪 Testing

```bash
# Run unit & integration test suite (DAG ordering, cycle checks, node execution, approval holds)
npm test
```
All 7 unit and integration test suites pass with 0 errors.

---

## 📄 License
MIT License. Built for creators and developers seeking sustainable, high-quality automation.
