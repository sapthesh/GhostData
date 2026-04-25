import React, { useState, useCallback, useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { FileCard } from './components/FileCard';
import { ProcessedFile } from './types';
import { extractMetadata, cleanFile, calculateHash } from './utils/fileProcessing';
import { Shield, Zap, DownloadCloud, RefreshCw, Loader2, MapPin, Smartphone, Calendar, FileCheck, Image, FileText, List, FileVideo, Sun, Moon, CheckSquare, Square, Trash2, Eye } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MetadataViewer } from './components/MetadataViewer';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showCombinedMetadata, setShowCombinedMetadata] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleFilesDropped = useCallback(async (droppedFiles: File[]) => {
    const newFiles: ProcessedFile[] = droppedFiles.map(file => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      originalSize: file.size,
      metadata: [],
      isScanning: false,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Automatically analyze metadata on drop
    for (const f of newFiles) {
      Promise.all([
        extractMetadata(f.file),
        calculateHash(f.file)
      ]).then(([metadata, originalHash]) => {
        setFiles(current => 
          current.map(curr => curr.id === f.id ? { ...curr, metadata, originalHash } : curr)
        );
      });
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.processedUrl) URL.revokeObjectURL(file.processedUrl);
      return prev.filter(f => f.id !== id);
    });
    // Also remove from selection if present
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const removeSelectedFiles = () => {
    // Cleanup URLs for selected files
    files.forEach(f => {
      if (selectedIds.has(f.id)) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
      }
    });

    setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const clearAllFiles = () => {
    // Revoke all URLs to prevent memory leaks
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
    });
    setFiles([]);
    setSelectedIds(new Set());
    setShowClearAllConfirm(false);
  };

  const handleDeepScan = async (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isScanning: true } : f));
    
    const fileData = files.find(f => f.id === id);
    if (!fileData) return;

    // Artificial delay to provide visual feedback of a "deeper" process
    await new Promise(r => setTimeout(r, 1000));

    const metadata = await extractMetadata(fileData.file);
    setFiles(prev => prev.map(f => f.id === id ? { ...f, metadata, isScanning: false } : f));
  };

  const processAllFiles = async () => {
    if (isGlobalProcessing) return;
    setIsGlobalProcessing(true);
    
    // Filter for files that are not yet completed or are in an error state
    const idsToProcess = files
      .filter(f => f.status === 'idle' || f.status === 'error')
      .map(f => f.id);

    for (const id of idsToProcess) {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', error: undefined } : f));
        
        try {
            const fileData = files.find(f => f.id === id);
            if (!fileData) continue;

            await new Promise(r => setTimeout(r, 500));

            const cleanedBlob = await cleanFile(fileData.file);
            const processedUrl = URL.createObjectURL(cleanedBlob);
            const processedHash = await calculateHash(cleanedBlob);

            setFiles(prev => prev.map(f => {
                if (f.id === id) {
                    return {
                        ...f,
                        status: 'completed',
                        processedUrl,
                        processedSize: cleanedBlob.size,
                        processedHash
                    };
                }
                return f;
            }));
        } catch (error) {
            console.error(error);
            setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'Processing failed' } : f));
        }
    }

    setIsGlobalProcessing(false);
  };

  const executeDownloadAll = () => {
    files.forEach(f => {
        if (f.status === 'completed' && f.processedUrl) {
            const link = document.createElement('a');
            link.href = f.processedUrl;
            link.download = `clean_${f.file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
    setShowDownloadConfirm(false);
  };

  const getSelectedFilesMetadata = () => {
    return files
        .filter(f => selectedIds.has(f.id))
        .map(f => ({ fileName: f.file.name, metadata: f.metadata }));
  };

  const stats = {
      total: files.length,
      cleaned: files.filter(f => f.status === 'completed').length,
      metadataTags: files.reduce((acc, curr) => acc + curr.metadata.length, 0)
  };

  const completedCount = files.filter(f => f.status === 'completed' || f.status === 'error').length;
  const progress = files.length > 0 ? Math.round((completedCount / files.length) * 100) : 0;
  const hasFilesToProcess = files.some(f => f.status === 'idle' || f.status === 'error');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 selection:bg-rose-500/30 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between relative">
          {/* Empty div to balance the flex layout if we want strict centering, or absolute positioning */}
          <div className="w-10 hidden md:block"></div>
          
          <div className="flex items-center gap-3 mx-auto">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Shield className="text-white" size={24} />
            </div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Ghost<span className="text-gray-500 dark:text-zinc-500 font-light">Data</span></h1>
                {stats.metadataTags > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-500/20 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300" title="Total Metadata Tags Found">
                         {stats.metadataTags}
                    </span>
                )}
            </div>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Hero Text */}
        <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                Make your photos <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">invisible</span>.
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto text-lg transition-colors">
                Remove invisible data like GPS location, device info, and timestamps from your files instantly in your browser.
            </p>
        </div>

        {/* Main Interface */}
        <div className="space-y-8">
            <Dropzone onFilesDropped={handleFilesDropped} />

            {/* Educational Section (Visible only when empty) */}
            {files.length === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* How it works */}
                    <div className="bg-white dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-lg shadow-blue-500/10 dark:shadow-blue-900/20">
                            <Zap size={20} />
                            </div>
                            How it works
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-mono border border-gray-200 dark:border-zinc-700">1</span>
                                <div>
                                    <p className="text-base font-medium text-gray-900 dark:text-zinc-200">Local Processing</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed mt-1">Files never leave your device. The browser's engine handles everything offline.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-mono border border-gray-200 dark:border-zinc-700">2</span>
                                <div>
                                    <p className="text-base font-medium text-gray-900 dark:text-zinc-200">Analyze & Clean</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed mt-1">We scan for EXIF, GPS, and XMP data tags and rewrite the file structure without them.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-mono border border-gray-200 dark:border-zinc-700">3</span>
                                <div>
                                    <p className="text-base font-medium text-gray-900 dark:text-zinc-200">Save Securely</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed mt-1">Download the sanitized copy. The original file remains untouched on your disk.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Why remove metadata */}
                    <div className="bg-white dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-lg shadow-rose-500/10 dark:shadow-rose-900/20">
                            <Shield size={20} />
                            </div>
                            Why remove metadata?
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4 items-start">
                                <div className="mt-1 text-rose-500/80 dark:text-rose-500/50 p-1 bg-rose-500/10 rounded-lg">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-gray-900 dark:text-zinc-200">Location Privacy</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed mt-1">Photos often contain precise GPS coordinates of where they were taken (e.g., your home).</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="mt-1 text-rose-500/80 dark:text-rose-500/50 p-1 bg-rose-500/10 rounded-lg">
                                    <Smartphone size={18} />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-gray-900 dark:text-zinc-200">Device Fingerprinting</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed mt-1">Metadata reveals your exact camera model, lens settings, and software version.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="mt-1 text-rose-500/80 dark:text-rose-500/50 p-1 bg-rose-500/10 rounded-lg">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-gray-900 dark:text-zinc-200">Hidden History</p>
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed mt-1">Edits, original creation dates, and thumbnail data can persist even after cropping.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Supported Formats */}
                <div className="bg-white dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-none transition-all">
                  <div className="absolute top-0 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-900/20">
                       <FileCheck size={20} />
                    </div>
                    Supported Formats
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Images */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-zinc-200 flex items-center gap-2">
                        <Image size={16} className="text-gray-500 dark:text-zinc-500" /> Images
                      </h4>
                      <ul className="space-y-3">
                         <li className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono">JPG / JPEG</span>
                         </li>
                         <li className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono">PNG / WEBP</span>
                         </li>
                      </ul>
                    </div>

                    {/* Documents */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-zinc-200 flex items-center gap-2">
                        <FileText size={16} className="text-gray-500 dark:text-zinc-500" /> Documents
                      </h4>
                      <ul className="space-y-3">
                         <li className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono">PDF</span>
                         </li>
                         <li className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono">DOCX (Word)</span>
                         </li>
                      </ul>
                    </div>

                    {/* Videos */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-zinc-200 flex items-center gap-2">
                        <FileVideo size={16} className="text-gray-500 dark:text-zinc-500" /> Videos
                      </h4>
                       <ul className="space-y-3">
                         <li className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono">MP4</span>
                         </li>
                         <li className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono">MOV</span>
                         </li>
                       </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Bar */}
            {files.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                        <span className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">Files</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center group hover:border-rose-500/30 transition-colors shadow-sm dark:shadow-none">
                        <span className="text-2xl font-bold text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform">{stats.metadataTags}</span>
                        <span className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">Tags Found</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                        <span className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{stats.cleaned}</span>
                        <span className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">Cleaned</span>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            {files.length > 0 && (
                <div className="sticky top-20 z-30 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl p-2 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl transition-all duration-300">
                    {isGlobalProcessing && (
                        <div className="px-2 pt-2 pb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-2 font-medium">
                                <span className="flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin text-rose-500"/>
                                    <span>Processing {completedCount}/{files.length}</span>
                                </span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300 ease-out rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={processAllFiles}
                            disabled={isGlobalProcessing || !hasFilesToProcess}
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-rose-500/20"
                        >
                            {isGlobalProcessing ? (
                                <><RefreshCw className="animate-spin" size={20} /> Processing...</>
                            ) : (
                                <><Zap size={20} /> Remove Metadata</>
                            )}
                        </button>
                        {stats.cleaned > 0 && (
                            <button 
                                onClick={() => setShowDownloadConfirm(true)}
                                className="bg-gray-100 dark:bg-white text-gray-900 dark:text-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-200 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                            >
                                <DownloadCloud size={20} /> Download All
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Selection Toolbar */}
            {files.length > 0 && (
              <div className="flex items-center justify-between px-2 py-1 animate-in fade-in duration-300">
                  <button 
                    onClick={toggleSelectAll} 
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {selectedIds.size === files.length && files.length > 0 ? (
                       <CheckSquare size={18} className="text-rose-500" />
                    ) : (
                       <Square size={18} />
                    )}
                    Select All ({selectedIds.size})
                  </button>

                  <div className="flex items-center gap-2">
                      {selectedIds.size > 0 && (
                        <>
                          <button 
                            onClick={() => setShowCombinedMetadata(true)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700"
                          >
                            <Eye size={16} />
                            View Metadata
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30"
                          >
                            <Trash2 size={16} />
                            Remove Selected
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setShowClearAllConfirm(true)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        Clear All
                      </button>
                  </div>
              </div>
            )}

            {/* File List */}
            <div className="space-y-3">
                {files.map((file) => (
                    <FileCard 
                        key={file.id} 
                        fileData={file} 
                        onRemove={removeFile}
                        isSelected={selectedIds.has(file.id)}
                        onToggleSelect={() => toggleSelect(file.id)}
                        onDeepScan={handleDeepScan}
                    />
                ))}
            </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-zinc-900 mt-24 py-12 bg-gray-50 dark:bg-zinc-950 relative overflow-hidden transition-colors">
          <div className="max-w-5xl mx-auto px-6 text-center">
              <p className="text-gray-500 dark:text-zinc-600 text-sm">
                  Processed entirely in your browser. No data is sent to any server.
              </p>
          </div>
      </footer>

      {/* Download Confirmation Dialog */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <DownloadCloud size={20} className="text-gray-900 dark:text-zinc-100"/>
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight">Confirm Download</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Batch Action</p>
               </div>
            </div>
            
            <p className="text-gray-600 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
              You are about to download <strong>{stats.cleaned}</strong> processed files to your device. Depending on browser settings, this may open multiple prompts.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDownloadConfirm(false)}
                className="px-4 py-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={executeDownloadAll}
                className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200 text-sm font-medium transition-colors shadow-lg shadow-black/5 dark:shadow-white/5"
              >
                Download {stats.cleaned} Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400"/>
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight">Confirm Deletion</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Bulk Action</p>
               </div>
            </div>
            
            <p className="text-gray-600 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to remove <strong>{selectedIds.size}</strong> selected files? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={removeSelectedFiles}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
              >
                Remove Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400"/>
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight">Clear All Files</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Reset Workspace</p>
               </div>
            </div>
            
            <p className="text-gray-600 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to remove <strong>ALL</strong> files from the list? This will reset the application state.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowClearAllConfirm(false)}
                className="px-4 py-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={clearAllFiles}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Metadata Viewer */}
      <MetadataViewer
        isOpen={showCombinedMetadata}
        onClose={() => setShowCombinedMetadata(false)}
        metadata={[]}
        fileName="Selected Files Metadata"
        aggregatedData={getSelectedFilesMetadata()}
      />
    </div>
  );
};

export default App;