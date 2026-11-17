import { NodeCategory, NodePort } from '../types/workflow.js';

export interface NodeDefinitionMeta {
  type: string;
  name: string;
  category: NodeCategory;
  description: string;
  icon: string;
  defaultConfig: Record<string, any>;
  inputs: NodePort[];
  outputs: NodePort[];
  tags: string[];
}

export const NODE_CATALOG: Record<string, NodeDefinitionMeta> = {
  // ==========================================
  // TRIGGERS
  // ==========================================
  'manual-trigger': {
    type: 'manual-trigger',
    name: 'Manual Trigger',
    category: 'triggers',
    description: 'Start the workflow on demand with custom parameters.',
    icon: 'PlayCircle',
    defaultConfig: {
      initialInput: { topic: 'Autonomous AI Coding Agents in 2026' },
    },
    inputs: [],
    outputs: [
      { id: 'out', name: 'Trigger Payload', type: 'control' }
    ],
    tags: ['trigger', 'manual', 'starter'],
  },
  'schedule-trigger': {
    type: 'schedule-trigger',
    name: 'Schedule Trigger',
    category: 'triggers',
    description: 'Trigger workflow periodically using a cron schedule or interval.',
    icon: 'Clock',
    defaultConfig: {
      cron: '0 9 * * 1', // Weekly Monday at 9:00 AM
      timezone: 'UTC',
      active: true,
    },
    inputs: [],
    outputs: [
      { id: 'out', name: 'Schedule Event', type: 'control' }
    ],
    tags: ['trigger', 'cron', 'recurring'],
  },
  'webhook-trigger': {
    type: 'webhook-trigger',
    name: 'Webhook Trigger',
    category: 'triggers',
    description: 'Trigger workflow via incoming HTTP POST requests.',
    icon: 'Webhook',
    defaultConfig: {
      path: '/yt-production-event',
      secretHeader: 'x-webhook-secret',
    },
    inputs: [],
    outputs: [
      { id: 'out', name: 'Webhook Body', type: 'control' }
    ],
    tags: ['trigger', 'webhook', 'api'],
  },

  // ==========================================
  // FLOW & LOGIC
  // ==========================================
  'if-else': {
    type: 'if-else',
    name: 'IF / ELSE Branch',
    category: 'flow',
    description: 'Evaluate a condition and branch execution.',
    icon: 'GitFork',
    defaultConfig: {
      conditionType: 'expression',
      field: 'qaScore',
      operator: '>=',
      value: 80,
    },
    inputs: [
      { id: 'in', name: 'Input Data', type: 'control' }
    ],
    outputs: [
      { id: 'true', name: 'True (Pass)', type: 'condition-true' },
      { id: 'false', name: 'False (Fail)', type: 'condition-false' },
    ],
    tags: ['flow', 'branch', 'condition'],
  },
  'switch': {
    type: 'switch',
    name: 'Switch',
    category: 'flow',
    description: 'Route execution to one of multiple paths based on a value.',
    icon: 'Split',
    defaultConfig: {
      field: 'format',
      cases: ['shorts', 'longform', 'default'],
    },
    inputs: [
      { id: 'in', name: 'Input Data', type: 'control' }
    ],
    outputs: [
      { id: 'case-shorts', name: 'Shorts', type: 'control' },
      { id: 'case-longform', name: 'Long-form', type: 'control' },
      { id: 'case-default', name: 'Default', type: 'control' },
    ],
    tags: ['flow', 'router', 'multi-branch'],
  },
  'merge': {
    type: 'merge',
    name: 'Merge',
    category: 'flow',
    description: 'Combine multiple execution paths into a single output.',
    icon: 'GitMerge',
    defaultConfig: {
      mode: 'wait-all', // 'wait-all' | 'first-available'
    },
    inputs: [
      { id: 'in-1', name: 'Path 1', type: 'control' },
      { id: 'in-2', name: 'Path 2', type: 'control' },
    ],
    outputs: [
      { id: 'out', name: 'Merged Stream', type: 'control' }
    ],
    tags: ['flow', 'join', 'merge'],
  },
  'delay': {
    type: 'delay',
    name: 'Delay / Wait',
    category: 'flow',
    description: 'Pause execution for a specific duration.',
    icon: 'Hourglass',
    defaultConfig: {
      durationSeconds: 5,
    },
    inputs: [
      { id: 'in', name: 'Input', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'control' }
    ],
    tags: ['flow', 'wait', 'pause'],
  },
  'approval-gate': {
    type: 'approval-gate',
    name: 'Human Approval Gate',
    category: 'approval',
    description: 'Pause workflow execution until a human reviews and approves.',
    icon: 'ShieldCheck',
    defaultConfig: {
      gateType: 'script', // 'script' | 'storyboard' | 'render' | 'publish'
      title: 'Editorial Sign-Off Required',
      description: 'Review script accuracy and viral potential before generating voice & video.',
      autoApproveIfScoreAbove: 0, // 0 means always require manual review
    },
    inputs: [
      { id: 'in', name: 'Payload to Review', type: 'control' }
    ],
    outputs: [
      { id: 'approved', name: 'Approved', type: 'condition-true' },
      { id: 'rejected', name: 'Rejected', type: 'condition-false' },
    ],
    tags: ['approval', 'human-in-the-loop', 'review', 'safety'],
  },

  // ==========================================
  // DATA & CODE
  // ==========================================
  'set-data': {
    type: 'set-data',
    name: 'Set / Transform Data',
    category: 'data',
    description: 'Define or reshape variables passed to downstream nodes.',
    icon: 'Database',
    defaultConfig: {
      values: {
        channelNiche: 'Technology & AI',
        targetLanguage: 'en-US',
      },
    },
    inputs: [
      { id: 'in', name: 'Input', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Transformed Data', type: 'control' }
    ],
    tags: ['data', 'transform', 'variables'],
  },
  'template-render': {
    type: 'template-render',
    name: 'Template Builder',
    category: 'data',
    description: 'Render text templates with {{variable}} substitutions.',
    icon: 'FileText',
    defaultConfig: {
      template: 'Deep Dive: {{topic.title}}\n\nHook: {{script.hook}}',
    },
    inputs: [
      { id: 'in', name: 'Variables', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Rendered Text', type: 'control' }
    ],
    tags: ['data', 'template', 'text'],
  },
  'http-request': {
    type: 'http-request',
    name: 'HTTP Request',
    category: 'data',
    description: 'Call external REST APIs with headers, query params, and body.',
    icon: 'Globe',
    defaultConfig: {
      method: 'GET',
      url: 'https://api.github.com/zen',
      headers: {},
    },
    inputs: [
      { id: 'in', name: 'Input', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Response Data', type: 'control' }
    ],
    tags: ['http', 'api', 'network'],
  },

  // ==========================================
  // AI & CONTENT
  // ==========================================
  'ai-text-gen': {
    type: 'ai-text-gen',
    name: 'AI Text Generation',
    category: 'ai',
    description: 'Generate text or structured JSON using Gemini, OpenAI, Claude or Ollama.',
    icon: 'Sparkles',
    defaultConfig: {
      provider: 'auto', // 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'mock'
      model: 'gemini-1.5-flash',
      prompt: 'Write 3 compelling video angles about: {{topic}}',
      temperature: 0.7,
      jsonOutput: true,
    },
    inputs: [
      { id: 'in', name: 'Prompt Context', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'AI Output', type: 'control' }
    ],
    tags: ['ai', 'llm', 'generate', 'text'],
  },
  'yt-topic-research': {
    type: 'yt-topic-research',
    name: 'Topic Scout & Scoring',
    category: 'ai',
    description: 'Discover trending topic angles and score them for audience interest, novelty, and safety.',
    icon: 'Compass',
    defaultConfig: {
      niche: 'AI & Future Technology',
      targetAudience: 'Software developers, tech enthusiasts, creators',
      format: 'shorts',
      numberOfCandidates: 3,
      minNoveltyScore: 70,
    },
    inputs: [
      { id: 'in', name: 'Channel / Seed', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Ranked Topics', type: 'control' }
    ],
    tags: ['youtube', 'research', 'ideation', 'viral-angle'],
  },
  'yt-script-writer': {
    type: 'yt-script-writer',
    name: 'Script Lab',
    category: 'ai',
    description: 'Generate retention-optimized scripts with hook variants and visual pacing.',
    icon: 'PenTool',
    defaultConfig: {
      format: 'shorts',
      targetDurationSec: 50,
      targetWpm: 150,
      numberOfHookVariants: 3,
      tone: 'Energetic, informative, punchy',
    },
    inputs: [
      { id: 'in', name: 'Chosen Topic', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Script Document', type: 'control' }
    ],
    tags: ['youtube', 'script', 'copywriting', 'retention'],
  },
  'yt-fact-checker': {
    type: 'yt-fact-checker',
    name: 'Fact-Check & Policy Audit',
    category: 'ai',
    description: 'Extract factual claims, verify evidence citations, and flag YouTube monetization risks.',
    icon: 'FileCheck',
    defaultConfig: {
      strictness: 'high',
      checkMonetizationRules: true,
      checkReusedContent: true,
    },
    inputs: [
      { id: 'in', name: 'Draft Script', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Audited Script', type: 'control' }
    ],
    tags: ['youtube', 'fact-check', 'policy', 'monetization'],
  },
  'yt-storyboard-gen': {
    type: 'yt-storyboard-gen',
    name: 'Storyboard & Scene Planner',
    category: 'ai',
    description: 'Decompose script into timed scenes with visual objectives, search queries, and transitions.',
    icon: 'Layers',
    defaultConfig: {
      aspectRatio: '9:16', // '9:16' (Shorts) or '16:9' (Long-form)
      maxSceneDurationSec: 5,
      preferredTransitions: 'zoom',
    },
    inputs: [
      { id: 'in', name: 'Approved Script', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Storyboard Scenes', type: 'control' }
    ],
    tags: ['youtube', 'storyboard', 'scenes', 'visuals'],
  },

  // ==========================================
  // MEDIA & RENDERING
  // ==========================================
  'voiceover-tts': {
    type: 'voiceover-tts',
    name: 'Voiceover Synthesis',
    category: 'media',
    description: 'Synthesize natural voiceover audio using Edge TTS or OpenAI with volume normalization.',
    icon: 'Mic',
    defaultConfig: {
      provider: 'edge-tts',
      voice: 'en-US-ChristopherNeural', // Natural, authoritative US English
      rate: '+0%',
      pitch: '+0Hz',
      normalizeAudio: true,
    },
    inputs: [
      { id: 'in', name: 'Script Sections', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Audio Track & Timestamps', type: 'control' }
    ],
    tags: ['audio', 'tts', 'voice', 'speech'],
  },
  'asset-collector': {
    type: 'asset-collector',
    name: 'Visual Asset Deck',
    category: 'media',
    description: 'Fetch licensed stock videos, photos, or generate algorithmic motion graphics for each scene.',
    icon: 'Image',
    defaultConfig: {
      providers: ['pexels', 'pixabay', 'procedural'],
      preferVideoOverImages: true,
      orientation: 'portrait', // 'portrait' | 'landscape'
    },
    inputs: [
      { id: 'in', name: 'Storyboard Scenes', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Scenes with Media Assets', type: 'control' }
    ],
    tags: ['media', 'stock', 'assets', 'video'],
  },
  'video-renderer': {
    type: 'video-renderer',
    name: 'FFmpeg Video Renderer',
    category: 'media',
    description: 'Render full HD/4K videos with dynamic captions, audio ducking, and smooth transitions.',
    icon: 'Film',
    defaultConfig: {
      format: 'shorts', // 'shorts' (1080x1920) or 'longform' (1920x1080)
      fps: 30,
      burnCaptions: true,
      captionAnimation: 'pop',
      musicDucking: true,
      bgMusicVolume: 0.12,
    },
    inputs: [
      { id: 'in', name: 'Storyboard + Audio Assets', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Rendered MP4 Video', type: 'control' }
    ],
    tags: ['ffmpeg', 'render', 'video', 'subtitles'],
  },
  'video-qa-check': {
    type: 'video-qa-check',
    name: 'Automated QA Engine',
    category: 'media',
    description: 'Inspect rendered MP4 for black frames, audio clipping, silence, duration, and aspect ratio.',
    icon: 'CheckCheck',
    defaultConfig: {
      minPassingScore: 85,
      failOnSilence: true,
      failOnBlackFrames: true,
    },
    inputs: [
      { id: 'in', name: 'Rendered Video File', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'QA Scorecard Report', type: 'control' }
    ],
    tags: ['qa', 'quality', 'verification', 'scorecard'],
  },
  'thumbnail-gen': {
    type: 'thumbnail-gen',
    name: 'Thumbnail Generator',
    category: 'media',
    description: 'Generate high-CTR thumbnail concepts and auto-render 1280x720 cover cards with bold typography.',
    icon: 'Palette',
    defaultConfig: {
      style: 'modern-bold',
      highlightKeywords: true,
      includeFaceOrFocalIcon: true,
    },
    inputs: [
      { id: 'in', name: 'Script / Title', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Thumbnail Image File', type: 'control' }
    ],
    tags: ['thumbnail', 'design', 'ctr', 'graphics'],
  },

  // ==========================================
  // YOUTUBE & PUBLISHING
  // ==========================================
  'yt-metadata-gen': {
    type: 'yt-metadata-gen',
    name: 'SEO Metadata & Chapters',
    category: 'youtube',
    description: 'Create high-intent YouTube titles, search-optimized descriptions, tags, and timestamps.',
    icon: 'Tag',
    defaultConfig: {
      generateTimestamps: true,
      includeAiDisclosure: true,
      defaultPrivacy: 'private',
    },
    inputs: [
      { id: 'in', name: 'Script & Video Info', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Publish Payload', type: 'control' }
    ],
    tags: ['youtube', 'seo', 'metadata', 'tags'],
  },
  'yt-publish': {
    type: 'yt-publish',
    name: 'YouTube Publisher',
    category: 'youtube',
    description: 'Upload video via official YouTube Data API v3 (Private by default, resumable).',
    icon: 'Youtube',
    defaultConfig: {
      defaultPrivacy: 'private', // Enforced safety default!
      category: '28', // Science & Technology
      notifySubscribers: true,
    },
    inputs: [
      { id: 'in', name: 'Video File + Metadata', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'YouTube Video Record', type: 'control' }
    ],
    tags: ['youtube', 'upload', 'publishing', 'oauth'],
  },
  'yt-analytics': {
    type: 'yt-analytics',
    name: 'YouTube Analytics & Feedback',
    category: 'youtube',
    description: 'Fetch real channel metrics (views, retention, watch time) and trigger feedback loops.',
    icon: 'BarChart3',
    defaultConfig: {
      periodDays: 30,
      generateNextTopicIdeas: true,
    },
    inputs: [
      { id: 'in', name: 'Channel Context', type: 'control' }
    ],
    outputs: [
      { id: 'out', name: 'Analytics & New Topic Ideas', type: 'control' }
    ],
    tags: ['youtube', 'analytics', 'kpis', 'feedback-loop'],
  },
};
