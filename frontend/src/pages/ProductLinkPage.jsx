import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Store,
  Tag,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  Info,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { reviewApi } from '../services/api';

export default function ProductLinkPage({ onAnalysisComplete, onNavigate }) {
  const [productUrl, setProductUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [listedPrice, setListedPrice] = useState('');
  const [originalMrp, setOriginalMrp] = useState('');
  const [reviewsText, setReviewsText] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inspectResult, setInspectResult] = useState(null);
  const [demoLinks, setDemoLinks] = useState([]);
  const [loadingDemoId, setLoadingDemoId] = useState(null);

  // Load demo presets on mount
  useEffect(() => {
    reviewApi.getDemoLinks()
      .then(data => {
        setDemoLinks(data.demo_links || data.demos || []);
      })
      .catch(err => console.warn('Could not fetch demo links:', err));
  }, []);

  // Compute live discount percentage
  const discountPercent = React.useMemo(() => {
    const list = parseFloat(listedPrice);
    const mrp = parseFloat(originalMrp);
    if (!isNaN(list) && !isNaN(mrp) && mrp > 0 && mrp > list) {
      return Math.round(((mrp - list) / mrp) * 100);
    }
    return null;
  }, [listedPrice, originalMrp]);

  const handleSelectDemo = (demo) => {
    setProductUrl(demo.url || '');
    setProductName(demo.product_name || '');
    setSellerName(demo.seller_name || '');
    setListedPrice(demo.listed_price ? String(demo.listed_price) : '');
    setOriginalMrp(demo.original_mrp ? String(demo.original_mrp) : '');
    setReviewsText(demo.sample_reviews || '');
    setError(null);
  };

  const handleInspect = async (e) => {
    if (e) e.preventDefault();
    if (!productUrl.trim()) {
      setError('Please provide an e-commerce product link (e.g. Amazon, Flipkart).');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      product_url: productUrl.trim(),
      product_name: productName.trim() || undefined,
      seller_name: sellerName.trim() || undefined,
      listed_price: listedPrice ? parseFloat(listedPrice) : undefined,
      original_mrp: originalMrp ? parseFloat(originalMrp) : undefined,
      reviews_text: reviewsText.trim() || undefined,
    };

    try {
      const response = await reviewApi.inspectProductLink(payload);
      setInspectResult(response);
    } catch (err) {
      console.error('Inspection failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to inspect product link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToMainDashboard = () => {
    if (inspectResult?.review_analysis && onAnalysisComplete) {
      onAnalysisComplete(inspectResult.review_analysis);
    }
  };

  const assessment = inspectResult?.assessment;
  const reviewAnalysis = inspectResult?.review_analysis;
  const summary = reviewAnalysis?.summary || {};
  const reviewsList = reviewAnalysis?.reviews || [];
  const reviewTrustScore = summary.review_trust_score ?? 0;
  const productQualityScore = summary.reported_product_quality_score ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Dual AI Verification Engine
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-medium">Physical Authenticity + Review Veracity</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Product Link & Counterfeit Scanner
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Enter an e-commerce URL from Amazon, Flipkart, AliExpress, or other marketplaces. The AI independently analyzes the product link, seller credibility, price plausibility, and customer reviews to evaluate both whether the <strong className="text-slate-700">product itself is fake</strong> and whether the <strong className="text-slate-700">reviews are manipulated</strong>.
        </p>
      </div>

      {/* Preset Demo Cases */}
      {demoLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Quick Test Presets (One-Click Link Analysis)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {demoLinks.map((demo) => {
              const isCounterfeitDemo = demo.id === 'link_2' || demo.id === 'link_3';
              return (
                <button
                  key={demo.id}
                  onClick={() => handleSelectDemo(demo)}
                  className={`text-left p-3 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                    productUrl === demo.url
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isCounterfeitDemo ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isCounterfeitDemo ? 'Suspected Fake' : 'Genuine Test'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {demo.listed_price ? `₹${demo.listed_price.toLocaleString()}` : ''}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{demo.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{demo.description}</p>
                  </div>
                  <div className="mt-2 text-[11px] font-medium text-blue-600 flex items-center gap-1">
                    Load Preset <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <LinkIcon className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Product Listing Information
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Works with or without direct review text
          </span>
        </div>

        <form onSubmit={handleInspect} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Inspection Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Product URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Link (URL) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.amazon.in/dp/B0BDHW4847 or https://www.flipkart.com/..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Amazon ASIN extraction, Flipkart product keys, AliExpress, and generic e-commerce platforms.
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Title (Optional)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Apple AirPods Pro (2nd Gen)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                Seller / Store Name (Optional)
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="e.g. Appario Retail, MegaDeals Hub"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Listed Price vs MRP (Optional)
                </span>
                {discountPercent !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    discountPercent > 70 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {discountPercent}% Off {discountPercent > 70 && '⚠️ Anomaly'}
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={listedPrice}
                  onChange={(e) => setListedPrice(e.target.value)}
                  placeholder="Selling (₹)"
                  className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <input
                  type="number"
                  value={originalMrp}
                  onChange={(e) => setOriginalMrp(e.target.value)}
                  placeholder="MRP (₹)"
                  className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Optional Reviews Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Customer Reviews from Product Page (Optional, 1 per line)</span>
              <span className="text-[11px] font-normal text-slate-400">
                Paste raw reviews to analyze fake review patterns & counterfeit cues
              </span>
            </label>
            <textarea
              rows={5}
              value={reviewsText}
              onChange={(e) => setReviewsText(e.target.value)}
              placeholder="Paste customer reviews here (one per line). If left empty, ReviewGuard evaluates URL structure, marketplace credibility, and price anomalies."
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setProductUrl('');
                setProductName('');
                setSellerName('');
                setListedPrice('');
                setOriginalMrp('');
                setReviewsText('');
                setInspectResult(null);
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={isLoading || !productUrl.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-xs rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting Product Link...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Run Product & Review Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {inspectResult && assessment && (
        <div className="space-y-6">
          {/* Top Banner / Verdict Card */}
          <div className={`p-6 rounded-xl border ${
            assessment.risk_category.includes('High')
              ? 'bg-rose-50/70 border-rose-200'
              : assessment.risk_category.includes('Moderate')
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700">
                    {assessment.marketplace}
                  </span>
                  {assessment.product_identifier && (
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-slate-600 font-mono">
                      ID: {assessment.product_identifier}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    assessment.risk_category.includes('High')
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : assessment.risk_category.includes('Moderate')
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {assessment.risk_category}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  {inspectResult.product_name}
                </h2>

                <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
                  {assessment.summary_verdict}
                </p>
              </div>

              {/* Dual Gauges / Scores */}
              <div className="flex items-center gap-4 shrink-0 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                {/* Product Counterfeit Risk */}
                <div className="text-center px-3 border-r border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Counterfeit Risk
                  </p>
                  <p className={`text-2xl font-bold mt-0.5 ${
                    assessment.counterfeit_risk_score > 60
                      ? 'text-rose-600'
                      : assessment.counterfeit_risk_score > 35
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}>
                    {Math.round(assessment.counterfeit_risk_score)}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Physical Authenticity</p>
                </div>

                {/* Review Trustworthiness */}
                <div className="text-center px-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Review Trust
                  </p>
                  <p className={`text-2xl font-bold mt-0.5 ${
                    reviewTrustScore >= 70
                      ? 'text-emerald-600'
                      : reviewTrustScore >= 40
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {Math.round(reviewTrustScore)}/100
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Review Veracity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Pillar Deep Dives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Pillar: Physical Product Authenticity */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Physical Product Legitimacy Audit
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Seller & Product Anomaly Signals
                </span>
              </div>

              {/* Signals list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Seller Credibility</span>
                  <span className={`font-semibold ${
                    assessment.seller_credibility.includes('Authorized') || assessment.seller_credibility.includes('Verified')
                      ? 'text-emerald-700'
                      : assessment.seller_credibility.includes('High Risk')
                      ? 'text-rose-700'
                      : 'text-slate-700'
                  }`}>
                    {assessment.seller_credibility}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Price Plausibility</span>
                  <span className={`font-semibold ${
                    assessment.price_anomaly_detected ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {assessment.price_anomaly_detected
                      ? `Abnormal Discount (${assessment.discount_percentage}% off)`
                      : assessment.discount_percentage !== null
                      ? `Standard Pricing (${assessment.discount_percentage}% off)`
                      : 'Normal Market Price'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Counterfeit Warnings in Reviews</span>
                  <span className={`font-semibold ${
                    assessment.counterfeit_signals_in_reviews.length > 0 ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    {assessment.counterfeit_signals_in_reviews.length} Detected
                  </span>
                </div>
              </div>

              {/* Specific Counterfeit Keywords Detected */}
              {assessment.counterfeit_signals_in_reviews.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1.5">
                    Customer Counterfeit Warning Cues:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.counterfeit_signals_in_reviews.map((cue, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-rose-700 font-mono text-[11px] border border-rose-200">
                        "{cue}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Identified Risk Factors */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Identified Legitimacy Findings:</p>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {assessment.risk_factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Pillar: Review Veracity & Quality Audit */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Customer Reviews & Manipulation Audit
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  NLP & ML Model Analysis
                </span>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Genuine</p>
                  <p className="text-base font-bold text-emerald-800 mt-0.5">
                    {summary.genuine_count ?? 0}
                  </p>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-rose-700">Suspicious</p>
                  <p className="text-base font-bold text-rose-800 mt-0.5">
                    {summary.suspicious_count ?? 0}
                  </p>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-amber-700">Uncertain</p>
                  <p className="text-base font-bold text-amber-800 mt-0.5">
                    {summary.uncertain_count ?? 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Reported Product Quality:</span>
                  <span className="font-semibold text-slate-800">
                    {Math.round(productQualityScore)}/100
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Suspicious Positive Reviews:</span>
                  <span className="font-semibold text-slate-800">
                    {summary.suspicious_positives_count ?? reviewAnalysis.suspicious_positives?.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Aspect Contradictions:</span>
                  <span className="font-semibold text-slate-800">
                    {reviewAnalysis.contradictions?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Top Reported Complaints:</span>
                  <span className="font-semibold text-slate-800">
                    {reviewAnalysis.top_defects?.length || 0}
                  </span>
                </div>
              </div>

              {/* Action Button: Explore Full Report */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleApplyToMainDashboard}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Open in Full Analytics Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sample Reviews Evaluated Table */}
          {reviewsList && reviewsList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Evaluated Customer Reviews ({reviewsList.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Classified by Machine Learning & NLP Pipeline
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {reviewsList.map((rev) => {
                  const isSuspicious = rev.authenticity_label === 'Suspicious';
                  const isGenuine = rev.authenticity_label === 'Likely Genuine';
                  const sentLower = (rev.sentiment || '').toLowerCase();
                  return (
                    <div key={rev.review_id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuspicious
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isGenuine
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {rev.authenticity_label}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            Calibrated Fake Prob: {(rev.deception_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                          sentLower === 'positive'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : sentLower === 'negative'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {rev.sentiment} Sentiment
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-sans leading-relaxed">
                        "{rev.review_text}"
                      </p>
                      {rev.explanation && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          ↳ {rev.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
