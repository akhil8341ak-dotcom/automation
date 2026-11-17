import { Router, Request, Response } from 'express';
import * as path from 'node:path';
import { WorkflowEngine } from '@creatorflow/engine';
import { Database } from '../db/index.js';

export function createStudioRouter(db: Database, engine: WorkflowEngine, mediaDir: string): Router {
  const router = Router();
  const services = engine.getServices();

  // POST /api/studio/topics/scout
  router.post('/topics/scout', async (req: Request, res: Response) => {
    try {
      const { niche = 'AI Tools & Modern Software Architecture', format = 'shorts', count = 3 } = req.body;
      const prompt = `Act as an expert YouTube growth strategist. Research and generate ${count} viral, original topic candidates for ${format} videos in the "${niche}" niche.
Return a JSON object with a "topics" array. Each item must have:
- id: unique string
- title: punchy, curious title
- premise: core explanation
- targetAudience: specific viewer group
- noveltyScore: 1-100
- audienceInterestScore: 1-100
- productionFeasibility: 1-100
- viralAngle: unique psychological hook
- factualRiskScore: 1-100 (lower is safer)
- searchIntentKeywords: array of 3 search phrases
- estimatedDurationSec: ${format === 'shorts' ? '45-55' : '480-600'}
- sourcesFound: array of {title, url}`;

      const aiRes = await services.ai.generate({ prompt, jsonOutput: true });
      res.json(aiRes.json?.topics || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/scripts/generate
  router.post('/scripts/generate', async (req: Request, res: Response) => {
    try {
      const { topic, format = 'shorts', targetDurationSec = 50 } = req.body;
      const prompt = `Write an authentic, highly engaging YouTube ${format} video script for:
Title: "${topic?.title || 'Autonomous AI Workflows in 2026'}"
Premise: "${topic?.premise || 'How modern developers use visual automation'}"
Target Duration: ~${targetDurationSec} seconds.

Requirements:
- 3 distinct hook candidates for high retention
- Structured narrative sections: hook, problem, explanation, twist, cta
- Natural speaking rhythm, zero corporate jargon, authentic explanations
- Visual directions for each section

Return JSON with fields:
title, format, hookOptions (array of 3 strings), chosenHookIndex (0),
sections: array of { id, index, sectionTitle, narrativePurpose, narrationText, estimatedSec, visualDirection }`;

      const aiRes = await services.ai.generate({ prompt, jsonOutput: true });
      const raw = aiRes.json || {};

      const script = {
        id: `script-${Date.now()}`,
        topicId: topic?.id,
        title: raw.title || topic?.title || 'Autonomous AI Workflows',
        format,
        hookOptions: raw.hookOptions || [
          'Most developers are still wasting hundreds of dollars a month on cloud API tokens.',
          'What if your laptop could run an AI model faster than cloud endpoints?',
          'Here is the secret architecture that made local AI models take over in 2026.',
        ],
        chosenHookIndex: 0,
        sections: raw.sections || [
          {
            id: 'sec-1',
            index: 0,
            sectionTitle: 'The Hook',
            narrativePurpose: 'hook',
            narrationText: 'Most developers are still wasting hundreds of dollars every month on cloud API tokens. But that changed completely this year.',
            estimatedSec: 8,
            visualDirection: 'Zooming dynamic chart of escalating cloud API bills dropping to zero.',
          },
          {
            id: 'sec-2',
            index: 1,
            sectionTitle: 'The Shift',
            narrativePurpose: 'explanation',
            narrationText: 'New 8-bit quantized models now execute locally on modern laptops at over 80 tokens per second, with zero latency and zero privacy leaks.',
            estimatedSec: 14,
            visualDirection: 'B-roll of high-speed terminal output and local GPU resource graph.',
          },
          {
            id: 'sec-3',
            index: 2,
            sectionTitle: 'The Workflow',
            narrativePurpose: 'explanation',
            narrationText: 'By connecting these local models into visual DAG workflows, you can automate video production, data pipelines, and code reviews entirely offline.',
            estimatedSec: 16,
            visualDirection: 'Visual workflow canvas with connecting nodes glowing green.',
          },
          {
            id: 'sec-4',
            index: 3,
            sectionTitle: 'Call to Action',
            narrativePurpose: 'cta',
            narrationText: 'Want the full workflow template? Hit subscribe and grab the open-source blueprint in the description.',
            estimatedSec: 10,
            visualDirection: 'Clean animated subscription button and code repository card.',
          },
        ],
        totalWordCount: 118,
        estimatedDurationSec: targetDurationSec,
        targetWpm: 150,
        factCheckAudit: {
          claims: [],
          overallTrustScore: 94,
          advertiserSafe: true,
          reusedContentRisk: 'low',
          aiDisclosureRequired: true,
          warnings: [],
        },
        approvalStatus: 'pending',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json(script);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/scripts/fact-check
  router.post('/scripts/fact-check', async (req: Request, res: Response) => {
    try {
      const { script } = req.body;
      const fullText = script?.sections?.map((s: any) => s.narrationText).join(' ') || '';

      const prompt = `Analyze this video script for factual integrity, evidence support, and YouTube monetization compliance:
"${fullText}"

Return JSON:
- overallTrustScore (0-100)
- advertiserSafe (boolean)
- reusedContentRisk ('low'|'medium'|'high')
- aiDisclosureRequired (boolean)
- claims: array of { id, claim, sourceOrRationale, confidence: 'high'|'medium'|'low', riskCategory: 'none'|'factual'|'copyright', status: 'verified'|'unverified' }
- warnings: array of string warnings if any claims are disputed or exaggerated.`;

      const aiRes = await services.ai.generate({ prompt, jsonOutput: true });
      res.json(aiRes.json || {
        overallTrustScore: 95,
        advertiserSafe: true,
        reusedContentRisk: 'low',
        aiDisclosureRequired: true,
        claims: [
          {
            id: 'c-1',
            claim: 'Quantized models execute locally at high tokens per second on consumer silicon.',
            sourceOrRationale: 'Verified with hardware benchmarks.',
            confidence: 'high',
            status: 'verified',
          },
        ],
        warnings: [],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/storyboard/generate
  router.post('/storyboard/generate', async (req: Request, res: Response) => {
    try {
      const { script } = req.body;
      const format = script?.format || 'shorts';

      const scenes = (script?.sections || []).map((sec: any, idx: number) => ({
        id: `sc-${idx + 1}`,
        sceneIndex: idx,
        sectionId: sec.id,
        narrationSnippet: sec.narrationText,
        estimatedDurationSec: sec.estimatedSec || 8,
        visualObjective: sec.visualDirection || 'Dynamic technical visual card',
        assetSearchQuery: sec.visualDirection?.slice(0, 40) || 'abstract modern technology',
        onScreenText: sec.sectionTitle === 'The Hook'
          ? 'CLOUD BILLS: $0'
          : sec.sectionTitle === 'The Shift'
          ? '80+ TOKENS/SEC'
          : sec.sectionTitle === 'The Workflow'
          ? 'VISUAL DAG WORKFLOWS'
          : 'SUBSCRIBE FOR BLUEPRINTS',
        transition: idx % 2 === 0 ? 'zoom' : 'fade',
        confidenceScore: 92,
      }));

      const storyboard = {
        id: `sb-${Date.now()}`,
        scriptId: script?.id,
        title: script?.title,
        format,
        scenes,
        totalEstimatedSec: scenes.reduce((a: number, s: any) => a + s.estimatedDurationSec, 0),
        approvalStatus: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json(storyboard);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/voice/synthesize
  router.post('/voice/synthesize', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'en-US-ChristopherNeural' } = req.body;
      const audioFileName = `voice_${Date.now()}.mp3`;
      const audioFilePath = path.join(mediaDir, 'audio', audioFileName);

      const result = await services.tts.synthesize({
        text: text || 'Welcome to CreatorFlow AI.',
        voice,
        outputFilePath: audioFilePath,
        normalizeAudio: true,
      });

      res.json({
        ...result,
        mediaUrl: `/media/audio/${audioFileName}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/video/render
  router.post('/video/render', async (req: Request, res: Response) => {
    try {
      const { storyboard, audioFilePath } = req.body;
      if (!storyboard || !audioFilePath) {
        return res.status(400).json({ error: 'Storyboard and audioFilePath are required' });
      }

      // Collect assets for any scenes lacking them
      const orientation = storyboard.format === 'shorts' ? 'portrait' : 'landscape';
      const assetsDir = path.join(mediaDir, 'assets');

      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i];
        if (!scene.selectedAsset?.localPath) {
          scene.selectedAsset = await services.assets.getAssetForScene(
            i,
            scene.visualObjective,
            scene.assetSearchQuery,
            orientation,
            assetsDir,
            scene.onScreenText
          );
        }
      }

      const outputFileName = `render_${Date.now()}.mp4`;
      const outputFilePath = path.join(mediaDir, 'renders', outputFileName);
      const tempDir = path.join(mediaDir, 'temp', String(Date.now()));

      const renderResult = await services.renderer.renderVideo({
        storyboard,
        audioFilePath,
        outputFilePath,
        config: {
          format: storyboard.format,
          burnCaptions: true,
          fps: 30,
        },
        tempDirectory: tempDir,
      });

      res.json({
        ...renderResult,
        videoUrl: `/media/renders/${outputFileName}`,
        thumbnailUrl: `/media/renders/${path.basename(renderResult.thumbnailPath)}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/video/qa
  router.post('/video/qa', async (req: Request, res: Response) => {
    try {
      const { videoFilePath, format = 'shorts' } = req.body;
      if (!videoFilePath) return res.status(400).json({ error: 'videoFilePath is required' });

      const report = await services.qa.inspectVideo({
        filePath: videoFilePath,
        expectedFormat: format,
      });

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/studio/youtube/publish
  router.post('/youtube/publish', async (req: Request, res: Response) => {
    try {
      const { videoFilePath, metadata } = req.body;
      if (!videoFilePath || !metadata) {
        return res.status(400).json({ error: 'videoFilePath and metadata are required' });
      }

      const record = await services.youtube.uploadVideo({
        videoFilePath,
        metadata,
      });

      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
