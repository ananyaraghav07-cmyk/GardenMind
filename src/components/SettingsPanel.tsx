import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Calendar, Key, Search, CheckCircle, HelpCircle } from 'lucide-react';
import type { Location, FrostDates, AppSettings } from '../types/garden';
import { searchCity, type GeocodeResult } from '../services/weather';

interface SettingsPanelProps {
  location: Location;
  setLocation: (loc: Location) => void;
  frostDates: FrostDates;
  setFrostDates: (fd: FrostDates) => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  proxyUrl?: string;
  setProxyUrl: (url: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  location,
  setLocation,
  frostDates,
  setFrostDates,
  settings,
  setSettings,
  proxyUrl,
  setProxyUrl,
}) => {
  const [cityInput, setCityInput] = useState(location.city);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Search autocomplete on input change
  useEffect(() => {
    if (!cityInput || cityInput.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchCity(cityInput);
      setSearchResults(results);
      setIsSearching(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [cityInput]);

  const selectSearchResult = (item: GeocodeResult) => {
    setLocation({
      city: `${item.name}, ${item.admin1 ? item.admin1 + ', ' : ''}${item.country}`,
      lat: item.latitude,
      lng: item.longitude,
      timezone: item.timezone
    });
    setCityInput(`${item.name}, ${item.admin1 ? item.admin1 + ', ' : ''}${item.country}`);
    setSearchResults([]);

    // Estimate frost dates based on latitude (Rough climate heuristics)
    // Positive latitude means Northern Hemisphere, negative means Southern
    const isNorthern = item.latitude >= 0;
    const absLat = Math.abs(item.latitude);

    let lastSpring = 'Apr 10';
    let firstFall = 'Oct 15';

    if (absLat < 20) {
      // Tropical: No frost
      lastSpring = 'None';
      firstFall = 'None';
    } else if (absLat >= 20 && absLat < 35) {
      // Warm Subtropical
      lastSpring = isNorthern ? 'Feb 20' : 'Aug 20';
      firstFall = isNorthern ? 'Dec 10' : 'Jun 10';
    } else if (absLat >= 35 && absLat < 45) {
      // Temperate
      lastSpring = isNorthern ? 'Apr 15' : 'Oct 15';
      firstFall = isNorthern ? 'Oct 20' : 'Apr 20';
    } else {
      // Cold/Subarctic
      lastSpring = isNorthern ? 'May 20' : 'Nov 20';
      firstFall = isNorthern ? 'Sep 15' : 'Mar 15';
    }

    setFrostDates({ lastSpring, firstFall });
  };

  const handleSaveSettings = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold flex items-center space-x-2 text-slate-100">
            <Settings className="w-5.5 h-5.5 text-forest-400" />
            <span>Application Settings</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Configure your local environment, frost dates, and Anthropic API credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location & Frost Dates Configuration */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-900 pb-2.5">
            <MapPin className="w-4 h-4 text-forest-400" />
            <span>Garden Location</span>
          </h3>

          {/* City search input */}
          <div className="space-y-1 relative">
            <label htmlFor="city-search" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              City Name / Region
            </label>
            <div className="relative">
              <input
                id="city-search"
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-forest-500"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <span className="w-4 h-4 border-2 border-forest-500 border-t-transparent rounded-full animate-spin block" />
                </div>
              )}
            </div>

            {/* Auto-complete suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800/60 max-h-48 overflow-y-auto custom-scrollbar">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    id={`search-suggest-${idx}`}
                    onClick={() => selectSearchResult(item)}
                    className="w-full px-4 py-2.5 text-xs text-left text-slate-300 hover:bg-slate-950 hover:text-slate-100 transition-colors flex flex-col"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[9px] text-slate-500">
                      {item.admin1 ? item.admin1 + ', ' : ''}{item.country} • Lat: {item.latitude.toFixed(2)}, Lng: {item.longitude.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates display */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-[10px] text-slate-400">
            <div>
              <span className="block text-slate-500">Latitude</span>
              <span className="font-bold text-slate-300">{location.lat.toFixed(4)}</span>
            </div>
            <div>
              <span className="block text-slate-500">Longitude</span>
              <span className="font-bold text-slate-300">{location.lng.toFixed(4)}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-500">Timezone</span>
              <span className="font-bold text-slate-300 truncate block">{location.timezone}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-900 pb-2.5 pt-2">
            <Calendar className="w-4 h-4 text-forest-400" />
            <span>Average Frost Dates</span>
          </h3>

          {/* Frost Dates Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="last-spring-frost" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Last Spring Frost
              </label>
              <input
                id="last-spring-frost"
                type="text"
                value={frostDates.lastSpring}
                onChange={(e) => setFrostDates({ ...frostDates, lastSpring: e.target.value })}
                placeholder="e.g. Apr 10"
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="first-fall-frost" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                First Fall Frost
              </label>
              <input
                id="first-fall-frost"
                type="text"
                value={frostDates.firstFall}
                onChange={(e) => setFrostDates({ ...frostDates, firstFall: e.target.value })}
                placeholder="e.g. Oct 15"
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
              />
            </div>
          </div>
        </div>

        {/* API Credentials & Demo Mode Configuration */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-900 pb-2.5">
              <Key className="w-4 h-4 text-forest-400" />
              <span>Anthropic API Integration</span>
            </h3>

            {/* Demo Mode Toggle */}
            <div className="p-3 bg-forest-950/20 border border-forest-500/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Demo Mode (Simulation)</span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Simulate Claude Vision and Text outputs without paying for tokens.
                </span>
              </div>
              <button
                id="demo-mode-toggle"
                onClick={() => setSettings({ ...settings, demoMode: !settings.demoMode })}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 relative flex items-center ${
                  settings.demoMode ? 'bg-forest-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform duration-300 ${
                    settings.demoMode ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* API Key Input */}
            <div className="space-y-1">
              <label htmlFor="anthropic-api-key" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex justify-between">
                <span>Anthropic API Key</span>
                <span className="text-[9px] text-slate-500 font-semibold lowercase">(Stored locally)</span>
              </label>
              <input
                id="anthropic-api-key"
                type="password"
                value={settings.anthropicApiKey}
                disabled={settings.demoMode}
                onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                placeholder={settings.demoMode ? "Inactive in Demo Mode" : "sk-ant-..."}
                className={`w-full px-3 py-2.5 text-xs border rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-forest-500 ${
                  settings.demoMode ? 'bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed' : 'bg-slate-950/80 border-slate-800'
                }`}
              />
            </div>

            {/* CORS / Proxy Override Input */}
            <div className="space-y-1">
              <label htmlFor="proxy-url" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center space-x-1">
                <span>CORS Proxy URL (Optional)</span>
                <span title="Bypasses standard browser CORS policy for direct Anthropic API calls.">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                </span>
              </label>
              <input
                id="proxy-url"
                type="text"
                value={proxyUrl || ''}
                disabled={settings.demoMode}
                onChange={(e) => setProxyUrl(e.target.value)}
                placeholder="e.g. https://my-cors-proxy.com/api"
                className={`w-full px-3 py-2 text-xs border rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-forest-500 ${
                  settings.demoMode ? 'bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed' : 'bg-slate-950/80 border-slate-800'
                }`}
              />
              <span className="text-[9px] text-slate-500 block leading-tight">
                Recommended if you encounter browser CORS errors when making real Claude requests.
              </span>
            </div>
          </div>

          <button
            id="save-settings-btn"
            onClick={handleSaveSettings}
            className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center space-x-1.5"
          >
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Floating success toast */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 p-4 bg-emerald-950 border border-emerald-500/30 text-emerald-300 rounded-2xl shadow-2xl flex items-center space-x-2.5 animate-fade-in-up z-50">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <div className="text-xs">
            <span className="font-bold block">Settings Saved!</span>
            All configurations updated in browser cache.
          </div>
        </div>
      )}
    </div>
  );
};
