# CreatorFlow AI — Security & Privacy Architecture

## 1. Core Security Principles

CreatorFlow AI operates with strict isolation between workflow definitions and system operations. Workflows are treated as untrusted data:
1. **No Arbitrary Shell Command Execution**: Node executors run dedicated, parameterized functions. Workflows cannot execute arbitrary `eval()`, shell scripts, or unauthorized commands.
2. **Server-Side Secret Custody**: API keys, OAuth tokens, and database credentials remain exclusively on the server. No raw credentials are ever transmitted to the frontend browser bundle.
3. **Automated Secret Scrubbing**: All execution logs, step outputs, and error stacks are filtered through regex redactors before storage or display.

---

## 2. Credential Redaction & Log Scrubbing

Located in `packages/engine/src/execution/context.ts`:
Every log emitted by a node executor passes through the `redactSecrets()` scrubber:
- **Google AI / Gemini Keys**: Matched via `AIza[0-9A-Za-z-_]{35}` → replaced with `AIza[REDACTED_GEMINI_KEY]`
- **OpenAI Keys**: Matched via `sk-[a-zA-Z0-9]{32,}` → replaced with `sk-[REDACTED_OPENAI_KEY]`
- **Bearer Tokens**: Matched via `Bearer\s+[A-Za-z0-9-_.]+` → replaced with `Bearer [REDACTED_TOKEN]`
- **Query Parameter Keys**: Matched via `key=[A-Za-z0-9-_]+` → replaced with `key=[REDACTED]`

---

## 3. Filesystem Sandboxing & Path Traversal Protection

Media operations (rendering, audio synthesis, asset caching) are strictly confined to the configurable storage directory (`STORAGE_PATH`, default `./data/storage`).
- All media file paths are validated using `path.resolve()` and checked against approved subdirectories: `audio/`, `assets/`, `renders/`, `temp/`, and `thumbnails/`.
- File uploads are validated for MIME type (`video/mp4`, `audio/mpeg`, `image/jpeg`, `image/png`).

---

## 4. YouTube OAuth2 & Channel Access

- **Least Privilege**: Only the minimum scopes needed for YouTube video uploads (`youtube.upload`) and analytics inspection (`yt-analytics.readonly`) are requested.
- **Refresh Token Security**: Refresh tokens are stored server-side in the SQLite database and never included in workflow JSON exports.
- **Human Publishing Gate**: Videos are uploaded with `privacyStatus: 'private'` by default. Public visibility requires explicit creator authorization.

---

## 5. Network & Rate Limiting

- Protected endpoints can be gated with reverse-proxy API rate limiters (e.g. Nginx or Cloudflare).
- External webhooks validate incoming requests using optional secret headers (`x-webhook-secret`).
