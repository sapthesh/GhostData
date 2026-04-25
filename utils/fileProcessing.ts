import piexif from 'piexifjs';
import ExifReader from 'exifreader';
import { MetadataEntry } from '../types';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// --- Metadata Extraction ---

export const extractMetadata = async (file: File): Promise<MetadataEntry[]> => {
  try {
    const entries: MetadataEntry[] = [];
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
        
        const title = pdfDoc.getTitle();
        if (title) entries.push({ tag: 'Title', value: title, group: 'PDF Info' });
        const author = pdfDoc.getAuthor();
        if (author) entries.push({ tag: 'Author', value: author, group: 'PDF Info' });
        const subject = pdfDoc.getSubject();
        if (subject) entries.push({ tag: 'Subject', value: subject, group: 'PDF Info' });
        const keywords = pdfDoc.getKeywords();
        if (keywords) {
          const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : String(keywords);
          entries.push({ tag: 'Keywords', value: keywordsStr, group: 'PDF Info' });
        }
        const producer = pdfDoc.getProducer();
        if (producer) entries.push({ tag: 'Producer', value: producer, group: 'PDF Info' });
        const creator = pdfDoc.getCreator();
        if (creator) entries.push({ tag: 'Creator', value: creator, group: 'PDF Info' });
        const creationDate = pdfDoc.getCreationDate();
        if (creationDate) entries.push({ tag: 'CreationDate', value: creationDate.toISOString(), group: 'Time' });
        const modDate = pdfDoc.getModificationDate();
        if (modDate) entries.push({ tag: 'ModificationDate', value: modDate.toISOString(), group: 'Time' });
      } catch (err) {
        console.warn("PDF parsing error", err);
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        const extractXmlTag = (xml: string, tag: string) => {
          const regex = new RegExp(`<(?:[a-zA-Z0-9_\\\\-]+:)?${tag}(?:\\\\s+[^>]*)?>([^<]*)</(?:[a-zA-Z0-9_\\\\-]+:)?${tag}>`);
          const match = xml.match(regex);
          return match ? match[1] : null;
        };

        const appXmlFile = zip.file('docProps/app.xml');
        if (appXmlFile) {
          const appXmlText = await appXmlFile.async('text');
          ['Template', 'TotalTime', 'Pages', 'Words', 'Characters', 'Application', 'DocSecurity', 'Lines', 'Paragraphs'].forEach(tag => {
            const val = extractXmlTag(appXmlText, tag);
            if (val) entries.push({ tag, value: val, group: 'DOCX App Info' });
          });
        }
        
        const coreXmlFile = zip.file('docProps/core.xml');
        if (coreXmlFile) {
          const coreXmlText = await coreXmlFile.async('text');
          const coreTags = [
            { xmlTag: 'creator', label: 'Creator', group: 'DOCX Core Info' },
            { xmlTag: 'title', label: 'Title', group: 'DOCX Core Info' },
            { xmlTag: 'lastModifiedBy', label: 'LastModifiedBy', group: 'DOCX Core Info' },
            { xmlTag: 'created', label: 'Created', group: 'Time' },
            { xmlTag: 'modified', label: 'Modified', group: 'Time' }
          ];

          coreTags.forEach(({ xmlTag, label, group }) => {
            const val = extractXmlTag(coreXmlText, xmlTag);
            if (val) entries.push({ tag: label, value: val, group });
          });
        }
      } catch (err) {
        console.warn("DOCX parsing error", err);
      }
    }

    try {
      const tags = await ExifReader.load(file);
      Object.keys(tags).forEach((key) => {
        const tag = tags[key];
        // Filter out thumbnails and massive binary blobs
        if (key === 'MakerNote' || key === 'UserComment' || key.includes('Thumbnail')) return;
        // Avoid duplicate tags if we already parsed them
        if (entries.some(e => e.tag === key)) return;
        
        // Categorize for UI
        let group = 'General';
        const keyLower = key.toLowerCase();
        if (keyLower.startsWith('gps') || keyLower.includes('latitude') || keyLower.includes('longitude') || keyLower.includes('altitude')) group = 'GPS';
        else if (keyLower.includes('date') || keyLower.includes('time')) group = 'Time';
        else if (keyLower.includes('lens') || keyLower.includes('fnumber') || keyLower.includes('iso')) group = 'Camera';

        entries.push({
          tag: key,
          value: tag.description ? tag.description.substring(0, 50) + (tag.description.length > 50 ? '...' : '') : String(tag.value).substring(0, 50),
          group,
        });
      });
    } catch (e) {
      if (entries.length === 0) {
        console.warn("Could not read Exif metadata", e);
      }
    }

    return entries;
  } catch (e) {
    console.warn("Could not read metadata", e);
    return [];
  }
};

// --- File Cleaning Logic ---

export const cleanFile = async (file: File): Promise<Blob> => {
  const fileType = file.type;

  if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
    return cleanJpeg(file);
  } else if (fileType === 'application/pdf') {
    return cleanPdf(file);
  } else if (fileType.startsWith('image/')) {
    // For PNG, WebP, etc., we use the "Re-encode" strategy via Canvas
    // This effectively strips non-pixel data (metadata).
    return cleanImageViaCanvas(file);
  }

  throw new Error(`Unsupported file type: ${fileType}`);
};

const cleanJpeg = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        // '0th', 'Exif', 'GPS', 'Interop', '1st' are the standard keys piexif uses.
        // Passing an empty object removes them.
        // However, we want to KEEP the image data, just strip the exif.
        // piexif.remove(jpegData) returns the raw JPEG data without Exif.
        const cleanedString = piexif.remove(result);
        
        // Convert binary string back to Blob
        const byteCharacters = atob(cleanedString.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        resolve(new Blob([byteArray], { type: 'image/jpeg' }));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const cleanImageViaCanvas = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      
      // Converting to Blob strips original metadata as it creates a fresh file container
      // We default to the original type, or PNG if not supported
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, file.type, 0.95); // 0.95 quality for lossy formats
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

const cleanPdf = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Strip metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    const savedBytes = await pdfDoc.save();
    return new Blob([savedBytes], { type: 'application/pdf' });
};

export const calculateHash = async (blob: Blob): Promise<string> => {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};