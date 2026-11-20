import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  ArrowRight,
  Search,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Calendar,
  Layers,
  Star
} from 'lucide-react';
import { reviewApi } from '../services/api';

export default function HistoryPage({ onSelectAnalysis, onNavigate }) {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await reviewApi.getHistory();
      setHistoryList(data.reports || []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Failed to retrieve analysis history from SQLite database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenReport = async (analysisId) => {
    try {
      const report = await reviewApi.getAnalysis(analysisId);
      onSelectAnalysis(report);
      onNavigate('dashboard');
    } catch (err) {
      alert("Failed to open report: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (analysisId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis report?")) return;
    setDeletingId(analysisId);
    try {
      await reviewApi.deleteAnalysis(analysisId);
      setHistoryList(prev => prev.filter(r => r.analysis_id !== analysisId));
    } catch (err) {
      alert("Failed to delete record: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear ALL past analysis reports from the SQLite database?")) return;
    try {
      await reviewApi.clearHistory();
      setHistoryList([]);
    } catch (err) {
      alert("Failed to clear history: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDownloadPdf = (analysisId, productName, e) => {
    e.stopPropagation();
    reviewApi.downloadPdf(analysisId, `ReviewGuard_${productName.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const filtered = historyList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.product_name || '').toLowerCase().includes(q) ||
      (item.platform || '').toLowerCase().includes(q) ||
      (item.analysis_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-blue-600" />
            <span>Analysis Report History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Persistent archive stored in SQLite. Reopen any past analysis report instantly in full detail.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved analysis history by product name, platform, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading analysis reports from SQLite...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm text-xs text-slate-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">No Analysis Reports Found</p>
          <p>Reports will automatically appear here when you submit product reviews for analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const trustScore = item.review_trust_score;
            const trustCat = item.review_trust_category || "Review Trust";

            return (
              <div
                key={item.analysis_id}
                onClick={() => handleOpenReport(item.analysis_id)}
                className="group p-5 bg-white border border-slate-200/90 hover:border-blue-500 rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      (item.platform || '').toLowerCase().includes('amazon')
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}>
                      {item.platform}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                    {item.product_name}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>Reviews: <strong className="text-slate-800 font-bold">{item.total_reviews}</strong></span>
                    <span>•</span>
                    <span>Genuine: <strong className="text-emerald-600 font-bold">{item.genuine_count}</strong></span>
                    <span>•</span>
                    <span>Fake: <strong className="text-rose-600 font-bold">{item.fake_count}</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      trustScore >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      trustScore >= 60 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      trustScore >= 40 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      Trust Score: {trustScore !== null && trustScore !== undefined ? `${trustScore}/100` : 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDownloadPdf(item.analysis_id, item.product_name, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.analysis_id, e)}
                      disabled={deletingId === item.analysis_id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition flex items-center gap-0.5 ml-1">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
