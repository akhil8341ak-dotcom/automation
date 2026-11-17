import { z } from 'zod';

export const NodeCategorySchema = z.enum([
  'triggers',
  'flow',
  'data',
  'ai',
  'media',
  'youtube',
  'approval',
]);

export const NodePortSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['data', 'control', 'condition-true', 'condition-false']),
  dataType: z.enum(['string', 'number', 'boolean', 'object', 'array', 'any']).optional(),
  description: z.string().optional(),
});

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  category: NodeCategorySchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  config: z.record(z.any()).default({}),
  inputs: z.array(NodePortSchema).optional(),
  outputs: z.array(NodePortSchema).optional(),
  disabled: z.boolean().optional(),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceHandle: z.string().optional(),
  target: z.string().min(1),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().default(''),
  version: z.number().int().default(1),
  category: z.string().default('YouTube Automation'),
  tags: z.array(z.string()).default([]),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  active: z.boolean().default(true),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
  channelId: z.string().optional(),
});

export const ChannelConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  handle: z.string().optional(),
  niche: z.string().min(1),
  targetAudience: z.string().min(1),
  primaryFormat: z.enum(['shorts', 'longform', 'both']).default('both'),
  preferredDurationSec: z.object({
    shorts: z.number().min(10).max(60).default(50),
    longform: z.number().min(60).max(3600).default(480),
  }),
  brandVoice: z.string().default('Engaging, informative, authentic'),
  brandColors: z.object({
    primary: z.string().default('#3B82F6'),
    secondary: z.string().default('#10B981'),
    accent: z.string().default('#F59E0B'),
    background: z.string().default('#0F172A'),
  }),
  targetCadencePerWeek: z.number().int().min(1).max(21).default(3),
  contentRestrictions: z.array(z.string()).default([]),
  defaultCallToAction: z.string().default('Subscribe for more deep dives into tech & creator tools.'),
  defaultTags: z.array(z.string()).default([]),
  defaultPrivacy: z.enum(['private', 'unlisted', 'public']).default('private'),
  requireApprovalBeforePublish: z.boolean().default(true),
  aiContentDisclosureDefault: z.boolean().default(true),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
});

export const ScriptSectionSchema = z.object({
  id: z.string().min(1),
  index: z.number().int(),
  sectionTitle: z.string(),
  narrativePurpose: z.enum(['hook', 'problem', 'explanation', 'climax', 'twist', 'cta', 'conclusion']),
  narrationText: z.string().min(1),
  estimatedSec: z.number().min(1),
  visualDirection: z.string(),
});

export const ScriptDocumentSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().optional(),
  title: z.string().min(1),
  format: z.enum(['shorts', 'longform']),
  hookOptions: z.array(z.string()).min(1),
  chosenHookIndex: z.number().int().default(0),
  sections: z.array(ScriptSectionSchema).min(1),
  totalWordCount: z.number().int().min(1),
  estimatedDurationSec: z.number().min(1),
  targetWpm: z.number().min(100).max(220).default(150),
  factCheckAudit: z.object({
    claims: z.array(z.object({
      id: z.string(),
      claim: z.string(),
      sourceOrRationale: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
      riskCategory: z.enum(['factual', 'copyright', 'safety', 'monetization', 'none']),
      status: z.enum(['verified', 'unverified', 'disputed']),
      verificationNotes: z.string().optional(),
    })),
    overallTrustScore: z.number().min(0).max(100),
    advertiserSafe: z.boolean(),
    reusedContentRisk: z.enum(['low', 'medium', 'high']),
    aiDisclosureRequired: z.boolean(),
    warnings: z.array(z.string()),
  }),
  approvalStatus: z.enum(['pending', 'approved', 'rejected', 'revision-requested']).default('pending'),
  feedbackNotes: z.string().optional(),
  version: z.number().int().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const YouTubePublishPayloadSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000),
  tags: z.array(z.string()).max(50),
  categoryId: z.string().default('28'),
  privacyStatus: z.enum(['private', 'unlisted', 'public']).default('private'),
  madeForKids: z.boolean().default(false),
  selfDeclaredMadeForKids: z.boolean().default(false),
  containsSyntheticMedia: z.boolean().default(true),
  notifySubscribers: z.boolean().default(true),
  scheduledPublishTime: z.string().datetime().optional(),
});



export const TopicCandidateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  premise: z.string().min(1),
  targetAudience: z.string().min(1),
  noveltyScore: z.number().int().min(1).max(100),
  audienceInterestScore: z.number().int().min(1).max(100),
  productionFeasibility: z.number().int().min(1).max(100),
  viralAngle: z.string().min(1),
  factualRiskScore: z.number().int().min(1).max(100),
  searchIntentKeywords: z.array(z.string()),
  format: z.enum(['shorts', 'longform']),
  estimatedDurationSec: z.number().positive(),
  sourcesFound: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      note: z.string().optional(),
    })
  ),
  status: z.enum(['draft', 'selected', 'archived']),
});


