# CreatorFlow AI — Node Library Reference

CreatorFlow AI provides a comprehensive catalog of 22 modular automation nodes.

---

## 1. Triggers (`category: triggers`)

### `manual-trigger` (Manual Trigger)
Starts a workflow on demand.
- **Outputs**: `out` (Trigger payload)
- **Config**: `{ initialInput: Record<string, any> }`

### `schedule-trigger` (Schedule Trigger)
Executes periodically based on a cron pattern.
- **Outputs**: `out` (Schedule event with timestamp)
- **Config**: `{ cron: string, timezone: string, active: boolean }`

### `webhook-trigger` (Webhook Trigger)
Fires upon incoming HTTP POST requests to `/api/webhooks/:path`.
- **Outputs**: `out` (Request body)
- **Config**: `{ path: string, secretHeader?: string }`

---

## 2. Flow & Logic (`category: flow`, `category: approval`)

### `if-else` (IF / ELSE Branch)
Evaluates a comparison expression and routes execution to either `true` or `false` handle.
- **Inputs**: `in`
- **Outputs**: `true` (`condition-true`), `false` (`condition-false`)
- **Config**: `{ field: string, operator: '>=' | '<=' | '>' | '<' | '==' | '!=' | 'contains', value: any }`

### `switch` (Switch)
Routes execution to one of several handles based on a field value.
- **Outputs**: `case-shorts`, `case-longform`, `case-default`
- **Config**: `{ field: string, cases: string[] }`

### `merge` (Merge)
Combines multiple incoming execution streams into a single downstream input.
- **Inputs**: Multiple `in-*`
- **Outputs**: `out`

### `delay` (Delay / Wait)
Suspends execution for a specified duration in seconds.
- **Config**: `{ durationSeconds: number }`

### `approval-gate` (Human Approval Gate)
Suspends execution safely and holds the workflow for manual review in the Approval Inbox.
- **Inputs**: `in` (Payload to inspect)
- **Outputs**: `approved`, `rejected`
- **Config**: `{ gateType: 'script' | 'storyboard' | 'render' | 'publish', title: string, description: string }`

---

## 3. Data & Code (`category: data`)

### `set-data` (Set / Transform Data)
Injects or merges variables into the downstream payload.
- **Config**: `{ values: Record<string, any> }`

### `template-render` (Template Builder)
Performs `{{variable}}` string substitutions on text templates.
- **Config**: `{ template: string }`

### `http-request` (HTTP Request)
Calls external REST APIs with method, URL, headers, and body.
- **Config**: `{ method: string, url: string, headers: Record<string, string> }`

---

## 4. AI & Content (`category: ai`)

### `ai-text-gen` (AI Text Generation)
Calls Google Gemini, OpenAI, Claude, or Ollama to generate text or structured JSON.
- **Config**: `{ provider: string, model: string, prompt: string, temperature: number, jsonOutput: boolean }`

### `yt-topic-research` (Topic Scout & Scoring)
Discovers viral topic angles scored on Novelty (1-100), Audience Interest (1-100), and Safety.
- **Config**: `{ niche: string, format: 'shorts' | 'longform', numberOfCandidates: number }`

### `yt-script-writer` (Script Lab)
Drafts retention-optimized video scripts with 3 hook variants and structured narrative sections.
- **Config**: `{ format: 'shorts' | 'longform', targetDurationSec: number, targetWpm: number }`

### `yt-fact-checker` (Fact-Check & Policy Audit)
Extracts factual claims, verifies sources, and audits against YouTube monetization guidelines.
- **Config**: `{ strictness: 'high' | 'medium', checkMonetizationRules: boolean }`

### `yt-storyboard-gen` (Storyboard & Scene Planner)
Decomposes script sections into timed scene objects with visual directives and transitions.
- **Config**: `{ aspectRatio: '9:16' | '16:9', maxSceneDurationSec: number }`

---

## 5. Media & Rendering (`category: media`)

### `voiceover-tts` (Voiceover Synthesis)
Synthesizes natural speech using Edge Neural TTS or OpenAI with EBU R128 audio normalization.
- **Config**: `{ voice: string, provider: 'edge-tts' | 'openai', normalizeAudio: boolean }`

### `asset-collector` (Visual Asset Deck)
Fetches licensed stock footage (Pexels / Pixabay) or generates procedural HD scene cards.
- **Config**: `{ orientation: 'portrait' | 'landscape', preferVideoOverImages: boolean }`

### `video-renderer` (FFmpeg Video Renderer)
Renders 1080p MP4 videos with dynamic animated burnt-in captions, audio ducking, and transitions.
- **Config**: `{ format: 'shorts' | 'longform', fps: number, burnCaptions: boolean }`

### `video-qa-check` (Automated QA Engine)
Inspects rendered containers for black frames (`blackdetect`), silence dropouts, and duration match.
- **Config**: `{ minPassingScore: number, failOnSilence: boolean, failOnBlackFrames: boolean }`

### `thumbnail-gen` (Thumbnail Generator)
Generates high-CTR 1280x720 cover card graphics with bold typography.
- **Config**: `{ style: string, highlightKeywords: boolean }`

---

## 6. YouTube & Publishing (`category: youtube`)

### `yt-metadata-gen` (SEO Metadata & Chapters)
Generates titles, descriptions, hashtags, timestamps, and AI synthetic media disclosures.
- **Config**: `{ includeAiDisclosure: boolean, defaultPrivacy: 'private' }`

### `yt-publish` (YouTube Publisher)
Uploads video via official YouTube Data API v3 resumable protocol (enforcing Private default safety).
- **Config**: `{ defaultPrivacy: 'private', notifySubscribers: boolean }`

### `yt-analytics` (YouTube Analytics & Feedback Loop)
Retrieves channel KPIs and derives actionable recommendations for future video topics.
- **Config**: `{ periodDays: number, generateNextTopicIdeas: boolean }`
