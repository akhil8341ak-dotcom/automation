import { NodeExecutor } from './base.js';
import {
  ManualTriggerExecutor,
  ScheduleTriggerExecutor,
  WebhookTriggerExecutor,
  IfElseExecutor,
  SwitchExecutor,
  MergeExecutor,
  DelayExecutor,
  ApprovalGateExecutor,
  SetDataExecutor,
  TemplateRenderExecutor,
  HttpRequestExecutor,
  AiTextGenExecutor,
  YtTopicResearchExecutor,
  YtScriptWriterExecutor,
  YtFactCheckerExecutor,
  YtStoryboardGenExecutor,
  VoiceoverTtsExecutor,
  AssetCollectorExecutor,
  VideoRendererExecutor,
  VideoQaCheckExecutor,
  ThumbnailGenExecutor,
  YtMetadataGenExecutor,
  YtPublishExecutor,
  YtAnalyticsExecutor,
} from './executors.js';

export * from './base.js';
export * from './executors.js';

export const EXECUTOR_REGISTRY: Record<string, NodeExecutor> = {
  // Triggers
  'manual-trigger': new ManualTriggerExecutor(),
  'schedule-trigger': new ScheduleTriggerExecutor(),
  'webhook-trigger': new WebhookTriggerExecutor(),

  // Flow & Logic
  'if-else': new IfElseExecutor(),
  'switch': new SwitchExecutor(),
  'merge': new MergeExecutor(),
  'delay': new DelayExecutor(),
  'approval-gate': new ApprovalGateExecutor(),

  // Data & Code
  'set-data': new SetDataExecutor(),
  'template-render': new TemplateRenderExecutor(),
  'http-request': new HttpRequestExecutor(),

  // AI & Content
  'ai-text-gen': new AiTextGenExecutor(),
  'yt-topic-research': new YtTopicResearchExecutor(),
  'yt-script-writer': new YtScriptWriterExecutor(),
  'yt-fact-checker': new YtFactCheckerExecutor(),
  'yt-storyboard-gen': new YtStoryboardGenExecutor(),

  // Media & Rendering
  'voiceover-tts': new VoiceoverTtsExecutor(),
  'asset-collector': new AssetCollectorExecutor(),
  'video-renderer': new VideoRendererExecutor(),
  'video-qa-check': new VideoQaCheckExecutor(),
  'thumbnail-gen': new ThumbnailGenExecutor(),

  // YouTube & Publishing
  'yt-metadata-gen': new YtMetadataGenExecutor(),
  'yt-publish': new YtPublishExecutor(),
  'yt-analytics': new YtAnalyticsExecutor(),
};
