# CreatorFlow AI — REST API & Event Stream Documentation

Base URL: `http://localhost:3001`

---

## 1. Workflows API (`/api/workflows`)

### `GET /api/workflows`
Returns an array of all saved workflows.

### `POST /api/workflows`
Creates a new workflow.
- **Payload**: Full `Workflow` JSON matching `WorkflowSchema`.

### `GET /api/workflows/:id`
Retrieves a specific workflow by its ID.

### `PUT /api/workflows/:id`
Updates an existing workflow.

### `DELETE /api/workflows/:id`
Deletes a workflow.

### `POST /api/workflows/:id/duplicate`
Clones a workflow and assigns a fresh ID.

### `POST /api/workflows/:id/validate`
Validates DAG connectivity, detects cycles, and verifies required trigger nodes.
- **Response**: `{ valid: boolean, issues: Array<{ type: 'error' | 'warning', message: string }> }`

### `POST /api/workflows/:id/execute`
Dispatches execution of the workflow.
- **Payload**: `{ triggerType?: 'manual' | 'schedule' | 'webhook', initialInput?: any, workflow?: Workflow }`
- **Response (202 Accepted)**: `{ message: string, execution: ExecutionRecord }`

---

## 2. Executions API (`/api/executions`)

### `GET /api/executions?limit=50`
Lists recent executions sorted by start time descending.

### `GET /api/executions/:id`
Returns full execution details including per-node states (`idle`, `queued`, `running`, `success`, `failed`, `paused`), duration, inputs, outputs, and step logs.

### `POST /api/executions/:id/cancel`
Signals abort controller to cancel an active running execution.

---

## 3. Human Approval Gates API (`/api/approvals`)

### `GET /api/approvals`
Lists all pending approval gates held for human review.

### `POST /api/approvals/:id/decide`
Submits a review decision.
- **Payload**: `{ decision: 'approved' | 'rejected', feedback?: string, decidedBy?: string }`
- **Effect**: If approved, automatically resumes the paused workflow in the engine and executes downstream steps.

---

## 4. AI YouTube Studio API (`/api/studio`)

### `POST /api/studio/topics/scout`
- **Payload**: `{ niche: string, format: 'shorts' | 'longform', count?: number }`
- **Response**: Array of scored `TopicCandidate` objects with novelty and audience interest scores.

### `POST /api/studio/scripts/generate`
- **Payload**: `{ topic: TopicCandidate, format: 'shorts' | 'longform', targetDurationSec: number }`
- **Response**: Full `ScriptDocument` with hook variations, narrative sections, and visual directions.

### `POST /api/studio/scripts/fact-check`
- **Payload**: `{ script: ScriptDocument }`
- **Response**: `FactCheckAudit` with verified claims, trust score, and advertiser safety flags.

### `POST /api/studio/storyboard/generate`
- **Payload**: `{ script: ScriptDocument }`
- **Response**: `Storyboard` containing timed scene objects and visual objectives.

### `POST /api/studio/voice/synthesize`
- **Payload**: `{ text: string, voice?: string }`
- **Response**: `{ filePath: string, durationSec: number, mediaUrl: string }`

### `POST /api/studio/video/render`
- **Payload**: `{ storyboard: Storyboard, audioFilePath: string }`
- **Response**: `{ outputFilePath: string, videoUrl: string, thumbnailUrl: string, durationSec: number }`

### `POST /api/studio/video/qa`
- **Payload**: `{ videoFilePath: string, format: 'shorts' | 'longform' }`
- **Response**: `QAReport` with black frame check, silence detection, and quality scorecard.

### `POST /api/studio/youtube/publish`
- **Payload**: `{ videoFilePath: string, metadata: YouTubePublishPayload }`
- **Response**: `YouTubeVideoRecord` with YouTube video ID and private link.

---

## 5. Live Server-Sent Events (`/api/events`)

Stream of real-time execution events consumed by the frontend canvas:
- `node:started`: `{ executionId, nodeId, nodeName }`
- `node:completed`: `{ executionId, nodeId, output }`
- `node:failed`: `{ executionId, nodeId, error }`
- `node:paused`: `{ executionId, nodeId, gateId }`
- `execution:paused`: `{ executionId, gateId, gate }`
- `execution:completed`: `ExecutionRecord`
- `execution:failed`: `ExecutionRecord`
