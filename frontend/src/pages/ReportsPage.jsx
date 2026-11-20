import React, { useState, useEffect } from 'react';
import { FileText, Download, Code, CheckCircle, Clock } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { reviewApi } from '../services/api';

export default function ReportsPage({ analysis, onLoadHistoryAnalysis }) {
  const [history, setHistory] = useState([]);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    reviewApi.getHistory()
      .then(res => setHistory(res.reports || []))
      .catch(err => console.error("Could not fetch report history:", err));
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto text-slate-500 text-xs shadow-sm">
        No report data available. Please run an analysis first.
      </div>
    );
  }

  const { summary, product_name, analysis_id, timestamp, model_name } = analysis;

  const handleDownloadPdf = () => {
    reviewApi.downloadPdf(analysis_id, `ReviewGuard_${product_name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Audit & Verification Report</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Executive Quality & Veracity Dossier
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Report ID: <span className="font-mono text-blue-700 font-bold">{analysis_id}</span> • Model: {model_name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF Report</span>
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Review Veracity Status
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {summary.review_trust_score.toFixed(1)} / 100
          </div>
          <p className="text-xs text-emerald-700 font-medium">
            {summary.review_trust_category}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Reported Product Quality
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {summary.reported_product_quality_score.toFixed(1)} / 100
          </div>
          <p className="text-xs text-blue-700 font-medium">
            {summary.reported_quality_category}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Physical Product Authenticity
          </span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {summary.product_authenticity_status}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {summary.product_authenticity_notes}
          </p>
        </div>
      </div>

      {/* Historical Analyses in Database */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Audit History (Stored in MongoDB)
        </h3>

        {history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs shadow-sm">
            No previous reports recorded in database.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800">{h.product_name}</h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {h.analysis_id} • {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-blue-700 font-mono font-bold">
                      Trust: {h.summary?.review_trust_score?.toFixed(1) || '-'}
                    </span>
                    <span className="text-slate-300 mx-1.5">•</span>
                    <span className="text-slate-600">
                      {h.summary?.total_reviews || 0} reviews
                    </span>
                  </div>

                  <button
                    onClick={() => onLoadHistoryAnalysis(h.analysis_id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
