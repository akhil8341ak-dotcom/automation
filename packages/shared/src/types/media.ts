import { VideoFormat } from './youtube.js';

export type AssetType = 'stock-video' | 'stock-image' | 'generative-graphic' | 'user-upload' | 'ai-image';

export interface VisualAsset {
  id: string;
  type: AssetType;
  source: 'pexels' | 'pixabay' | 'local' | 'procedural' | 'generative';
  title?: string;
  url: string;
  localPath?: string;
  width: number;
  height: number;
  durationSec?: number;
  author?: string;
  attributionUrl?: string;
  license: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | 'other';
}

export interface StoryboardScene {
  id: string;
  sceneIndex: number;
  sectionId?: string;
  narrationSnippet: string;
  estimatedDurationSec: number;
  visualObjective: string;
  assetSearchQuery: string;
  selectedAsset?: VisualAsset;
  onScreenText?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  transition: 'cut' | 'fade' | 'zoom' | 'slide-left' | 'dissolve';
  confidenceScore: number; // 0-100 relevance score
}

export interface Storyboard {
  id: string;
  scriptId: string;
  title: string;
  format: VideoFormat;
  scenes: StoryboardScene[];
  totalEstimatedSec: number;
  approvalStatus: 'draft' | 'approved' | 'changes-requested';
  createdAt: string;
  updatedAt: string;
}

export interface SubtitleStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string; // e.g. '#FFFFFF'
  highlightColor: string; // e.g. '#FACC15' (amber)
  outlineColor: string; // e.g. '#000000'
  outlineWidth: number;
  allCaps: boolean;
  positionY: number; // percentage from bottom, e.g. 25% for Shorts
  animation: 'none' | 'word-by-word' | 'pop';
}

export interface RenderJobConfig {
  format: VideoFormat;
  width: number;
  height: number;
  fps: number;
  crf: number; // 18-28 (lower is higher quality)
  videoBitrate: string; // e.g. '8M'
  audioBitrate: string; // e.g. '192k'
  subtitleStyle: SubtitleStyle;
  burnSubtitles: boolean;
  burnCaptions?: boolean;
  backgroundMusicPath?: string;
  backgroundMusicVolume: number; // 0.05 - 0.20
  duckMusicUnderVoice: boolean;
  outputFormat: 'mp4' | 'webm';
}

export interface QACheckItem {
  id: string;
  name: string;
  category: 'video' | 'audio' | 'captions' | 'policy' | 'metadata';
  status: 'pass' | 'warn' | 'fail';
  measuredValue: string | number;
  targetThreshold: string | number;
  message: string;
  remedyAction?: string;
}

export interface QAReport {
  id: string;
  renderJobId: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  overallScore: number; // 0 - 100
  checks: QACheckItem[];
  outputFileDetails: {
    filePath: string;
    fileSizeBytes: number;
    durationSec: number;
    width: number;
    height: number;
    codec: string;
    hasAudio: boolean;
    audioChannels: number;
  };
  generatedAt: string;
}
