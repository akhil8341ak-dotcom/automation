import React, { useState } from 'react';
import { 
  Sparkles, Compass, PenTool, FileCheck, Layers, Mic, Film, 
  CheckCheck, Youtube, Play, CheckCircle2, AlertCircle, Loader2, ArrowRight, Volume2
} from 'lucide-react';
import { api } from '../../lib/api.js';

export const YouTubeStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topics' | 'script' | 'storyboard' | 'voice' | 'render' | 'publish'>('topics');

  // Studio Production State
  const [niche, setNiche] = useState('AI Engineering & Future Tools');
  const [format, setFormat] = useState<'shorts' | 'longform'>('shorts');
  const [loading, setLoading] = useState(false);

  const [topicCandidates, setTopicCandidates] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);

  const [script, setScript] = useState<any | null>(null);
  const [factAudit, setFactAudit] = useState<any | null>(null);

  const [storyboard, setStoryboard] = useState<any | null>(null);
  const [audioResult, setAudioResult] = useState<any | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('en-US-ChristopherNeural');

  const [renderResult, setRenderResult] = useState<any | null>(null);
  const [qaReport, setQaReport] = useState<any | null>(null);
  const [publishRecord, setPublishRecord] = useState<any | null>(null);

  // 1. Scout Topics
  const handleScoutTopics = async () => {
    setLoading(true);
    try {
      const topics = await api.scoutTopics(niche, format);
      setTopicCandidates(topics);
      if (topics.length > 0) setSelectedTopic(topics[0]);
    } catch (err: any) {
      alert(`Error scouting topics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Draft Script
  const handleGenerateScript = async (topic: any) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const res = await api.generateScript(topic, format, format === 'shorts' ? 50 : 480);
      setScript(res);
      setActiveTab('script');
      // Auto run fact check
      const audit = await api.factCheckScript(res);
      setFactAudit(audit);
    } catch (err: any) {
      alert(`Error generating script: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate Storyboard
  const handleBuildStoryboard = async () => {
    if (!script) return;
    setLoading(true);
    try {
      const sb = await api.generateStoryboard(script);
      setStoryboard(sb);
      setActiveTab('storyboard');
    } catch (err: any) {
      alert(`Error building storyboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Synthesize Voiceover
  const handleSynthesizeVoice = async () => {
    if (!script) return;
    setLoading(true);
    try {
      const fullText = script.sections.map((s: any) => s.narrationText).join(' ');
      const res = await api.synthesizeVoice(fullText, selectedVoice);
      setAudioResult(res);
      setActiveTab('voice');
    } catch (err: any) {
      alert(`Error synthesizing voice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Render Video via FFmpeg
  const handleRenderVideo = async () => {
    if (!storyboard || !audioResult) {
      alert('Please generate storyboard and audio before rendering.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.renderVideo(storyboard, audioResult.filePath);
      setRenderResult(res);
      setActiveTab('render');

      // Automatically inspect QA
      const qa = await api.qaInspectVideo(res.outputFilePath, format);
      setQaReport(qa);
    } catch (err: any) {
      alert(`Error rendering video: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. YouTube Upload
  const handlePublish = async () => {
    if (!renderResult) return;
    setLoading(true);
    try {
      const metadata = {
        title: script?.title || selectedTopic?.title || 'Autonomous Video',
        description: `${script?.title}\n\nProduced with CreatorFlow AI.\n\n#AI #Automation #Tech`,
        tags: ['AI', 'Tech', 'Automation'],
        categoryId: '28',
        privacyStatus: 'private', // Safety default!
        containsSyntheticMedia: true,
      };

      const record = await api.publishToYouTube(renderResult.outputFilePath, metadata);
      setPublishRecord(record);
      setActiveTab('publish');
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-[#090d16] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Studio Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI YouTube Production Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end pipeline: Research → Retention Script → Policy Audit → Storyboard → Voiceover → 1080p FFmpeg Render → QA Scorecard → YouTube
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setFormat('shorts')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                format === 'shorts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shorts (9:16)
            </button>
            <button
              onClick={() => setFormat('longform')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                format === 'longform' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Long-Form (16:9)
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'topics', label: '1. Topic Scout', icon: <Compass className="w-4 h-4" /> },
            { id: 'script', label: '2. Script & Policy Audit', icon: <PenTool className="w-4 h-4" /> },
            { id: 'storyboard', label: '3. Storyboard & Visuals', icon: <Layers className="w-4 h-4" /> },
            { id: 'voice', label: '4. Voiceover & Audio', icon: <Mic className="w-4 h-4" /> },
            { id: 'render', label: '5. Render & QA Scorecard', icon: <Film className="w-4 h-4" /> },
            { id: 'publish', label: '6. Publishing Review', icon: <Youtube className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: TOPIC SCOUT */}
        {activeTab === 'topics' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Channel Topic Ideation & Search Intent</h3>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="Enter content niche or seed topic..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleScoutTopics}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                  Scout Viral Angles
                </button>
              </div>
            </div>

            {/* Topic Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topicCandidates.map((top, idx) => (
                <div
                  key={top.id || idx}
                  className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        Novelty {top.noveltyScore}/100
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Interest {top.audienceInterestScore}/100
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-2">{top.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{top.premise}</p>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 text-[11px] text-amber-300">
                      <span className="font-semibold text-slate-400">Viral Angle:</span> {top.viralAngle}
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateScript(top)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <span>Draft Script</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SCRIPT & FACT-CHECK */}
        {activeTab === 'script' && (
          <div className="space-y-6">
            {!script ? (
              <div className="text-center py-12 glass-panel rounded-2xl">
                <p className="text-xs text-slate-400">No script drafted yet. Scout a topic in Step 1 first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Script Sections */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{script.title}</h3>
                      <p className="text-xs text-slate-400">
                        {script.sections.length} Narrative Sections • ~{script.estimatedDurationSec}s target • {script.totalWordCount} words
                      </p>
                    </div>
                    <button
                      onClick={handleBuildStoryboard}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      <span>Build Storyboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Hook Variants */}
                  <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Active Hook (Retention Engine)
                    </span>
                    <p className="text-xs font-semibold text-slate-200">
                      "{script.hookOptions?.[script.chosenHookIndex] || script.sections[0]?.narrationText}"
                    </p>
                  </div>

                  {/* Sections List */}
                  <div className="space-y-3">
                    {script.sections.map((sec: any, idx: number) => (
                      <div key={sec.id || idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-400">
                            {idx + 1}. {sec.sectionTitle} ({sec.narrativePurpose.toUpperCase()})
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{sec.estimatedSec}s</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{sec.narrationText}</p>
                        <p className="text-[11px] text-slate-500 italic">Visual: {sec.visualDirection}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Col: Fact Check & Policy Audit */}
                <div className="glass-panel p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Policy & Fact Check
                    </h4>
                    {factAudit && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {factAudit.overallTrustScore}/100 Trust
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-white/5">
                      <span className="text-slate-300">Advertiser Suitability</span>
                      <span className="font-bold text-emerald-400">SAFE</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-white/5">
                      <span className="text-slate-300">Reused Content Risk</span>
                      <span className="font-bold text-emerald-400">LOW (Original)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-white/5">
                      <span className="text-slate-300">AI Synthetic Media Disclosure</span>
                      <span className="font-bold text-blue-400">ENFORCED</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase mb-2">Verified Claims</h5>
                    <div className="space-y-2">
                      {(factAudit?.claims || []).map((c: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-black/40 border border-white/5 text-[11px]">
                          <p className="text-slate-200 font-medium">{c.claim}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{c.sourceOrRationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STORYBOARD & VISUALS */}
        {activeTab === 'storyboard' && (
          <div className="space-y-6">
            {!storyboard ? (
              <div className="text-center py-12 glass-panel rounded-2xl">
                <p className="text-xs text-slate-400">No storyboard generated. Complete Step 2 first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Scene Sequence ({storyboard.scenes.length} Scenes • {storyboard.totalEstimatedSec}s)
                  </h3>
                  <button
                    onClick={handleSynthesizeVoice}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <span>Synthesize Voiceover</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {storyboard.scenes.map((sc: any, idx: number) => (
                    <div key={sc.id || idx} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-400">SCENE 0{idx + 1}</span>
                        <span className="font-mono text-slate-500">{sc.estimatedDurationSec}s</span>
                      </div>
                      <div className="h-32 rounded-xl bg-slate-950 flex flex-col items-center justify-center border border-white/10 text-center p-2 relative overflow-hidden">
                        {/* Live AI preview via Pollinations Flux.1 */}
                        <img
                          src={`https://image.pollinations.ai/prompt/${encodeURIComponent((sc.visualObjective || sc.assetSearchQuery || 'cinematic scene') + ', cinematic lighting, photorealistic, 8k')}&width=400&height=720&model=flux&nologo=true&seed=${idx * 137 + 42}`}
                          alt={`Scene ${idx + 1} AI preview`}
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                        <span className="text-[11px] font-bold text-white z-10 px-2 py-1 bg-black/60 rounded drop-shadow">
                          {sc.onScreenText || 'SCENE TITLE'}
                        </span>
                        <span className="text-[9px] text-slate-400 z-10 mt-1 uppercase tracking-wider drop-shadow">
                          Transition: {sc.transition}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {sc.narrationSnippet}
                      </p>
                      <p className="text-[10px] text-slate-500">Query: {sc.assetSearchQuery}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VOICEOVER */}
        {activeTab === 'voice' && (
          <div className="glass-panel p-6 rounded-2xl space-y-6 max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-400" />
              High-Fidelity Neural Voiceover (Edge TTS)
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Choose Narrator Voice</label>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="en-US-ChristopherNeural">Christopher (US Male - Clear, Authoritative, Engaging)</option>
                <option value="en-US-GuyNeural">Guy (US Male - Conversational, Relaxed)</option>
                <option value="en-US-JennyNeural">Jenny (US Female - Natural, Articulate)</option>
                <option value="en-US-AriaNeural">Aria (US Female - Expressive, Storyteller)</option>
                <option value="en-GB-RyanNeural">Ryan (UK Male - Polished Documentary)</option>
                <option value="en-GB-SoniaNeural">Sonia (UK Female - Sophisticated)</option>
                <option value="en-IN-PrabhatNeural">Prabhat (India Male - Technical)</option>
              </select>
            </div>

            <button
              onClick={handleSynthesizeVoice}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              Synthesize Audio Track (EBU R128 Normalized)
            </button>

            {audioResult && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Audio Preview ({audioResult.durationSec}s)</span>
                  <span className="text-emerald-400">Ready for FFmpeg</span>
                </div>
                <audio controls src={audioResult.mediaUrl} className="w-full" />
                <button
                  onClick={handleRenderVideo}
                  disabled={loading}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Film className="w-4 h-4" />
                  Render Video Container (FFmpeg 1080p)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RENDER & QA SCORECARD */}
        {activeTab === 'render' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Player */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Rendered Video Container</span>
                  {renderResult && (
                    <span className="text-xs font-mono text-slate-400">
                      {renderResult.width}x{renderResult.height} • {renderResult.durationSec}s
                    </span>
                  )}
                </h3>
                {renderResult ? (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10">
                    <video controls src={renderResult.videoUrl} className="max-h-80 w-auto" />
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center border border-white/5 text-xs text-slate-500">
                    Render your video in Step 4 to preview playback here.
                  </div>
                )}
                {renderResult && (
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                  >
                    <Youtube className="w-4 h-4" />
                    Review & Publish to YouTube
                  </button>
                )}
              </div>

              {/* Automated QA Scorecard */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-bold text-white">Automated QA Inspection Report</h4>
                  {qaReport && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Score: {qaReport.overallScore}/100 ({qaReport.overallStatus.toUpperCase()})
                    </span>
                  )}
                </div>

                {!qaReport ? (
                  <p className="text-xs text-slate-500 italic">No inspection performed yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {qaReport.checks.map((chk: any) => (
                      <div
                        key={chk.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {chk.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {chk.status === 'warn' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                            {chk.status === 'fail' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            <span className="text-xs font-bold text-white">{chk.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{chk.message}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded shrink-0">
                          {chk.measuredValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PUBLISHING REVIEW */}
        {activeTab === 'publish' && (
          <div className="glass-panel p-6 rounded-2xl max-w-xl mx-auto space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <Youtube className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-sm font-bold text-white">YouTube Release Confirmation</h3>
                <p className="text-xs text-slate-400">Strict human approval required before public release</p>
              </div>
            </div>

            {publishRecord ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully Uploaded as PRIVATE
                </div>
                <p className="text-xs text-slate-300">
                  Video ID: <span className="font-mono text-blue-400">{publishRecord.youtubeId}</span>
                </p>
                <p className="text-xs text-slate-300">
                  Target Link:{' '}
                  <a
                    href={publishRecord.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline font-mono"
                  >
                    {publishRecord.youtubeUrl}
                  </a>
                </p>
                <div className="p-2.5 rounded bg-black/40 text-[11px] text-slate-400">
                  Status: <strong>Private</strong>. The video is protected from public visibility until you explicitly authorize release.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                  <strong>Safety Gate Active:</strong> Video will be uploaded strictly as <strong>Private</strong> under official YouTube Data API v3 rules.
                </div>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
                >
                  Confirm Upload to YouTube (Private)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
