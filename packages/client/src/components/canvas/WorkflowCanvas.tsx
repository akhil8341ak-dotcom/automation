import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import { 
  Play, Square, Plus, Save, Download, Upload, ShieldCheck, 
  Terminal, Sparkles, Copy, Trash2, CheckCircle2, AlertCircle, LayoutTemplate
} from 'lucide-react';
import { Workflow, WorkflowNode, WorkflowEdge, ExecutionRecord } from '@creatorflow/shared';
import { CustomNode } from './CustomNode.js';
import { NodePalette } from './NodePalette.js';
import { NodeDrawer } from './NodeDrawer.js';
import { ExecutionInspector } from './ExecutionInspector.js';
import { api } from '../../lib/api.js';

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  workflow: Workflow;
  onWorkflowChange: (wf: Workflow) => void;
  onOpenTemplates: () => void;
  activeExecution: ExecutionRecord | null;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowChange,
  onOpenTemplates,
  activeExecution,
}) => {
  // Convert workflow nodes to ReactFlow nodes
  const initialNodes: Node[] = workflow.nodes.map(n => ({
    id: n.id,
    type: 'custom',
    position: n.position,
    data: {
      ...n,
      executionStatus: activeExecution?.nodeStates[n.id]?.status || 'idle',
      durationMs: activeExecution?.nodeStates[n.id]?.durationMs,
    },
  }));

  const initialEdges: Edge[] = workflow.edges.map(e => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
    label: e.label,
    animated: activeExecution?.status === 'running',
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; issues: any[] } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync execution status onto ReactFlow nodes
  useEffect(() => {
    if (activeExecution) {
      setNodes(nds =>
        nds.map(node => ({
          ...node,
          data: {
            ...node.data,
            executionStatus: activeExecution.nodeStates[node.id]?.status || 'idle',
            durationMs: activeExecution.nodeStates[node.id]?.durationMs,
          },
        }))
      );
    }
  }, [activeExecution, setNodes]);

  // Handle Edge connection
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${Date.now()}`,
        animated: false,
      };
      setEdges(eds => addEdge(newEdge, eds));

      // Persist to parent workflow state
      const updatedEdges: WorkflowEdge[] = [
        ...workflow.edges,
        {
          id: newEdge.id,
          source: newEdge.source,
          sourceHandle: newEdge.sourceHandle || undefined,
          target: newEdge.target,
          targetHandle: newEdge.targetHandle || undefined,
        },
      ];
      onWorkflowChange({ ...workflow, edges: updatedEdges });
    },
    [workflow, onWorkflowChange, setEdges]
  );

  // Node Clicked -> Open Drawer
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const rawNode = workflow.nodes.find(n => n.id === node.id);
    if (rawNode) setSelectedNode(rawNode);
  };

  // Add node from Palette
  const handleAddNode = (type: string) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: WorkflowNode = {
      id: newNodeId,
      type,
      name: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: 'data',
      position: { x: 300 + Math.random() * 80, y: 200 + Math.random() * 80 },
      config: {},
    };

    const updatedNodes = [...workflow.nodes, newNode];
    onWorkflowChange({ ...workflow, nodes: updatedNodes });

    setNodes(nds => [
      ...nds,
      {
        id: newNode.id,
        type: 'custom',
        position: newNode.position,
        data: { ...newNode, executionStatus: 'idle' },
      },
    ]);
  };

  // Update Config from Drawer
  const handleUpdateConfig = (nodeId: string, name: string, config: Record<string, any>) => {
    const updatedNodes = workflow.nodes.map(n =>
      n.id === nodeId ? { ...n, name, config } : n
    );
    onWorkflowChange({ ...workflow, nodes: updatedNodes });

    setNodes(nds =>
      nds.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, name, config } }
          : n
      )
    );
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = workflow.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = workflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    onWorkflowChange({ ...workflow, nodes: updatedNodes, edges: updatedEdges });

    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  // Run Workflow Action
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setIsInspectorOpen(true);
    try {
      await api.executeWorkflow(workflow);
    } catch (err: any) {
      alert(`Execution Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Save Workflow Action
  const handleSaveWorkflow = async () => {
    try {
      await api.saveWorkflow(workflow);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  // Validate Workflow
  const handleValidateWorkflow = async () => {
    try {
      const res = await api.validateWorkflow(workflow);
      setValidationResult(res);
      setTimeout(() => setValidationResult(null), 4000);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflow, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `${workflow.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    dl.click();
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex flex-col bg-[#090d16] overflow-hidden select-none">
      {/* Top Workflow Action Bar */}
      <div className="h-14 px-4 glass-panel border-b border-white/10 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={workflow.name}
            onChange={e => onWorkflowChange({ ...workflow, name: e.target.value })}
            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 text-sm font-bold text-white px-1 py-0.5 focus:outline-none transition-colors"
          />
          <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded">
            v{workflow.version}
          </span>
          <span className="text-[11px] text-slate-400 border-l border-white/10 pl-3">
            {workflow.nodes.length} nodes • {workflow.edges.length} connections
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {validationResult && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                validationResult.valid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {validationResult.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{validationResult.valid ? 'Valid DAG' : 'Validation Issues'}</span>
            </div>
          )}

          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            Add Step
          </button>

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
            Templates
          </button>

          <button
            onClick={handleValidateWorkflow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Validate
          </button>

          <button
            onClick={handleExportJson}
            title="Export workflow definition as validated JSON"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSaveWorkflow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 transition-colors"
          >
            <Save className={`w-3.5 h-3.5 ${saveSuccess ? 'text-emerald-400' : 'text-slate-400'}`} />
            {saveSuccess ? 'Saved' : 'Save'}
          </button>

          {/* Master Run Workflow button */}
          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Executing...' : 'Run Workflow'}</span>
          </button>

          {/* Logs toggle */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isInspectorOpen
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Logs
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#090d16]"
        >
          <Background color="#1e293b" gap={20} size={1.5} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-slate-900 !border-white/10 !rounded-xl !shadow-2xl overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-white/10 [&>button]:!fill-slate-300 hover:[&>button]:!bg-slate-800" />
          <MiniMap
            nodeColor="#3b82f6"
            maskColor="rgba(9, 13, 22, 0.85)"
            className="!bg-slate-950 !border-white/10 !rounded-xl !shadow-2xl overflow-hidden"
          />
        </ReactFlow>

        {/* Node Library Drawer */}
        <NodePalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onAddNode={handleAddNode}
        />

        {/* Node Configuration Drawer */}
        <NodeDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdateConfig={handleUpdateConfig}
          onDeleteNode={handleDeleteNode}
        />

        {/* Live Execution Inspector Drawer */}
        {isInspectorOpen && (
          <ExecutionInspector
            execution={activeExecution}
            onClose={() => setIsInspectorOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
