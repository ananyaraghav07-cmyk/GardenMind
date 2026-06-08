import React from 'react';
import { Sprout, CloudSun, Calendar, Grid3X3, Settings, AlertCircle, Leaf } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  demoMode: boolean;
  apiKeySet: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  demoMode,
  apiKeySet,
}) => {
  const navItems = [
    { id: 'garden', label: 'My Garden', icon: Sprout },
    { id: 'weather', label: 'Climate & Care', icon: CloudSun },
    { id: 'calendar', label: 'Planting Calendar', icon: Calendar },
    { id: 'companion', label: 'Companion Grid', icon: Grid3X3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 glass-panel md:h-screen md:sticky md:top-0 flex flex-col z-20 border-r border-slate-800">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-forest-600/30 p-2.5 rounded-xl border border-forest-500/30 flex items-center justify-center text-forest-400">
          <Leaf className="w-6 h-6 animate-float" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-forest-400 to-moss-400 bg-clip-text text-transparent">
            GardenMind
          </span>
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            AI Plant Companion
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive
                  ? 'bg-forest-700/40 text-emerald-300 border border-forest-500/30 glow-green'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 hover:border-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
                <span>{item.label}</span>
              </div>
              
              {/* Special badges */}
              {item.id === 'settings' && !apiKeySet && !demoMode && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="API Key Required" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
        {demoMode ? (
          <div className="flex items-center space-x-2 text-[11px] bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Demo Simulator Active</span>
          </div>
        ) : apiKeySet ? (
          <div className="flex items-center space-x-2 text-[11px] bg-forest-950/40 border border-forest-500/20 text-forest-400 px-3 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-forest-400" />
            <span>Claude API Connected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-[11px] bg-amber-950/40 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Setup API Key in Settings</span>
          </div>
        )}
        <div className="text-[10px] text-slate-500 text-center">
          v1.0.0 • Local-First Storage
        </div>
      </div>
    </aside>
  );
};
