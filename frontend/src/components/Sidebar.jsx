import React from 'react';
import {
  Link as LinkIcon,
  LayoutDashboard,
  CheckSquare,
  History,
  BookOpen
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, hasAnalysis = false }) {
  const mainNavItems = [
    { id: 'home', label: 'Scan Product', icon: LinkIcon, description: 'Paste product link' },
    { id: 'dashboard', label: 'Analysis Dashboard', icon: LayoutDashboard, requiresData: true, description: 'Trust score & metrics' },
    { id: 'reviews', label: 'All Reviews', icon: CheckSquare, requiresData: true, description: 'Verified buyer reviews' },
    { id: 'history', label: 'Saved History', icon: History, description: 'Past analyzed products' },
    { id: 'about', label: 'How It Works', icon: BookOpen, description: 'Veracity methodology' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col p-3.5 shrink-0 min-h-[calc(100vh-65px)]">
      <div className="space-y-5">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = item.requiresData && !hasAnalysis;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {isLocked && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" title="Awaiting product link scan" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
