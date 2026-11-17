import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Sparkles, Lock, BarChart3, Settings, 
  Plus, ChevronDown, CheckCircle2, AlertCircle, LayoutTemplate
} from 'lucide-react';
import { Workflow, ExecutionRecord } from '@creatorflow/shared';
import { WorkflowCanvas } from './components/canvas/WorkflowCanvas.js';
import { YouTubeStudio } from './components/studio/YouTubeStudio.js';
import { ApprovalInbox } from './components/approvals/ApprovalInbox.js';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { TemplatesModal } from './components/templates/TemplatesModal.js';
import { api } from './lib/api.js';

export function App() {
  const [currentView, setCurrentView] = useState<'canvas' | 'studio' | 'approvals' | 'analytics' | 'settings'>('canvas');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [activeExecution, setActiveExecution] = useState<ExecutionRecord | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load Workflows on mount
  useEffect(() => {
    api.getWorkflows()
      .then(wfs => {
        setWorkflows(wfs);
        if (wfs.length > 0) setActiveWorkflow(wfs[0]);
      })
      .catch(console.error);

    api.getApprovals()
      .then(gates => setPendingApprovalsCount(gates.length))
      .catch(() => {});
  }, []);

  // Listen to Server-Sent Events (SSE) for live node & execution state
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.addEventListener('node:started', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setActiveExecution(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodeStates: {
              ...prev.nodeStates,
              [payload.nodeId]: {
                ...prev.nodeStates[payload.nodeId],
                status: 'running',
              },
            },
          };
        });
      } catch {}
    });

    eventSource.addEventListener('node:completed', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setActiveExecution(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodeStates: {
              ...prev.nodeStates,
              [payload.nodeId]: {
                ...prev.nodeStates[payload.nodeId],
                status: 'success',
                outputData: payload.output,
              },
            },
          };
        });
      } catch {}
    });

    eventSource.addEventListener('execution:paused', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setPendingApprovalsCount(c => c + 1);
        setActiveExecution(prev => (prev ? { ...prev, status: 'paused', approvalGateId: payload.gateId } : prev));
      } catch {}
    });

    eventSource.addEventListener('execution:resumed', () => {
      setPendingApprovalsCount(c => Math.max(0, c - 1));
      setActiveExecution(prev => (prev ? { ...prev, status: 'running', pausedAtNodeId: undefined, approvalGateId: undefined } : prev));
    });

    eventSource.addEventListener('execution:completed', (e: any) => {
      try {
        const record = JSON.parse(e.data);
        setActiveExecution(record);
      } catch {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleCreateNewWorkflow = async () => {
    try {
      const newWf = await api.createWorkflow({
        id: `wf-${Date.now()}`,
        name: 'Untitled YouTube Pipeline',
        description: 'Custom visual workflow automation',
        version: 1,
        category: 'YouTube Production',
        tags: ['custom'],
        nodes: [
          {
            id: 'n-start',
            type: 'manual-trigger',
            name: 'Launch Workflow',
            category: 'triggers',
            position: { x: 80, y: 180 },
            config: { initialInput: { niche: 'AI & Future Technology' } },
          },
        ],
        edges: [],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setWorkflows(prev => [newWf, ...prev]);
      setActiveWorkflow(newWf);
      setCurrentView('canvas');
    } catch (err: any) {
      alert(`Error creating workflow: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Main Navigation Header */}
      <header className="h-16 px-6 glass-panel border-b border-white/10 flex items-center justify-between z-40 shrink-0">
        {/* Brand & Active Workflow Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                CREATORFLOW <span className="text-blue-500">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">
                ENGINE V1.0 • n8n ARCHITECTURE
              </span>
            </div>
          </div>

          {/* Workflow Picker Dropdown */}
          <div className="relative flex items-center gap-2 pl-4 border-l border-white/10">
            <select
              value={activeWorkflow?.id || ''}
              onChange={e => {
                const wf = workflows.find(w => w.id === e.target.value);
                if (wf) setActiveWorkflow(wf);
              }}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 max-w-[220px] truncate"
            >
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateNewWorkflow}
              title="Create new workflow"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Switching Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/60 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setCurrentView('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'canvas'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Workflow Builder</span>
          </button>

          <button
            onClick={() => setCurrentView('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'studio'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio</span>
          </button>

          <button
            onClick={() => setCurrentView('approvals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              currentView === 'approvals'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Approval Inbox</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-black font-extrabold text-[9px] rounded-full flex items-center justify-center -ml-0.5">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'analytics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Growth</span>
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Server & Engine Telemetry Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-[11px]">{isConnected ? 'Engine Online' : 'Connecting...'}</span>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {currentView === 'canvas' && activeWorkflow && (
          <WorkflowCanvas
            workflow={activeWorkflow}
            onWorkflowChange={setActiveWorkflow}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            activeExecution={activeExecution}
          />
        )}

        {currentView === 'studio' && <YouTubeStudio />}

        {currentView === 'approvals' && <ApprovalInbox />}

        {currentView === 'analytics' && <AnalyticsDashboard />}

        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={tpl => {
          setWorkflows(prev => [tpl, ...prev]);
          setActiveWorkflow(tpl);
          setCurrentView('canvas');
        }}
      />
    </div>
  );
}
