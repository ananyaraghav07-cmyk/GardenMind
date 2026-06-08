import React, { useState } from 'react';
import { Grid3X3, Sparkles, RefreshCw, Layers, ShieldCheck, HeartPulse } from 'lucide-react';
import { fetchCompanionPlantingAdvice } from '../services/claude';

interface GardenGridProps {
  myGardenPlants: string[];
  demoMode: boolean;
  anthropicApiKey: string;
  proxyUrl?: string;
}

export const GardenGrid: React.FC<GardenGridProps> = ({
  myGardenPlants,
  demoMode,
  anthropicApiKey,
  proxyUrl,
}) => {
  const [selectedPlants, setSelectedPlants] = useState<string[]>(
    myGardenPlants.length > 0 ? [myGardenPlants[0]] : ['Tomato']
  );
  const [isLoading, setIsLoading] = useState(false);
  const [layoutResult, setLayoutResult] = useState<any | null>(null);
  const [activeCell, setActiveCell] = useState<any | null>(null);

  const availableCrops = [
    'Tomato', 'Basil', 'Monstera', 'Rose', 'Succulent',
    'Pepper', 'Carrot', 'Garlic', 'Marigold', 'Onion', 'Lettuce'
  ];

  const togglePlantSelection = (plantName: string) => {
    if (selectedPlants.includes(plantName)) {
      if (selectedPlants.length > 1) {
        setSelectedPlants(selectedPlants.filter(p => p !== plantName));
      }
    } else {
      setSelectedPlants([...selectedPlants, plantName]);
    }
  };

  const handleGenerateLayout = async () => {
    setIsLoading(true);
    try {
      const result = await fetchCompanionPlantingAdvice(
        selectedPlants,
        { anthropicApiKey, demoMode, proxyUrl }
      );
      setLayoutResult(result);
      setActiveCell(null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to generate companion layout: ${error.message || 'Error communicating with Claude.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLayoutGrid = () => {
    if (!layoutResult || !layoutResult.suggestedLayout) return null;
    
    const { gridWidth, gridHeight, layoutGrid } = layoutResult.suggestedLayout;
    
    const cells = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));
    
    layoutGrid.forEach((item: any) => {
      if (item.y < gridHeight && item.x < gridWidth) {
        cells[item.y][item.x] = item;
      }
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
            Interactive Plot Layout
          </span>
          <span className="text-[9px] text-slate-500 italic">
            *Click cell to inspect plant details
          </span>
        </div>
        <div 
          className="grid gap-3 p-4 bg-slate-950/60 border border-slate-900 rounded-2xl glow-green relative"
          style={{ gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))` }}
        >
          {cells.map((row, y) => 
            row.map((cell, x) => {
              if (cell) {
                const isSelected = activeCell?.x === x && activeCell?.y === y;
                return (
                  <button
                    key={`${x}-${y}`}
                    id={`grid-cell-${x}-${y}`}
                    onClick={() => setActiveCell(isSelected ? null : cell)}
                    className="aspect-square rounded-xl p-3 flex flex-col justify-between items-center text-center transition-all duration-300 border relative group hover:scale-[1.03]"
                    style={{
                      backgroundColor: `${cell.color}15`,
                      borderColor: isSelected ? '#34d399' : `${cell.color}40`,
                      boxShadow: isSelected ? `0 0 15px ${cell.color}40` : 'none',
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70" style={{ color: cell.color }}>
                      {cell.role}
                    </span>
                    <div className="my-auto">
                      <span className="font-extrabold text-xs text-slate-200 block truncate max-w-full">
                        {cell.plantName}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspect
                    </span>
                  </button>
                );
              } else {
                return (
                  <div
                    key={`${x}-${y}`}
                    className="aspect-square rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-600 bg-slate-950/20"
                  >
                    Empty Space
                  </div>
                );
              }
            })
          )}
        </div>

        {activeCell && (
          <div className="p-4 bg-slate-900 border border-forest-500/20 rounded-xl space-y-2 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">{activeCell.plantName}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${activeCell.color}25`, color: activeCell.color }}>
                {activeCell.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Placing <strong className="text-slate-100">{activeCell.plantName}</strong> at coordinates (X: {activeCell.x}, Y: {activeCell.y}) optimizes spacing, protects nearby roots from pests, and ensures appropriate nutrient allocation relative to neighboring plants.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 lg:col-span-1">
          <div>
            <h3 className="text-lg font-bold flex items-center space-x-2 text-slate-100">
              <Layers className="w-5 h-5 text-forest-400" />
              <span>1. Choose Plants</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Select one or more crops you want to grow together. Claude will calculate the ideal companion guild layout.
            </p>
          </div>

          <div className="flex-1 max-h-60 overflow-y-auto custom-scrollbar pr-1 py-1 grid grid-cols-2 gap-2">
            {availableCrops.map((crop) => {
              const isSelected = selectedPlants.includes(crop);
              return (
                <button
                  key={crop}
                  id={`crop-select-${crop}`}
                  onClick={() => togglePlantSelection(crop)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all duration-300 ${
                    isSelected
                      ? 'bg-forest-800/40 border-forest-500 text-emerald-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {crop}
                </button>
              );
            })}
          </div>

          <button
            id="companion-generate-btn"
            disabled={isLoading || selectedPlants.length === 0}
            onClick={handleGenerateLayout}
            className={`w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border glow-green-hover ${
              isLoading
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-forest-600 border-emerald-500/30 text-white shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-300" />
            )}
            <span>{isLoading ? 'Designing guild...' : 'Design Companion Guild'}</span>
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 min-h-[350px] flex flex-col justify-between">
          {layoutResult ? (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderLayoutGrid()}
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
                    Permaculture Benefits
                  </span>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span>Natural Pest Deterrents</span>
                    </h4>
                    <div className="space-y-1.5">
                      {layoutResult.pestControlList?.map((p: string, idx: number) => (
                        <div key={idx} className="bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 text-[11px] text-slate-300 flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-400" />
                      <span>Productivity & Yield Boosters</span>
                    </h4>
                    <div className="space-y-1.5">
                      {layoutResult.productivityList?.map((pr: string, idx: number) => (
                        <div key={idx} className="bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 text-[11px] text-slate-300 flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span>{pr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-emerald-400 block mb-1">Guild Design Summary:</span>
                <p>{layoutResult.companionRecommendations}</p>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
              <Grid3X3 className="w-10 h-10 text-slate-500 animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold text-slate-300">
                  Awaiting Layout Design
                </h4>
                <p className="text-slate-500 text-xs max-w-sm mt-1 leading-relaxed">
                  Choose the crops you are growing or planning to grow on the left, then click "Design Companion Guild" to construct your companion layout.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
