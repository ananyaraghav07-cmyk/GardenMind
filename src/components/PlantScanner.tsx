import React, { useState, useRef } from 'react';
import { Upload, HelpCircle, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, RefreshCw, Leaf } from 'lucide-react';
import { identifyPlantFromPhoto } from '../services/claude';

interface PlantScannerProps {
  demoMode: boolean;
  apiKeySet: boolean;
  anthropicApiKey: string;
  proxyUrl?: string;
  onPlantIdentified: (plantData: { name: string; species: string; commonName: string; photo: string; healthScore: number; pests: string[]; diseases: string[] }) => void;
}

export const PlantScanner: React.FC<PlantScannerProps> = ({
  demoMode,
  apiKeySet,
  anthropicApiKey,
  proxyUrl,
  onPlantIdentified,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [customName, setCustomName] = useState('');
  const [mockChoice, setMockChoice] = useState<'tomato' | 'basil' | 'monstera' | 'rose' | 'succulent'>('tomato');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-compiled mock images for scanning visualization
  const mockImageUrls: Record<string, string> = {
    tomato: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400',
    basil: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&q=80&w=400',
    monstera: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=400',
    rose: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
    succulent: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=400',
  };

  const mockChoices: Array<'tomato' | 'basil' | 'monstera' | 'rose' | 'succulent'> = ['tomato', 'basil', 'monstera', 'rose', 'succulent'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setScanResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectMockImage = (choice: 'tomato' | 'basil' | 'monstera' | 'rose' | 'succulent') => {
    setMockChoice(choice);
    setSelectedImage(mockImageUrls[choice]);
    setScanResult(null);
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    try {
      const result = await identifyPlantFromPhoto(
        selectedImage,
        { anthropicApiKey, demoMode, proxyUrl },
        demoMode ? mockChoice : undefined
      );
      setScanResult(result);
      // Pre-fill custom name with common name
      setCustomName(result.commonName);
    } catch (error: any) {
      console.error(error);
      alert(`Identification failed: ${error.message || 'API Error. Please check settings.'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToGarden = () => {
    if (!scanResult || !selectedImage) return;
    
    onPlantIdentified({
      name: customName.trim() || scanResult.commonName,
      species: scanResult.species,
      commonName: scanResult.commonName,
      photo: selectedImage,
      healthScore: scanResult.healthScore,
      pests: scanResult.pestsFound || [],
      diseases: scanResult.diseasesFound || [],
    });

    // Reset scanner
    setSelectedImage(null);
    setScanResult(null);
    setCustomName('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500 text-emerald-950';
    if (score >= 5) return 'bg-amber-500 text-amber-950';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Upload & Image Box */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold flex items-center space-x-2 text-slate-100">
              <Sparkles className="w-5 h-5 text-forest-400" />
              <span>Plant Scanner</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Upload a picture of your plant to let Claude analyze its health, diagnose pests, and check for diseases.
            </p>
          </div>

          {/* Selector for Mock Plants in Demo Mode */}
          {demoMode && (
            <div className="space-y-2">
              <label className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                Select Simulation Target (Demo Mode)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {mockChoices.map((key) => (
                  <button
                    key={key}
                    id={`demo-select-${key}`}
                    onClick={() => selectMockImage(key)}
                    className={`px-1.5 py-2 rounded-xl text-[10px] font-bold text-center border capitalize transition-all duration-300 ${
                      mockChoice === key && selectedImage === mockImageUrls[key]
                        ? 'bg-forest-800/40 border-forest-500 text-emerald-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo Dropzone / Image Display */}
          <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center group">
            {selectedImage ? (
              <>
                <img
                  src={selectedImage}
                  alt="Scanned Plant"
                  className="w-full h-full object-cover"
                />
                
                {/* Laser scan line effect */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan z-10" />
                )}
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-slate-900/90 border border-emerald-500/30 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs text-emerald-300 font-semibold animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Claude is analyzing...</span>
                    </div>
                  </div>
                )}
                
                {/* Clear / Change photo button */}
                {!isScanning && !scanResult && (
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-3 right-3 bg-slate-900/80 border border-slate-700/50 hover:bg-slate-900 text-slate-300 hover:text-white p-2 rounded-xl transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                id="select-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center p-6 space-y-3 hover:bg-slate-900/20 transition-all duration-300 group"
              >
                <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-colors duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-200">
                    Click to upload photo
                  </p>
                  <p className="text-[10px] text-slate-500">
                    PNG, JPG or JPEG up to 5MB
                  </p>
                </div>
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Action Trigger */}
          {selectedImage && !scanResult && (
            <button
              id="start-scan-btn"
              disabled={isScanning}
              onClick={handleScan}
              className={`w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border glow-green-hover ${
                isScanning
                  ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-forest-600 border-emerald-500/30 text-white shadow-lg shadow-forest-900/20 hover:scale-[1.02]'
              }`}
            >
              <Leaf className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Diagnosing...' : 'Scan with Claude AI'}</span>
            </button>
          )}

          {/* API Setup Reminder if settings are empty */}
          {!apiKeySet && !demoMode && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 text-amber-300 rounded-xl text-[11px] flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <span className="font-semibold block">Anthropic Key Missing</span>
                Provide an API key in Settings, or toggle Demo Mode to explore with simulator data.
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Scan Analysis Report & Action */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
          {scanResult ? (
            <div className="space-y-4 animate-fade-in-up">
              {/* Plant Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-extrabold text-slate-100">
                    {scanResult.commonName}
                  </h4>
                  <span className="text-xs italic text-forest-400 font-medium">
                    {scanResult.species}
                  </span>
                </div>
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getScoreColor(scanResult.healthScore)} flex items-center space-x-1`}>
                  <span>Health:</span>
                  <span className="text-xs font-extrabold">{scanResult.healthScore}/10</span>
                </div>
              </div>

              {/* confidence bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Botanist Confidence</span>
                  <span>{scanResult.confidence}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${scanResult.confidence}%` }}
                  />
                </div>
              </div>

              {/* Diagnosis text */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-emerald-400 block mb-1">Diagnostic Report:</span>
                {scanResult.diagnosisText}
              </div>

              {/* Pests and Diseases alerts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Pests Found</span>
                  {scanResult.pestsFound?.length > 0 ? (
                    <div className="space-y-1">
                      {scanResult.pestsFound.map((p: string, i: number) => (
                        <span key={i} className="inline-flex items-center text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No pests found</span>
                  )}
                </div>

                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Diseases Found</span>
                  {scanResult.diseasesFound?.length > 0 ? (
                    <div className="space-y-1">
                      {scanResult.diseasesFound.map((d: string, i: number) => (
                        <span key={i} className="inline-flex items-center text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No disease markers</span>
                  )}
                </div>
              </div>

              {/* Custom Name & Add to Garden Button */}
              <div className="pt-4 border-t border-slate-900 space-y-3">
                <div>
                  <label htmlFor="custom-plant-name" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1.5">
                    Give this plant a nickname
                  </label>
                  <input
                    id="custom-plant-name"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. My Balcony Tomato"
                    className="w-full px-3 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-forest-500"
                  />
                </div>
                
                <button
                  id="add-plant-to-garden-btn"
                  onClick={handleAddToGarden}
                  className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-500 border border-forest-500/30 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center space-x-1 hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Save to My Garden</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
              <HelpCircle className="w-10 h-10 text-slate-500 animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold text-slate-300">
                  Awaiting Diagnosis
                </h4>
                <p className="text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
                  Select a photo or sample image, then hit "Scan" to generate the diagnostic report.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
