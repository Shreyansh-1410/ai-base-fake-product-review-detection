import React from 'react';

export default function TrustGauge({
  score = 0,
  max = 100,
  label = "Review Trust Score",
  category = "High Trust",
  size = 170,
  type = "trust"
}) {
  const percentage = Math.min(Math.max(score, 0), max);
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / max;

  let strokeColor = "#16a34a"; // Green (High Trust)
  let badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (percentage < 60) {
    strokeColor = "#dc2626"; // Pure Red for Fake/Low Trust Product
    badgeBg = "bg-red-100 text-red-800 border-red-300 font-bold";
  } else if (percentage < 80) {
    strokeColor = "#d97706"; // Amber (Moderate Trust)
    badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
  }

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-135 origin-center"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s ease-out, stroke 0.4s ease"
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {score.toFixed(1)}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">
            / {max}
          </span>
        </div>
      </div>

      <div className="text-center mt-2">
        <h4 className="text-xs font-semibold text-slate-700">{label}</h4>
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1 border ${badgeBg}`}
        >
          {category}
        </span>
      </div>
    </div>
  );
}
