'use client';

/**
 * DesignUpload — shared, controlled artwork upload widget.
 *
 * Used by the /quote project form and the /services/* quote forms so the
 * upload UX and client-side validation stay identical everywhere.
 *
 * Scope (for now): UI/UX only. The selected File is held in the parent's
 * state and is intentionally NOT sent to any backend yet — storage, server
 * side validation, and AV scanning are a later phase. Keep it that way until
 * that work lands.
 *
 * Constraints:
 *   - Formats: PNG, JPG, WEBP, PDF
 *   - Max size: 20MB per file
 *   - Quantity: exactly 1 file
 */

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DESIGN_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
];
// `accept` attribute hint for the file picker (extensions).
const DESIGN_ACCEPTED_EXT = '.png,.jpg,.jpeg,.webp,.pdf';
const DESIGN_MAX_SIZE = 20 * 1024 * 1024; // 20MB per file
const DESIGN_MAX_SIZE_LABEL = '20MB';

export interface DesignUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  /**
   * Compact layout with reduced height — intended for tight spaces such as
   * modals/popups. Same behavior, smaller footprint.
   */
  compact?: boolean;
  /**
   * Word used in the drop-zone copy, e.g. "design" (default) or "file".
   * Lets generic forms (like /contact) read naturally without implying the
   * upload must be artwork.
   */
  fileNoun?: string;
}

export function DesignUpload({
  value,
  onChange,
  className,
  compact = false,
  fileNoun = 'design',
}: DesignUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build/tear down an object URL for image previews. PDFs get a file icon.
  useEffect(() => {
    if (value && value.type.startsWith('image/')) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (!DESIGN_ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported format. Please use PNG, JPG, WEBP, or PDF.';
    }
    if (file.size > DESIGN_MAX_SIZE) {
      return `"${file.name}" is too large. Maximum size is ${DESIGN_MAX_SIZE_LABEL}.`;
    }
    return null;
  };

  const acceptFiles = (fileList: FileList | File[]) => {
    setError(null);
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    // One design file only.
    if (arr.length > 1) {
      setError('Only 1 design file. Please choose a single file.');
      return;
    }
    const file = arr[0];
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    onChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      acceptFiles(e.dataTransfer.files);
    }
  };

  const removeFile = () => {
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {!value ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-all',
            compact ? 'p-3' : 'p-6',
            dragActive
              ? 'border-brand-400 bg-brand-50'
              : 'border-stone-300 bg-stone-50 hover:border-brand-300 hover:bg-brand-50/50',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={DESIGN_ACCEPTED_EXT}
            onChange={(e) => {
              if (e.target.files) acceptFiles(e.target.files);
            }}
            className="hidden"
          />
          <div
            className={cn(
              'flex items-center justify-center rounded-xl transition-colors',
              compact ? 'mb-1 h-8 w-8' : 'mb-2 h-11 w-11',
              dragActive
                ? 'bg-brand-200 text-brand-600'
                : 'bg-stone-200 text-slate-500',
            )}
          >
            <Upload className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </div>
          <p
            className={cn(
              'font-medium text-slate-700',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {dragActive
              ? `Drop your ${fileNoun} here`
              : `Drag & drop your ${fileNoun}, or click to browse`}
          </p>
          <p
            className={cn(
              'text-slate-400',
              compact ? 'mt-0.5 text-[11px]' : 'mt-2 text-xs',
            )}
          >
            PNG, JPG, WEBP, PDF · up to {DESIGN_MAX_SIZE_LABEL} · 1 file
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border border-stone-200 bg-white shadow-sm',
            compact ? 'p-2' : 'p-3',
          )}
        >
          {previewUrl ? (
            <div
              className={cn(
                'flex-shrink-0 overflow-hidden rounded-lg bg-stone-100',
                compact ? 'h-9 w-9' : 'h-12 w-12',
              )}
            >
              {/* Local object URL preview — next/image isn't suitable for
                  blob: URLs, so a plain <img> is used here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={value.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                'flex flex-shrink-0 items-center justify-center rounded-lg bg-stone-100',
                compact ? 'h-9 w-9' : 'h-12 w-12',
              )}
            >
              <FileText
                className={cn(
                  'text-slate-400',
                  compact ? 'h-5 w-5' : 'h-6 w-6',
                )}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {value.name}
            </p>
            <p className="text-xs text-slate-500">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-600"
            aria-label="Remove design file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 p-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
