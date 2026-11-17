import React, { useState, useEffect } from 'react';
import { X, Trash2, Copy, Sliders, Check } from 'lucide-react';
import { WorkflowNode, NODE_CATALOG } from '@creatorflow/shared';

interface NodeDrawerProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, name: string, config: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeDrawer: React.FC<NodeDrawerProps> = ({
  node,
  onClose,
  onUpdateConfig,
  onDeleteNode,
}) => {
  const [nodeName, setNodeName] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [savedBadge, setSavedBadge] = useState(false);

  useEffect(() => {
    if (node) {
      setNodeName(node.name);
      setConfig(node.config || {});
    }
  }, [node]);

  if (!node) return null;

  const meta = NODE_CATALOG[node.type];

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    onUpdateConfig(node.id, nodeName, updated);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1200);
  };

  const handleNameChange = (newName: string) => {
    setNodeName(newName);
    onUpdateConfig(node.id, newName, config);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 glass-panel border-l border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Configure Step</h3>
          {savedBadge && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Configuration Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Step Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={e => handleNameChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-[10px] text-slate-500 mt-1">Node Type: {node.type}</p>
        </div>

        {/* Dynamic Config Fields based on Node Type */}
        {node.type === 'manual-trigger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Initial Niche / Topic Payload
            </label>
            <input
              type="text"
              value={config.initialInput?.niche || config.initialInput?.topic || ''}
              onChange={e => handleFieldChange('initialInput', { ...config.initialInput, niche: e.target.value })}
              placeholder="e.g. Autonomous AI Agents & Future Tech"
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {node.type === 'schedule-trigger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cron Schedule Pattern
            </label>
            <input
              type="text"
              value={config.cron || '0 9 * * 1'}
              onChange={e => handleFieldChange('cron', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Default: Every Monday at 9:00 AM UTC</p>
          </div>
        )}

        {node.type === 'approval-gate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gate Category
              </label>
              <select
                value={config.gateType || 'script'}
                onChange={e => handleFieldChange('gateType', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="script">Script & Outline Review</option>
                <option value="storyboard">Storyboard & Visuals Review</option>
                <option value="render">Rendered Video QA Sign-Off</option>
                <option value="publish">Public YouTube Release Sign-Off</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Review Guidance Instructions
              </label>
              <textarea
                value={config.description || ''}
                onChange={e => handleFieldChange('description', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {node.type === 'voiceover-tts' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Voice Selection (Edge Neural TTS)
              </label>
              <select
                value={config.voice || 'en-US-ChristopherNeural'}
                onChange={e => handleFieldChange('voice', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="en-US-ChristopherNeural">Christopher (US Male - Clear & Authoritative)</option>
                <option value="en-US-GuyNeural">Guy (US Male - Conversational)</option>
                <option value="en-US-JennyNeural">Jenny (US Female - Natural & Smooth)</option>
                <option value="en-US-AriaNeural">Aria (US Female - Expressive)</option>
                <option value="en-GB-RyanNeural">Ryan (UK Male - Professional)</option>
                <option value="en-GB-SoniaNeural">Sonia (UK Female - Crisp)</option>
                <option value="en-IN-PrabhatNeural">Prabhat (India Male - Technical)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="normAudio"
                checked={config.normalizeAudio !== false}
                onChange={e => handleFieldChange('normalizeAudio', e.target.checked)}
                className="rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <label htmlFor="normAudio" className="text-xs text-slate-300">
                EBU R128 Volume Normalization
              </label>
            </div>
          </div>
        )}

        {node.type === 'video-renderer' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Video Format & Resolution
              </label>
              <select
                value={config.format || 'shorts'}
                onChange={e => handleFieldChange('format', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="shorts">Vertical 9:16 (1080x1920) - YouTube Shorts</option>
                <option value="longform">Widescreen 16:9 (1920x1080) - Long-form Explainer</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="burnSub"
                checked={config.burnCaptions !== false}
                onChange={e => handleFieldChange('burnCaptions', e.target.checked)}
                className="rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <label htmlFor="burnSub" className="text-xs text-slate-300">
                Burn Bold Dynamic Captions
              </label>
            </div>
          </div>
        )}

        {node.type === 'yt-publish' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Privacy Status (Safety Default)
              </label>
              <select
                value={config.defaultPrivacy || 'private'}
                onChange={e => handleFieldChange('defaultPrivacy', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="private">Private (Default & Recommended)</option>
                <option value="unlisted">Unlisted (Shareable Link Only)</option>
                <option value="public">Public (Immediate Broadcast)</option>
              </select>
            </div>
          </div>
        )}

        {/* Generic JSON Config Editor for advanced options */}
        <div className="pt-2 border-t border-white/5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Raw Configuration (JSON)
          </label>
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value);
                setConfig(parsed);
                onUpdateConfig(node.id, nodeName, parsed);
              } catch {}
            }}
            rows={5}
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={() => onDeleteNode(node.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Step
        </button>
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
