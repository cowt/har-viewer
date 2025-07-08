import React from 'react';
import type { DeletedEntry } from '../types/har';
import { useTranslation } from '../hooks/useTranslation';

interface DeletedEntriesPanelProps {
  deletedEntries: DeletedEntry[];
  onRestore: (index: number) => void;
  onRestoreAll: () => void;
  onClearAll: () => void;
}

export const DeletedEntriesPanel: React.FC<DeletedEntriesPanelProps> = ({
  deletedEntries,
  onRestore,
  onRestoreAll,
  onClearAll
}) => {
  const { t } = useTranslation();

  if (deletedEntries.length === 0) return null;

  const handleClearAll = () => {
    if (confirm(t('confirmClearAll'))) {
      onClearAll();
    }
  };

  // Sort for display by original position
  const sortedForDisplay = deletedEntries
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .sort((a, b) => a.originalPosition - b.originalPosition);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md mb-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('deletedEntries')}</h3>
        <div className="flex gap-2">
          <button
            onClick={onRestoreAll}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            {t('restoreAll')}
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {t('clearAll')}
          </button>
        </div>
      </div>
      
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
        {sortedForDisplay.map((item) => {
          const shortUrl = item.entry.request.url.length > 50 
            ? '...' + item.entry.request.url.slice(-47) 
            : item.entry.request.url;
          
          return (
            <div key={item.originalIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 text-sm">
              <span className="flex-grow break-all">
                <span className="bg-gray-200 px-2 py-1 rounded text-xs mr-2">
                  #{item.originalPosition + 1}
                </span>
                <strong>{item.entry.request.method}</strong> {shortUrl}
              </span>
              <button
                onClick={() => onRestore(item.originalIndex)}
                className="ml-2 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                title={t('restoreToPosition')}
              >
                {t('restore')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};