import React from 'react';

export default function GlassCard({ children, className = '', glow = false, hover = false, onClick }) {
  const hoverClass = hover ? 'transition-all duration-150 hover:shadow-md hover:border-slate-300' : '';
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 shadow-sm rounded-xl p-5 ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
