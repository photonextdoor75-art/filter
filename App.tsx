
import React, { useState, useRef } from 'react';
import { applyRetroFilter, FilterType } from './utils/imageProcessing';
import { Spinner } from './components/Spinner';
import { UploadIcon, MagicIcon, DownloadIcon, TrashIcon, AlertIcon, ImageIcon, ShareIcon } from './components/Icons';
import { blobToBase64, base64ToBlob } from './utils/fileUtils';

const FILTERS: { id: FilterType; name: string; desc: string; color: string }[] = [
  { id: '70s-mag', name: '70s Vintage', desc: 'Warm, soft, faded yellow paper', color: 'bg-amber-200 text-amber-900' },
  { id: '80s-pop', name: '80s Glossy', desc: 'Saturated, garish, high contrast', color: 'bg-pink-500 text-white' },
  { id: '90s-washed', name: '90s Editorial', desc: 'Cool, greenish, high flash look', color: 'bg-emerald-800 text-emerald-100' },
  { id: 'polaroid-1', name: 'Polaroid 600', desc: 'Classic warm instant film', color: 'bg-orange-100 text-orange-900' },
  { id: 'polaroid-2', name: 'Polaroid Expired', desc: 'Faded, magenta chemical shift', color: 'bg-pink-100 text-pink-900' },
  { id: 'polaroid-3', name: 'Polaroid SX-70', desc: 'Cool, blue, high contrast', color: 'bg-blue-100 text-blue-900' },
  { id: 'comics-60s', name: 'Comics 60s', desc: 'Halftones, CMYK dots, yellow paper', color: 'bg-blue-400 text-white' },
  { id: 'comics-80s', name: 'Comics 80s', desc: 'Heavy ink, vibrant, graphic novel', color: 'bg-purple-600 text-white' },
  { id: 'vhs-worn', name: 'VHS Worn', desc: 'Magnetic tracking error & static', color: 'bg-indigo-900 text-indigo-100' },
  { id: 'dv-cam', name: 'DV Camcorder', desc: '2000s Interlaced digital video', color: 'bg-teal-800 text-teal-100' },
  { id: 'aged-gazette', name: 'Aged Gazette', desc: 'Classic yellowed newspaper', color: 'bg-amber-100 text-amber-900' },
  { id: 'newspaper-bw', name: 'Daily News', desc: 'Black & white halftone style', color: 'bg-stone-200 text-stone-900' },
  { id: 'mimeograph', name: 'Mimeograph', desc: 'Purple ink handout', color: 'bg-purple-200 text-purple-900' },
  { id: 'bad-photocopy', name: 'Bad Copy', desc: 'Gritty B&W xerox', color: 'bg-stone-800 text-stone-100' },
  { id: 'misaligned', name: 'Misaligned', desc: 'CMYK Print error', color: 'bg-red-200 text-blue-900' },
  { id: 'thermal', name: 'Receipt', desc: 'Faded thermal printer', color: 'bg-gray-300 text-gray-900' },
  { id: 'blueprint', name: 'Blueprint', desc: 'Architectural blue', color: 'bg-blue-900 text-blue-100' },
];

export default function App() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('70s-mag');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await blobToBase64(file);
      setSourceImage(base64);
      setGeneratedImage(null); // Reset previous result
      setError(null);
    } catch (err) {
      setError("Failed to process image file.");
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Use Local Client-Side Filter Engine instead of API
      const resultBase64 = await applyRetroFilter(sourceImage, selectedFilter);
      
      // Artificial delay purely for UX
      await new Promise(r => setTimeout(r, 400)); 
      
      setGeneratedImage(resultBase64);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while processing the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `retro-${selectedFilter}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedImage) return;
    
    try {
      const blob = base64ToBlob(generatedImage);
      const file = new File([blob], `retro-${selectedFilter}.jpg`, { type: 'image/jpeg' });
      
      // Check if navigator.share is available and can share files
      // Note: TypeScript sometimes misses canShare, so we use 'as any' safely here or standard check
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'RetroFlash Photo',
          text: 'Check out this retro photo created with RetroFlash! #vintage #retro',
        });
      } else {
        // If share API is not supported (e.g., Desktop Chrome), show alert
        alert("Direct sharing is only supported on mobile devices (iOS/Android) or compatible browsers. Please download the image instead.");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Ignore AbortError (user cancelled share)
      if ((err as Error).name !== 'AbortError') {
        alert("Could not share the image. Try downloading it instead.");
      }
    }
  };

  const clearAll = () => {
    setSourceImage(null);
    setGeneratedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600 p-2 rounded-lg shadow-lg shadow-amber-900/20">
              <MagicIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-wide text-stone-100">
              Retro<span className="text-amber-500">Flash</span>
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-stone-500 uppercase tracking-widest font-bold">
              Local Engine
            </span>
            <span className="text-[10px] text-green-500/80 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Uncensored
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 sm:p-8 gap-8 max-w-7xl mx-auto w-full">
        
        {/* Info Section */}
        <div className="w-full max-w-3xl text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-100">
            Authentic Magazine Press
          </h2>
          <p className="text-stone-400 text-lg font-light">
            Real color grading from the 70s, 80s, and 90s. <br/>
            <span className="text-amber-500/80">No fake noise. Pure vintage color science.</span>
          </p>
        </div>

        {/* Editor Interface */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Controls & Source */}
          <div className="space-y-6">
            
            {/* Image Upload Area */}
            <div className={`
              relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[400px] bg-stone-900/50
              ${!sourceImage ? 'border-stone-700 hover:border-amber-500/50 hover:bg-stone-900' : 'border-stone-700 p-2'}
            `}>
              {!sourceImage ? (
                <div className="space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-10 h-10 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-stone-200">Drop an image here</p>
                    <p className="text-sm text-stone-500">or click to upload</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative w-full h-full group flex items-center justify-center bg-stone-950 rounded-xl overflow-hidden">
                  <img 
                    src={sourceImage} 
                    alt="Original" 
                    className="max-w-full max-h-[500px] object-contain"
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={clearAll}
                      className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
                      title="Remove image"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-stone-800/90 hover:bg-stone-700 text-white p-2 rounded-lg shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
                      title="Change image"
                    >
                      <UploadIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    Original Source
                  </div>
                </div>
              )}
            </div>

            {/* Filter Selection */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-stone-200 font-display font-semibold text-lg">Select Era / Style</h3>
                <p className="text-stone-500 text-sm">Authentic process simulation</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`
                      relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col h-full justify-between
                      ${selectedFilter === filter.id 
                        ? `border-amber-500/50 ring-1 ring-amber-500/20 bg-stone-800` 
                        : 'border-stone-800 bg-stone-950/50 hover:bg-stone-800 hover:border-stone-700'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1 w-full">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-full ${filter.color}`}>
                        {filter.name}
                      </span>
                    </div>
                    <p className="text-stone-400 text-[10px] leading-tight mt-1 line-clamp-2">{filter.desc}</p>
                    {selectedFilter === filter.id && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                      )}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={!sourceImage || loading}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
                    ${!sourceImage || loading 
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/20 transform hover:-translate-y-0.5 active:translate-y-0'}
                  `}
                >
                  {loading ? (
                    <>
                      <Spinner className="w-6 h-6 text-white" />
                      <span>Developing...</span>
                    </>
                  ) : (
                    <>
                      <MagicIcon className="w-6 h-6" />
                      <span>Apply {FILTERS.find(f => f.id === selectedFilter)?.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-xl flex items-start gap-3">
                <AlertIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="space-y-6">
             <div className={`
              relative border-2 border-stone-800 rounded-2xl p-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] bg-stone-900
              ${generatedImage ? 'border-amber-500/30 shadow-2xl shadow-amber-900/10' : ''}
            `}>
              {!generatedImage ? (
                <div className="flex flex-col items-center text-stone-600 p-12 text-center">
                  <div className="w-24 h-24 bg-stone-800/50 rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="w-12 h-12 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No Filter Applied Yet</p>
                  <p className="text-sm opacity-70 max-w-xs mt-2">Upload an image and click apply. The result will appear here instantly.</p>
                </div>
              ) : (
                <div className="relative w-full h-full animate-fade-in flex items-center justify-center bg-stone-950 rounded-xl overflow-hidden">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="max-w-full max-h-[700px] object-contain"
                  />
                  <div className="absolute bottom-4 left-4 bg-amber-500/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm shadow-lg font-semibold">
                    Processed Locally
                  </div>
                  
                  <div className="absolute bottom-4 right-4 flex gap-3">
                     <button
                      onClick={handleShare}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 border border-blue-400/30"
                      title="Share to Instagram/Facebook (Mobile Only)"
                    >
                      <ShareIcon className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                     <button
                      onClick={handleDownload}
                      className="bg-stone-100 hover:bg-white text-stone-900 px-5 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 transition-transform hover:scale-105"
                    >
                      <DownloadIcon className="w-5 h-5" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
                  <Spinner className="w-12 h-12 text-amber-500 mb-4" />
                  <p className="text-amber-500 font-medium animate-pulse">Developing photo...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-stone-600 text-sm border-t border-stone-900 mt-auto bg-stone-950">
        <p>&copy; {new Date().getFullYear()} RetroFlash. Client-Side Processing.</p>
      </footer>
    </div>
  );
}
