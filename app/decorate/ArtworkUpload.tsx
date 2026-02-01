'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  X, 
  FileImage, 
  FileText,
  Check,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useQuoteStore } from '@/lib/quote-store';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const ACCEPTED_DOC_TYPES = ['application/pdf', 'application/postscript', 'application/illustrator'];
const ACCEPTED_EXTENSIONS = '.png, .jpg, .jpeg, .gif, .webp, .pdf, .ai, .eps';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface ArtworkUploadProps {
  onSubmit: (files: File[], description: string) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function ArtworkUpload({
  onSubmit,
  onBack,
  isSubmitting = false,
}: ArtworkUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { designDescription, setDesignDescription } = useQuoteStore();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is too large. Maximum size is 20MB.`;
    }
    
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isDoc = ACCEPTED_DOC_TYPES.includes(file.type) || 
      file.name.endsWith('.ai') || 
      file.name.endsWith('.eps');
    
    if (!isImage && !isDoc) {
      return `${file.name} is not a supported file type.`;
    }
    
    return null;
  };

  const processFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(newFiles);
    
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const processedFiles: UploadedFile[] = fileArray.map((file) => {
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const uploadedFile: UploadedFile = {
        id: `${file.name}-${Date.now()}`,
        file,
        type: isImage ? 'image' : 'document',
      };
      
      // Create preview for images
      if (isImage) {
        uploadedFile.preview = URL.createObjectURL(file);
      }
      
      return uploadedFile;
    });

    setFiles((prev) => [...prev, ...processedFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = () => {
    if (files.length === 0 && !designDescription.trim()) {
      setError('Please upload artwork or describe your design.');
      return;
    }
    onSubmit(files.map((f) => f.file), designDescription);
  };

  const canSubmit = files.length > 0 || designDescription.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Upload Your Artwork
        </h3>
        <p className="text-slate-600">
          Upload your logo or design files. Our team will review and confirm the final details.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
          dragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-stone-300 bg-stone-50 hover:border-brand-300 hover:bg-brand-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className={cn(
            'inline-flex items-center justify-center h-14 w-14 rounded-2xl transition-colors',
            dragActive ? 'bg-brand-200' : 'bg-stone-200'
          )}>
            <Upload className={cn(
              'h-7 w-7 transition-colors',
              dragActive ? 'text-brand-600' : 'text-slate-500'
            )} />
          </div>
          
          <div>
            <p className="font-medium text-slate-700">
              {dragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or <span className="text-brand-600 font-medium">browse</span> to upload
            </p>
          </div>
          
          <p className="text-xs text-slate-400">
            PNG, JPG, AI, EPS, PDF up to 20MB
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Uploaded Files ({files.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200 shadow-sm"
              >
                {/* Preview or Icon */}
                {file.preview ? (
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    {file.type === 'image' ? (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    ) : (
                      <FileText className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                )}
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate text-sm">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400">Or describe your design</span>
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <label htmlFor="design-description" className="block text-sm font-medium text-slate-700">
          Design Description
        </label>
        <textarea
          id="design-description"
          value={designDescription}
          onChange={(e) => setDesignDescription(e.target.value)}
          placeholder="Describe your logo or design. Include colors, text, and placement details..."
          rows={4}
          className={cn(
            'w-full px-4 py-3 rounded-xl border border-stone-300 bg-white',
            'placeholder:text-slate-400 text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'resize-none'
          )}
        />
        <p className="text-xs text-slate-500">
          Example: "Company logo - blue text 'ACME Corp' on white/light colored shirts. Front left chest, about 4 inches wide."
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
        <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
          <FileImage className="h-4 w-4 text-brand-500" />
          Artwork Tips
        </h4>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            Vector files (AI, EPS, PDF) produce the best results
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            High-resolution images (300 DPI+) for raster formats
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            Don't have artwork? Just describe it and we'll help
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back to Configuration
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Submit Quote Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
