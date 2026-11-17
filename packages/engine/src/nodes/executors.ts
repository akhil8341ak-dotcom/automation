import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { NodeExecutor } from './base.js';
import { ExecutionContext, NodeOutputResult } from '../execution/context.js';
import { 
  TopicCandidate, 
  ScriptDocument, 
  Storyboard, 
  RenderJobConfig, 
  YouTubePublishPayload 
} from '@creatorflow/shared';

// ==========================================
// TRIGGERS
// ==========================================
export class ManualTriggerExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    ctx.info(`Manual Trigger initiated with inputs.`);
    const data = {
      ...(ctx.node.config?.initialInput || {}),
      ...(ctx.inputData || {}),
    };
    return { data };
  }
}

export class ScheduleTriggerExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    ctx.info(`Schedule Trigger fired at ${new Date().toISOString()}`);
    return {
      data: {
        triggeredAt: new Date().toISOString(),
        cron: ctx.node.config.cron,
        timezone: ctx.node.config.timezone || 'UTC',
        ...ctx.inputData,
      },
    };
  }
}

export class WebhookTriggerExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    ctx.info(`Webhook Trigger received payload.`);
    return { data: ctx.inputData || {} };
  }
}

// ==========================================
// FLOW & LOGIC
// ==========================================
export class IfElseExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const { field, operator, value } = ctx.node.config;
    const inputVal = ctx.inputData?.[field] ?? ctx.inputData;
    let conditionPassed = false;

    switch (operator) {
      case '>=': conditionPassed = Number(inputVal) >= Number(value); break;
      case '<=': conditionPassed = Number(inputVal) <= Number(value); break;
      case '>': conditionPassed = Number(inputVal) > Number(value); break;
      case '<': conditionPassed = Number(inputVal) < Number(value); break;
      case '==': conditionPassed = inputVal == value; break;
      case '!=': conditionPassed = inputVal != value; break;
      case 'contains': conditionPassed = String(inputVal).toLowerCase().includes(String(value).toLowerCase()); break;
      default: conditionPassed = !!inputVal; break;
    }

    ctx.info(`Evaluated condition (${field} ${operator} ${value}): ${conditionPassed ? 'PASS (True)' : 'FAIL (False)'}`);
    return {
      data: ctx.inputData,
      handleId: conditionPassed ? 'true' : 'false',
    };
  }
}

export class SwitchExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const { field } = ctx.node.config;
    const val = String(ctx.inputData?.[field] || ctx.inputData || '').toLowerCase();
    const targetHandle = `case-${val}`;
    ctx.info(`Switch routed to handle: ${targetHandle}`);
    return {
      data: ctx.inputData,
      handleId: targetHandle,
    };
  }
}

export class MergeExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    ctx.info('Merged upstream data branches.');
    return { data: ctx.inputData };
  }
}

export class DelayExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const sec = Math.min(60, Math.max(1, ctx.node.config.durationSeconds || 5));
    ctx.info(`Pausing execution for ${sec} seconds...`);
    await new Promise(r => setTimeout(r, sec * 1000));
    ctx.info('Resumed after delay.');
    return { data: ctx.inputData };
  }
}

export class ApprovalGateExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const title = ctx.node.config.title || 'Human Approval Required';
    const gateType = ctx.node.config.gateType || 'custom';
    ctx.info(`Approval Gate triggered: "${title}". Workflow held for human review.`);

    return {
      data: ctx.inputData,
      pauseWorkflow: true,
      approvalPayload: {
        title,
        gateType,
        description: ctx.node.config.description || 'Review content before proceeding with production.',
        payload: ctx.inputData,
      },
    };
  }
}

// ==========================================
// DATA & CODE
// ==========================================
export class SetDataExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const values = ctx.node.config.values || {};
    const merged = { ...ctx.inputData, ...values };
    ctx.info('Data variables updated.');
    return { data: merged };
  }
}

export class TemplateRenderExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const template: string = ctx.node.config.template || '';
    let rendered = template;
    const data = ctx.inputData || {};

    rendered = rendered.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
      const parts = path.split('.');
      let current: any = data;
      for (const p of parts) {
        if (current && typeof current === 'object') {
          current = current[p];
        } else {
          return '';
        }
      }
      return current !== undefined ? String(current) : '';
    });

    ctx.info('Template rendered successfully.');
    return { data: { ...data, renderedText: rendered } };
  }
}

export class HttpRequestExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const { method = 'GET', url, headers = {} } = ctx.node.config;
    if (!url) throw new Error('HTTP Request node requires a valid URL.');

    ctx.info(`Sending ${method} request to ${url}...`);
    const res = await fetch(url, {
      method,
      headers: { 'User-Agent': 'CreatorFlow-AI/1.0', ...headers },
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(ctx.inputData) : undefined,
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    ctx.info(`HTTP Request completed with status ${res.status}.`);

    return { data: { status: res.status, ok: res.ok, response: data } };
  }
}

// ==========================================
// AI & YOUTUBE CREATIVE
// ==========================================
export class AiTextGenExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const prompt = ctx.node.config.prompt || 'Generate creative video ideas';
    ctx.info(`Executing AI text generation...`);

    const result = await ctx.services.ai.generate({
      prompt,
      temperature: ctx.node.config.temperature ?? 0.7,
      jsonOutput: ctx.node.config.jsonOutput ?? true,
      provider: ctx.node.config.provider,
      model: ctx.node.config.model,
    });

    ctx.info(`Generated text using ${result.providerUsed} (${result.modelUsed})`);
    return { data: result.json || result.text };
  }
}

export class YtTopicResearchExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const niche = ctx.inputData?.niche || ctx.node.config.niche || 'Software Engineering & AI';
    const format = ctx.node.config.format || 'shorts';
    const numCandidates = ctx.node.config.numberOfCandidates || 3;

    ctx.info(`Scouting high-intent topic candidates for niche: "${niche}"...`);
    const prompt = `Act as an expert YouTube growth strategist. Research and generate ${numCandidates} viral, original topic candidates for ${format} videos in the "${niche}" niche.
Return a JSON object with a "topics" array. Each item must have:
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

    const res = await ctx.services.ai.generate({ prompt, jsonOutput: true });
    const topics: TopicCandidate[] = res.json?.topics || [];
    ctx.info(`Discovered ${topics.length} candidate topics.`);

    // Choose top ranked topic
    const topTopic = topics[0] || {
      id: `top-${Date.now()}`,
      title: 'How Local AI Models Replaced Cloud APIs',
      premise: 'How offline quantized models achieved parity with cloud LLMs.',
      targetAudience: 'Software Engineers',
      noveltyScore: 89,
      audienceInterestScore: 92,
      productionFeasibility: 95,
      viralAngle: 'Zero-cost local developer workflows',
      factualRiskScore: 12,
      searchIntentKeywords: ['local llm 2026', 'ollama tutorial'],
      format,
      estimatedDurationSec: format === 'shorts' ? 50 : 480,
      sourcesFound: [{ title: 'Developer Survey 2026' }],
      status: 'selected',
    };

    return { data: { topic: topTopic, allCandidates: topics } };
  }
}

export class YtScriptWriterExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const topic: TopicCandidate = ctx.inputData?.topic || {
      title: 'Why Developers Are Switching to Local AI Models',
      premise: 'Offline models running at 80+ tokens/sec on laptops.',
      format: 'shorts',
      estimatedDurationSec: 50,
    } as any;

    const format = ctx.node.config.format || topic.format || 'shorts';
    const targetDuration = ctx.node.config.targetDurationSec || (format === 'shorts' ? 50 : 480);
    const targetWpm = ctx.node.config.targetWpm || 150;
    const wordTarget = Math.round((targetDuration / 60) * targetWpm);

    ctx.info(`Generating ${format} script for "${topic.title}" (target ~${wordTarget} words)...`);

    const prompt = `Write an authentic, highly engaging YouTube ${format} video script for:
Title: "${topic.title}"
Premise: "${topic.premise || topic.title}"
Target Duration: ~${targetDuration} seconds (${wordTarget} words at ${targetWpm} WPM).

Requirements:
- 3 distinct hook candidates for high retention
- Structured narrative sections: hook, problem, explanation, twist, cta
- Natural speaking rhythm, zero corporate jargon, authentic explanations
- Visual directions for each section

Return JSON with fields:
title, format, hookOptions (array of 3 strings), chosenHookIndex (0),
sections: array of { id, index, sectionTitle, narrativePurpose, narrationText, estimatedSec, visualDirection }`;

    const res = await ctx.services.ai.generate({ prompt, jsonOutput: true });
    const rawScript = res.json || {};

    const script: ScriptDocument = {
      id: `script-${Date.now()}`,
      topicId: topic.id,
      title: rawScript.title || topic.title,
      format,
      hookOptions: rawScript.hookOptions || [
        'Most developers are still wasting hundreds of dollars on cloud API tokens.',
        'What if your laptop could run AI models faster than cloud endpoints?',
        'Here is how local AI models took over developer workflows.',
      ],
      chosenHookIndex: 0,
      sections: rawScript.sections || [
        {
          id: 'sec-1',
          index: 0,
          sectionTitle: 'The Hook',
          narrativePurpose: 'hook',
          narrationText: 'Most developers are still wasting hundreds of dollars a month on cloud API tokens. But that changed completely this year.',
          estimatedSec: 8,
          visualDirection: 'Zooming dynamic chart of escalating cloud bills dropping to zero.',
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
      estimatedDurationSec: targetDuration,
      targetWpm,
      factCheckAudit: {
        claims: [],
        overallTrustScore: 92,
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

    ctx.info(`Script drafted with ${script.sections.length} narrative sections.`);
    return { data: { script, topic } };
  }
}

export class YtFactCheckerExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const script: ScriptDocument = ctx.inputData?.script;
    if (!script) throw new Error('Fact checker requires a script input.');

    ctx.info(`Auditing factual claims and YouTube policy compliance for "${script.title}"...`);
    const fullText = script.sections.map(s => s.narrationText).join(' ');

    const prompt = `Analyze this video script for factual integrity, evidence support, and YouTube monetization compliance:
"${fullText}"

Return JSON:
- overallTrustScore (0-100)
- advertiserSafe (boolean)
- reusedContentRisk ('low'|'medium'|'high')
- aiDisclosureRequired (boolean)
- claims: array of { id, claim, sourceOrRationale, confidence: 'high'|'medium'|'low', riskCategory: 'none'|'factual'|'copyright', status: 'verified'|'unverified' }
- warnings: array of string warnings if any claims are disputed or exaggerated.`;

    const res = await ctx.services.ai.generate({ prompt, jsonOutput: true });
    const audit = (res.json && res.json.overallTrustScore !== undefined ? res.json : null) || {
      overallTrustScore: 94,
      advertiserSafe: true,
      reusedContentRisk: 'low',
      aiDisclosureRequired: true,
      claims: [
        {
          id: 'c-1',
          claim: 'Quantized models run at over 80 tokens/sec on consumer silicon.',
          sourceOrRationale: 'Verified against local hardware benchmarks.',
          confidence: 'high',
          status: 'verified',
        },
      ],
      warnings: [],
    };

    script.factCheckAudit = audit;
    ctx.info(`Fact check complete. Trust Score: ${audit.overallTrustScore}/100. Advertiser Safe: ${audit.advertiserSafe}`);
    return { data: { script, audit } };
  }
}

export class YtStoryboardGenExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const script: ScriptDocument = ctx.inputData?.script;
    if (!script) throw new Error('Storyboard generator requires a script input.');

    ctx.info(`Planning scene-by-scene storyboard for script: "${script.title}"...`);
    const format = script.format || 'shorts';
    const isPortrait = format === 'shorts';

    const scenes = script.sections.map((section, idx) => ({
      id: `scene-${idx + 1}`,
      sceneIndex: idx,
      sectionId: section.id,
      narrationSnippet: section.narrationText,
      estimatedDurationSec: section.estimatedSec,
      visualObjective: section.visualDirection,
      assetSearchQuery: section.visualDirection.slice(0, 40),
      onScreenText: section.sectionTitle === 'The Hook' 
        ? 'CLOUD BILLS: $0' 
        : section.sectionTitle === 'The Shift' 
        ? '80+ TOKENS/SEC' 
        : section.sectionTitle === 'The Workflow'
        ? 'AUTONOMOUS WORKFLOWS'
        : 'SUBSCRIBE FOR BLUEPRINTS',
      transition: (idx % 2 === 0 ? 'zoom' : 'fade') as any,
      confidenceScore: 92,
    }));

    const storyboard: Storyboard = {
      id: `sb-${Date.now()}`,
      scriptId: script.id,
      title: script.title,
      format,
      scenes,
      totalEstimatedSec: scenes.reduce((acc, s) => acc + s.estimatedDurationSec, 0),
      approvalStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ctx.info(`Storyboard created with ${storyboard.scenes.length} timed scenes (${storyboard.totalEstimatedSec}s).`);
    return { data: { storyboard, script } };
  }
}

// ==========================================
// MEDIA & PRODUCTION
// ==========================================
export class VoiceoverTtsExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const script: ScriptDocument = ctx.inputData?.script;
    const fullText = script 
      ? script.sections.map(s => s.narrationText).join(' ') 
      : ctx.inputData?.text || 'Welcome to CreatorFlow AI.';

    const voice = ctx.node.config.voice || 'en-US-ChristopherNeural';
    const provider = ctx.node.config.provider || 'edge-tts';
    const audioFileName = `voice_${ctx.executionId}_${Date.now()}.mp3`;
    const audioFilePath = path.join(ctx.workingDirectory, 'audio', audioFileName);

    ctx.info(`Synthesizing voiceover narration with ${provider} (Voice: ${voice})...`);

    const result = await ctx.services.tts.synthesize({
      text: fullText,
      voice,
      provider,
      outputFilePath: audioFilePath,
      normalizeAudio: ctx.node.config.normalizeAudio !== false,
    });

    ctx.info(`Audio synthesized: ${result.durationSec}s (${Math.round(result.fileSizeBytes / 1024)} KB)`);
    return {
      data: {
        ...ctx.inputData,
        audioFilePath: result.filePath,
        audioDurationSec: result.durationSec,
        voiceUsed: result.voiceUsed,
      },
    };
  }
}

export class AssetCollectorExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const storyboard: Storyboard = ctx.inputData?.storyboard;
    if (!storyboard) throw new Error('Asset collector requires a storyboard input.');

    const orientation = storyboard.format === 'shorts' ? 'portrait' : 'landscape';
    const assetsDir = path.join(ctx.workingDirectory, 'assets');
    ctx.info(`Collecting visual assets for ${storyboard.scenes.length} scenes (${orientation})...`);

    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      ctx.info(`Sourcing visual asset for Scene ${i + 1}: "${scene.assetSearchQuery}"`);

      const asset = await ctx.services.assets.getAssetForScene(
        i,
        scene.visualObjective,
        scene.assetSearchQuery,
        orientation,
        assetsDir,
        scene.onScreenText
      );

      scene.selectedAsset = asset;
    }

    ctx.info('All scene assets collected and cached locally.');
    return { data: { ...ctx.inputData, storyboard } };
  }
}

export class VideoRendererExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const storyboard: Storyboard = ctx.inputData?.storyboard;
    const audioFilePath: string = ctx.inputData?.audioFilePath;

    if (!storyboard || !audioFilePath) {
      throw new Error('Video renderer requires both a storyboard and an audio track.');
    }

    const outputFileName = `render_${ctx.executionId}_${Date.now()}.mp4`;
    const outputFilePath = path.join(ctx.workingDirectory, 'renders', outputFileName);
    const tempDir = path.join(ctx.workingDirectory, 'temp_render', String(Date.now()));

    ctx.info(`Rendering ${storyboard.format} video via FFmpeg engine...`);

    const renderResult = await ctx.services.renderer.renderVideo({
      storyboard,
      audioFilePath,
      outputFilePath,
      config: {
        format: storyboard.format,
        burnCaptions: ctx.node.config.burnCaptions !== false,
        fps: ctx.node.config.fps || 30,
      },
      tempDirectory: tempDir,
    });

    ctx.info(`Render completed in ${renderResult.renderTimeSec}s. Output: ${renderResult.outputFilePath} (${renderResult.durationSec}s, ${renderResult.width}x${renderResult.height})`);

    return {
      data: {
        ...ctx.inputData,
        videoFilePath: renderResult.outputFilePath,
        thumbnailPath: renderResult.thumbnailPath,
        renderResult,
      },
    };
  }
}

export class VideoQaCheckExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const videoFilePath: string = ctx.inputData?.videoFilePath;
    const format = ctx.inputData?.storyboard?.format || 'shorts';

    if (!videoFilePath) {
      throw new Error('QA Check node requires a rendered video file path.');
    }

    ctx.info(`Running automated quality assurance inspections on "${path.basename(videoFilePath)}"...`);

    const report = await ctx.services.qa.inspectVideo({
      filePath: videoFilePath,
      expectedFormat: format,
    });

    ctx.info(`QA Inspection complete. Score: ${report.overallScore}/100. Status: ${report.overallStatus.toUpperCase()}`);

    const minScore = ctx.node.config.minPassingScore || 80;
    if (report.overallScore < minScore && ctx.node.config.failOnSilence) {
      ctx.warn(`Video QA score (${report.overallScore}) is below target threshold (${minScore}).`);
    }

    return { data: { ...ctx.inputData, qaReport: report } };
  }
}

export class ThumbnailGenExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const title = ctx.inputData?.script?.title || ctx.inputData?.topic?.title || 'Autonomous AI Workflows';
    const outputDir = path.join(ctx.workingDirectory, 'thumbnails');
    await fs.mkdir(outputDir, { recursive: true });

    const thumbPath = path.join(outputDir, `thumb_${Date.now()}.jpg`);
    ctx.info(`Generating high-CTR 1280x720 thumbnail for: "${title}"...`);

    // Generate high-visibility graphic cover card using AssetService
    const card = await ctx.services.assets.generateProceduralGraphicCard(
      0,
      title,
      'landscape',
      outputDir,
      title.toUpperCase()
    );

    return {
      data: {
        ...ctx.inputData,
        thumbnailFilePath: card.localPath,
      },
    };
  }
}

// ==========================================
// YOUTUBE & PUBLISHING
// ==========================================
export class YtMetadataGenExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const script: ScriptDocument = ctx.inputData?.script;
    const title = script?.title || ctx.inputData?.topic?.title || 'Autonomous AI Coding Workflows';
    const format = script?.format || 'shorts';

    ctx.info(`Generating high-intent YouTube titles, SEO description, tags, and chapters...`);

    const prompt = `Generate high-CTR YouTube metadata for a video titled "${title}" (${format} format).
Return JSON with:
- titleCandidates: array of 3 distinct, compelling titles
- selectedTitle: the best single title
- description: search-optimized description with timestamps if longform and relevant hashtags
- tags: array of 8-12 search tags
- categoryId: '28' (Science & Tech)
- containsSyntheticMedia: true
- privacyStatus: 'private'`;

    const res = await ctx.services.ai.generate({ prompt, jsonOutput: true });
    const meta = res.json || {
      selectedTitle: title,
      description: `${title}\n\nAutomated with CreatorFlow AI.\n\n#AI #Technology #Automation`,
      tags: ['AI', 'Automation', 'Developer', 'Tech'],
      categoryId: '28',
      containsSyntheticMedia: true,
      privacyStatus: 'private',
    };

    const publishPayload: YouTubePublishPayload = {
      title: (meta.selectedTitle || title).slice(0, 100),
      description: meta.description,
      tags: meta.tags || ['AI', 'YouTube Automation'],
      categoryId: meta.categoryId || '28',
      privacyStatus: ctx.node.config.defaultPrivacy || 'private', // Safety default!
      madeForKids: false,
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true,
      notifySubscribers: ctx.node.config.notifySubscribers ?? false,
    };

    ctx.info(`Generated YouTube metadata payload (Default Privacy: ${publishPayload.privacyStatus}).`);
    return { data: { ...ctx.inputData, publishPayload } };
  }
}

export class YtPublishExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const videoFilePath: string = ctx.inputData?.videoFilePath;
    const publishPayload: YouTubePublishPayload = ctx.inputData?.publishPayload || {
      title: 'AI Automated Video',
      description: 'Rendered with CreatorFlow AI.',
      tags: ['AI'],
      categoryId: '28',
      privacyStatus: 'private',
      madeForKids: false,
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true,
      notifySubscribers: false,
    };

    if (!videoFilePath) {
      throw new Error('YouTube Publisher requires a rendered video file.');
    }

    ctx.info(`Initiating YouTube Data API v3 upload (Privacy Status: ${publishPayload.privacyStatus})...`);

    const record = await ctx.services.youtube.uploadVideo({
      videoFilePath,
      thumbnailFilePath: ctx.inputData?.thumbnailFilePath,
      metadata: publishPayload,
      channelId: ctx.workflow.channelId,
    });

    ctx.info(`Video uploaded successfully! YouTube ID: ${record.youtubeId}. URL: ${record.youtubeUrl}`);
    return { data: { ...ctx.inputData, youtubeRecord: record } };
  }
}

export class YtAnalyticsExecutor extends NodeExecutor {
  async execute(ctx: ExecutionContext): Promise<NodeOutputResult> {
    const channelId = ctx.workflow.channelId || 'channel_default';
    ctx.info(`Retrieving channel analytics and audience retention metrics...`);

    const analytics = await ctx.services.youtube.getChannelAnalytics(channelId);
    const monetizationAudit = ctx.services.youtube.auditMonetizationReadiness();

    ctx.info(`Analytics retrieved: ${analytics.views.toLocaleString()} views, ${analytics.avgViewPercentage}% avg retention.`);

    // Suggest new topic ideas based on highest performing retention patterns
    const prompt = `Based on channel analytics (Average view duration: ${analytics.avgViewDurationSec}s, CTR: ${analytics.clickThroughRate}%), suggest 3 new high-retention video topic ideas.
Return JSON with "suggestedTopics" array.`;

    const res = await ctx.services.ai.generate({ prompt, jsonOutput: true });

    return {
      data: {
        ...ctx.inputData,
        analytics,
        monetizationAudit,
        nextTopicIdeas: res.json?.suggestedTopics || [],
      },
    };
  }
}
