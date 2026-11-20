import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Store,
  Tag,
  Star,
  RefreshCw
} from 'lucide-react';
import { reviewApi } from '../services/api';

export default function AnalysisPage({
  analysis,
  extractedInfo,
  onAnalysisComplete,
  onNavigate
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  // If we already have full analysis, display product details with button to go to Dashboard
  const product = analysis || extractedInfo || {
    product_name: " boAt Rockerz 450 Bluetooth On-Ear Headphones",
    platform: "Flipkart",
    brand: "boAt",
    product_rating: 4.3,
    total_reviews_count: 12,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    product_url: "https://www.flipkart.com/boat-rockerz-450-bluetooth-headset/p/itm5a8c90382d56e"
  };

  const steps = [
    { title: "1. Platform Identification & URL Validation", status: "completed", desc: `Identified as ${product.platform || 'E-Commerce Platform'}` },
    { title: "2. Product Information Extraction", status: "completed", desc: "Product title, brand, image, and catalog rating extracted" },
    { title: "3. Review Collection & Permitted Ingestion", status: analysis ? "completed" : "active", desc: analysis ? `${analysis.reviews?.length || 0} reviews collected` : "Awaiting review stream verification" },
    { title: "4. NLP Preprocessing & Linguistic Extraction", status: analysis ? "completed" : "pending", desc: "TF-IDF vectorization, puffery detection, and lexical diversity" },
    { title: "5. ML Inference & Review Trust Calculation", status: analysis ? "completed" : "pending", desc: analysis ? `Trust Score computed: ${analysis.summary?.review_trust_score}/100` : "Calibrated classifiers ready" }
  ];

  const handleRunFallbackPasted = async (e) => {
    e.preventDefault();
    if (!pasteText.trim()) {
      setError("Please paste customer reviews to continue.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const result = await reviewApi.analyzeProductUrl({
        product_url: product.product_url || "https://www.amazon.in/dp/B0SAMPLE",
        model_name: "Logistic Regression",
        fallback_reviews_text: pasteText
      });
      onAnalysisComplete(result);
      onNavigate('dashboard');
    } catch (err) {
      console.error("Fallback paste analysis failed:", err);
      setError(err.response?.data?.detail?.message || err.message || "Failed to analyze reviews.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunFallbackCsv = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError("Please select a review CSV file.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('product_name', product.product_name);
    try {
      const result = await reviewApi.uploadFile(formData);
      onAnalysisComplete(result);
      onNavigate('dashboard');
    } catch (err) {
      console.error("CSV upload failed:", err);
      setError(err.response?.data?.detail || err.message || "Failed to process review dataset.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Product Analysis Progress & Information
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          ReviewGuard modular pipeline for live e-commerce inspection, review ingestion, and AI model evaluation.
        </p>
      </div>

      {/* Section 3: Product Information Card (Attractive & Professional) */}
      <div className="p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"}
            alt={product.product_name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
          />

          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                (product.platform || '').toLowerCase().includes('amazon')
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-sky-50 text-sky-800 border border-sky-200'
              }`}>
                {product.platform || 'E-Commerce Platform'}
              </span>

              {product.brand && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Brand: {product.brand}</span>
                </span>
              )}

              {product.product_rating && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{product.product_rating} / 5.0</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {product.product_name}
            </h2>

            {product.product_url && (
              <a
                href={product.product_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                <span>View original e-commerce listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
              <span>Total Available Reviews: <strong className="text-slate-800 font-bold">{analysis?.summary?.total_reviews || product.total_reviews_count || product.reviews?.length || 0}</strong></span>
              {analysis && (
                <span>Review Trust Score: <strong className="text-blue-600 font-bold">{analysis.summary?.review_trust_score}/100</strong></span>
              )}
            </div>
          </div>

          {analysis && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Step Indicator */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          AI Pipeline Execution Stages
        </h3>

        <div className="space-y-3">
          {steps.map((st, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
              {st.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : st.status === 'active' ? (
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0 mt-0.5" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 bg-white shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">{st.title}</p>
                <p className="text-[11px] text-slate-500">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anti-Bot Fallback Option (If Automatic Extraction Was Restricted) */}
      {!analysis && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Notice: Anti-Bot Protection May Restrict Live Scraping
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                As per e-commerce security policies, automatic scraping is restricted on protected endpoints. You can supply customer reviews directly via manual paste or CSV file below to complete the full AI authenticity analysis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Paste Reviews */}
            <form onSubmit={handleRunFallbackPasted} className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Option A: Paste Customer Reviews
              </label>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste customer reviews here, one review per line..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={isProcessing || !pasteText.trim()}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase transition disabled:opacity-50"
              >
                {isProcessing ? "Analyzing..." : "Analyze Pasted Reviews"}
              </button>
            </form>

            {/* Upload CSV */}
            <form onSubmit={handleRunFallbackCsv} className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Option B: Upload Review CSV
                </label>
                <input
                  type="file"
                  accept=".csv, .xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCsvFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white cursor-pointer"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !csvFile}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase transition disabled:opacity-50"
              >
                {isProcessing ? "Analyzing..." : "Analyze Uploaded CSV"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
