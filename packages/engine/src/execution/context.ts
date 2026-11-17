import { Workflow, WorkflowNode, ExecutionLogItem } from '@creatorflow/shared';
import { AiProviderService } from '../services/ai/aiService.js';
import { TtsService } from '../services/tts/ttsService.js';
import { AssetService } from '../services/media/assetService.js';
import { FfmpegRenderService } from '../services/render/ffmpegService.js';
import { QaService } from '../services/qa/qaService.js';
import { YouTubeService } from '../services/youtube/youtubeService.js';

export interface ServiceContainer {
  ai: AiProviderService;
  tts: TtsService;
  assets: AssetService;
  renderer: FfmpegRenderService;
  qa: QaService;
  youtube: YouTubeService;
}

export interface NodeOutputResult {
  data: any;
  handleId?: string; // e.g. 'condition-true' or 'case-shorts'
  pauseWorkflow?: boolean;
  approvalPayload?: any;
}

export class ExecutionContext {
  public logs: ExecutionLogItem[] = [];

  constructor(
    public executionId: string,
    public workflow: Workflow,
    public node: WorkflowNode,
    public inputData: any,
    public services: ServiceContainer,
    public workingDirectory: string,
    public abortSignal?: AbortSignal
  ) {}

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: Record<string, any>): void {
    // Scrub sensitive tokens before recording log
    const safeMessage = this.redactSecrets(message);
    const item: ExecutionLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nodeId: this.node.id,
      level,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.logs.push(item);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  public error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }

  private redactSecrets(str: string): string {
    return str
      .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED_GEMINI_KEY]')
      .replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-[REDACTED_OPENAI_KEY]')
      .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]')
      .replace(/key=[A-Za-z0-9-_]+/gi, 'key=[REDACTED]');
  }
}
