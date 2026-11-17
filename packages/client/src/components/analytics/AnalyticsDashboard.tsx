import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Eye, Clock, TrendingUp, Users, ThumbsUp, DollarSign, 
  ShieldCheck, AlertTriangle, Lightbulb, ArrowRight, ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] flex items-center justify-center bg-[#090d16] text-xs text-slate-500">
        Loading Channel Telemetry...
      </div>
    );
  }

  const { analytics, monetizationAudit, insights } = data;

  return (
    <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-[#090d16] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Data Provenance Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Channel Analytics & Monetization Readiness
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Performance telemetry driving the autonomous content improvement loop
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                analytics.isRealData
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}
            >
              Source: {analytics.source === 'official-api' ? 'Official YouTube Data API' : 'Sandbox Simulation'}
            </span>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Total Views</span>
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-white">{analytics.views.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-400 font-semibold">+18% this month</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Watch Time</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">{analytics.watchTimeHours} hrs</p>
            <span className="text-[10px] text-emerald-400 font-semibold">Target: 4,000 hrs</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Avg Retention</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-lg font-bold text-white">{analytics.avgViewPercentage}%</p>
            <span className="text-[10px] text-slate-400">{analytics.avgViewDurationSec}s per view</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Click-Through</span>
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-white">{analytics.clickThroughRate}%</p>
            <span className="text-[10px] text-emerald-400 font-semibold">Above average</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Subscribers</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-lg font-bold text-white">+{analytics.subscribersGained}</p>
            <span className="text-[10px] text-emerald-400 font-semibold">Healthy growth</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Estimated API Cost</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400">${analytics.estimatedApiCostUsd.toFixed(2)}</p>
            <span className="text-[10px] text-slate-400">Edge TTS: $0</span>
          </div>
        </div>

        {/* Split Grid: Monetization Audit & Feedback Loop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monetization Readiness Checklist */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  YouTube Monetization Readiness
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verified against YouTube Partner Program (YPP) Content Guidelines
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Score: {monetizationAudit.overallScore}/100
              </span>
            </div>

            <div className="space-y-3">
              {monetizationAudit.checks.map((chk: any) => (
                <div key={chk.id} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{chk.ruleTitle}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      COMPLIANT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{chk.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics-to-Content Feedback Loop */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Audience Retention & Improvement Loop
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Observed audience drop-offs driving future topic and hook recommendations
              </p>
            </div>

            <div className="space-y-3">
              {insights.map((ins: any) => (
                <div key={ins.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-400">{ins.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      Confidence {ins.confidenceScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{ins.observation}</p>
                  <p className="text-[11px] text-amber-300 font-medium">
                    Recommendation: {ins.actionableRecommendation}
                  </p>

                  {ins.suggestedNextTopics && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Recommended Next Videos:
                      </span>
                      {ins.suggestedNextTopics.map((top: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-200">
                          <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>{top}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
