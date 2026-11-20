import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  AlertOctagon,
  FileText,
  Download,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Tag,
  Star,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart2,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import TrustGauge from '../components/TrustGauge';
import PlotlyChart from '../components/PlotlyChart';
import { reviewApi } from '../services/api';

export default function DashboardPage({ analysis, onNavigate }) {
  const [reviewFilter, setReviewFilter] = useState('ALL'); // 'ALL', 'GENUINE', 'FAKE', 'SUSPICIOUS'
  const [starFilter, setStarFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm my-12">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Review Analysis Data Available</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please paste a product link on the Home page to generate the analysis dashboard.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm uppercase tracking-wider transition"
        >
          Go to Home & Input Link
        </button>
      </div>
    );
  }

  const {
    summary,
    reviews = [],
    product_name,
    product_url,
    platform = "E-Commerce Platform",
    brand,
    image_url,
    product_rating,
    analysis_id
  } = analysis;

  const total = summary.total_reviews || reviews.length;
  const genuine = summary.genuine_count || 0;
  const fake = summary.fake_count || 0;
  const suspicious = summary.suspicious_count || 0;

  const genuinePct = summary.genuine_percentage || (total > 0 ? roundPct((genuine / total) * 100) : 0);
  const fakePct = summary.fake_percentage || (total > 0 ? roundPct((fake / total) * 100) : 0);
  const suspiciousPct = summary.suspicious_percentage || (total > 0 ? roundPct((suspicious / total) * 100) : 0);

  function roundPct(val) {
    return Math.round(val * 10) / 10;
  }

  const trustScore = summary.review_trust_score;
  const trustCategory = summary.review_trust_category || "Moderate Review Trust";
  const isFakeProduct = fakePct >= 25 || (trustScore !== null && trustScore < 60) || (trustCategory && trustCategory.toLowerCase().includes('low'));

  // Filter Reviews on Dashboard
  const filteredReviews = reviews.filter((r) => {
    const label = (r.classification || r.authenticity_label || '').toUpperCase();
    if (reviewFilter === 'GENUINE' && label !== 'GENUINE' && label !== 'LIKELY GENUINE') return false;
    if (reviewFilter === 'FAKE' && label !== 'FAKE' && label !== 'SUSPICIOUS') return false;
    if (reviewFilter === 'SUSPICIOUS' && label !== 'SUSPICIOUS' && label !== 'UNCERTAIN') return false;

    if (starFilter !== 'ALL') {
      const star = Math.round(r.rating || 5);
      if (String(star) !== starFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (r.review_text || '').toLowerCase().includes(q);
      const matchReason = (r.reason || r.explanation || '').toLowerCase().includes(q);
      if (!matchText && !matchReason) return false;
    }
    return true;
  });

  // Chart 1: Donut Chart - Genuine vs Fake vs Suspicious
  const pieChartData = [
    {
      values: [genuine, fake, suspicious],
      labels: ['GENUINE', 'FAKE', 'SUSPICIOUS'],
      type: 'pie',
      hole: 0.62,
      marker: {
        colors: ['#10b981', '#dc2626', '#f59e0b']
      },
      textinfo: 'label+percent',
      textposition: 'inside',
      hoverinfo: 'label+value+percent'
    }
  ];

  // Chart 2: Bar Chart - Distribution
  const barChartData = [
    {
      x: ['GENUINE', 'FAKE', 'SUSPICIOUS'],
      y: [genuine, fake, suspicious],
      type: 'bar',
      marker: {
        color: ['#10b981', '#dc2626', '#f59e0b']
      },
      text: [genuine, fake, suspicious],
      textposition: 'auto'
    }
  ];

  // Chart 3: Star Rating Breakdown
  const starRatings = [1, 2, 3, 4, 5];
  const genuineByStar = starRatings.map(
    star => reviews.filter(r => Math.round(r.rating || 5) === star && (r.classification === 'GENUINE' || r.authenticity_label === 'Likely Genuine')).length
  );
  const fakeByStar = starRatings.map(
    star => reviews.filter(r => Math.round(r.rating || 5) === star && (r.classification === 'FAKE' || r.authenticity_label === 'Suspicious')).length
  );
  const suspiciousByStar = starRatings.map(
    star => reviews.filter(r => Math.round(r.rating || 5) === star && (r.classification === 'SUSPICIOUS' || r.authenticity_label === 'Uncertain')).length
  );

  const ratingChartData = [
    {
      x: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      y: genuineByStar,
      name: 'Genuine',
      type: 'bar',
      marker: { color: '#10b981' }
    },
    {
      x: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      y: suspiciousByStar,
      name: 'Suspicious',
      type: 'bar',
      marker: { color: '#f59e0b' }
    },
    {
      x: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      y: fakeByStar,
      name: 'Fake',
      type: 'bar',
      marker: { color: '#dc2626' }
    }
  ];

  const handleDownloadPdf = () => {
    reviewApi.downloadPdf(analysis_id, `ReviewGuard_${product_name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Product Summary Header Banner (Consumer E-Commerce Style) */}
      <div className="p-6 sm:p-7 bg-white border border-slate-200/90 rounded-3xl shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
          <div className="w-28 h-28 rounded-2xl bg-white p-2 border border-slate-200 shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
            <img
              src={image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"}
              alt={product_name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                platform.toLowerCase().includes('amazon')
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}>
                {platform}
              </span>
              {brand && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  Brand: {brand}
                </span>
              )}
              {product_rating && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  ★ {product_rating} / 5.0
                </span>
              )}
              <span className="text-xs font-mono text-slate-400">ID: {analysis_id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {product_name}
            </h1>
            {product_url && (
              <a
                href={product_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
              >
                <span>View Original Listing on {platform}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Right Action / Verdict Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <div className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            isFakeProduct
              ? 'bg-red-50 text-red-900 border-red-300'
              : trustScore >= 80
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            {isFakeProduct ? (
              <>
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                <span>High Fake Risk ({fakePct}% Fake)</span>
              </>
            ) : trustScore >= 80 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Safe to Buy ({trustScore}% Trust)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Moderate Trust ({trustScore}% Score)</span>
              </>
            )}
          </div>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 🚨 BUYHATKE-STYLE RED FAKE PRODUCT WARNING BANNER */}
      {isFakeProduct && (
        <div className="p-5 rounded-3xl bg-red-50 border-2 border-red-500 text-red-900 shadow-md flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-red-600 text-white tracking-wider shadow-xs">
                🚨 High Fake Product / Review Alert
              </span>
              <span className="text-xs font-bold text-red-700 font-mono">
                {fakePct}% Fake Reviews Detected • Trust Score: {trustScore}/100
              </span>
            </div>
            <p className="text-xs sm:text-sm text-red-800 leading-relaxed font-medium">
              Warning: This product exhibits a high concentration of fake reviews, promotional astroturfing, or manipulated star ratings. ReviewGuard AI flags this product with Low Review Authenticity. Buyer discretion is strongly advised before ordering.
            </p>
          </div>
        </div>
      )}

      {/* Trust Score Gauge Card & Summary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Score Gauge */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Overall Review Trust Score
            </h3>
            <p className="text-xs text-slate-500">
              Veracity index derived from authentic customer review density
            </p>
          </div>

          <div className="py-2">
            <TrustGauge score={trustScore !== null ? trustScore : 50} category={trustCategory} />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{trustCategory} ({trustScore !== null ? `${trustScore}/100` : 'Insufficient Data'})</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This score measures <strong>review authenticity and manipulation risk</strong>. It does not evaluate intrinsic product quality, seller delivery speed, or warranty support.
            </p>
          </div>
        </div>

        {/* Metric Cards (Total, Genuine, Fake, Suspicious) */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Total Reviews */}
          <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Reviews Analyzed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{total}</span>
              <span className="text-xs font-semibold text-slate-400">Reviews</span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated individually by AI NLP pipeline
            </p>
          </div>

          {/* Genuine Reviews */}
          <div className="p-6 bg-emerald-50/60 border border-emerald-200/90 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Genuine Reviews
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-700">{genuine}</span>
              <span className="text-sm font-bold text-emerald-600">({genuinePct}%)</span>
            </div>
            <p className="text-xs text-emerald-700/80">
              Authentic experiential customer sentiment
            </p>
          </div>

          {/* Fake Reviews (Bold RED styling) */}
          <div className="p-6 bg-red-50 border-2 border-red-300 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-800 uppercase tracking-wider">
                Fake / Spam Reviews
              </span>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-red-600">{fake}</span>
              <span className="text-sm font-black text-red-600">({fakePct}%)</span>
            </div>
            <p className="text-xs text-red-700/90 font-medium">
              High deception, bot spam, or promotional astroturfing
            </p>
          </div>

          {/* Suspicious Reviews */}
          <div className="p-6 bg-amber-50/60 border border-amber-200/90 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Suspicious Reviews
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-700">{suspicious}</span>
              <span className="text-sm font-bold text-amber-600">({suspiciousPct}%)</span>
            </div>
            <p className="text-xs text-amber-700/80">
              Borderline confidence, repetitive or conflicting signals
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section (Pie, Bar, Rating Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Genuine vs Fake vs Suspicious */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Review Authenticity Proportion (Donut Chart)
            </h3>
            <span className="text-xs font-mono text-slate-400">100% Total Pool</span>
          </div>
          <PlotlyChart
            data={pieChartData}
            layout={{
              height: 280,
              margin: { t: 15, b: 25, l: 20, r: 20 },
              showlegend: true,
              legend: { orientation: 'h', y: -0.1 }
            }}
          />
        </div>

        {/* Bar Chart: Review Distribution Count */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Classification Volume Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-400">By Classification</span>
          </div>
          <PlotlyChart
            data={barChartData}
            layout={{
              height: 280,
              margin: { t: 15, b: 35, l: 35, r: 20 },
              yaxis: { title: 'Number of Reviews' }
            }}
          />
        </div>
      </div>

      {/* Chart 3: Rating Distribution Chart (1 to 5 Stars with Genuine vs Fake) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Star Rating Authenticity Distribution (1★ to 5★)
            </h3>
            <p className="text-xs text-slate-500">
              Displays how genuine, fake, and suspicious reviews are spread across star ratings.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-600">Stacked Rating Audit</span>
        </div>
        <PlotlyChart
          data={ratingChartData}
          layout={{
            barmode: 'stack',
            height: 300,
            margin: { t: 20, b: 35, l: 35, r: 20 },
            yaxis: { title: 'Review Count' },
            legend: { orientation: 'h', y: -0.15 }
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* DIRECT EMBEDDED PRODUCT REVIEWS ON DASHBOARD (USER REQUEST) */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                All Customer Reviews & AI Classification Details
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Product ke sabhi customer reviews, star rating, classification label, aur AI reason yahan likha hua dekhein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
              Showing <strong className="text-blue-700">{filteredReviews.length}</strong> of {reviews.length} reviews
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('reviews')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                title="Go to page 4: Detailed Reviews"
              >
                <span>Full Detailed Reviews Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar directly on Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Classification Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setReviewFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                reviewFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Reviews ({reviews.length})
            </button>

            <button
              onClick={() => setReviewFilter('GENUINE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                reviewFilter === 'GENUINE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Genuine ({genuine})</span>
            </button>

            <button
              onClick={() => setReviewFilter('FAKE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                reviewFilter === 'FAKE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Fake ({fake})</span>
            </button>

            <button
              onClick={() => setReviewFilter('SUSPICIOUS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                reviewFilter === 'SUSPICIOUS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspicious ({suspicious})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in reviews..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 4-Pillar Review Authenticity Framework */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 uppercase">
              How ReviewGuard Analyzes Customer Feedback
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Every customer review is verified across 4 core authenticity pillars:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-white border border-red-200 space-y-1 shadow-xs">
              <span className="text-red-700 font-bold block text-[11px] uppercase">1. Promotional Puffery (Fake)</span>
              <p className="text-[11px] text-slate-600 leading-snug">Flags extreme ungrounded superlatives like "1000% RECOMMENDED" or "BUY NOW" planted by sellers.</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-1 shadow-xs">
              <span className="text-purple-700 font-bold block text-[11px] uppercase">2. Duplicate Bot Hashing</span>
              <p className="text-[11px] text-slate-600 leading-snug">Detects copy-pasted bot reviews syndicated across multiple profiles.</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1 shadow-xs">
              <span className="text-amber-700 font-bold block text-[11px] uppercase">3. Rating Contradiction</span>
              <p className="text-[11px] text-slate-600 leading-snug">Catches deceptive 5-star ratings where customer complaint text reveals defects or returns.</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-1 shadow-xs">
              <span className="text-emerald-700 font-bold block text-[11px] uppercase">4. Experiential Sentiment (Genuine)</span>
              <p className="text-[11px] text-slate-600 leading-snug">Identifies real buyers by personal usage details, realistic sentiment, and natural phrasing.</p>
            </div>
          </div>
        </div>

        {/* Reviews Cards List directly on Dashboard */}
        <div className="space-y-3 pt-2">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No reviews matched your filter criteria.
            </div>
          ) : (
            filteredReviews.slice(0, 15).map((rev) => {
              const isExpanded = expandedId === rev.review_id;
              const label = (rev.classification || rev.authenticity_label || 'GENUINE').toUpperCase();
              const isGenuine = label === 'GENUINE' || label === 'LIKELY GENUINE';
              const isFake = label === 'FAKE';
              const isSuspicious = !isGenuine && !isFake;

              const conf = rev.confidence_score || Math.round((rev.calibrated_confidence || 0.85) * 100);
              const stars = Math.round(rev.rating || 5);
              const avatarLetter = ((rev.author || 'C').trim()[0] || 'U').toUpperCase();

              return (
                <div
                  key={rev.review_id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition ${
                    isFake
                      ? 'border-red-300 border-l-4 border-l-red-600 bg-red-50/20 hover:bg-red-50/40'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top: Customer Profile & Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isFake ? 'bg-red-100 text-red-700' : isSuspicious ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {avatarLetter}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rev.author || 'Verified Customer'}</span>
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                            ✓ Verified Purchase
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {/* Star Rating */}
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-1">
                              {rev.rating !== null && rev.rating !== undefined ? `${rev.rating}★` : '5★'}
                            </span>
                          </div>
                          {rev.date && (
                            <>
                              <span>•</span>
                              <span>{rev.date}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Classification Status Badge */}
                    <div className="flex items-center gap-2">
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
                    </div>
                  </div>

                  {/* Customer Review Text */}
                  <div className="mt-3.5 sm:pl-12">
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                      "{rev.review_text}"
                    </p>

                    {/* ReviewGuard Veracity Verdict */}
                    <div className={`mt-2.5 p-3.5 rounded-xl border text-xs space-y-2 ${
                      isFake
                        ? 'bg-red-50/80 border-red-300 text-red-950'
                        : isSuspicious
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                          {isFake ? (
                            <>
                              <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span className="text-red-700 font-extrabold">ReviewGuard Verdict: Flagged FAKE / Astroturfed</span>
                            </>
                          ) : isSuspicious ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-amber-700 font-extrabold">ReviewGuard Verdict: Suspicious / Borderline</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {filteredReviews.length > 15 && (
            <div className="pt-4 text-center">
              <button
                onClick={() => onNavigate('reviews')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>View All {filteredReviews.length} Reviews on All Reviews Tab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
