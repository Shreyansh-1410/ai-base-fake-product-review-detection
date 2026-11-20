import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  ShieldCheck,
  Search,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
  Cpu,
  BarChart3,
  X,
  ShoppingBag,
  Zap,
  ClipboardCheck,
  Star,
  Check
} from 'lucide-react';
import { reviewApi } from '../services/api';

export default function HomePage({ onStartAnalysis, onNavigate, onOpenDemo }) {
  const [productLink, setProductLink] = useState('');
  const [inputMode, setInputMode] = useState('link'); // 'link', 'csv', 'paste'
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedLinkNotice, setCopiedLinkNotice] = useState(false);

  // Manual Paste State
  const [pastedName, setPastedName] = useState('');
  const [pastedText, setPastedText] = useState('');

  // File Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');

  useEffect(() => {
    reviewApi.getSampleProducts()
      .then(res => setSamples(res.samples || []))
      .catch(err => console.warn("Could not fetch samples:", err));
  }, []);

  const handleLinkSubmit = async (e) => {
    if (e) e.preventDefault();
    const link = productLink.trim();
    if (!link) {
      setError("Please paste a valid Amazon or Flipkart product link.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysisData = await reviewApi.analyzeProductUrl({
        product_url: link,
        model_name: "Logistic Regression"
      });
      onStartAnalysis(analysisData);
    } catch (err) {
      console.error("Link Analysis failed:", err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : err.message || "Could not extract reviews. Please verify the link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setProductLink(text.trim());
          setError(null);
          setCopiedLinkNotice(true);
          setTimeout(() => setCopiedLinkNotice(false), 2500);
        } else {
          setError("Clipboard is empty. Please copy a product link first.");
        }
      } else {
        setError("Clipboard access not supported. Please use Ctrl+V.");
      }
    } catch (err) {
      console.warn("Clipboard read error:", err);
      setError("Could not read clipboard. Please paste manually using Ctrl+V.");
    }
  };

  const handleSelectSample = async (sample) => {
    setProductLink(sample.url);
    setError(null);
    setIsLoading(true);
    try {
      const analysisData = await reviewApi.analyzeProductUrl({
        product_url: sample.url,
        model_name: "Logistic Regression"
      });
      onStartAnalysis(analysisData);
    } catch (err) {
      console.error("Failed to analyze sample:", err);
      setError("Failed to analyze sample link: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a .csv or .xlsx review file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('product_name', pastedName || 'Uploaded Review Dataset');
    formData.append('model_name', 'Logistic Regression');

    try {
      const analysisData = await reviewApi.uploadFile(formData);
      onStartAnalysis(analysisData);
    } catch (err) {
      console.error("CSV upload analysis failed:", err);
      setError(err.response?.data?.detail || err.message || "Failed to parse file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* 🌟 HERO SEARCH SECTION (BUYHATKE STYLE) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-7 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          
          {/* Store Pills Header */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">Live E-Commerce Verification</span>
            <span className="text-slate-500">•</span>
            <span>Amazon India & Flipkart</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              ReviewGuard: Real Review Checker
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Paste any product link. Spot astroturfed, bot, and paid reviews in seconds before you spend your hard-earned money.
            </p>
          </div>

          {/* Input Mode Selector (Pill Tabs) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-xs font-semibold">
            <button
              onClick={() => setInputMode('link')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition cursor-pointer ${
                inputMode === 'link'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Product Link (Amazon / Flipkart)</span>
            </button>
            <button
              onClick={() => setInputMode('csv')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition cursor-pointer ${
                inputMode === 'csv'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-3 text-left max-w-xl mx-auto shadow-md">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-100">Detection Notice</p>
                <p className="mt-0.5 leading-relaxed text-red-200">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Copied Banner */}
          {copiedLinkNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-center gap-2 max-w-md mx-auto shadow-md">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Product link pasted from clipboard!</span>
            </div>
          )}

          {/* TAB 1: PRODUCT LINK SEARCH (MAIN CONSUMER INPUT) */}
          {inputMode === 'link' && (
            <form onSubmit={handleLinkSubmit} className="pt-2 max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-2xl p-2 pl-4 sm:pl-5 shadow-xl border-2 border-white/90 focus-within:border-blue-500 transition-all">
                {/* Search Icon */}
                <div className="text-slate-400 pr-2 shrink-0">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>

                {/* Input Box */}
                <input
                  type="url"
                  value={productLink}
                  onChange={(e) => { setProductLink(e.target.value); setError(null); }}
                  placeholder="Paste Amazon or Flipkart link (e.g. amazon.in/dp/... or flipkart.com/...)"
                  className="w-full py-2.5 px-2 bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none font-medium"
                  required
                />

                {/* In-Input Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  {productLink && (
                    <button
                      type="button"
                      onClick={() => setProductLink('')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    title="Paste from clipboard"
                  >
                    <span>Paste</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !productLink.trim()}
                    className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <span>Check Reviews</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: CSV UPLOAD */}
          {inputMode === 'csv' && (
            <form onSubmit={handleFileUpload} className="pt-2 max-w-xl mx-auto">
              <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 text-left space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name (Optional)</label>
                  <input
                    type="text"
                    value={pastedName}
                    onChange={(e) => setPastedName(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM4 Headphones"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Review Dataset (.csv or .xlsx)</label>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                        setUploadFileName(e.target.files[0].name);
                      }
                    }}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {uploadFileName && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono">Selected: {uploadFileName}</p>
                  )}
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Needs columns: review_text, rating</span>
                  <button
                    type="submit"
                    disabled={isLoading || !uploadFile}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isLoading ? "Analyzing..." : "Analyze File"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Quick Info Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" /> Real Buyer Sentiment
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" /> Bot Spam Detection
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" /> 0–100 Trust Score
            </span>
          </div>

        </div>
      </div>



      {/* 🧭 HOW REVIEWGUARD PROTECTS SHOPPERS (3 CARDS) */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            How ReviewGuard Detects Fake Reviews
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A simple 3-stage authenticity verification process designed for Indian e-commerce:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <LinkIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">1. Real Live Review Scraping</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We extract actual customer reviews directly from the product listing on Amazon India or Flipkart using verified legal methods.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">2. Astroturfing & Bot Flags (RED)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Machine learning models analyze promotional puffery, copy-pasted bot reviews, and ratings that conflict with complaint text.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">3. Transparent Trust Score (0–100)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You receive an authentic 0–100 Review Trust Score, genuine review percentage, and clear reasons for each flagged review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
