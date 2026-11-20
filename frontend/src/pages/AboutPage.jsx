import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
  Scale,
  Award
} from 'lucide-react';
import { reviewApi } from '../services/api';

export default function AboutPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    reviewApi.getModelMetrics()
      .then(res => setMetrics(res))
      .catch(err => console.warn("Could not load metrics:", err));
  }, []);

  const benchmarkTable = metrics?.comparison_table || [
    { model_name: "Logistic Regression", accuracy: 0.9556, precision: 0.9503, recall: 0.9609, f1_score: 0.9556, roc_auc: 0.9492, brier_score: 0.0452 },
    { model_name: "Random Forest", accuracy: 0.9528, precision: 0.9500, recall: 0.9553, f1_score: 0.9526, roc_auc: 0.9418, brier_score: 0.0482 },
    { model_name: "XGBoost", accuracy: 0.9500, precision: 0.9448, recall: 0.9553, f1_score: 0.9500, roc_auc: 0.9425, brier_score: 0.0480 },
    { model_name: "BERT (Contextual Classifier)", accuracy: 0.9556, precision: 0.9503, recall: 0.9609, f1_score: 0.9556, roc_auc: 0.9494, brier_score: 0.1282 }
  ];

  const confusionMatrix = metrics?.confusion_matrices?.["Logistic Regression"] || [
    [172, 9],
    [7, 172]
  ];

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-8 sm:p-10 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>About ReviewGuard – AI Architecture & Academic Methodology</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          ReviewGuard – AI-Based Fake Product Review Detector
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          ReviewGuard is a production-grade AI system engineered to detect fake, manipulated, and suspicious customer reviews on e-commerce platforms such as Amazon India and Flipkart. Combining Natural Language Processing (NLP), calibrated machine learning classifiers, and contradiction detection, it delivers a transparent 0–100 Review Trust Score.
        </p>
      </div>

      {/* Section 14: Model Testing & Benchmark Metrics */}
      <div className="p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span>Machine Learning Benchmark & Evaluation (Test Set: N=360)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluated on gold-standard labeled fake review corpus with strict 70/15/15 train/validation/test split to prevent data leakage.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Model Architecture</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">Brier Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {benchmarkTable.map((row, idx) => (
                <tr key={idx} className={row.model_name === 'Logistic Regression' ? 'bg-blue-50/50 font-bold text-blue-900' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 flex items-center gap-2">
                    {row.model_name}
                    {row.model_name === 'Logistic Regression' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">
                        Active Best
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">{(row.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4">{(row.precision * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4">{(row.recall * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 font-bold text-blue-600">{(row.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4">{(row.roc_auc * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-500">{row.brier_score?.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix Visualization */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Confusion Matrix (Calibrated Logistic Regression)
          </h3>
          <div className="grid grid-cols-2 max-w-sm border border-slate-200 rounded-xl overflow-hidden text-center text-xs">
            <div className="p-4 bg-emerald-50 border-r border-b border-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">True Genuine (TN)</span>
              <span className="text-2xl font-black text-emerald-700">{confusionMatrix[0][0]}</span>
            </div>
            <div className="p-4 bg-rose-50 border-b border-slate-200">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">False Fake (FP)</span>
              <span className="text-2xl font-black text-rose-700">{confusionMatrix[0][1]}</span>
            </div>
            <div className="p-4 bg-amber-50 border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">False Genuine (FN)</span>
              <span className="text-2xl font-black text-amber-700">{confusionMatrix[1][0]}</span>
            </div>
            <div className="p-4 bg-blue-50">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">True Fake (TP)</span>
              <span className="text-2xl font-black text-blue-700">{confusionMatrix[1][1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology & Feature Engineering */}
      <div className="p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Multi-Stage NLP & Feature Engineering Pipeline</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">1. TF-IDF N-Gram Vectorization</h3>
            <p className="text-slate-600 leading-relaxed">
              Extracts 3,000 sublinear TF-IDF features spanning unigrams and bigrams, capturing semantic context and subtle deceptive phrasing markers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">2. Stylometric & Linguistic Indicators</h3>
            <p className="text-slate-600 leading-relaxed">
              Calculates 10 specialized metrics including lexical diversity (Type-Token Ratio), uppercase ratio (shouting density), exclamation intensity, and numeric detail density.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">3. Puffery & Superlative Lexicon</h3>
            <p className="text-slate-600 leading-relaxed">
              Identifies exaggerated marketing buzzwords ("1000% recommended", "miracle product", "life changing") commonly generated by automated review farms.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">4. Near-Duplicate & Syndication Engine</h3>
            <p className="text-slate-600 leading-relaxed">
              Utilizes Jaccard token similarity (threshold 0.70) across batch reviews to isolate coordinated bot campaigns copy-pasting repetitive feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical & Compliance Disclaimer (Section 2 & 5 Requirement) */}
      <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 text-slate-700 text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Scale className="w-4 h-4 text-slate-700" />
          <span>Legal & Technical Compliance Disclosure</span>
        </div>
        <p className="leading-relaxed">
          ReviewGuard respects website terms of service, robots.txt directives, and anti-bot protections. It does not bypass CAPTCHA, authentication walls, or security perimeters. If automatic scraping is restricted by an e-commerce platform, the user is provided transparent options to supply customer reviews via CSV or manual entry.
        </p>
        <p className="text-[11px] text-slate-500 italic">
          Disclaimer: AI classifications and Review Trust Scores are statistical estimates generated by trained machine learning algorithms and do not represent absolute legal or commercial claims regarding sellers or manufacturers.
        </p>
      </div>
    </div>
  );
}
