import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { extractText } from '@/lib/textExtractor';

interface FileUploadZoneProps {
  onTextExtracted: (text: string, fileName: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

export function FileUploadZone({ onTextExtracted, isProcessing, setIsProcessing }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setFileName(file.name);
    try {
      const text = await extractText(file);
      if (!text.trim()) throw new Error('No readable text found in this file.');
      onTextExtracted(text, file.name);
    } catch (e: any) {
      setError(e.message || 'Failed to process file');
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onTextExtracted, setIsProcessing]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all duration-300 ${
          dragOver
            ? 'border-primary bg-primary/5 glow-border'
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
          onChange={handleChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-display text-lg text-foreground">Extracting text from {fileName}...</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="h-12 w-12 text-primary" />
            <p className="font-display text-lg text-foreground">{fileName}</p>
            <p className="text-sm text-muted-foreground">Click or drop to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-14 w-14 text-muted-foreground" />
            <div>
              <p className="font-display text-xl text-foreground">Drop your book or page here</p>
              <p className="mt-1 text-sm text-muted-foreground">Supports PDF, TXT, MD, and image files</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
