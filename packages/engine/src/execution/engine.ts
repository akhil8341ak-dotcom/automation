import { EventEmitter } from 'node:events';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { 
  Workflow, 
  WorkflowNode, 
  ExecutionRecord, 
  NodeExecutionState, 
  ApprovalGate, 
  ExecutionLogItem 
} from '@creatorflow/shared';
import { DependencyGraph } from '../dag/graph.js';
import { WorkflowValidator } from '../dag/validator.js';
import { EXECUTOR_REGISTRY } from '../nodes/index.js';
import { ExecutionContext, ServiceContainer } from './context.js';
import { AiProviderService } from '../services/ai/aiService.js';
import { TtsService } from '../services/tts/ttsService.js';
import { AssetService } from '../services/media/assetService.js';
import { FfmpegRenderService } from '../services/render/ffmpegService.js';
import { QaService } from '../services/qa/qaService.js';
import { YouTubeService } from '../services/youtube/youtubeService.js';

export interface ExecuteWorkflowOptions {
  triggerType?: 'manual' | 'schedule' | 'webhook' | 'test';
  initialInput?: any;
  storageBaseDir?: string;
  executionId?: string;
}

interface ExecutionRuntimeState {
  workflow: Workflow;
  graph: DependencyGraph;
  order: string[];
  nodeOutputs: Map<string, any>;
  skippedNodes: Set<string>;
  workingDir: string;
  abortController: AbortController;
  options: ExecuteWorkflowOptions;
}

export class WorkflowEngine extends EventEmitter {
  private activeExecutions: Map<string, ExecutionRecord> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private approvalGates: Map<string, ApprovalGate> = new Map();
  private runtimeStates: Map<string, ExecutionRuntimeState> = new Map();
  private services: ServiceContainer;

  constructor(env: Record<string, string | undefined> = process.env) {
    super();
    this.services = {
      ai: new AiProviderService(env),
      tts: new TtsService(env),
      assets: new AssetService(env),
      renderer: new FfmpegRenderService(),
      qa: new QaService(),
      youtube: new YouTubeService(env),
    };
  }

  public getServices(): ServiceContainer {
    return this.services;
  }

  public getActiveExecution(id: string): ExecutionRecord | undefined {
    return this.activeExecutions.get(id);
  }

  public getApprovalGate(id: string): ApprovalGate | undefined {
    return this.approvalGates.get(id);
  }

  public getPendingApprovalGates(): ApprovalGate[] {
    return Array.from(this.approvalGates.values()).filter(g => g.status === 'pending');
  }

  /**
   * Execute a full DAG Workflow
   */
  public async execute(workflow: Workflow, options: ExecuteWorkflowOptions = {}): Promise<ExecutionRecord> {
    // 1. Validate workflow structure
    const validation = WorkflowValidator.validate(workflow);
    if (!validation.valid) {
      const errMsgs = validation.issues.filter(i => i.type === 'error').map(i => i.message).join('; ');
      throw new Error(`Workflow validation failed: ${errMsgs}`);
    }

    // 2. Initialize execution record
    const executionId = options.executionId || `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const abortController = new AbortController();
    this.abortControllers.set(executionId, abortController);

    const nodeStates: Record<string, NodeExecutionState> = {};
    for (const node of workflow.nodes) {
      nodeStates[node.id] = {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        status: node.disabled ? 'skipped' : 'queued',
      };
    }

    const record: ExecutionRecord = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerType: options.triggerType || 'manual',
      status: 'running',
      startedAt: new Date().toISOString(),
      nodeStates,
      stepLogs: [],
      currentRunningNodeIds: [],
    };

    this.activeExecutions.set(executionId, record);
    this.emit('execution:started', record);

    // 3. Setup working directory
    const baseDir = options.storageBaseDir || path.resolve('./data/storage');
    const workingDir = path.join(baseDir, 'executions', executionId);
    await fs.mkdir(workingDir, { recursive: true });

    // 4. Resolve topological order
    const graph = new DependencyGraph(workflow);
    const order = graph.getTopologicalOrder();

    // Store node outputs for passing down to dependencies
    const nodeOutputs = new Map<string, any>();
    if (options.initialInput) {
      nodeOutputs.set('__initial__', options.initialInput);
    }

    // Nodes that are deactivated because a branch condition bypassed them
    const skippedNodes = new Set<string>();

    const runtime: ExecutionRuntimeState = {
      workflow,
      graph,
      order,
      nodeOutputs,
      skippedNodes,
      workingDir,
      abortController,
      options,
    };
    this.runtimeStates.set(executionId, runtime);

    return await this.runExecutionLoop(record, runtime, 0);
  }

  private async runExecutionLoop(
    record: ExecutionRecord,
    runtime: ExecutionRuntimeState,
    startIndex: number
  ): Promise<ExecutionRecord> {
    const { workflow, graph, order, nodeOutputs, skippedNodes, workingDir, abortController, options } = runtime;
    const executionId = record.id;

    try {
      for (let i = startIndex; i < order.length; i++) {
        const nodeId = order[i];
        if (abortController.signal.aborted) {
          record.status = 'cancelled';
          record.completedAt = new Date().toISOString();
          record.durationMs = Date.now() - new Date(record.startedAt).getTime();
          record.currentRunningNodeIds = [];
          this.emit('execution:cancelled', record);
          this.runtimeStates.delete(executionId);
          return record;
        }

        const graphNode = graph.nodes.get(nodeId)!;
        const node = graphNode.node;

        if (node.disabled || skippedNodes.has(nodeId)) {
          record.nodeStates[nodeId].status = 'skipped';
          this.emit('node:skipped', { executionId, nodeId });
          continue;
        }

        // Aggregate inputs from incoming edges
        let combinedInput: any = {};
        for (const inEdge of graphNode.incomingEdges) {
          const upstreamData = nodeOutputs.get(inEdge.source);
          if (upstreamData !== undefined) {
            combinedInput = { ...combinedInput, ...upstreamData };
          }
        }
        if (Object.keys(combinedInput).length === 0 && options.initialInput) {
          combinedInput = { ...options.initialInput };
        }

        // Execute current node
        const nodeState = record.nodeStates[nodeId];
        nodeState.status = 'running';
        nodeState.startedAt = new Date().toISOString();
        nodeState.inputData = combinedInput;
        record.currentRunningNodeIds = [nodeId];
        this.emit('node:started', { executionId, nodeId, nodeName: node.name });

        const ctx = new ExecutionContext(
          executionId,
          workflow,
          node,
          combinedInput,
          this.services,
          workingDir,
          abortController.signal
        );

        const executor = EXECUTOR_REGISTRY[node.type];
        if (!executor) {
          throw new Error(`No executor registered for node type: "${node.type}"`);
        }

        const startTime = Date.now();
        let result;
        try {
          result = await executor.execute(ctx);
        } catch (execErr: any) {
          nodeState.status = 'failed';
          nodeState.error = execErr.message;
          nodeState.completedAt = new Date().toISOString();
          nodeState.durationMs = Date.now() - startTime;
          record.stepLogs.push(...ctx.logs);

          record.status = 'failed';
          record.error = `Node "${node.name}" (${node.type}) failed: ${execErr.message}`;
          record.completedAt = new Date().toISOString();
          record.durationMs = Date.now() - new Date(record.startedAt).getTime();
          record.currentRunningNodeIds = [];

          this.emit('node:failed', { executionId, nodeId, error: execErr.message });
          this.emit('execution:failed', record);
          this.runtimeStates.delete(executionId);
          return record;
        }

        // Record logs from context
        record.stepLogs.push(...ctx.logs);
        nodeState.durationMs = Date.now() - startTime;
        nodeState.completedAt = new Date().toISOString();
        nodeState.outputData = result.data;
        nodeOutputs.set(nodeId, result.data);

        // Check if node is an Approval Gate holding execution
        if (result.pauseWorkflow) {
          const gateId = `gate-${Date.now()}`;
          const gate: ApprovalGate = {
            id: gateId,
            executionId,
            workflowId: workflow.id,
            nodeId,
            title: result.approvalPayload?.title || 'Approval Required',
            description: result.approvalPayload?.description || '',
            type: result.approvalPayload?.gateType || 'custom',
            status: 'pending',
            payload: result.approvalPayload?.payload || result.data,
            createdAt: new Date().toISOString(),
          };

          this.approvalGates.set(gateId, gate);

          nodeState.status = 'paused';
          record.status = 'paused';
          record.pausedAtNodeId = nodeId;
          record.approvalGateId = gateId;
          record.currentRunningNodeIds = [];

          this.emit('node:paused', { executionId, nodeId, gateId });
          this.emit('execution:paused', { executionId, gateId, gate });
          return record; // Execution paused safely awaiting human decision!
        }

        nodeState.status = 'success';
        this.emit('node:completed', { executionId, nodeId, output: result.data });

        // Branching logic: if node selected a specific handle (e.g. 'condition-true')
        if (result.handleId) {
          for (const edge of graphNode.outgoingEdges) {
            if (edge.sourceHandle && edge.sourceHandle !== result.handleId) {
              // Mark downstream branch as skipped
              skippedNodes.add(edge.target);
            }
          }
        }
      }

      record.status = 'completed';
      record.completedAt = new Date().toISOString();
      record.durationMs = Date.now() - new Date(record.startedAt).getTime();
      record.currentRunningNodeIds = [];

      this.emit('execution:completed', record);
      this.runtimeStates.delete(executionId);
      return record;
    } catch (err: any) {
      record.status = 'failed';
      record.error = err.message;
      record.completedAt = new Date().toISOString();
      record.durationMs = Date.now() - new Date(record.startedAt).getTime();
      record.currentRunningNodeIds = [];
      this.emit('execution:failed', record);
      this.runtimeStates.delete(executionId);
      return record;
    }
  }

  /**
   * Resume an execution held at an Approval Gate
   */
  public async resumeExecution(
    executionId: string,
    gateId: string,
    decision: 'approved' | 'rejected',
    feedback?: string
  ): Promise<ExecutionRecord> {
    const record = this.activeExecutions.get(executionId);
    const gate = this.approvalGates.get(gateId);

    if (!record || !gate) {
      throw new Error(`Execution ${executionId} or Gate ${gateId} not found.`);
    }

    gate.status = decision;
    gate.feedback = feedback;
    gate.decidedAt = new Date().toISOString();

    const pausedNodeId = record.pausedAtNodeId || gate.nodeId;
    const nodeState = record.nodeStates[pausedNodeId];

    if (decision === 'rejected') {
      nodeState.status = 'failed';
      nodeState.error = `Rejected by reviewer: ${feedback || 'No feedback provided'}`;
      record.status = 'failed';
      record.error = `Execution halted at approval gate: ${gate.title} (Rejected)`;
      record.completedAt = new Date().toISOString();
      record.currentRunningNodeIds = [];
      this.emit('execution:rejected', { executionId, gateId });
      this.emit('execution:failed', record);
      this.runtimeStates.delete(executionId);
      return record;
    }

    // If approved, mark node as success and resume remainder of workflow
    nodeState.status = 'success';
    record.status = 'running';
    record.pausedAtNodeId = undefined;
    record.approvalGateId = undefined;

    this.emit('execution:resumed', { executionId, gateId });

    const runtime = this.runtimeStates.get(executionId);
    if (runtime) {
      const pausedIndex = runtime.order.indexOf(pausedNodeId);
      if (pausedIndex !== -1) {
        runtime.nodeOutputs.set(pausedNodeId, gate.payload || nodeState.outputData);
        // Continue execution loop asynchronously
        this.runExecutionLoop(record, runtime, pausedIndex + 1);
      }
    }

    return record;
  }

  /**
   * Cancel an in-flight execution safely
   */
  public cancelExecution(executionId: string): boolean {
    const controller = this.abortControllers.get(executionId);
    const record = this.activeExecutions.get(executionId);

    if (controller && record && record.status === 'running') {
      controller.abort();
      record.status = 'cancelled';
      record.completedAt = new Date().toISOString();
      this.emit('execution:cancelled', record);
      return true;
    }
    return false;
  }
}
