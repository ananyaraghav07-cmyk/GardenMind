import React, { useState } from 'react';
import { Sprout, Trash2, Heart, ShieldAlert, BookOpen, Plus, Calendar, AlertTriangle, Check } from 'lucide-react';
import type { Plant, HealthLogEntry } from '../types/garden';
import { PlantScanner } from './PlantScanner';

interface GardenDashboardProps {
  plants: Plant[];
  onAddPlant: (plant: any) => void;
  onDeletePlant: (id: string) => void;
  onUpdatePlantLogs: (plantId: string, log: HealthLogEntry) => void;
  demoMode: boolean;
  apiKeySet: boolean;
  anthropicApiKey: string;
  proxyUrl?: string;
}

export const GardenDashboard: React.FC<GardenDashboardProps> = ({
  plants,
  onAddPlant,
  onDeletePlant,
  onUpdatePlantLogs,
  demoMode,
  apiKeySet,
  anthropicApiKey,
  proxyUrl,
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [activeJournalPlant, setActiveJournalPlant] = useState<Plant | null>(null);

  // Journal form states
  const [journalScore, setJournalScore] = useState<number>(8);
  const [journalNote, setJournalNote] = useState('');
  const [journalPest, setJournalPest] = useState('');
  const [journalDisease, setJournalDisease] = useState('');

  const calculateAverageHealth = () => {
    if (plants.length === 0) return 0;
    const total = plants.reduce((sum, p) => sum + p.healthScore, 0);
    return Math.round((total / plants.length) * 10) / 10;
  };

  const getIssuesCount = () => {
    return plants.reduce((sum, p) => sum + p.pests.length + p.diseases.length, 0);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 5) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const handleAddJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJournalPlant) return;

    const newLog: HealthLogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      healthScore: journalScore,
      note: journalNote,
      pests: journalPest.trim() ? journalPest.split(',').map((p) => p.trim()) : [],
      diseases: journalDisease.trim() ? journalDisease.split(',').map((d) => d.trim()) : [],
    };

    onUpdatePlantLogs(activeJournalPlant.id, newLog);

    const updatedPlant = plants.find((p) => p.id === activeJournalPlant.id);
    if (updatedPlant) {
      setActiveJournalPlant({
        ...updatedPlant,
        healthScore: newLog.healthScore,
        pests: newLog.pests,
        diseases: newLog.diseases,
        healthLog: [newLog, ...updatedPlant.healthLog],
      });
    }

    setJournalScore(8);
    setJournalNote('');
    setJournalPest('');
    setJournalDisease('');
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4">
          <div className="bg-forest-600/20 text-emerald-400 p-3 rounded-xl border border-forest-500/20">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Plants</span>
            <span className="text-xl font-black text-slate-100">{plants.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4">
          <div className="bg-emerald-600/20 text-emerald-400 p-3 rounded-xl border border-emerald-500/20">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Average Health</span>
            <span className="text-xl font-black text-slate-100">
              {plants.length > 0 ? `${calculateAverageHealth()}/10` : '—'}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4">
          <div className="bg-rose-600/20 text-rose-400 p-3 rounded-xl border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Issues</span>
            <span className="text-xl font-black text-slate-100">{getIssuesCount()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Sprout className="w-5.5 h-5.5 text-forest-400" />
          <span>My Garden Beds</span>
        </h3>
        <button
          id="toggle-scanner-btn"
          onClick={() => setShowScanner(!showScanner)}
          className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 shadow-lg border border-forest-500/30"
        >
          {showScanner ? (
            <span>Close Scanner</span>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Identify New Plant</span>
            </>
          )}
        </button>
      </div>

      {showScanner && (
        <div className="border border-forest-500/20 rounded-2xl p-4 bg-slate-950/40 animate-fade-in-up">
          <PlantScanner
            demoMode={demoMode}
            apiKeySet={apiKeySet}
            anthropicApiKey={anthropicApiKey}
            proxyUrl={proxyUrl}
            onPlantIdentified={(data) => {
              onAddPlant(data);
              setShowScanner(false);
            }}
          />
        </div>
      )}

      {plants.length === 0 ? (
        <div className="glass-panel py-20 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-800">
          <div className="p-4 bg-slate-900 rounded-full text-slate-500 border border-slate-800">
            <Sprout className="w-10 h-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-300">Your garden is empty</h4>
            <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
              Identify a plant photo using the Claude AI scanner at the top to add your first plant and begin tracking health diaries!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <div
              key={plant.id}
              id={`plant-card-${plant.id}`}
              className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-800/80 hover:border-forest-500/30 transition-all duration-300 group shadow-md"
            >
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={plant.photo}
                  alt={plant.commonName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div className="min-w-0">
                    <span className="font-black text-base text-slate-100 block truncate drop-shadow-md">
                      {plant.name}
                    </span>
                    <span className="text-[10px] text-slate-400 italic block truncate drop-shadow-md font-medium">
                      {plant.species}
                    </span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getScoreBadgeColor(plant.healthScore)}`}>
                    Score: {plant.healthScore}
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Vigor Index</span>
                    <span>{plant.healthScore * 10}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
                      style={{ width: `${plant.healthScore * 10}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[...plant.pests, ...plant.diseases].length > 0 ? (
                    [...plant.pests, ...plant.diseases].map((issue, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[9px] font-extrabold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                        {issue}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">
                      <Check className="w-2.5 h-2.5 mr-1" />
                      Perfect Health
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-slate-900/60 bg-slate-950/20 grid grid-cols-2 gap-2">
                <button
                  id={`btn-journal-${plant.id}`}
                  onClick={() => setActiveJournalPlant(plant)}
                  className="py-2 rounded-xl bg-slate-900 hover:bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5 text-forest-400" />
                  <span>Health Diary</span>
                </button>
                
                <button
                  id={`btn-delete-${plant.id}`}
                  onClick={() => onDeletePlant(plant.id)}
                  className="py-2 rounded-xl bg-slate-950 hover:bg-rose-950/30 border border-slate-900 hover:border-rose-900/40 text-slate-500 hover:text-rose-400 text-[11px] font-bold transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeJournalPlant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-fade-in-up flex flex-col md:flex-row max-h-[85vh]">
            
            <div className="p-6 md:w-1/2 border-r border-slate-900 flex flex-col justify-between space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="text-lg font-black text-slate-100 truncate">
                  {activeJournalPlant.name}
                </h3>
                <span className="text-xs italic text-forest-400 font-semibold block">
                  {activeJournalPlant.species}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Added: {new Date(activeJournalPlant.addedDate).toLocaleDateString()}
                </p>
              </div>

              <form onSubmit={handleAddJournalEntry} className="space-y-3 pt-2">
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
                  Log New Diary Entry
                </span>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Health Rating</span>
                    <span className="text-emerald-400">{journalScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={journalScore}
                    onChange={(e) => setJournalScore(Number(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-forest-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="journal-pests" className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                      Pests
                    </label>
                    <input
                      id="journal-pests"
                      type="text"
                      value={journalPest}
                      onChange={(e) => setJournalPest(e.target.value)}
                      placeholder="e.g. Aphids, none"
                      className="w-full px-2 py-1.5 text-[11px] bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="journal-diseases" className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                      Diseases
                    </label>
                    <input
                      id="journal-diseases"
                      type="text"
                      value={journalDisease}
                      onChange={(e) => setJournalDisease(e.target.value)}
                      placeholder="e.g. Mold, none"
                      className="w-full px-2 py-1.5 text-[11px] bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="journal-notes" className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                    Observation Diary
                  </label>
                  <textarea
                    id="journal-notes"
                    required
                    rows={3}
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                    placeholder="Describe how the foliage looks, soil moisture, light levels..."
                    className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-forest-500"
                  />
                </div>

                <button
                  id="submit-journal-entry-btn"
                  type="submit"
                  className="w-full py-2.5 bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold rounded-xl transition-all duration-300"
                >
                  Save Entry
                </button>
              </form>
            </div>

            <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-hidden bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-forest-400" />
                  <span>Observations Log</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">
                  {activeJournalPlant.healthLog?.length || 0} Entries
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {!activeJournalPlant.healthLog || activeJournalPlant.healthLog.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    No diary entries logged yet.
                  </div>
                ) : (
                  activeJournalPlant.healthLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-forest-400 font-semibold">{log.date}</span>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Score: {log.healthScore}/10
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{log.note}</p>
                      
                      {[...log.pests, ...log.diseases].length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-900/60">
                          {[...log.pests, ...log.diseases].map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                id="close-journal-modal-btn"
                onClick={() => setActiveJournalPlant(null)}
                className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-900/60 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Close Journal
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
