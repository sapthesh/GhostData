import React, { useMemo } from 'react';
import { MetadataEntry } from '../types';
import { X, MapPin, Camera, Calendar, Info, File, AlertTriangle, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MetadataViewerProps {
  metadata: MetadataEntry[];
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  aggregatedData?: { fileName: string; metadata: MetadataEntry[] }[];
}

export const MetadataViewer: React.FC<MetadataViewerProps> = ({ metadata, fileName, isOpen, onClose, aggregatedData }) => {
  if (!isOpen) return null;

  const getIcon = (group: string) => {
    switch (group) {
      case 'GPS': return <MapPin size={14} className="text-rose-500 dark:text-rose-400" />;
      case 'Camera': return <Camera size={14} className="text-blue-500 dark:text-blue-400" />;
      case 'Time': return <Calendar size={14} className="text-amber-500 dark:text-amber-400" />;
      default: return <Info size={14} className="text-gray-400 dark:text-zinc-400" />;
    }
  };

  // Helper to extract coordinates from metadata if they exist
  const gpsCoordinates = useMemo(() => {
    if (aggregatedData) return null; // Don't show map for aggregated data to avoid clutter

    const latEntry = metadata.find(m => m.tag.toLowerCase() === 'latitude' || m.tag === 'GPSLatitude');
    const longEntry = metadata.find(m => m.tag.toLowerCase() === 'longitude' || m.tag === 'GPSLongitude');

    if (latEntry && longEntry) {
      // Simple parsing: assume standard decimal or simple array format often returned by ExifReader
      // A production app would need robust DMS to Decimal conversion here if raw EXIF is used.
      // ExifReader usually provides a 'description' which is decimal, or a raw value array.
      
      // We try to convert the value to a float.
      const lat = parseFloat(String(latEntry.value));
      const lng = parseFloat(String(longEntry.value));

      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  }, [metadata, aggregatedData]);

  const renderMetadataList = (entries: MetadataEntry[]) => {
    if (entries.length === 0) {
        return (
            <div className="text-center py-4 text-gray-400 dark:text-zinc-600 text-sm italic">
                No metadata tags found.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 font-semibold px-2">
                <span>Tag</span>
                <span>Value</span>
            </div>
            {entries.map((entry, idx) => (
                <div 
                  key={`${entry.tag}-${idx}`} 
                  className={`flex items-start justify-between p-3 rounded-lg border transition-colors gap-4 group
                    ${entry.group === 'GPS' 
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' 
                      : 'bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`p-1.5 rounded-md border shadow-sm dark:shadow-none flex items-center justify-center
                      ${entry.group === 'GPS' 
                        ? 'bg-white dark:bg-zinc-800 border-rose-200 dark:border-rose-500/30' 
                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                      }`}>
                      {getIcon(entry.group)}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-medium truncate ${entry.group === 'GPS' ? 'text-rose-700 dark:text-rose-200' : 'text-gray-700 dark:text-zinc-300'}`}>
                        {entry.tag}
                      </span>
                      <span className={`text-xs ${entry.group === 'GPS' ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-gray-500 dark:text-zinc-500'}`}>
                        {entry.group}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 px-2 py-1 rounded border border-gray-200 dark:border-zinc-800 max-w-[50%] break-all text-right group-hover:text-rose-500 dark:group-hover:text-rose-200 transition-colors">
                    {String(entry.value)}
                  </span>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Metadata Report</h3>
            <span className="text-xs text-gray-500 dark:text-zinc-500 font-mono truncate max-w-[300px]">{fileName}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-6 flex-1">
          
          {/* Metadata List */}
          {aggregatedData ? (
             aggregatedData.map((fileData, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-zinc-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur py-2 z-10 border-b border-transparent">
                        <File size={16} className="text-gray-400 dark:text-zinc-500"/>
                        <h4 className="font-semibold text-gray-900 dark:text-zinc-200 text-sm truncate max-w-[280px]" title={fileData.fileName}>{fileData.fileName}</h4>
                        <span className="text-xs text-gray-500 dark:text-zinc-500 ml-auto bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{fileData.metadata.length} tags</span>
                    </div>
                    {renderMetadataList(fileData.metadata)}
                </div>
             ))
          ) : (
             renderMetadataList(metadata)
          )}

          {/* GPS Map Visualization */}
          {gpsCoordinates && (
            <div className="bg-zinc-100 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden mt-6">
              <div className="h-48 w-full relative z-0">
                 <MapContainer 
                    center={[gpsCoordinates.lat, gpsCoordinates.lng]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                 >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[gpsCoordinates.lat, gpsCoordinates.lng]} icon={icon}>
                      <Popup>
                        Exact location found in file metadata.
                      </Popup>
                    </Marker>
                 </MapContainer>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border-t border-rose-100 dark:border-rose-500/20 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Precise Location Detected</h4>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                      This file contains exact coordinates ({gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lng.toFixed(4)}). 
                      Anyone with this file can see exactly where it was created.
                    </p>
                    <a 
                      href={`https://www.google.com/maps?q=${gpsCoordinates.lat},${gpsCoordinates.lng}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-rose-700 dark:text-rose-300 hover:underline hover:text-rose-800 dark:hover:text-rose-200 transition-colors"
                    >
                      View on Google Maps <ExternalLink size={10} />
                    </a>
                  </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-gray-500 dark:text-zinc-500">
            Processing will permanently remove these values.
          </p>
        </div>
      </div>
    </div>
  );
};