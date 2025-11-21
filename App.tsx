
import React, { useState, useRef, useEffect } from 'react';
import { applyRetroFilter, FilterType } from './utils/imageProcessing';
import { Spinner } from './components/Spinner';
import { UploadIcon, DownloadIcon, TrashIcon, ImageIcon } from './components/Icons';
import { blobToBase64 } from './utils/fileUtils';

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

  // Process image whenever filter or source changes
  useEffect(() => {
    if (sourceImage) {
      processImage(sourceImage, selectedFilter);
    }
  }, [sourceImage, selectedFilter]);

  const processImage = async (imgSrc: string, filter: FilterType) => {
    setLoading(true);
    setError(null);
    try {
      // Use setTimeout to allow the UI to update (show spinner) before heavy canvas work
      setTimeout(async () => {
        try {
            const result = await applyRetroFilter(imgSrc, filter);
            setGeneratedImage(result);
        } catch (err) {
            console.error(err);
            setError("Error processing image");
        } finally {
            setLoading(false);
        }
      }, 50);
    } catch (err) {
      setError("Failed to process image.");
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const base64 = await blobToBase64(file);
      setSourceImage(base64);
      // Effect hook will trigger processing
    } catch (err) {
      setError("Failed to process image file.");
      console.error(err);
      setLoading(false);
    } finally {
        // Reset input value so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `retro-flash-${selectedFilter}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetEditor = () => {
    setSourceImage(null);
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans flex flex-col items-center p-4 md:p-8">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-end mb-8 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-stone-100">
            RetroFlash
          </h1>
          <p className="text-stone-500 mt-1 text-sm md:text-base">
            Analog aesthetic processor. <span className="text-amber-600 font-semibold">100% Offline.</span>
          </p>
        </div>
        <div className="hidden md:block">
           <div className="px-3 py-1 bg-stone-900 border border-stone-800 rounded text-xs text-stone-500 uppercase tracking-widest">
             v1.0 Local Core
           </div>
        </div>
      </header>

      <main className="w-full max-w-5xl flex-1 flex flex-col gap-6">
        
        {/* Upload State */}
        {!sourceImage ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-800 rounded-xl bg-stone-900/50 hover:bg-stone-900/80 transition-colors p-12 min-h-[400px]">
            <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 text-stone-400">
              <ImageIcon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Load a photograph</h2>
            <p className="text-stone-500 mb-8 text-center max-w-md">
              Select an image to apply vintage textures, newspaper halftones, and chemical film simulations. All processing happens on your device.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-amber-600 font-display rounded-full hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 ring-offset-stone-900"
            >
              <UploadIcon className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
              Upload Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          // Editor State
          <div className="flex flex-col lg:flex-row gap-8 h-full">
            
            {/* Preview Area */}
            <div className="flex-1 bg-stone-900/50 rounded-xl border border-stone-800 p-4 flex items-center justify-center relative overflow-hidden min-h-[400px] lg:min-h-[600px]">
               {loading && (
                 <div className="absolute inset-0 z-20 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center">
                   <div className="flex flex-col items-center">
                     <Spinner className="w-12 h-12 text-amber-500 mb-4" />
                     <span className="text-amber-500 font-mono text-sm animate-pulse">Developing...</span>
                   </div>
                 </div>
               )}
               
               {generatedImage ? (
                 <img 
                   src={generatedImage} 
                   alt="Processed" 
                   className="max-w-full max-h-[70vh] object-contain shadow-2xl"
                 />
               ) : (
                 <img 
                   src={sourceImage} 
                   alt="Original" 
                   className="max-w-full max-h-[70vh] object-contain opacity-50 blur-sm" 
                 />
               )}

               {/* Action Bar (Mobile/Desktop Overlay) */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                 <button 
                    onClick={resetEditor}
                    className="bg-stone-800/90 hover:bg-red-900/90 text-white p-3 rounded-full backdrop-blur shadow-lg border border-stone-700 transition-all"
                    title="Clear Image"
                 >
                   <TrashIcon className="w-6 h-6" />
                 </button>
                 <button 
                    onClick={handleDownload}
                    disabled={!generatedImage || loading}
                    className="bg-amber-600/90 hover:bg-amber-500/90 text-white px-6 py-3 rounded-full backdrop-blur shadow-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   <DownloadIcon className="w-6 h-6" />
                   <span className="hidden sm:inline">Save Photo</span>
                 </button>
               </div>
            </div>

            {/* Controls Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <h3 className="text-lg font-display font-bold text-stone-400 px-1">Select Stock</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 overflow-y-auto max-h-[200px] lg:max-h-[600px] pr-2 custom-scrollbar">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`group relative overflow-hidden rounded-lg p-4 text-left border transition-all duration-200
                      ${selectedFilter === filter.id 
                        ? 'border-amber-500 ring-1 ring-amber-500 bg-stone-800' 
                        : 'border-stone-800 bg-stone-900 hover:border-stone-600'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${filter.color}`}>
                        {filter.id.split('-')[0]}
                      </span>
                    </div>
                    <div className="font-display font-bold text-lg text-stone-200 group-hover:text-amber-500 transition-colors">
                      {filter.name}
                    </div>
                    <div className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {filter.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur-md border border-red-700 animate-bounce">
          {error}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(41, 37, 36, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(87, 83, 78, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 119, 6, 0.8);
        }
      `}</style>
    </div>
  );
}
