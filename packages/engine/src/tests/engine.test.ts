import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Workflow, WORKFLOW_TEMPLATES } from '@creatorflow/shared';
import { DependencyGraph } from '../dag/graph.js';
import { WorkflowValidator } from '../dag/validator.js';
import { WorkflowEngine } from '../execution/engine.js';

describe('Workflow DAG and Topological Ordering', () => {
  test('correctly orders linear nodes without cycles', () => {
    const wf: Workflow = {
      id: 'wf-test-1',
      name: 'Linear Test',
      description: 'Test linear flow',
      version: 1,
      category: 'Test',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: 'node-3', type: 'template-render', name: 'Format', category: 'data', position: { x: 300, y: 0 }, config: {} },
        { id: 'node-1', type: 'manual-trigger', name: 'Start', category: 'triggers', position: { x: 0, y: 0 }, config: {} },
        { id: 'node-2', type: 'set-data', name: 'Transform', category: 'data', position: { x: 150, y: 0 }, config: {} },
      ],
      edges: [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-2', target: 'node-3' },
      ],
    };

    const graph = new DependencyGraph(wf);
    const order = graph.getTopologicalOrder();
    assert.deepStrictEqual(order, ['node-1', 'node-2', 'node-3']);
  });

  test('detects cycles and throws an error', () => {
    const cycleWf: Workflow = {
      id: 'wf-cycle',
      name: 'Cycle Test',
      description: 'Contains loop',
      version: 1,
      category: 'Test',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: 'node-a', type: 'manual-trigger', name: 'A', category: 'triggers', position: { x: 0, y: 0 }, config: {} },
        { id: 'node-b', type: 'set-data', name: 'B', category: 'data', position: { x: 100, y: 0 }, config: {} },
      ],
      edges: [
        { id: 'e1', source: 'node-a', target: 'node-b' },
        { id: 'e2', source: 'node-b', target: 'node-a' }, // Cycle!
      ],
    };

    const graph = new DependencyGraph(cycleWf);
    assert.throws(() => graph.getTopologicalOrder(), /Cycle detected/);
  });
});

describe('Workflow Validator', () => {
  test('validates built-in production templates successfully', () => {
    for (const tpl of WORKFLOW_TEMPLATES) {
      const result = WorkflowValidator.validate(tpl);
      assert.strictEqual(
        result.valid, 
        true, 
        `Template "${tpl.name}" failed validation: ${JSON.stringify(result.issues)}`
      );
    }
  });

  test('flags workflows without trigger nodes', () => {
    const invalidWf: Workflow = {
      id: 'wf-no-trigger',
      name: 'No Trigger',
      description: 'Missing starter',
      version: 1,
      category: 'Test',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: 'node-1', type: 'set-data', name: 'Data', category: 'data', position: { x: 0, y: 0 }, config: {} },
      ],
      edges: [],
    };

    const res = WorkflowValidator.validate(invalidWf);
    assert.strictEqual(res.valid, false);
    assert.ok(res.issues.some(i => i.message.includes('no active trigger node')));
  });
});

describe('Workflow Execution Engine Core', () => {
  test('executes a data pipeline passing data from trigger to downstream nodes', async () => {
    const engine = new WorkflowEngine({ DEFAULT_AI_PROVIDER: 'mock' });
    const wf: Workflow = {
      id: 'wf-data-pipeline',
      name: 'Data Pipeline',
      description: 'Test data passing',
      version: 1,
      category: 'Test',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'n-trigger',
          type: 'manual-trigger',
          name: 'Manual Start',
          category: 'triggers',
          position: { x: 0, y: 0 },
          config: { initialInput: { channelNiche: 'Autonomous Engineering' } },
        },
        {
          id: 'n-set',
          type: 'set-data',
          name: 'Set Platform',
          category: 'data',
          position: { x: 150, y: 0 },
          config: { values: { platform: 'YouTube Shorts' } },
        },
        {
          id: 'n-tpl',
          type: 'template-render',
          name: 'Render Prompt',
          category: 'data',
          position: { x: 300, y: 0 },
          config: { template: 'Create a {{platform}} video about {{channelNiche}}.' },
        },
      ],
      edges: [
        { id: 'e1', source: 'n-trigger', target: 'n-set' },
        { id: 'e2', source: 'n-set', target: 'n-tpl' },
      ],
    };

    const record = await engine.execute(wf, { initialInput: { runId: 42 } });

    assert.strictEqual(record.status, 'completed');
    assert.strictEqual(record.nodeStates['n-trigger'].status, 'success');
    assert.strictEqual(record.nodeStates['n-set'].status, 'success');
    assert.strictEqual(record.nodeStates['n-tpl'].status, 'success');

    const output = record.nodeStates['n-tpl'].outputData;
    assert.strictEqual(output.renderedText, 'Create a YouTube Shorts video about Autonomous Engineering.');
  });

  test('handles branching via IfElse node', async () => {
    const engine = new WorkflowEngine({ DEFAULT_AI_PROVIDER: 'mock' });
    const wf: Workflow = {
      id: 'wf-branch',
      name: 'Branching Test',
      description: 'Test if-else routing',
      version: 1,
      category: 'Test',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'n-start',
          type: 'manual-trigger',
          name: 'Start',
          category: 'triggers',
          position: { x: 0, y: 0 },
          config: { initialInput: { qaScore: 92 } },
        },
        {
          id: 'n-if',
          type: 'if-else',
          name: 'Check Quality',
          category: 'flow',
          position: { x: 150, y: 0 },
          config: { field: 'qaScore', operator: '>=', value: 85 },
        },
        {
          id: 'n-pass',
          type: 'set-data',
          name: 'Pass Path',
          category: 'data',
          position: { x: 300, y: -50 },
          config: { values: { outcome: 'APPROVED_FOR_RELEASE' } },
        },
        {
          id: 'n-fail',
          type: 'set-data',
          name: 'Fail Path',
          category: 'data',
          position: { x: 300, y: 50 },
          config: { values: { outcome: 'REJECTED' } },
        },
      ],
      edges: [
        { id: 'e1', source: 'n-start', target: 'n-if' },
        { id: 'e2', source: 'n-if', sourceHandle: 'true', target: 'n-pass' },
        { id: 'e3', source: 'n-if', sourceHandle: 'false', target: 'n-fail' },
      ],
    };

    const record = await engine.execute(wf);

    assert.strictEqual(record.status, 'completed');
    assert.strictEqual(record.nodeStates['n-pass'].status, 'success');
    assert.strictEqual(record.nodeStates['n-fail'].status, 'skipped');
    assert.strictEqual(record.nodeStates['n-pass'].outputData.outcome, 'APPROVED_FOR_RELEASE');
  });

  test('pauses execution at Approval Gate and safely resumes on human approval', async () => {
    const engine = new WorkflowEngine({ DEFAULT_AI_PROVIDER: 'mock' });
    const wf: Workflow = {
      id: 'wf-approval-test',
      name: 'Human Approval Gate Test',
      description: 'Test pausing and resuming',
      version: 1,
      category: 'Test',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'n-start',
          type: 'manual-trigger',
          name: 'Draft Script',
          category: 'triggers',
          position: { x: 0, y: 0 },
          config: { initialInput: { scriptTitle: 'The Future of AI Automation' } },
        },
        {
          id: 'n-gate',
          type: 'approval-gate',
          name: 'Editorial Review',
          category: 'approval',
          position: { x: 150, y: 0 },
          config: { gateType: 'script', title: 'Verify Script Content' },
        },
        {
          id: 'n-voice',
          type: 'set-data',
          name: 'Generate Voiceover',
          category: 'data',
          position: { x: 300, y: 0 },
          config: { values: { voiceReady: true } },
        },
      ],
      edges: [
        { id: 'e1', source: 'n-start', target: 'n-gate' },
        { id: 'e2', source: 'n-gate', target: 'n-voice' },
      ],
    };

    // Step 1: Execute workflow. It should stop at n-gate
    const pausedRecord = await engine.execute(wf);

    assert.strictEqual(pausedRecord.status, 'paused');
    assert.strictEqual(pausedRecord.pausedAtNodeId, 'n-gate');
    assert.ok(pausedRecord.approvalGateId);
    assert.strictEqual(pausedRecord.nodeStates['n-gate'].status, 'paused');
    assert.strictEqual(pausedRecord.nodeStates['n-voice'].status, 'queued');

    // Step 2: Human signs off on approval gate
    const gateId = pausedRecord.approvalGateId!;
    const resumedRecord = await engine.resumeExecution(
      pausedRecord.id,
      gateId,
      'approved',
      'Script looks fantastic and meets all factual criteria.'
    );

    assert.strictEqual(resumedRecord.status, 'running');
    assert.strictEqual(resumedRecord.nodeStates['n-gate'].status, 'success');
  });
});
