export interface MetadataEntry {
  tag: string;
  value: string | number;
  group: string; // e.g., 'GPS', 'Exif', 'Image'
}

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface ProcessedFile {
  id: string;
  file: File;
  previewUrl: string;
  processedUrl?: string;
  status: ProcessingStatus;
  originalSize: number;
  processedSize?: number;
  metadata: MetadataEntry[];
  error?: string;
  originalHash?: string;
  processedHash?: string;
}

export interface ProcessingStats {
  totalFiles: number;
  dataSaved: number;
  metadataTagsRemoved: number;
}