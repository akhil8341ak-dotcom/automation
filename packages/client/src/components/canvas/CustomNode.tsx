import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  PlayCircle, Clock, Webhook, GitFork, Split, GitMerge, Hourglass, 
  ShieldCheck, Database, FileText, Globe, Sparkles, Compass, PenTool, 
  FileCheck, Layers, Mic, Image, Film, CheckCheck, Palette, Tag, 
  Youtube, BarChart3, CheckCircle2, AlertCircle, Loader2, Lock
} from 'lucide-react';
import { NODE_CATALOG, NodeCategory } from '@creatorflow/shared';

const ICONS: Record<string, React.ReactNode> = {
  PlayCircle: <PlayCircle className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Webhook: <Webhook className="w-4 h-4" />,
  GitFork: <GitFork className="w-4 h-4" />,
  Split: <Split className="w-4 h-4" />,
  GitMerge: <GitMerge className="w-4 h-4" />,
  Hourglass: <Hourglass className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Database: <Database className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  PenTool: <PenTool className="w-4 h-4" />,
  FileCheck: <FileCheck className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Mic: <Mic className="w-4 h-4" />,
  Image: <Image className="w-4 h-4" />,
  Film: <Film className="w-4 h-4" />,
  CheckCheck: <CheckCheck className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  Tag: <Tag className="w-4 h-4" />,
  Youtube: <Youtube className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<NodeCategory, { border: string; bg: string; text: string; iconBg: string }> = {
  triggers: { border: 'border-emerald-500/40', bg: 'bg-emerald-950/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
  flow: { border: 'border-amber-500/40', bg: 'bg-amber-950/20', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
  data: { border: 'border-cyan-500/40', bg: 'bg-cyan-950/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
  ai: { border: 'border-purple-500/40', bg: 'bg-purple-950/20', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  media: { border: 'border-blue-500/40', bg: 'bg-blue-950/20', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
  youtube: { border: 'border-red-500/40', bg: 'bg-red-950/20', text: 'text-red-400', iconBg: 'bg-red-500/20' },
  approval: { border: 'border-amber-400/50', bg: 'bg-amber-950/30', text: 'text-amber-300', iconBg: 'bg-amber-500/30' },
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeType = (data?.type as string) || 'manual-trigger';
  const meta = NODE_CATALOG[nodeType];
  const category = (data?.category as NodeCategory) || meta?.category || 'data';
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.data;
  const icon = ICONS[meta?.icon || 'Sparkles'] || <Sparkles className="w-4 h-4" />;

  const executionStatus = (data?.executionStatus as string) || 'idle';
  const durationMs = data?.durationMs as number | undefined;

  const isRunning = executionStatus === 'running';
  const isSuccess = executionStatus === 'success';
  const isFailed = executionStatus === 'failed';
  const isPaused = executionStatus === 'paused';

  const inputs = meta?.inputs || [];
  const outputs = meta?.outputs || [{ id: 'out', name: 'Output', type: 'control' }];

  return (
    <div
      className={`relative min-w-[240px] max-w-[280px] rounded-xl border bg-[#0d131f]/95 shadow-2xl backdrop-blur-md transition-all duration-200 select-none ${
        isRunning ? 'node-running-glow' : selected ? 'border-blue-500 ring-2 ring-blue-500/30' : color.border
      }`}
    >
      {/* Node Header */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-white/5 rounded-t-xl ${color.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color.iconBg} ${color.text}`}>
            {icon}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {String(meta?.name || data?.name || 'Step')}
          </span>
        </div>

        {/* Status Badge */}
        {isRunning && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Running</span>
          </div>
        )}
        {isSuccess && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>{durationMs ? `${durationMs}ms` : 'Done'}</span>
          </div>
        )}
        {isFailed && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </div>
        )}
        {isPaused && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
            <Lock className="w-3 h-3" />
            <span>Approval Held</span>
          </div>
        )}
      </div>

      {/* Node Body */}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-slate-100 truncate">
          {String(data?.name || meta?.name || 'Workflow Step')}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {meta?.description || 'Custom configured step.'}
        </p>
      </div>

      {/* Input Handles (Left) */}
      {inputs.map((input, idx) => {
        const topPercent = inputs.length === 1 ? 50 : ((idx + 1) / (inputs.length + 1)) * 100;
        return (
          <div key={input.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{ top: `${topPercent}%` }}
              className="!bg-slate-400 hover:!bg-blue-400 !w-2.5 !h-2.5"
            />
            {inputs.length > 1 && (
              <span
                className="absolute left-3 text-[9px] font-mono text-slate-500 -translate-y-1/2 pointer-events-none"
                style={{ top: `${topPercent}%` }}
              >
                {input.name}
              </span>
            )}
          </div>
        );
      })}

      {/* Output Handles (Right) */}
      {outputs.map((output, idx) => {
        const topPercent = outputs.length === 1 ? 50 : ((idx + 1) / (outputs.length + 1)) * 100;
        const isTrue = output.type === 'condition-true';
        const isFalse = output.type === 'condition-false';
        const handleColor = isTrue ? '!bg-emerald-400' : isFalse ? '!bg-red-400' : '!bg-blue-500';

        return (
          <div key={output.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{ top: `${topPercent}%` }}
              className={`${handleColor} hover:!scale-125 !w-2.5 !h-2.5`}
            />
            {outputs.length > 1 && (
              <span
                className={`absolute right-3 text-[9px] font-mono -translate-y-1/2 pointer-events-none ${
                  isTrue ? 'text-emerald-400 font-semibold' : isFalse ? 'text-red-400 font-semibold' : 'text-slate-400'
                }`}
                style={{ top: `${topPercent}%` }}
              >
                {output.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
