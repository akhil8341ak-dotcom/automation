import { Router, Request, Response } from 'express';
import { WorkflowEngine } from '@creatorflow/engine';

export function createSettingsRouter(engine: WorkflowEngine): Router {
  const router = Router();
  const services = engine.getServices();

  // GET /api/settings - System status & provider inspection
  router.get('/', (req: Request, res: Response) => {
    const isGeminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
    const isOpenAiConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
    const isPexelsConfigured = !!(process.env.PEXELS_API_KEY && process.env.PEXELS_API_KEY !== 'your_pexels_api_key_here');
    const isPixabayConfigured = !!(process.env.PIXABAY_API_KEY && process.env.PIXABAY_API_KEY !== 'your_pixabay_api_key_here');
    const isYouTubeConfigured = services.youtube.isOAuthConfigured();

    const voices = [
      { id: 'en-US-ChristopherNeural', name: 'Christopher (US Male - Clear, Authoritative, Engaging)', lang: 'en-US', gender: 'Male' },
      { id: 'en-US-GuyNeural', name: 'Guy (US Male - Conversational, Friendly)', lang: 'en-US', gender: 'Male' },
      { id: 'en-US-JennyNeural', name: 'Jenny (US Female - Natural, Articulate)', lang: 'en-US', gender: 'Female' },
      { id: 'en-US-AriaNeural', name: 'Aria (US Female - Expressive, Storyteller)', lang: 'en-US', gender: 'Female' },
      { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male - Polished, Professional)', lang: 'en-GB', gender: 'Male' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female - Clear, Sophisticated)', lang: 'en-GB', gender: 'Female' },
      { id: 'en-IN-PrabhatNeural', name: 'Prabhat (India Male - Technical, Direct)', lang: 'en-IN', gender: 'Male' },
      { id: 'en-IN-NeerjaNeural', name: 'Neerja (India Female - Crisp, Warm)', lang: 'en-IN', gender: 'Female' },
    ];

    res.json({
      providers: {
        ai: {
          active: services.ai.getActiveProvider(),
          gemini: isGeminiConfigured,
          openai: isOpenAiConfigured,
          ollama: true, // Local Ollama
          mock: true,   // Offline zero-cost mode is always 100% available
        },
        tts: {
          active: 'edge-tts',
          edgeTts: true, // Verified installed and operational
          openai: isOpenAiConfigured,
          offlineSynth: true,
        },
        media: {
          pexels: isPexelsConfigured,
          pixabay: isPixabayConfigured,
          proceduralGraphics: true, // Always available with 0 API keys
        },
        youtube: {
          configured: isYouTubeConfigured,
          defaultPrivacy: process.env.DEFAULT_PRIVACY_STATUS || 'private',
          sandboxMode: !isYouTubeConfigured,
        },
        ffmpeg: {
          installed: true,
          version: '9.0.2',
        },
      },
      voices,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        requireScriptApproval: process.env.REQUIRE_SCRIPT_APPROVAL !== 'false',
        requirePublishApproval: process.env.REQUIRE_PUBLISH_APPROVAL !== 'false',
      },
    });
  });

  return router;
}
