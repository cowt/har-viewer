import React, { useState, useEffect } from 'react';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import type { HAREntry } from '../types/har';
import { getResourceType, harEntryToCurl } from '../utils/harUtils';
import { useTranslation } from '../hooks/useTranslation';

// Register languages
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

interface EntryDetailsProps {
  entry: HAREntry;
  index: number;
  isFocused: boolean;
  isBlurred: boolean;
  onCurlRequest: (curlCommand: string) => void;
  onDelete: (index: number) => void;
}

export const EntryDetails: React.FC<EntryDetailsProps> = ({
  entry,
  index,
  isFocused,
  isBlurred,
  onCurlRequest,
  onDelete
}) => {
  const { t } = useTranslation();
  const [showCurl, setShowCurl] = useState(false);
  const [copyText, setCopyText] = useState(t('copy'));

  const jsonContent = JSON.stringify(entry, null, 2);
  const curlContent = harEntryToCurl(entry);
  const resourceType = getResourceType(entry);
  const resourceTypeLabel = resourceType.toUpperCase();

  const shortUrl = entry.request.url.length > 80 
    ? '...' + entry.request.url.slice(-77) 
    : entry.request.url;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(showCurl ? curlContent : jsonContent);
      setCopyText(t('copied'));
      setTimeout(() => setCopyText(t('copy')), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDelete = () => {
    if (confirm(t('confirmDelete'))) {
      onDelete(index);
    }
  };

  const getHighlightedCode = (content: string, language: string) => {
    try {
      const highlighted = hljs.highlight(content, { language, ignoreIllegals: true });
      return highlighted.value;
    } catch (error) {
      return content;
    }
  };

  useEffect(() => {
    setCopyText(t('copy'));
  }, [t]);

  return (
    <div 
      id={`entry-${index}`}
      className={`border-b border-dashed border-gray-300 pb-4 mb-4 last:border-b-0 p-2 rounded-lg transition-all duration-300 ${
        isFocused ? 'shadow-md border-blue-500 border-2 transform scale-105' : ''
      } ${isBlurred ? 'opacity-50 blur-sm transform scale-95' : ''}`}
    >
      {/* Entry Header */}
      <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
        <h3 className="text-lg font-semibold flex-grow break-all">
          {index + 1}. 
          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs ml-2 mr-2">
            {resourceTypeLabel}
          </span>
          <strong>{entry.request.method}</strong> {shortUrl}
        </h3>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              copyText === t('copied') 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {copyText}
          </button>
          
          <button
            onClick={() => onCurlRequest(curlContent)}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
          >
            {t('sendRequest')}
          </button>
          
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
          >
            {t('deleteEntry')}
          </button>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">{t('showCurl')}</label>
            <label className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={showCurl}
                onChange={(e) => setShowCurl(e.target.checked)}
                className="opacity-0 w-0 h-0"
              />
              <span className={`absolute inset-0 bg-gray-300 rounded-full transition-colors cursor-pointer ${
                showCurl ? 'bg-blue-600' : ''
              }`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  showCurl ? 'transform translate-x-6' : ''
                }`} />
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Code Block */}
      <pre className="bg-gray-900 text-white rounded-lg overflow-auto max-h-96 text-sm leading-relaxed">
        <code 
          className={`hljs language-${showCurl ? 'bash' : 'json'} block p-4`}
          dangerouslySetInnerHTML={{
            __html: getHighlightedCode(
              showCurl ? curlContent : jsonContent,
              showCurl ? 'bash' : 'json'
            )
          }}
        />
      </pre>
    </div>
  );
};