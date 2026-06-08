import React, { useState, useEffect } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, Umbrella, Sparkles, RefreshCw, Leaf, CheckCircle2 } from 'lucide-react';
import type { Location, Plant, WeatherData } from '../types/garden';
import { fetchCurrentWeather } from '../services/weather';
import { fetchCareRecommendations } from '../services/claude';

interface WeatherPanelProps {
  location: Location;
  plants: Plant[];
  demoMode: boolean;
  anthropicApiKey: string;
  proxyUrl?: string;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  location,
  plants,
  demoMode,
  anthropicApiKey,
  proxyUrl,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [loadingCare, setLoadingCare] = useState(false);
  const [careTips, setCareTips] = useState<string[]>([]);
  const [tipsFetchedFor, setTipsFetchedFor] = useState<string>('');

  // Load weather on mount or location change
  const loadWeather = async () => {
    setLoadingWeather(true);
    try {
      const data = await fetchCurrentWeather(location.lat, location.lng);
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [location]);

  // Set default plant selected if not set
  useEffect(() => {
    if (plants.length > 0 && !selectedPlantId) {
      setSelectedPlantId(plants[0].id);
    }
  }, [plants]);

  const handleFetchCare = async () => {
    if (!weather || !selectedPlantId) return;
    const plant = plants.find(p => p.id === selectedPlantId);
    if (!plant) return;

    setLoadingCare(true);
    try {
      const tips = await fetchCareRecommendations(
        plant,
        weather,
        location,
        { anthropicApiKey, demoMode, proxyUrl }
      );
      setCareTips(tips);
      setTipsFetchedFor(plant.commonName);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to fetch recommendations: ${error.message || 'Error communicating with Claude.'}`);
    } finally {
      setLoadingCare(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Live Conditions */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center space-x-2 text-slate-100">
              <CloudSun className="w-5.5 h-5.5 text-forest-400" />
              <span>Current Climate</span>
            </h3>
            <button
              onClick={loadWeather}
              disabled={loadingWeather}
              className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-2xl font-black text-slate-100 block truncate max-w-full">
              {location.city.split(',')[0]}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">
              Lat: {location.lat.toFixed(2)} • Lng: {location.lng.toFixed(2)}
            </span>
          </div>

          {weather ? (
            <div className="space-y-4">
              {/* Primary Temp Banner */}
              <div className="flex items-center space-x-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
                <div className="p-3 bg-forest-800/20 text-emerald-400 rounded-xl border border-forest-500/20 flex items-center justify-center">
                  <Thermometer className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-100">{weather.temp}°C</span>
                  <span className="text-xs text-slate-400 block font-semibold">{weather.conditionText}</span>
                </div>
              </div>

              {/* Climate Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-center">
                  <Droplets className="w-4.5 h-4.5 mx-auto text-sky-400 mb-1" />
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Humidity</span>
                  <span className="text-xs font-extrabold text-slate-200">{weather.humidity}%</span>
                </div>
                
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-center">
                  <Wind className="w-4.5 h-4.5 mx-auto text-sage-400 mb-1" />
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Wind</span>
                  <span className="text-xs font-extrabold text-slate-200">{weather.windSpeed} km/h</span>
                </div>
                
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-center">
                  <Umbrella className="w-4.5 h-4.5 mx-auto text-indigo-400 mb-1" />
                  <span className="block text-[9px] text-slate-500 font-bold uppercase">Rain Chance</span>
                  <span className="text-xs font-extrabold text-slate-200">{weather.precipitationProbability}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-[10px] text-slate-500">
            Weather details are updated in real-time using public open meteorological metrics.
          </div>
        </div>

        {/* Right Columns: AI Care Recommendations */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between min-h-[350px] space-y-4">
          <div>
            <h3 className="text-lg font-bold flex items-center space-x-2 text-slate-100">
              <Sparkles className="w-5.5 h-5.5 text-forest-400" />
              <span>Environment-Aware Care Advice</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Select one of your plants. Claude will synthesize its health score, species preferences, and current weather indices to craft a custom care list.
            </p>
          </div>

          {plants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
              <Leaf className="w-10 h-10 text-slate-500" />
              <div>
                <h4 className="text-sm font-semibold text-slate-300">No Plants Registered</h4>
                <p className="text-slate-500 text-xs max-w-xs mt-1">
                  Add plants via the scanner on the Dashboard to get custom climate care tips.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Plant selection row */}
              <div className="flex items-end space-x-3">
                <div className="flex-1 space-y-1">
                  <label htmlFor="plant-select" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Select Target Plant
                  </label>
                  <select
                    id="plant-select"
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
                  >
                    {plants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name} ({plant.commonName})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  id="fetch-care-tips-btn"
                  disabled={loadingCare || !weather}
                  onClick={handleFetchCare}
                  className="px-5 py-2.5 bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold rounded-xl transition-all duration-300 flex items-center space-x-2 border border-forest-500/30"
                >
                  {loadingCare ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  )}
                  <span>{loadingCare ? 'Synthesizing...' : 'Generate Tips'}</span>
                </button>
              </div>

              {/* Tips list */}
              {loadingCare ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
                  <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Claude is studying climate reports...</span>
                </div>
              ) : careTips.length > 0 ? (
                <div className="space-y-3 mt-2 animate-fade-in-up">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Weekly Care Tasks for {tipsFetchedFor}:
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {careTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-start space-x-3 text-xs text-slate-300 hover:border-forest-500/20 transition-colors duration-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                  <span>Click "Generate Tips" to load AI care actions for the selected plant.</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
