import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  GitCompare,
  AlertTriangle,
  Sparkles,
  BarChart2,
  FileText,
  CheckCircle2,
  Search,
  FileCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function LandingPage({ onNavigate, onOpenDemo }) {
  const scenarios = [
    {
      badge: "Scenario A",
      tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      title: "Genuine Product + Genuine Review",
      desc: "An authentic customer provides an authentic review of an original product. Correctly classified as Likely Genuine."
    },
    {
      badge: "Scenario B",
      tagColor: "bg-amber-50 text-amber-800 border-amber-200",
      title: "Defective/Fake Product + Genuine Review",
      desc: "An honest customer gives a scathing review of a counterfeit or defective product. Critical rule: Not classified as fake just because the product is bad!"
    },
    {
      badge: "Scenario C",
      tagColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
      title: "Genuine Product + Fake Review",
      desc: "Fabricated promotional puffery or competitor smear attack posted on an original product. System detects manipulation independently."
    },
    {
      badge: "Scenario D",
      tagColor: "bg-rose-50 text-rose-800 border-rose-200",
      title: "Fake Product + Fake Review",
      desc: "A counterfeit product is masked by coordinated 5-star promotional astroturfing. System isolates misleading positive reviews."
    }
  ];

  const pipelineSteps = [
    { title: "Direct Customer Reviews", subtitle: "No URLs or scraping needed" },
    { title: "NLP Preprocessing", subtitle: "Linguistic & stylometric analysis" },
    { title: "Calibrated ML Ensemble", subtitle: "LR, RF, XGBoost & BERT models" },
    { title: "Aspect Claim Extraction", subtitle: "Battery, Sound, Build, Performance" },
    { title: "Contradiction Detection", subtitle: "Cross-review claim conflict engine" },
    { title: "Misleading Positive Detection", subtitle: "Quarantine promotional astroturfing" },
    { title: "Tri-Axis Scoring", subtitle: "Veracity vs Quality vs Physical Authenticity" }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Product Review Integrity & Quality Audit System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            AI-Based Fake Product Review Detection System
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Analyze customer reviews directly using Natural Language Processing and Machine Learning. 
            Identify deceptive promotional clusters, extract aspect claims, and expose contradictory product claims without relying on e-commerce URLs.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('analyze')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <span>Analyze Customer Reviews</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('product-link')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition"
            >
              <span>Scan Product Link & Legitimacy</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={onOpenDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Explore 10 College Demo Presets</span>
            </button>
          </div>
        </div>
      </div>

      {/* The 4 Critical Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              The 4 Critical Evaluation Scenarios
            </h2>
            <p className="text-xs text-slate-500">
              Review veracity and product authenticity are strictly treated as separate evaluation tasks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((s, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${s.tagColor}`}>
                  {s.badge}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Innovation Showcase */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold tracking-wider uppercase">
          <GitCompare className="w-4 h-4" />
          <span>Primary Innovation Focus</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Aspect-Based Contradiction & Misleading Positive Review Detection
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Deceptive positive reviews often mask serious hardware defects by overwhelming platforms with generic 5-star praise. 
          ReviewGuard extracts fine-grained claims across Battery, Audio, Build Quality, and Performance, detects direct contradictions 
          (e.g., <i>"12 hours battery"</i> vs <i>"battery drains in 30 minutes"</i>), and downweights suspicious promotional reviews so customer-reported quality 
          reflects real customer experiences.
        </p>
      </div>

      {/* AI Processing Pipeline */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Processing Pipeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineSteps.map((step, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-semibold shrink-0">
                {i + 1}
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{step.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
