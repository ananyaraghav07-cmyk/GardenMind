import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Layers, ShieldCheck, HeartPulse, Trash2 } from 'lucide-react';
import { fetchCompanionPlantingAdvice } from '../services/claude';

interface GardenGridProps {
  myGardenPlants: string[];
  demoMode: boolean;
  anthropicApiKey: string;
  proxyUrl?: string;
}

interface GridCell {
  x: number;
  y: number;
  plantName: string;
  role: string;
  color: string;
}

// Plant styling helper mapping names to colors and custom SVG icons/shapes
const CROP_METADATA: Record<string, { color: string; emoji: string; category: string; companions: string[]; antagonists: string[] }> = {
  tomato: {
    color: '#ef4444', // red
    emoji: '🍅',
    category: 'Nightshade',
    companions: ['basil', 'marigold', 'garlic', 'onion', 'carrot', 'chives'],
    antagonists: ['potato', 'fennel', 'cabbage', 'broccoli']
  },
  basil: {
    color: '#10b981', // emerald
    emoji: '🌿',
    category: 'Herb',
    companions: ['tomato', 'pepper', 'oregano'],
    antagonists: ['sage', 'fennel']
  },
  monstera: {
    color: '#047857', // dark emerald
    emoji: '🪴',
    category: 'Houseplant',
    companions: ['pothos', 'fern', 'snake plant'],
    antagonists: ['cactus']
  },
  rose: {
    color: '#f43f5e', // rose
    emoji: '🌹',
    category: 'Flower',
    companions: ['garlic', 'chives', 'lavender', 'marigold'],
    antagonists: ['fennel']
  },
  succulent: {
    color: '#65a30d', // lime
    emoji: '🌵',
    category: 'Cactus',
    companions: ['sedum', 'aloe', 'jade plant'],
    antagonists: ['monstera', 'fern']
  },
  pepper: {
    color: '#f97316', // orange
    emoji: '🫑',
    category: 'Nightshade',
    companions: ['basil', 'marigold', 'onion', 'garlic'],
    antagonists: ['fennel']
  },
  carrot: {
    color: '#fb923c', // light orange
    emoji: '🥕',
    category: 'Root',
    companions: ['tomato', 'rosemary', 'chives', 'lettuce'],
    antagonists: ['fennel', 'dill']
  },
  garlic: {
    color: '#cbd5e1', // slate
    emoji: '🧄',
    category: 'Allium',
    companions: ['tomato', 'rose', 'pepper', 'carrot'],
    antagonists: ['beans', 'peas']
  },
  marigold: {
    color: '#eab308', // yellow
    emoji: '🌼',
    category: 'Flower',
    companions: ['tomato', 'pepper', 'rose', 'eggplant'],
    antagonists: []
  },
  onion: {
    color: '#e2e8f0', // zinc
    emoji: '🧅',
    category: 'Allium',
    companions: ['tomato', 'pepper', 'carrot', 'lettuce'],
    antagonists: ['beans', 'peas']
  },
  lettuce: {
    color: '#22c55e', // green
    emoji: '🥬',
    category: 'Leafy',
    companions: ['carrot', 'onion', 'chives', 'radish'],
    antagonists: []
  }
};

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
  const [layoutAdvice, setLayoutAdvice] = useState<string>('');
  const [pestList, setPestList] = useState<string[]>([]);
  const [prodList, setProdList] = useState<string[]>([]);
  
  // Grid layout state (3x3 grid)
  const gridWidth = 3;
  const gridHeight = 3;
  const [layoutGrid, setLayoutGrid] = useState<GridCell[]>([]);
  
  // Drag and Drop State
  const [draggedCrop, setDraggedCrop] = useState<string | null>(null);
  const [draggedOverCell, setDraggedOverCell] = useState<{ x: number; y: number } | null>(null);
  const [activeCell, setActiveCell] = useState<GridCell | null>(null);

  // Preload a default grid on mount
  useEffect(() => {
    // Generate initial companion layout on load
    const initialGrid: GridCell[] = [
      { x: 1, y: 1, plantName: 'Tomato', role: 'Main Crop', color: '#ef4444' },
      { x: 0, y: 1, plantName: 'Marigold', role: 'Companion (Pests)', color: '#eab308' },
      { x: 2, y: 1, plantName: 'Basil', role: 'Companion (Vigor)', color: '#10b981' }
    ];
    setLayoutGrid(initialGrid);
    setLayoutAdvice("To get started, dragging **Basil** and **Marigold** next to **Tomato** protects roots from nematodes and improves overall fruit yield. Try dragging other crops to manually plan, or hit the AI Designer to construct a comprehensive permaculture guild!");
    setPestList(['Marigold (repels nematodes)', 'Basil (mosquitoes/flies)']);
    setProdList(['Basil (improves flavor/growth)', 'Tomato (protects basil understory)']);
  }, []);

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
      setLayoutAdvice(result.companionRecommendations);
      setPestList(result.pestControlList || []);
      setProdList(result.productivityList || []);
      if (result.suggestedLayout && result.suggestedLayout.layoutGrid) {
        setLayoutGrid(result.suggestedLayout.layoutGrid);
      }
      setActiveCell(null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to generate companion layout: ${error.message || 'Error communicating with Claude.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (cropName: string) => {
    setDraggedCrop(cropName);
  };

  const handleDragEnd = () => {
    setDraggedCrop(null);
    setDraggedOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (draggedOverCell?.x !== x || draggedOverCell?.y !== y) {
      setDraggedOverCell({ x, y });
    }
  };

  const handleDrop = (x: number, y: number) => {
    if (!draggedCrop) return;

    const normalizedDraggedName = draggedCrop.toLowerCase();
    const meta = CROP_METADATA[normalizedDraggedName] || { color: '#10b981', emoji: '🌱' };

    // Determine the role based on adjacent plants
    let role = 'Guild Crop';
    const adjacentCells = getAdjacentPlants(x, y);
    if (adjacentCells.length > 0) {
      const isCompanion = adjacentCells.some(adj => 
        meta.companions?.includes(adj.plantName.toLowerCase())
      );
      const isAntagonist = adjacentCells.some(adj => 
        meta.antagonists?.includes(adj.plantName.toLowerCase())
      );
      if (isAntagonist) {
        role = 'Antagonist (Warning)';
      } else if (isCompanion) {
        role = 'Companion (Good)';
      }
    }

    const newCell: GridCell = {
      x,
      y,
      plantName: draggedCrop,
      role,
      color: meta.color
    };

    // Replace cell if occupied
    const filteredGrid = layoutGrid.filter(cell => !(cell.x === x && cell.y === y));
    setLayoutGrid([...filteredGrid, newCell]);
    setDraggedOverCell(null);
    setActiveCell(newCell);
  };

  const handleRemoveCell = (x: number, y: number) => {
    setLayoutGrid(layoutGrid.filter(cell => !(cell.x === x && cell.y === y)));
    setActiveCell(null);
  };

  // Helper to fetch adjacent cells for compatibility checks
  const getAdjacentPlants = (x: number, y: number): GridCell[] => {
    const adjPositions = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ];
    return layoutGrid.filter(cell => 
      adjPositions.some(pos => pos.x === cell.x && pos.y === cell.y)
    );
  };

  // Evaluates drag hover compatibility status for glow color
  const getCompatibilityGlowClass = (x: number, y: number): string => {
    if (!draggedOverCell || draggedOverCell.x !== x || draggedOverCell.y !== y || !draggedCrop) return 'border-slate-800/80 hover:border-forest-500/20';

    const normalizedDragged = draggedCrop.toLowerCase();
    const draggedMeta = CROP_METADATA[normalizedDragged];
    if (!draggedMeta) return 'border-indigo-500/60 bg-indigo-500/5 scale-102 shadow-[0_0_12px_rgba(99,102,241,0.25)]';

    const adj = getAdjacentPlants(x, y);
    if (adj.length === 0) return 'border-forest-400 bg-forest-500/5 scale-102 shadow-[0_0_12px_rgba(16,185,129,0.25)]';

    // Check companion and antagonists compatibility
    const hasAntagonist = adj.some(a => draggedMeta.antagonists?.includes(a.plantName.toLowerCase()));
    const hasCompanion = adj.some(a => draggedMeta.companions?.includes(a.plantName.toLowerCase()));

    if (hasAntagonist) {
      return 'border-rose-500 bg-rose-500/10 scale-102 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse';
    }
    if (hasCompanion) {
      return 'border-emerald-400 bg-emerald-500/10 scale-102 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse';
    }

    return 'border-amber-400 bg-amber-500/5 scale-102 shadow-[0_0_12px_rgba(234,179,8,0.25)]';
  };

  const getCropEmoji = (name: string): string => {
    return CROP_METADATA[name.toLowerCase()]?.emoji || '🌱';
  };

  const renderVisualSoilGrid = () => {
    // 2D Array matrix initialization
    const cells = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));
    layoutGrid.forEach((item) => {
      if (item.y < gridHeight && item.x < gridWidth) {
        cells[item.y][item.x] = item;
      }
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
            Plot Bed: 3x3 Loam Soil Grid
          </span>
          <span className="text-[9px] text-slate-500 italic block">
            *Drag plants here or click to remove
          </span>
        </div>

        {/* Outer Wooden Planter Box border framing */}
        <div className="p-3 bg-[#3f2415] rounded-3xl border-4 border-[#24130a] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:40px_40px] opacity-10 pointer-events-none" />
          
          <div className="grid grid-cols-3 gap-2.5 relative z-10">
            {cells.map((row, y) => 
              row.map((cell, x) => {
                const isOver = draggedOverCell?.x === x && draggedOverCell?.y === y;
                if (cell) {
                  const isActive = activeCell?.x === x && activeCell?.y === y;
                  return (
                    <button
                      key={`${x}-${y}`}
                      id={`grid-cell-${x}-${y}`}
                      onClick={() => setActiveCell(isActive ? null : cell)}
                      onDragOver={(e) => handleDragOver(e, x, y)}
                      onDrop={() => handleDrop(x, y)}
                      className={`aspect-square rounded-2xl flex flex-col justify-between items-center text-center p-3.5 border transition-all duration-300 relative overflow-hidden select-none hover:scale-[1.03] ${
                        isActive
                          ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                          : 'border-slate-800'
                      }`}
                      style={{
                        background: 'radial-gradient(circle, #3d2314 0%, #201007 100%)',
                      }}
                    >
                      {/* Cell Header Badge */}
                      <span className="text-[8px] font-black uppercase tracking-wider block px-1.5 py-0.5 rounded" style={{ backgroundColor: `${cell.color}20`, color: cell.color }}>
                        {cell.role}
                      </span>
                      
                      {/* Center Avatar Plant Sprout */}
                      <div className="my-auto transform transition-transform duration-300 group-hover:scale-110">
                        <span className="text-3.5xl block select-none drop-shadow-lg filter saturate-120 animate-float" style={{ animationDelay: `${(x+y)*0.3}s` }}>
                          {getCropEmoji(cell.plantName)}
                        </span>
                        <span className="font-extrabold text-[11px] text-slate-200 block truncate max-w-full pt-1.5">
                          {cell.plantName}
                        </span>
                      </div>

                      {/* Small Quick-Delete cross button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCell(x, y);
                        }}
                        className="absolute bottom-2 right-2 p-1 bg-black/60 border border-slate-900 rounded-lg opacity-0 hover:opacity-100 group-hover:opacity-60 transition-opacity hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                        title="Remove crop"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  );
                } else {
                  return (
                    <div
                      key={`${x}-${y}`}
                      onDragOver={(e) => handleDragOver(e, x, y)}
                      onDrop={() => handleDrop(x, y)}
                      className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-[10px] text-slate-500 font-semibold transition-all duration-300 select-none ${getCompatibilityGlowClass(
                        x, y
                      )}`}
                      style={{
                        background: isOver 
                          ? 'radial-gradient(circle, #452818 0%, #29150b 100%)' 
                          : 'radial-gradient(circle, #2d180c 0%, #150a04 100%)',
                      }}
                    >
                      <span className="text-xl opacity-40 select-none block mb-1">🕳️</span>
                      <span className="opacity-60">Loam Soil</span>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        {/* Selected cell coordinates metadata */}
        {activeCell && (
          <div className="p-4 bg-slate-900/60 border border-slate-900 rounded-2xl space-y-2.5 animate-fade-in-up flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg select-none">{getCropEmoji(activeCell.plantName)}</span>
                <span className="text-xs font-black text-slate-100">{activeCell.plantName}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${activeCell.color}25`, color: activeCell.color }}>
                  {activeCell.role}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                Planted at cell coordinates **(X: {activeCell.x}, Y: {activeCell.y})**. To optimize yields, inspect companions and ensure soil remains aerated.
              </p>
            </div>
            <button
              onClick={() => handleRemoveCell(activeCell.x, activeCell.y)}
              className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors"
              title="Harvest / Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Select/Drag Crop list */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 lg:col-span-1">
          <div>
            <h3 className="text-lg font-bold flex items-center space-x-2 text-slate-100">
              <Layers className="w-5 h-5 text-forest-400" />
              <span>1. Companion Deck</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Select targets for AI designs, or **DRAG** any plant icon below directly onto the soil plot grid to manually plan your guild.
            </p>
          </div>

          {/* Draggable crops panel */}
          <div className="flex-1 max-h-72 overflow-y-auto custom-scrollbar pr-1 py-1 grid grid-cols-2 gap-2">
            {availableCrops.map((crop) => {
              const isSelected = selectedPlants.includes(crop);
              const meta = CROP_METADATA[crop.toLowerCase()] || { color: '#10b981', emoji: '🌱' };
              
              return (
                <div
                  key={crop}
                  id={`crop-card-${crop}`}
                  draggable="true"
                  onDragStart={() => handleDragStart(crop)}
                  onDragEnd={handleDragEnd}
                  onClick={() => togglePlantSelection(crop)}
                  className={`px-3 py-2.5 rounded-xl border flex items-center justify-between cursor-grab active:cursor-grabbing select-none transition-all duration-300 group hover:scale-[1.02] ${
                    isSelected
                      ? 'bg-forest-800/40 border-forest-500 text-emerald-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-lg select-none filter group-hover:scale-110 transition-transform">{meta.emoji}</span>
                    <span className="text-xs font-bold truncate block">{crop}</span>
                  </div>
                  
                  {/* Selector checkbox */}
                  <span className={`w-2.5 h-2.5 rounded-full border ${
                    isSelected ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'border-slate-700 bg-transparent'
                  }`} />
                </div>
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
            <span>{isLoading ? 'Designing guild...' : 'AI Guild Designer'}</span>
          </button>
        </div>

        {/* Step 2 & 3: Results Display */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 min-h-[350px] flex flex-col justify-between">
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Soil Plot */}
              <div>
                {renderVisualSoilGrid()}
              </div>

              {/* Lists & Reports */}
              <div className="space-y-4">
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
                  Permaculture Guild Benefits
                </span>
                
                {/* Pest Control List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Natural Pest Deterrents</span>
                  </h4>
                  <div className="space-y-1.5">
                    {pestList.map((p, idx) => (
                      <div key={idx} className="bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 text-[11px] text-slate-300 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vigor / Productivity list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    <span>Productivity & Yield Boosters</span>
                  </h4>
                  <div className="space-y-1.5">
                    {prodList.map((pr, idx) => (
                      <div key={idx} className="bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 text-[11px] text-slate-300 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span>{pr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* General Recommendations Text */}
            <div className="p-4 bg-slate-950/40 border border-[#0f291e] rounded-2xl text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-emerald-400 block mb-1">Guild Design Summary:</span>
              <p className="leading-relaxed">{layoutAdvice}</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
