'use client';

import { Fragment, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full screen on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 lg:p-8">
        <div
          className={cn(
            'relative w-full bg-white shadow-2xl shadow-stone-900/20 overflow-hidden',
            // Mobile: full width, rounded top corners, max 95% height
            'rounded-t-2xl sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh]',
            // Desktop: apply size constraints
            `sm:${sizes[size]}`,
            size === 'full' ? 'flex flex-col h-[95vh] sm:h-[90vh]' : ''
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle grain texture overlay */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Mobile drag indicator */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden relative z-10">
            <div className="h-1 w-10 rounded-full bg-stone-300" />
          </div>
          
          {/* Header */}
          {title && (
            <div className="relative z-10 flex items-center justify-between border-b border-stone-100 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Close button (if no title) - Always visible with high z-index */}
          {!title && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 sm:right-5 sm:top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-lg ring-1 ring-stone-200/50 backdrop-blur-sm hover:bg-stone-50 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Content - scrollable */}
          <div className={cn(
            'relative z-10 overflow-auto',
            size === 'full' ? 'flex-1' : 'max-h-[calc(95vh-4rem)] sm:max-h-[calc(90vh-4rem)]'
          )}>
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
