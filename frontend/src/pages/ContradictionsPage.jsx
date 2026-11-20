import React from 'react';
import { GitCompare, AlertTriangle, HelpCircle, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function ContradictionsPage({ analysis }) {
  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto text-slate-500 text-xs shadow-sm">
        No contradiction data available. Please run an analysis first.
      </div>
    );
  }

  const { contradictions, product_name } = analysis;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <GitCompare className="w-4 h-4" />
            <span>Aspect-Level Claim Conflict Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Review Contradiction Analysis
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
            Exposes direct factual disputes between customer reviews across specific features (Battery, Sound, Build Quality, Performance).
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center shrink-0">
          <span className="block text-2xl font-bold text-blue-700 font-mono">
            {contradictions.length}
          </span>
          <span className="text-[10px] text-blue-900 uppercase tracking-wider font-semibold">
            Aspect Conflicts
          </span>
        </div>
      </div>

      {/* Scientific Principle Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <b>Scientific Protocol:</b> Contradictions between customer claims are reported as factual disputes 
            (e.g., conflicting battery runtimes or defective units). The system <b>does not automatically assume either review is fake</b> 
            solely due to contradictory claims.
          </p>
        </div>
      </div>

      {/* Contradictions List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Extracted Feature Disputes ({contradictions.length})
        </h3>

        {contradictions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-sm">
            No contradictory aspect claims were detected among the submitted reviews.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contradictions.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Aspect: {item.aspect}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Dispute #{idx + 1}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                    item.severity === 'High'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {item.severity} Severity Discrepancy
                  </span>
                </div>

                {/* Side-by-side Opposing Claims */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Claim A */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-blue-700 font-bold">
                        Claim A ({item.review_id_a || 'Review'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 italic">
                      "{item.claim_a}"
                    </p>
                  </div>

                  {/* Claim B */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-rose-700 font-bold">
                        Claim B ({item.review_id_b || 'Review'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 italic">
                      "{item.claim_b}"
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-800 block">
                    Relationship: {item.relationship}
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
