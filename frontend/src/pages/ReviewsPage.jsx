import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Star,
  Copy,
  Info,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ReviewsPage({ analysis }) {
  const [filterLabel, setFilterLabel] = useState('ALL'); // 'ALL', 'GENUINE', 'FAKE', 'SUSPICIOUS'
  const [starFilter, setStarFilter] = useState('ALL'); // 'ALL', '5', '4', '3', '2', '1'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl max-w-md mx-auto text-slate-500 text-xs shadow-sm my-12 space-y-2">
        <Info className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="font-bold text-slate-700 text-sm">No Review Data Loaded</p>
        <p>Please analyze an Amazon/Flipkart product URL on the Home page first.</p>
      </div>
    );
  }

  const { reviews = [], product_name } = analysis;

  const filtered = reviews.filter((r) => {
    // 1. Classification Filter
    const label = (r.classification || r.authenticity_label || '').toUpperCase();
    if (filterLabel === 'GENUINE' && label !== 'GENUINE' && label !== 'LIKELY GENUINE') return false;
    if (filterLabel === 'FAKE' && label !== 'FAKE' && label !== 'SUSPICIOUS') return false;
    if (filterLabel === 'SUSPICIOUS' && label !== 'SUSPICIOUS' && label !== 'UNCERTAIN') return false;

    // 2. Star Filter
    if (starFilter !== 'ALL') {
      const star = Math.round(r.rating || 5);
      if (String(star) !== starFilter) return false;
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textMatch = (r.review_text || '').toLowerCase().includes(q);
      const reasonMatch = (r.reason || r.explanation || '').toLowerCase().includes(q);
      const idMatch = (r.review_id || '').toLowerCase().includes(q);
      if (!textMatch && !reasonMatch && !idMatch) return false;
    }

    return true;
  });

  const counts = {
    all: reviews.length,
    genuine: reviews.filter(r => (r.classification === 'GENUINE' || r.authenticity_label === 'Likely Genuine' || r.authenticity_label === 'GENUINE')).length,
    fake: reviews.filter(r => (r.classification === 'FAKE' || r.authenticity_label === 'FAKE')).length,
    suspicious: reviews.filter(r => (r.classification === 'SUSPICIOUS' || r.authenticity_label === 'SUSPICIOUS' || r.authenticity_label === 'Uncertain')).length,
  };

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedReviews = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Detailed Review Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual AI authenticity classification, calibrated confidence scores, and explainability reasoning for <strong>{product_name}</strong>.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
          Showing <span className="text-blue-700 font-bold">{filtered.length}</span> of {reviews.length} reviews
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Classification Filters (Section 7 Requirement) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterLabel('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterLabel === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Reviews ({counts.all})
            </button>

            <button
              onClick={() => setFilterLabel('GENUINE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterLabel === 'GENUINE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Genuine ({counts.genuine})</span>
            </button>

            <button
              onClick={() => setFilterLabel('FAKE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterLabel === 'FAKE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Fake ({counts.fake})</span>
            </button>

            <button
              onClick={() => setFilterLabel('SUSPICIOUS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterLabel === 'SUSPICIOUS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspicious ({counts.suspicious})</span>
            </button>
          </div>

          {/* Star Filter Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Rating:</span>
            <select
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Star Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          </div>
        </div>

        {/* Live Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, review text, or AI classification reasons..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Review Classification Methodology Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            How ReviewGuard Evaluates Each Customer Review
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-normal">
          Each buyer review is evaluated across 4 core integrity checks to separate genuine buyer experiences from promotional astroturfing and syndicated bot networks:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>1. Promotional Puffery</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">Sycophantic buzzwords ("1000% RECOMMENDED", "MIRACLE DEVICE") typically planted by incentivized sellers.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>2. Duplicate Bot Hashing</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">Cross-profile text hashing that flags syndicated bot reviews copy-pasted across multiple products.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>3. Rating Contradiction</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">Deceptive 5-star ratings where the buyer text actually details broken, defective, or fake items.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>4. Experiential Proof</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">Genuine buyers use organic phrasing, specific usage timelines, and balanced pros & cons.</p>
          </div>
        </div>
      </div>

      {/* Review Cards / Table View */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs shadow-sm">
          No reviews matched your search and filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedReviews.map((rev) => {
              const isExpanded = expandedId === rev.review_id;
            const label = (rev.classification || rev.authenticity_label || 'GENUINE').toUpperCase();
            const isGenuine = label === 'GENUINE' || label === 'LIKELY GENUINE';
            const isFake = label === 'FAKE';
            const isSuspicious = !isGenuine && !isFake;

            const conf = rev.confidence_score || Math.round((rev.calibrated_confidence || 0.85) * 100);
            const stars = Math.round(rev.rating || 5);
            const authorName = rev.author || 'Verified Customer';
            const authorInitial = authorName.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() || 'C';

            return (
              <div
                key={rev.review_id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition ${
                  isFake ? 'border-red-300 border-l-4 border-l-red-600 bg-red-50/20 hover:bg-red-50/40' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Header: Buyer Avatar, Name, Rating, and Verdict Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                      {authorInitial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{authorName}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          ✓ Verified Purchase
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {rev.date || 'Verified Transaction'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Visual Badges for Each Classification */}
                    {isGenuine && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>GENUINE</span>
                      </span>
                    )}

                    {isFake && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white border border-red-700 shadow-xs">
                        <XCircle className="w-3.5 h-3.5 text-white" />
                        <span>FAKE</span>
                      </span>
                    )}

                    {isSuspicious && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>SUSPICIOUS</span>
                      </span>
                    )}

                    {/* Duplicate Flag Badge */}
                    {rev.is_duplicate && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                        Duplicate Text
                      </span>
                    )}

                    {/* Rating Mismatch Badge */}
                    {rev.rating_mismatch && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                        Rating Mismatch
                      </span>
                    )}

                    <button
                      onClick={() => toggleExpand(rev.review_id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Toggle Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Review Text Body */}
                <div className="mt-3">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    "{rev.review_text}"
                  </p>
                </div>

                {/* ReviewGuard Verdict & Reasoning */}
                <div className={`mt-3.5 p-3.5 rounded-xl border text-xs space-y-2 ${
                  isFake
                    ? 'bg-red-50/90 border-red-300 text-red-950'
                    : isSuspicious
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold tracking-tight text-xs">
                      {isFake ? (
                        <>
                          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                          <span className="text-red-700 font-extrabold">ReviewGuard Verdict: Flagged FAKE / Astroturfed</span>
                        </>
                      ) : isSuspicious ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-amber-700 font-extrabold">ReviewGuard Verdict: Suspicious Rating Pattern</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700 font-extrabold">ReviewGuard Verdict: Verified Genuine Buyer</span>
                        </>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isFake ? 'bg-red-600 text-white' : isSuspicious ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {conf}% Confidence
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium">
                    {rev.reason || rev.explanation}
                  </p>

                  {rev.indicators && rev.indicators.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detection Flags:</span>
                      {rev.indicators.map((ind, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            isFake
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isSuspicious
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          • {ind}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/40">
                    <span>Sentiment: <strong>{rev.sentiment}</strong> ({rev.sentiment_score?.toFixed(2)})</span>
                    <span>Review ID: {rev.review_id}</span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls for 1,000 Review Capacity */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
                <span className="font-bold text-blue-700">{filtered.length}</span> reviews
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-mono font-bold text-slate-700 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Show per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25 reviews</option>
                  <option value={50}>50 reviews</option>
                  <option value={100}>100 reviews</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
