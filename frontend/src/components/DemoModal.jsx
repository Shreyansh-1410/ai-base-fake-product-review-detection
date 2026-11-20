import React, { useState, useEffect } from 'react';
import { X, Play, Sparkles, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { reviewApi } from '../services/api';
import ScenarioBadge from './ScenarioBadge';

export default function DemoModal({ isOpen, onClose, onSelectCase, selectedModel, isLoading }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      reviewApi.getDemoCases()
        .then(res => {
          setCases(res.cases || []);
          if (res.cases?.length > 0 && !selectedCaseId) {
            setSelectedCaseId(res.cases[8]?.id || res.cases[0]?.id);
          }
        })
        .catch(err => console.error("Error loading demo cases:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Select Demonstration Test Case
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Scenarios List */}
          <div className="w-2/5 border-r border-slate-200 overflow-y-auto p-3 space-y-1.5 bg-slate-50/60">
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left p-3 rounded-xl transition text-xs ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="font-semibold text-slate-800 mb-0.5">{c.title}</div>
                  <div className="text-[11px] text-slate-500 truncate">{c.product_name}</div>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Case Details */}
          {currentCase && (
            <div className="w-3/5 p-6 overflow-y-auto flex flex-col justify-between space-y-4 bg-white">
              <div className="space-y-4">
                <div>
                  <div className="mb-2">
                    <ScenarioBadge scenarioType={currentCase.scenario_type} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{currentCase.title}</h4>
                  <p className="text-xs text-blue-700 font-mono mt-0.5">
                    Product: {currentCase.product_name}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="text-slate-600">
                    <b className="text-slate-800">Test Intent:</b> {currentCase.description}
                  </div>
                  <div className="text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <b className="text-emerald-900">Expected System Output:</b> {currentCase.expected_behavior}
                  </div>
                </div>

                {/* Pre-packaged Reviews in this case */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Included Reviews ({currentCase.reviews?.length || 0})
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentCase.reviews?.map((r, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-mono font-semibold text-blue-700">Review #{i+1}</span>
                          <span>{r.rating ? `${r.rating}★` : 'No rating'}</span>
                        </div>
                        <p className="italic text-slate-800">"{r.review_text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    onSelectCase(currentCase.id);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isLoading ? "Running Pipeline..." : "Execute This Scenario"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
