export interface YouTubeAnalyticsSnapshot {
  id: string;
  channelId: string;
  periodStart: string;
  periodEnd: string;
  views: number;
  watchTimeHours: number;
  avgViewDurationSec: number;
  avgViewPercentage: number;
  impressions: number;
  clickThroughRate: number; // CTR in percentage e.g. 5.8%
  subscribersGained: number;
  likes: number;
  comments: number;
  shares: number;
  estimatedApiCostUsd: number;
  source: 'official-api' | 'manual-input' | 'mock-simulation';
  isRealData: boolean;
  retrievedAt: string;
}

export interface MonetizationPolicyCheck {
  id: string;
  ruleTitle: string;
  category: 'originality' | 'advertiser-friendly' | 'synthetic-media' | 'metadata' | 'reused-content';
  passed: boolean;
  severity: 'blocker' | 'warning' | 'info';
  rationale: string;
  officialDocUrl: string;
}

export interface MonetizationReadinessAudit {
  overallScore: number; // 0-100
  monetizationEligible: boolean;
  checks: MonetizationPolicyCheck[];
  lastCheckedDate: string;
  keyActionItems: string[];
}

export interface ImprovementInsight {
  id: string;
  type: 'hook-strength' | 'pacing' | 'retention-dropoff' | 'thumbnail-ctr' | 'topic-angle';
  title: string;
  observation: string;
  actionableRecommendation: string;
  confidenceScore: number;
  suggestedNextTopics?: string[];
}
