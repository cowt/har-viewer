import React, { useEffect, useRef } from 'react';
import type { HAREntry } from '../types/har';
import { EntryDetails } from './EntryDetails';
import { useTranslation } from '../hooks/useTranslation';

interface DetailsPanelProps {
  entries: HAREntry[];
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onCurlRequest: (curlCommand: string) => void;
  onDelete: (index: number) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  entries,
  focusedIndex,
  onFocusChange,
  onCurlRequest,
  onDelete
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingProgrammatically = useRef(false);

  // Set up intersection observer for auto-focusing visible entries
  useEffect(() => {
    if (!containerRef.current || entries.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (intersections) => {
        if (isScrollingProgrammatically.current) return;
        
        const intersectingEntries = intersections.filter(e => e.isIntersecting);
        if (intersectingEntries.length === 0) return;

        // Find the entry closest to the center of the viewport
        const centralEntry = intersectingEntries.reduce((prev, current) => {
          const prevDistance = Math.abs(prev.boundingClientRect.top - window.innerHeight / 2);
          const currentDistance = Math.abs(current.boundingClientRect.top - window.innerHeight / 2);
          return currentDistance < prevDistance ? current : prev;
        });

        const index = parseInt(centralEntry.target.id.split('-')[1], 10);
        if (index !== focusedIndex && !isNaN(index)) {
          onFocusChange(index);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0.1
      }
    );

    // Observe all entry elements
    const entryElements = containerRef.current.querySelectorAll('[id^="entry-"]');
    entryElements.forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [entries, focusedIndex, onFocusChange]);

  // Scroll to focused entry when focusedIndex changes externally
  useEffect(() => {
    if (focusedIndex < 0 || focusedIndex >= entries.length) return;

    const element = document.getElementById(`entry-${focusedIndex}`);
    if (element && containerRef.current) {
      isScrollingProgrammatically.current = true;
      
      // Temporarily disconnect observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Re-enable observer after scroll animation
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
        
        // Reconnect observer
        if (observerRef.current && containerRef.current) {
          const entryElements = containerRef.current.querySelectorAll('[id^="entry-"]');
          entryElements.forEach(el => observerRef.current?.observe(el));
        }
      }, 1000);
    }
  }, [focusedIndex, entries.length]);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-full overflow-auto" ref={containerRef}>
      <h2 className="text-center text-gray-800 mt-0 border-b-2 border-gray-200 pb-4 mb-5">
        {t('harDetails')}
      </h2>
      
      <div>
        {entries.map((entry, index) => (
          <EntryDetails
            key={index}
            entry={entry}
            index={index}
            isFocused={index === focusedIndex}
            isBlurred={focusedIndex >= 0 && index !== focusedIndex}
            onCurlRequest={onCurlRequest}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};