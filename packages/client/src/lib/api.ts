import { Workflow, ExecutionRecord, ApprovalGate, ChannelConfig } from '@creatorflow/shared';

const API_BASE = '/api';

export const api = {
  // Workflows
  getWorkflows: async (): Promise<Workflow[]> => {
    const res = await fetch(`${API_BASE}/workflows`);
    if (!res.ok) throw new Error('Failed to load workflows');
    return res.json();
  },

  getWorkflow: async (id: string): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    if (!res.ok) throw new Error('Failed to load workflow');
    return res.json();
  },

  saveWorkflow: async (wf: Workflow): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows/${wf.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf),
    });
    if (!res.ok) throw new Error('Failed to save workflow');
    return res.json();
  },

  createWorkflow: async (wf: Partial<Workflow>): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf),
    });
    if (!res.ok) throw new Error('Failed to create workflow');
    return res.json();
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/workflows/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete workflow');
  },

  duplicateWorkflow: async (id: string): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/workflows/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to duplicate workflow');
    return res.json();
  },

  validateWorkflow: async (wf: Workflow): Promise<{ valid: boolean; issues: any[] }> => {
    const res = await fetch(`${API_BASE}/workflows/${wf.id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf),
    });
    if (!res.ok) throw new Error('Failed to validate workflow');
    return res.json();
  },

  executeWorkflow: async (wf: Workflow, initialInput?: any): Promise<{ message: string; execution?: ExecutionRecord }> => {
    const res = await fetch(`${API_BASE}/workflows/${wf.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow: wf, initialInput }),
    });
    if (!res.ok) throw new Error('Failed to execute workflow');
    return res.json();
  },

  // Executions
  getExecutions: async (): Promise<ExecutionRecord[]> => {
    const res = await fetch(`${API_BASE}/executions`);
    if (!res.ok) throw new Error('Failed to load executions');
    return res.json();
  },

  getExecution: async (id: string): Promise<ExecutionRecord> => {
    const res = await fetch(`${API_BASE}/executions/${id}`);
    if (!res.ok) throw new Error('Failed to load execution details');
    return res.json();
  },

  cancelExecution: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/executions/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel execution');
  },

  // Approvals
  getApprovals: async (): Promise<ApprovalGate[]> => {
    const res = await fetch(`${API_BASE}/approvals`);
    if (!res.ok) throw new Error('Failed to load approvals');
    return res.json();
  },

  decideApproval: async (id: string, decision: 'approved' | 'rejected', feedback?: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/approvals/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, feedback }),
    });
    if (!res.ok) throw new Error('Failed to submit approval decision');
    return res.json();
  },

  // Studio
  scoutTopics: async (niche: string, format = 'shorts'): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/studio/topics/scout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, format }),
    });
    if (!res.ok) throw new Error('Failed to scout topics');
    return res.json();
  },

  generateScript: async (topic: any, format = 'shorts', targetDurationSec = 50): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/scripts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, format, targetDurationSec }),
    });
    if (!res.ok) throw new Error('Failed to generate script');
    return res.json();
  },

  factCheckScript: async (script: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/scripts/fact-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script }),
    });
    if (!res.ok) throw new Error('Failed to fact-check script');
    return res.json();
  },

  generateStoryboard: async (script: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/storyboard/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script }),
    });
    if (!res.ok) throw new Error('Failed to generate storyboard');
    return res.json();
  },

  synthesizeVoice: async (text: string, voice?: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) throw new Error('Failed to synthesize voice');
    return res.json();
  },

  renderVideo: async (storyboard: any, audioFilePath: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/video/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyboard, audioFilePath }),
    });
    if (!res.ok) throw new Error('Failed to render video');
    return res.json();
  },

  qaInspectVideo: async (videoFilePath: string, format = 'shorts'): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/video/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoFilePath, format }),
    });
    if (!res.ok) throw new Error('Failed to run QA inspection');
    return res.json();
  },

  publishToYouTube: async (videoFilePath: string, metadata: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/studio/youtube/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoFilePath, metadata }),
    });
    if (!res.ok) throw new Error('Failed to publish to YouTube');
    return res.json();
  },

  // Templates
  getTemplates: async (): Promise<Workflow[]> => {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Failed to load templates');
    return res.json();
  },

  instantiateTemplate: async (id: string, name?: string): Promise<Workflow> => {
    const res = await fetch(`${API_BASE}/templates/${id}/instantiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to instantiate template');
    return res.json();
  },

  // Channel & Settings & Analytics
  getChannel: async (): Promise<ChannelConfig> => {
    const res = await fetch(`${API_BASE}/channels`);
    if (!res.ok) throw new Error('Failed to load channel');
    return res.json();
  },

  updateChannel: async (cfg: ChannelConfig): Promise<ChannelConfig> => {
    const res = await fetch(`${API_BASE}/channels`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    if (!res.ok) throw new Error('Failed to update channel');
    return res.json();
  },

  getAnalytics: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  getSettings: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },
};
