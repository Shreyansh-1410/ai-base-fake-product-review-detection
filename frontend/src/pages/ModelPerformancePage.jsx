import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, Cpu, Layers } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PlotlyChart from '../components/PlotlyChart';
import { reviewApi } from '../services/api';

export default function ModelPerformancePage() {
  const [metricsData, setMetricsData] = useState(null);
  const [activeModelMatrix, setActiveModelMatrix] = useState('Logistic Regression');

  useEffect(() => {
    reviewApi.getModelMetrics()
      .then(res => setMetricsData(res))
      .catch(err => console.error("Could not fetch model metrics:", err));
  }, []);

  if (!metricsData) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto text-slate-500 text-xs shadow-sm">
        Loading scientific benchmark metrics...
      </div>
    );
  }

  const { comparison_table, confusion_matrices, subgroup_evaluation, best_model_name, total_samples, vocabulary_size } = metricsData;

  const modelNames = comparison_table.map(m => m.model_name);
  const accuracies = comparison_table.map(m => m.accuracy);
  const f1Scores = comparison_table.map(m => m.f1_score);
  const rocAucs = comparison_table.map(m => m.roc_auc);

  const modelComparisonChart = [
    {
      x: modelNames,
      y: accuracies,
      name: 'Accuracy',
      type: 'bar',
      marker: { color: '#2563eb' }
    },
    {
      x: modelNames,
      y: f1Scores,
      name: 'F1 Score',
      type: 'bar',
      marker: { color: '#7c3aed' }
    },
    {
      x: modelNames,
      y: rocAucs,
      name: 'ROC-AUC',
      type: 'bar',
      marker: { color: '#16a34a' }
    }
  ];

  const cm = confusion_matrices[activeModelMatrix] || [[0, 0], [0, 0]];
  const tn = cm[0][0];
  const fp = cm[0][1];
  const fn = cm[1][0];
  const tp = cm[1][1];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Empirical ML & NLP Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Machine Learning Benchmark & Scientific Calibration
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
            Validated against gold-standard deceptive review benchmarks (Ott Opinion Spam & Amazon Corpus). 
            Rigorous cross-model comparison between Logistic Regression, Random Forest, XGBoost, and Contextual BERT.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Top Performing Model</span>
          <span className="text-xs font-bold text-slate-900 font-mono">{best_model_name}</span>
        </div>
      </div>

      {/* Dataset & Artifact Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-slate-500">Total Labeled Reviews</span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{total_samples}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-slate-500">TF-IDF N-Gram Vocabulary</span>
          <div className="text-xl font-bold text-blue-700 font-mono mt-0.5">{vocabulary_size} terms</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-slate-500">Test Set Size (Unseen)</span>
          <div className="text-xl font-bold text-indigo-700 font-mono mt-0.5">{metricsData.test_samples} reviews</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-slate-500">Calibration Margin</span>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
            {metricsData.uncertainty_thresholds.lower * 100}% - {metricsData.uncertainty_thresholds.upper * 100}%
          </div>
        </div>
      </div>

      {/* Scientific Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Multi-Model Scientific Evaluation Table (Unseen Test Data)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Model Architecture</th>
                <th className="py-2.5 px-3 font-semibold">Accuracy</th>
                <th className="py-2.5 px-3 font-semibold">Precision</th>
                <th className="py-2.5 px-3 font-semibold">Recall</th>
                <th className="py-2.5 px-3 font-semibold">F1-Score</th>
                <th className="py-2.5 px-3 font-semibold">ROC-AUC</th>
                <th className="py-2.5 px-3 font-semibold">Brier Calibration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {comparison_table.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                    {m.model_name}
                    {m.model_name === best_model_name && (
                      <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Top Performer
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700">{(m.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 text-slate-700">{(m.precision * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 text-slate-700">{(m.recall * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">{(m.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 text-emerald-700">{(m.roc_auc * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 text-slate-500">{m.brier_score.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Comparison Plotly Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Comparative Performance Metrics Chart
        </h3>
        <div className="h-72">
          <PlotlyChart
            data={modelComparisonChart}
            layout={{
              barmode: 'group',
              yaxis: { title: 'Score (0 - 1.0)', range: [0.85, 1.0] },
              legend: { orientation: 'h', y: -0.2, font: { color: '#64748b' } },
              margin: { t: 20, r: 20, l: 40, b: 50 }
            }}
          />
        </div>
      </div>

      {/* Confusion Matrix & Subgroup Evaluation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Confusion Matrix */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Confusion Matrix
            </h3>
            <select
              value={activeModelMatrix}
              onChange={(e) => setActiveModelMatrix(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs text-slate-700"
            >
              {modelNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">True Negatives (TN)</span>
              <span className="text-2xl font-bold text-emerald-800 mt-1 block">{tn}</span>
              <span className="text-[10px] text-slate-500">Genuine Correctly Identified</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-800 uppercase font-bold block">False Positives (FP)</span>
              <span className="text-2xl font-bold text-rose-800 mt-1 block">{fp}</span>
              <span className="text-[10px] text-slate-500">Genuine Wrongly Flagged</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">False Negatives (FN)</span>
              <span className="text-2xl font-bold text-amber-800 mt-1 block">{fn}</span>
              <span className="text-[10px] text-slate-500">Deceptive Missed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-800 uppercase font-bold block">True Positives (TP)</span>
              <span className="text-2xl font-bold text-blue-800 mt-1 block">{tp}</span>
              <span className="text-[10px] text-slate-500">Deceptive Correctly Flagged</span>
            </div>
          </div>
        </div>

        {/* Subgroup Scientific Evaluation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Critical Subgroup Accuracy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted validation for specific high-risk project scenarios:
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {subgroup_evaluation && subgroup_evaluation[activeModelMatrix] && (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Deceptive Positive Accuracy (Puffery Detection)
                    </span>
                    <span className="font-mono font-bold text-indigo-700">
                      {(subgroup_evaluation[activeModelMatrix].deceptive_positive_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Precision in detecting fabricated 5-star promotional reviews.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Scenario B: Genuine Negative Review Accuracy
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {(subgroup_evaluation[activeModelMatrix].genuine_negative_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ensures honest customer reviews of defective products are NOT wrongly classified as fake.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
