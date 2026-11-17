import React, { useState } from 'react';
import { X, LayoutTemplate, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Workflow, WORKFLOW_TEMPLATES } from '@creatorflow/shared';
import { api } from '../../lib/api.js';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (workflow: Workflow) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cloningId, setCloningId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['All', 'YouTube Production', 'Ideation & Scripting', 'Quality & Safety', 'Audio Production', 'Rendering & QA', 'Publishing'];

  const filtered = WORKFLOW_TEMPLATES.filter(tpl =>
    selectedCategory === 'All' ? true : tpl.category === selectedCategory
  );

  const handleUseTemplate = async (template: Workflow) => {
    setCloningId(template.id);
    try {
      const cloned = await api.instantiateTemplate(template.id, `${template.name} (My Pipeline)`);
      onSelectTemplate(cloned);
      onClose();
    } catch (err: any) {
      alert(`Error using template: ${err.message}`);
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[85vh] glass-panel rounded-2xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Production Workflow Templates
              </h3>
              <p className="text-xs text-slate-400">
                10 real, validated, production-grade pipelines ready to execute
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/5 overflow-x-auto no-scrollbar bg-slate-950/40">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(tpl => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl glass-panel border border-white/10 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {tpl.nodes.length} nodes • {tpl.edges.length} edges
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{tpl.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  {tpl.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  disabled={cloningId === tpl.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  <span>{cloningId === tpl.id ? 'Loading...' : 'Use Template'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
