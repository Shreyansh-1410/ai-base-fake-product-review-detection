import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function SuspiciousPositivesPage({ analysis }) {
  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto text-slate-500 text-xs shadow-sm">
        No analysis available. Please run an analysis first.
      </div>
    );
  }

  const { suspicious_positives, summary, product_name, top_defects } = analysis;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Fraud Detection & Review Integrity</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Misleading Positive Reviews Detection
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Identifies deceptive 5-star promotional reviews, coordinated astroturfing clusters, 
            and exaggerated puffery that falsely elevate product ratings while authentic users report defects.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center shrink-0">
          <span className="block text-2xl font-bold text-indigo-700 font-mono">
            {suspicious_positives.length}
          </span>
          <span className="text-[10px] text-indigo-900 uppercase tracking-wider font-semibold">
            Flagged Reviews
          </span>
        </div>
      </div>

      {/* Side-by-side Contrast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real Defect Realities */}
        <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Extracted Hardware & Operational Defects</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Reported defects extracted from authentic customer complaints:
          </p>
          <div className="space-y-2">
            {top_defects && top_defects.length > 0 ? (
              top_defects.map((defect, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span className="font-medium">{defect}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic p-2">
                No major hardware defects registered in current review set.
              </div>
            )}
          </div>
        </div>

        {/* Protection Against False Accusations */}
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>False Accusation Safeguard</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <b>Scientific Rule:</b> A positive review is <i>never</i> classified as fake solely because negative reviews exist. 
            Reviews are flagged only when they exhibit independently verified synthetic markers, promotional copy-paste syndication, 
            or extreme linguistic deception indicators.
          </p>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium">
            {summary.genuine_count} genuine positive/negative reviews verified and protected from false penalties.
          </div>
        </div>
      </div>

      {/* Flagged Misleading Positives List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Flagged Misleading Positive Reviews ({suspicious_positives.length})
        </h3>

        {suspicious_positives.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-sm">
            No deceptive positive reviews or promotional puffery detected in this dataset.
          </div>
        ) : (
          <div className="space-y-3">
            {suspicious_positives.map((item, idx) => (
              <div key={idx} className="bg-white border border-rose-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900">
                      {item.review_id}
                    </span>
                    {item.rating && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {item.rating} ★
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      {item.pattern_type}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  "{item.review_text}"
                </p>

                {/* Evidence Triggers */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-semibold text-slate-800 block">
                    Forensic Deception Evidence:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.suspicion_indicators.map((trig, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300 text-[11px]"
                      >
                        • {trig}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
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
