# AI Provider & Voiceover Setup Guide

CreatorFlow AI features a pluggable AI adapter architecture that works with both cloud APIs and 100% free, local offline models.

---

## 1. Provider Comparison & Cost Matrix

| Provider | Model | Free Tier? | Setup Effort | Best For |
|---|---|---|---|---|
| **Google Gemini** | `gemini-1.5-flash` | **Yes (Generous Free Tier)** | 2 minutes | High-volume topic research & scriptwriting |
| **Edge Neural TTS** | `ChristopherNeural`, `JennyNeural` | **Yes (100% Free)** | 0 minutes (Pre-installed) | Broadcast-quality natural voiceovers |
| **Local Ollama** | `llama3:8b`, `mistral` | **Yes (100% Free, Offline)** | 5 minutes | Zero API cost & complete data privacy |
| **OpenAI** | `gpt-4o-mini`, `tts-1` | Paid (Pay-as-you-go) | 2 minutes | Premium alternative |
| **CreatorFlow Offline Mode** | `offline-v1` | **Yes (100% Free, Built-in)** | 0 minutes | Automated tests and offline development |

---

## 2. Option A: Google Gemini (Recommended for Free Cloud AI)

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and generate a new key.
3. Open your `.env` file and set:
   ```env
   DEFAULT_AI_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   ```
4. Restart the server. Gemini 1.5 Flash provides fast, creative script drafts and factual analysis at no cost within standard quotas.

---

## 3. Option B: Edge Neural TTS (Free Voiceover)

CreatorFlow AI integrates directly with Microsoft Edge's Neural Text-To-Speech engine.
- **Cost**: ₹0 / $0 (No subscription or API key required).
- **Quality**: Ultra-realistic human neural speech with emotional intonation.
- **Languages**: Over 100 languages supported.
- **Verify Installation**:
  ```bash
  edge-tts --list-voices
  ```
- **Popular Voices**:
  - `en-US-ChristopherNeural` (US Male — Clear, Authoritative, Engaging)
  - `en-US-GuyNeural` (US Male — Conversational, Natural)
  - `en-US-JennyNeural` (US Female — Crisp, Articulate)
  - `en-GB-RyanNeural` (UK Male — Documentary style)

---

## 4. Option C: Local Ollama (100% Free & Private)

1. Download and install [Ollama](https://ollama.com/).
2. Pull your preferred model:
   ```bash
   ollama pull llama3:8b
   ```
3. Start the Ollama daemon (`ollama serve`).
4. In `.env`:
   ```env
   DEFAULT_AI_PROVIDER=ollama
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3:8b
   ```

---

## 5. Option D: OpenAI (Optional)

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys) and generate an API key.
2. In `.env`:
   ```env
   DEFAULT_AI_PROVIDER=openai
   OPENAI_API_KEY=sk-...your_openai_key
   ```
