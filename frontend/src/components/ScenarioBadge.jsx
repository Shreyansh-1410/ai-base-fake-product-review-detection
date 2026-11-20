import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ScenarioBadge({ scenarioType = "" }) {
  if (scenarioType.includes("Scenario A")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Scenario A: Genuine Product + Genuine Review
      </span>
    );
  } else if (scenarioType.includes("Scenario B")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Scenario B: Defective/Fake Product + Genuine Review
      </span>
    );
  } else if (scenarioType.includes("Scenario C")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
        <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />
        Scenario C: Genuine Product + Fake Review
      </span>
    );
  } else if (scenarioType.includes("Scenario D")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        Scenario D: Fake Product + Fake Review
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        {scenarioType || "Standard Analysis"}
      </span>
    );
  }
}
