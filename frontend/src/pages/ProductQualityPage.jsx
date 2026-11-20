import React from 'react';
import { Layers, ShieldAlert, ThumbsUp, ThumbsDown, Info, CheckCircle2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import TrustGauge from '../components/TrustGauge';

export default function ProductQualityPage({ analysis }) {
  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto text-slate-500 text-xs shadow-sm">
        No product quality data available. Please run an analysis first.
      </div>
    );
  }

  const { summary, aspect_insights, top_defects, product_name } = analysis;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Axis 2: Customer-Reported Performance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Reported Product Quality Insights
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
            Summarizes customer experiences, recurring hardware defects, and feature sentiment.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
          Product: <span className="text-slate-900 font-bold">{product_name}</span>
        </div>
      </div>

      {/* Main Score & Disclaimer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quality Scorecard */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <TrustGauge
            score={summary.reported_product_quality_score}
            label="Reported Quality Index"
            category={summary.reported_quality_category}
            size={170}
            type="quality"
          />
        </div>

        {/* Scientific Disclaimer Card */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Measurement Methodology</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Customer-Reported Experience vs. Physical Product Reality
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This score measures <b>aggregated customer-reported performance</b> derived from organic reviews. 
              Crucially, <b>potentially suspicious reviews are down-weighted</b> so promotional bot campaigns do not mask real hardware failures.
            </p>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
              <b>Important:</b> Low reported quality indicates customer dissatisfaction or frequent defects, but does <i>not</i> necessarily mean the product is counterfeit.
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Reported Defects */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Extracted Physical / Operational Defects</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {top_defects && top_defects.length > 0 ? (
            top_defects.map((defect, i) => (
              <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
                <span className="font-semibold">{defect}</span>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-xs text-slate-400 italic">
              No recurrent hardware defects reported by customers.
            </div>
          )}
        </div>
      </div>

      {/* Feature Sentiment Breakdown */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Product Aspect Breakdown ({aspect_insights.length} Aspects Monitored)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aspect_insights.map((asp, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">{asp.aspect}</span>
                <span className={`text-xs font-mono font-bold ${
                  asp.net_sentiment >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {asp.net_sentiment > 0 ? `+${asp.net_sentiment}` : asp.net_sentiment}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ThumbsUp className="w-3.5 h-3.5" /> {asp.positive_mentions} positive
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <ThumbsDown className="w-3.5 h-3.5" /> {asp.negative_mentions} negative
                </span>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {asp.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
