'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TruncatedDescriptionProps {
  html: string;
  maxLines?: number;
  className?: string;
}

export function TruncatedDescription({ 
  html, 
  maxLines = 3,
  className 
}: TruncatedDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Check if content exceeds max lines
  useEffect(() => {
    if (measureRef.current && contentRef.current) {
      const lineHeight = parseInt(getComputedStyle(measureRef.current).lineHeight) || 24;
      const maxHeight = lineHeight * maxLines;
      const actualHeight = measureRef.current.scrollHeight;
      
      setNeedsTruncation(actualHeight > maxHeight + 10); // 10px buffer
    }
  }, [html, maxLines]);

  if (!html) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Measure container (hidden) */}
      <div 
        ref={measureRef}
        className="invisible absolute top-0 left-0 right-0 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Visible content */}
      <div
        ref={contentRef}
        className={cn(
          'text-sm text-slate-600 leading-relaxed prose prose-sm prose-slate max-w-none',
          'prose-ul:list-disc prose-ul:pl-5 prose-li:my-1',
          !isExpanded && needsTruncation && 'line-clamp-3'
        )}
        style={!isExpanded && needsTruncation ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Gradient fade overlay when truncated */}
      {!isExpanded && needsTruncation && (
        <div className="absolute bottom-6 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
      
      {/* Read more/less button */}
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          {isExpanded ? (
            <>
              Read less
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Read more
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
