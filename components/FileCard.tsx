import React, { useState, useMemo } from 'react';
import { ProcessedFile } from '../types';
import { formatBytes } from '../utils/fileProcessing';
import { FileCheck, Loader2, Download, Eye, EyeOff, Trash2, AlertTriangle, FileText, File, FileVideo, FileType, Check, Shield, ShieldAlert, ShieldCheck, ScanSearch, FileSearch, Hash } from 'lucide-react';
import { MetadataViewer } from './MetadataViewer';

interface FileCardProps {
  fileData: ProcessedFile;
  onRemove: (id: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDeepScan: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ fileData, onRemove, isSelected, onToggleSelect, onDeepScan }) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const isImage = fileData.file.type.startsWith('image/');
  const isPdf = fileData.file.type === 'application/pdf';
  const isVideo = fileData.file.type.startsWith('video/');
  const isDoc = fileData.file.type.includes('document') || fileData.file.type.includes('msword');
  
  // Calculate threat level and specific reason based on metadata presence
  const { level: threatLevel, reason: threatReason } = useMemo(() => {
    if (fileData.metadata.length === 0) return { level: 'safe', reason: 'No metadata found' };
    
    const hasGPS = fileData.metadata.some(m => m.group === 'GPS');
    const hasAuthor = fileData.metadata.some(m => m.group === 'Author');
    const hasCamera = fileData.metadata.some(m => m.group === 'Camera');
    
    if (hasGPS) return { level: 'high', reason: 'Contains precise GPS location coordinates' };
    if (hasAuthor) return { level: 'medium', reason: 'Contains personal author information' };
    if (hasCamera) return { level: 'medium', reason: 'Contains device and camera details' };
    
    return { level: 'low', reason: 'Contains standard file metadata' };
  }, [fileData.metadata]);

  const handleDownload = () => {
    if (fileData.processedUrl) {
      const link = document.createElement('a');
      link.href = fileData.processedUrl;
      link.download = `clean_${fileData.file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Determine styling for the file thumbnail area
  const getFileStyles = () => {
    if (isImage) return 'bg-gray-100 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800';
    if (isPdf) return 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
    if (isVideo) return 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20';
    if (isDoc) return 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
    return 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700';
  };

  const renderThreatBadge = () => {
    switch (threatLevel) {
      case 'high':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldAlert size={12} className="animate-pulse" />
            High Risk
          </div>
        );
      case 'medium':
        return (
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldAlert size={12} />
            Medium
          </div>
        );
      case 'low':
        return (
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <Shield size={12} />
            Low Risk
          </div>
        );
      case 'safe':
        return (
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck size={12} />
            Safe
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div 
        className={`group relative bg-white dark:bg-zinc-900/40 border rounded-xl p-4 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md dark:hover:bg-zinc-900/60 hover:scale-[1.005]
        ${isSelected 
          ? 'border-rose-500 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-900/10' 
          : 'border-gray-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-zinc-700'
        }`}
      >
        {/* Processing Overlay */}
        {fileData.status === 'processing' && (
          <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="animate-spin text-rose-500" size={32} />
          </div>
        )}

        <div className="flex gap-4 items-start">
          {/* Checkbox Area - Vertically centered with thumbnail (h-20) */}
          <div className="h-20 flex items-center -ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className={`
                shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-500/50
                ${isSelected 
                  ? 'bg-rose-500 border-rose-500 text-white' 
                  : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 hover:border-rose-400 dark:hover:border-rose-500 text-transparent'
                }
              `}
              title={isSelected ? "Deselect" : "Select"}
            >
              <Check size={12} strokeWidth={3} />
            </button>
          </div>

          {/* Thumbnail Area */}
          <div className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center transition-colors ${getFileStyles()}`}>
            {isImage ? (
              <img 
                src={fileData.previewUrl} 
                alt={fileData.file.name} 
                className="w-full h-full object-cover opacity-90 dark:opacity-80 group-hover:opacity-100 transition-opacity" 
              />
            ) : isPdf ? (
              <div className="flex flex-col items-center justify-center gap-1">
                 <FileText size={36} className="text-rose-500 dark:text-rose-400 drop-shadow-sm" strokeWidth={1.5} />
                 <span className="text-[9px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider">PDF</span>
              </div>
            ) : isVideo ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <FileVideo size={36} className="text-purple-500 dark:text-purple-400 drop-shadow-sm" strokeWidth={1.5} />
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider">Video</span>
              </div>
            ) : isDoc ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <FileType size={36} className="text-blue-500 dark:text-blue-400 drop-shadow-sm" strokeWidth={1.5} />
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">Doc</span>
              </div>
            ) : (
              <File size={36} className="text-gray-400 dark:text-zinc-500" strokeWidth={1.5} />
            )}
            
            {/* Status Indicator Badge */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 
              ${fileData.status === 'completed' ? 'bg-emerald-500' : 
                fileData.status === 'error' ? 'bg-red-500' : 
                threatLevel === 'high' ? 'bg-rose-500' : 
                threatLevel === 'medium' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-zinc-700'
              }`} 
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-zinc-200 truncate max-w-[240px]" title={fileData.file.name}>
                    {fileData.file.name}
                  </h4>
                  <div 
                    className="cursor-help hover:scale-105 transition-transform" 
                    title={`${threatReason}`}
                  >
                    {renderThreatBadge()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 font-mono">
                  {formatBytes(fileData.originalSize)} 
                  {fileData.processedSize && (
                    <span className="text-emerald-600 dark:text-emerald-500 ml-2">
                       → {formatBytes(fileData.processedSize)}
                    </span>
                  )}
                </p>

                {/* Hash Display */}
                {fileData.originalHash && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-600 font-mono mt-1 cursor-help" title={`Original SHA-256: ${fileData.originalHash}`}>
                        <Hash size={10} />
                        <span className="truncate max-w-[150px]">{fileData.originalHash}</span>
                    </div>
                )}
                {fileData.processedHash && (
                     <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-mono mt-0.5 cursor-help" title={`Processed SHA-256: ${fileData.processedHash}`}>
                        <Hash size={10} />
                        <span className="truncate max-w-[150px]">{fileData.processedHash}</span>
                    </div>
                )}
              </div>
              
              <button 
                onClick={() => onRemove(fileData.id)}
                className="text-gray-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                title="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
               {fileData.status === 'error' ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20" title="Processing Failed">
                    <AlertTriangle size={12} /> Failed
                  </span>
               ) : fileData.status === 'completed' ? (
                 <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" title="Metadata Removed">
                   <FileCheck size={12} /> Cleaned
                 </span>
               ) : (
                 <>
                   {fileData.metadata.length > 0 ? (
                     <button 
                       onClick={() => setShowMetadata(true)}
                       title="View metadata details"
                       className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors cursor-pointer
                         ${threatLevel === 'high' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20' : 
                           threatLevel === 'medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20' : 
                           'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'
                         }`}
                     >
                       <Eye size={12} /> {fileData.metadata.length} Tags Found
                     </button>
                   ) : (
                     fileData.isScanning ? (
                         <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                             <Loader2 size={12} className="animate-spin" /> Scanning...
                         </span>
                     ) : (
                         <button 
                             onClick={(e) => {
                                 e.stopPropagation();
                                 onDeepScan(fileData.id);
                             }}
                             className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-500/30 transition-all group/scan"
                             title="Run a deep scan to uncover hidden metadata"
                         >
                             <ScanSearch size={12} className="group-hover/scan:scale-110 transition-transform"/> Deep Scan
                         </button>
                     )
                   )}
                 </>
               )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-center gap-2 border-l border-gray-200 dark:border-zinc-800 pl-4">
            {(fileData.status === 'completed' || fileData.status === 'error') && (
               <button 
                 onClick={() => setShowMetadata(true)}
                 className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg hover:bg-white dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-zinc-200 hover:scale-105 transition-all shadow-sm"
                 title="Inspect Metadata"
               >
                 <FileSearch size={18} />
               </button>
            )}
            {fileData.status === 'completed' && (
              <button 
                onClick={handleDownload}
                className="p-2 bg-gray-100 dark:bg-zinc-100 text-gray-900 dark:text-zinc-900 rounded-lg hover:bg-white hover:scale-105 transition-all shadow-sm"
                title="Download Clean File"
              >
                <Download size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <MetadataViewer 
        isOpen={showMetadata} 
        onClose={() => setShowMetadata(false)} 
        metadata={fileData.metadata}
        fileName={fileData.file.name}
        originalHash={fileData.originalHash}
        processedHash={fileData.processedHash}
      />
    </>
  );
};
