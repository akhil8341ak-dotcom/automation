import React, { useState } from 'react';
import { X, Clock, Terminal, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ExecutionRecord, NodeExecutionState } from '@creatorflow/shared';

interface ExecutionInspectorProps {
  execution: ExecutionRecord | null;
  onClose: () => void;
}

export const ExecutionInspector: React.FC<ExecutionInspectorProps> = ({ execution, onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!execution) return null;

  const nodeStates = Object.values(execution.nodeStates || {});
  const activeNodeState: NodeExecutionState | undefined = selectedNodeId
    ? execution.nodeStates[selectedNodeId]
    : nodeStates[0];

  const nodeLogs = (execution.stepLogs || []).filter(
    log => !activeNodeState || !log.nodeId || log.nodeId === activeNodeState.nodeId
  );

  return (
    <div className="fixed inset-x-0 bottom-0 h-80 glass-panel border-t border-white/10 z-40 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white tracking-wide">
            Execution Inspector: {execution.workflowName}
          </h3>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              execution.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : execution.status === 'running'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                : execution.status === 'paused'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {execution.status.toUpperCase()}
          </span>
          {execution.durationMs && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3 h-3" /> {(execution.durationMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Split: Left Node List, Right Details & Logs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Step Timeline */}
        <div className="w-64 border-r border-white/10 overflow-y-auto p-2 space-y-1 bg-slate-950/40">
          {nodeStates.map(ns => {
            const isSelected = activeNodeState?.nodeId === ns.nodeId;
            return (
              <button
                key={ns.nodeId}
                onClick={() => setSelectedNodeId(ns.nodeId)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {ns.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
                  {ns.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {ns.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  {ns.status === 'queued' && <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  <span className="truncate">{ns.nodeName}</span>
                </div>
                {ns.durationMs !== undefined && (
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{ns.durationMs}ms</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Input, Output, and Logs Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
          {activeNodeState ? (
            <div className="flex-1 grid grid-cols-2 divide-x divide-white/10 overflow-hidden">
              {/* Output & Input JSON inspector */}
              <div className="flex flex-col p-3 overflow-y-auto space-y-3 font-mono text-xs">
                {activeNodeState.error && (
                  <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-[11px]">
                    <span className="font-bold">Error:</span> {activeNodeState.error}
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Output Data
                  </h4>
                  <pre className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                    {JSON.stringify(activeNodeState.outputData || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Input Data
                  </h4>
                  <pre className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-[11px] text-slate-400 overflow-x-auto max-h-48">
                    {JSON.stringify(activeNodeState.inputData || {}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Step Logs Stream */}
              <div className="flex flex-col p-3 overflow-y-auto">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Execution Logs
                </h4>
                {nodeLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No logs recorded for this step.</p>
                ) : (
                  <div className="space-y-1 font-mono text-[11px]">
                    {nodeLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-2">
                        <span className="text-slate-500 text-[9px] shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={`font-semibold shrink-0 text-[10px] uppercase ${
                            log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }`}
                        >
                          [{log.level}]
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select a node to inspect inputs, outputs, and execution telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
