export type NodeExecutionStatus = 
  | 'idle' 
  | 'queued' 
  | 'running' 
  | 'success' 
  | 'failed' 
  | 'paused' 
  | 'skipped';

export type NodeCategory = 
  | 'triggers' 
  | 'flow' 
  | 'data' 
  | 'ai' 
  | 'media' 
  | 'youtube' 
  | 'approval';

export interface NodePort {
  id: string;
  name: string;
  type: 'data' | 'control' | 'condition-true' | 'condition-false';
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  description?: string;
}

export interface WorkflowNode<TConfig = Record<string, any>> {
  id: string;
  type: string;
  name: string;
  category: NodeCategory;
  position: { x: number; y: number };
  config: TConfig;
  inputs?: NodePort[];
  outputs?: NodePort[];
  disabled?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  category: string;
  tags: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  channelId?: string;
}

export interface NodeExecutionState {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: NodeExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  inputData?: any;
  outputData?: any;
  error?: string;
  retryCount?: number;
}

export interface ExecutionLogItem {
  id: string;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type ExecutionTrigger = 'manual' | 'schedule' | 'webhook' | 'test';

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: ExecutionTrigger;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  nodeStates: Record<string, NodeExecutionState>;
  stepLogs: ExecutionLogItem[];
  currentRunningNodeIds: string[];
  pausedAtNodeId?: string;
  approvalGateId?: string;
}

export interface ApprovalGate {
  id: string;
  executionId: string;
  workflowId: string;
  nodeId: string;
  title: string;
  description: string;
  type: 'script' | 'storyboard' | 'render' | 'publish' | 'custom';
  status: 'pending' | 'approved' | 'rejected';
  payload: any;
  feedback?: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}
