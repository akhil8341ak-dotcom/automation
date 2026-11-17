export type VideoFormat = 'shorts' | 'longform';

export interface ChannelConfig {
  id: string;
  name: string;
  handle?: string;
  niche: string;
  targetAudience: string;
  primaryFormat: VideoFormat | 'both';
  preferredDurationSec: {
    shorts: number;    // e.g. 50 seconds
    longform: number;  // e.g. 480 seconds (8 mins)
  };
  brandVoice: string; // e.g., 'Authoritative, engaging, witty, documentary-style'
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  targetCadencePerWeek: number;
  contentRestrictions: string[]; // Topics or words to avoid
  defaultCallToAction: string;
  defaultTags: string[];
  defaultPrivacy: 'private' | 'unlisted' | 'public';
  requireApprovalBeforePublish: boolean;
  aiContentDisclosureDefault: boolean; // YouTube policy requirement for synthetic/altered media
  createdAt: string;
  updatedAt: string;
}

export interface TopicCandidate {
  id: string;
  title: string;
  premise: string;
  targetAudience: string;
  noveltyScore: number;         // 1-100
  audienceInterestScore: number;// 1-100
  productionFeasibility: number;// 1-100
  viralAngle: string;
  factualRiskScore: number;     // 1-100 (lower is safer)
  searchIntentKeywords: string[];
  format: VideoFormat;
  estimatedDurationSec: number;
  sourcesFound: Array<{ title: string; url?: string; note?: string }>;
  status: 'draft' | 'selected' | 'archived';
}

export interface FactCheckClaim {
  id: string;
  claim: string;
  sourceOrRationale: string;
  confidence: 'high' | 'medium' | 'low';
  riskCategory: 'factual' | 'copyright' | 'safety' | 'monetization' | 'none';
  status: 'verified' | 'unverified' | 'disputed';
  verificationNotes?: string;
}

export interface FactCheckAudit {
  claims: FactCheckClaim[];
  overallTrustScore: number; // 0-100
  advertiserSafe: boolean;
  reusedContentRisk: 'low' | 'medium' | 'high';
  aiDisclosureRequired: boolean;
  warnings: string[];
}

export interface ScriptSection {
  id: string;
  index: number;
  sectionTitle: string;
  narrativePurpose: 'hook' | 'problem' | 'explanation' | 'climax' | 'twist' | 'cta' | 'conclusion';
  narrationText: string;
  estimatedSec: number;
  visualDirection: string;
}

export interface ScriptDocument {
  id: string;
  topicId?: string;
  title: string;
  format: VideoFormat;
  hookOptions: string[];
  chosenHookIndex: number;
  sections: ScriptSection[];
  totalWordCount: number;
  estimatedDurationSec: number;
  targetWpm: number; // e.g. 145-160 WPM
  factCheckAudit: FactCheckAudit;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision-requested';
  feedbackNotes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubePublishPayload {
  title: string;
  description: string;
  tags: string[];
  categoryId: string; // 28: Science & Technology, 27: Education, etc.
  privacyStatus: 'private' | 'unlisted' | 'public';
  madeForKids: boolean;
  selfDeclaredMadeForKids: boolean;
  containsSyntheticMedia: boolean; // YouTube AI disclosure requirement
  recordingDate?: string;
  notifySubscribers: boolean;
  scheduledPublishTime?: string;
}

export interface YouTubeVideoRecord {
  id: string;
  youtubeId?: string;
  channelId: string;
  executionId?: string;
  title: string;
  description: string;
  format: VideoFormat;
  videoFilePath: string;
  thumbnailFilePath?: string;
  uploadStatus: 'local-only' | 'pending-approval' | 'uploading' | 'uploaded' | 'failed';
  privacyStatus: 'private' | 'unlisted' | 'public';
  youtubeUrl?: string;
  uploadedAt?: string;
  viewCount?: number;
  likeCount?: number;
  error?: string;
}
