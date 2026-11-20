import React, { useState } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Play,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { reviewApi } from '../services/api';

export default function AnalyzePage({
  onAnalysisComplete,
  selectedModel,
  onOpenDemo,
  isLoading,
  setIsLoading
}) {
  const [inputMode, setInputMode] = useState('batch'); // 'batch', 'manual', 'file'
  const [productName, setProductName] = useState('ProSound ANC Wireless Earbuds');
  
  // Batch paste state
  const [batchText, setBatchText] = useState(
`Excellent battery life! The battery lasts 12 hours on a single charge. Best earbuds ever!
Battery drains within 30 minutes. Completely unusable during my workout.
Fantastic sound quality and amazing battery backup! Flawless purchase!
The earbuds stopped working after two days. Left earpiece produces no sound at all.
Best purchase! Highly recommended to all buyers!`
  );

  // Manual list state
  const [manualReviews, setManualReviews] = useState([
    { text: 'I have been using this laptop for three weeks. Battery lasts 7 hours while coding.', rating: 5, verified: true }
  ]);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  // Optional Product Verification Evidence state
  const [hasEvidence, setHasEvidence] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [inspectionResult, setInspectionResult] = useState('not_verified');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  
  const [errorMsg, setErrorMsg] = useState(null);

  const addManualRow = () => {
    setManualReviews([...manualReviews, { text: '', rating: 5, verified: true }]);
  };

  const removeManualRow = (index) => {
    setManualReviews(manualReviews.filter((_, i) => i !== index));
  };

  const updateManualRow = (index, field, value) => {
    const updated = [...manualReviews];
    updated[index][field] = value;
    setManualReviews(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (inputMode === 'file') {
        if (!selectedFile) {
          throw new Error('Please select a CSV or Excel file to upload.');
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('product_name', productName);
        formData.append('model_name', selectedModel);
        formData.append('has_verification_evidence', hasEvidence);
        if (hasEvidence) {
          formData.append('serial_number', serialNumber);
          formData.append('inspection_result', inspectionResult);
          formData.append('evidence_notes', evidenceNotes);
        }

        const result = await reviewApi.uploadFile(formData);
        onAnalysisComplete(result);
      } else {
        let reviewsPayload = [];
        if (inputMode === 'batch') {
          const lines = batchText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2);
          
          if (lines.length === 0) {
            throw new Error('Please paste at least one customer review.');
          }

          reviewsPayload = lines.map((line, idx) => ({
            review_id: `rev_${idx + 1}`,
            review_text: line,
            rating: null,
            verified_purchase: null
          }));
        } else {
          const validReviews = manualReviews.filter(r => r.text.trim().length > 2);
          if (validReviews.length === 0) {
            throw new Error('Please enter text for at least one customer review.');
          }
          reviewsPayload = validReviews.map((r, idx) => ({
            review_id: `rev_${idx + 1}`,
            review_text: r.text.trim(),
            rating: Number(r.rating) || null,
            verified_purchase: r.verified
          }));
        }

        const payload = {
          product_name: productName,
          reviews: reviewsPayload,
          product_verification: {
            has_verification_evidence: hasEvidence,
            serial_number: hasEvidence ? serialNumber : null,
            inspection_result: hasEvidence ? inspectionResult : 'not_verified',
            evidence_notes: hasEvidence ? evidenceNotes : ''
          }
        };

        const result = await reviewApi.analyzeReviews(payload, selectedModel);
        onAnalysisComplete(result);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Analysis failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analyze Customer Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accepts customer reviews directly via text paste, manual list, or CSV/Excel upload.
          </p>
        </div>

        <button
          onClick={onOpenDemo}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Load Demonstration Preset</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Information Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Name / Model Identifier
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Wireless ANC Earbuds Pro"
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Input Method Selector Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInputMode('batch')}
            className={`pb-2.5 transition flex items-center gap-1.5 ${
              inputMode === 'batch'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Batch Paste (Multi-Review)</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`pb-2.5 transition flex items-center gap-1.5 ${
              inputMode === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload CSV / Excel File</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`pb-2.5 transition flex items-center gap-1.5 ${
              inputMode === 'manual'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Structured Manual Entry</span>
          </button>
        </div>

        {/* Input Method Content */}
        {inputMode === 'batch' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Paste Reviews (One customer review per line)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {batchText.split('\n').filter(l => l.trim().length > 2).length} reviews detected
              </span>
            </div>
            <textarea
              rows={7}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="Paste customer reviews here, each on a new line..."
              className="w-full p-3.5 rounded-lg bg-slate-50/50 border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {inputMode === 'file' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="p-8 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-center bg-slate-50/70 transition">
              <input
                type="file"
                id="reviewFileInput"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                className="hidden"
              />
              <label htmlFor="reviewFileInput" className="cursor-pointer space-y-2 block">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to select CSV or Excel (.xlsx) file'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Column detection automatically maps review text, star ratings, and reviewer IDs.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {inputMode === 'manual' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Review Entries
              </span>
              <button
                type="button"
                onClick={addManualRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </button>
            </div>

            <div className="space-y-3">
              {manualReviews.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-semibold text-blue-700">
                      Review #{idx + 1}
                    </span>
                    {manualReviews.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeManualRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={item.text}
                    onChange={(e) => updateManualRow(idx, 'text', e.target.value)}
                    placeholder="Enter customer review text..."
                    className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Rating:</span>
                      <select
                        value={item.rating}
                        onChange={(e) => updateManualRow(idx, 'rating', Number(e.target.value))}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.verified}
                        onChange={(e) => updateManualRow(idx, 'verified', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Verified Purchase Badge</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Physical Product Verification Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Optional Product Authenticity Verification Evidence
                </h3>
                <p className="text-[11px] text-slate-500">
                  Provide independent manufacturer or distributor audit records to verify physical counterfeit status.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasEvidence}
                onChange={(e) => setHasEvidence(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {hasEvidence && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Serial Number / Batch Identifier
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-88219-ORIGINAL"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Independent Inspection Result
                </label>
                <select
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="verified_genuine">Verified Genuine (Authorized Channel)</option>
                  <option value="verified_counterfeit">Verified Counterfeit (Lab Confirmed)</option>
                  <option value="suspected_counterfeit">Suspected Counterfeit (Pending Audit)</option>
                  <option value="not_verified">Not Verified / Inconclusive</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">
                  Audit Notes / Laboratory Reference
                </label>
                <input
                  type="text"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="e.g. Official warranty registered on manufacturer support database"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isLoading ? 'Running Pipeline...' : 'Run Review Analysis'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
