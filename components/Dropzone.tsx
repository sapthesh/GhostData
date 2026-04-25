import React, { useCallback, useState } from 'react';
import { Upload, FileUp, ShieldCheck } from 'lucide-react';

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesDropped }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(Array.from(e.dataTransfer.files));
    }
  }, [onFilesDropped]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesDropped(Array.from(e.target.files));
    }
  }, [onFilesDropped]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 group
        ${isDragging 
          ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 scale-[1.01] shadow-xl shadow-rose-500/10' 
          : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900/50'
        }
      `}
    >
      <div className="p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className={`
          w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all duration-300
          ${isDragging ? 'bg-rose-500 text-white rotate-12 scale-110' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 group-hover:bg-white dark:group-hover:bg-zinc-800 shadow-sm dark:shadow-none'}
        `}>
          {isDragging ? <FileUp size={40} /> : <Upload size={40} />}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2 relative z-10">
          Drop your files here
        </h3>
        <p className="text-gray-500 dark:text-zinc-400 mb-8 max-w-md relative z-10">
          Securely strip EXIF, GPS, and sensitive metadata locally. 
          <br/>
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-mono mt-2 block">Supports JPG, PNG, WebP, PDF, DOCX, MP4, MOV</span>
        </p>

        <label className="relative z-10 group/btn cursor-pointer">
          <input 
            type="file" 
            multiple 
            onChange={handleFileInput} 
            className="hidden" 
            accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/quicktime"
          />
          <span className="px-8 py-3 rounded-full bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-rose-500 dark:hover:bg-rose-500 hover:text-white dark:hover:text-white transition-all shadow-lg shadow-gray-900/5 dark:shadow-white/5 hover:shadow-rose-500/25 flex items-center gap-2">
            <ShieldCheck size={18} />
            Select Files
          </span>
        </label>
      </div>
    </div>
  );
};