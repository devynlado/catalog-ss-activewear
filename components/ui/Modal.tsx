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
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full screen on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        <div
          className={cn(
            'relative w-full bg-white shadow-xl',
            // Mobile: full width, rounded top corners, max 95% height
            'rounded-t-2xl sm:rounded-xl max-h-[95vh] sm:max-h-[90vh]',
            // Desktop: apply size constraints
            `sm:${sizes[size]}`,
            size === 'full' ? 'flex flex-col h-[95vh] sm:h-[90vh]' : ''
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag indicator */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
          
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Close button (if no title) - Always visible with high z-index */}
          {!title && (
            <button
              onClick={onClose}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md backdrop-blur-sm hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Content - scrollable */}
          <div className={cn(
            'overflow-auto',
            size === 'full' ? 'flex-1' : 'max-h-[calc(95vh-4rem)] sm:max-h-[calc(90vh-4rem)]'
          )}>
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
