import React, { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { NODE_CATALOG, NodeCategory } from '@creatorflow/shared';

interface NodePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Nodes' },
  { id: 'triggers', label: 'Triggers' },
  { id: 'flow', label: 'Flow & Logic' },
  { id: 'ai', label: 'AI & Content' },
  { id: 'media', label: 'Media & Render' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'approval', label: 'Human Gates' },
  { id: 'data', label: 'Data & HTTP' },
];

export const NodePalette: React.FC<NodePaletteProps> = ({ isOpen, onClose, onAddNode }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const filteredNodes = Object.values(NODE_CATALOG).filter(node => {
    const matchesSearch = 
      node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase()) ||
      node.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-y-0 left-0 w-80 glass-panel border-r border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Node Library</h3>
          <p className="text-[11px] text-slate-400">Add automation steps to canvas</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes by name or tag..."
            className="w-full bg-slate-900/90 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-2.5 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredNodes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No matching nodes found.
          </div>
        ) : (
          filteredNodes.map(node => (
            <div
              key={node.type}
              onClick={() => {
                onAddNode(node.type);
                onClose();
              }}
              className="group p-2.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                    {node.name}
                  </h4>
                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {node.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
