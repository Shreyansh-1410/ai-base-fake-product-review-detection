import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { reviewApi } from '../services/api';

export default function Navbar({
  selectedModel,
  onModelChange,
  onOpenDemoModal,
  currentAnalysis,
  activeTab,
  onNavigate
}) {
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    reviewApi.getModelStatus()
      .then(res => setModelStatus(res))
      .catch(err => console.error("Could not fetch model status:", err));
  }, []);

  const modelsList = modelStatus?.available_models || [
    "Logistic Regression",
    "Random Forest",
    "XGBoost",
    "BERT (Contextual Classifier)"
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Review<span className="text-blue-600">Guard</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Real E-Commerce Review & Fake Detector for Amazon & Flipkart
            </p>
          </div>
        </button>
      </div>

      {/* Center Store Badges (Consumer credibility) */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Amazon India</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Flipkart Verified</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live Scraper Active</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Model Selection - Clean Discreet Consumer Styling */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:border-slate-300 transition">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-400 font-medium">Engine:</span>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            {modelsList.map((m) => (
              <option key={m} value={m} className="bg-white text-slate-800">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Demo Cases Modal Trigger */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          title="Try 4 Sample Test Cases"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Demo Cases</span>
        </button>

        {/* API Docs Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          title="FastAPI Swagger Documentation"
        >
          <span className="hidden sm:inline">API</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
