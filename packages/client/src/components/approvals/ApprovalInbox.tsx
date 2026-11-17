import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Lock, Clock, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import { ApprovalGate } from '@creatorflow/shared';
import { api } from '../../lib/api.js';

export const ApprovalInbox: React.FC = () => {
  const [gates, setGates] = useState<ApprovalGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<ApprovalGate | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const loadApprovals = async () => {
    try {
      const list = await api.getApprovals();
      setGates(list);
      if (list.length > 0 && !selectedGate) {
        setSelectedGate(list[0]);
      }
    } catch (err: any) {
      console.error('Failed to load approvals:', err.message);
    }
  };

  useEffect(() => {
    loadApprovals();
    const interval = setInterval(loadApprovals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedGate) return;
    setLoading(true);
    try {
      await api.decideApproval(selectedGate.id, decision, feedback);
      setFeedback('');
      await loadApprovals();
      setSelectedGate(null);
    } catch (err: any) {
      alert(`Decision submission error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden bg-[#090d16] flex">
      {/* Left: Pending Gates List */}
      <div className="w-80 border-r border-white/10 bg-slate-950/40 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Approval Inbox</h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            {gates.length} Pending
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {gates.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              No pending gates held for review.
            </div>
          ) : (
            gates.map(gate => {
              const isSelected = selectedGate?.id === gate.id;
              return (
                <div
                  key={gate.id}
                  onClick={() => setSelectedGate(gate)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {gate.type} GATE
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(gate.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 truncate">{gate.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {gate.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Inspection & Decision Console */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6">
        {selectedGate ? (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Header Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  AWAITING HUMAN SIGN-OFF
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Execution ID: {selectedGate.executionId}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{selectedGate.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedGate.description}</p>
            </div>

            {/* Payload Inspection Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Submitted Payload For Verification
              </h4>
              <pre className="p-4 rounded-xl bg-black/60 border border-white/5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96">
                {JSON.stringify(selectedGate.payload, null, 2)}
              </pre>
            </div>

            {/* Decision Controls */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Reviewer Feedback & Notes
              </h4>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Optional feedback notes for audit trail and workflow logs..."
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleDecision('rejected')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-bold border border-red-500/30 transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject & Halt Workflow
                </button>
                <button
                  onClick={() => handleDecision('approved')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve & Resume Production
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <ShieldCheck className="w-12 h-12 mb-3 text-slate-600" />
            Select a pending gate from the inbox to review content and sign off.
          </div>
        )}
      </div>
    </div>
  );
};
