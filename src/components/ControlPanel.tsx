import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ResourceFilterButtons } from './ResourceFilterButtons';
import { StatusMessageComponent } from './StatusMessage';
import type { ResourceType, StatusMessage } from '../types/har';

interface ControlPanelProps {
  harContent: string;
  onHarContentChange: (content: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  statusMessage: StatusMessage | null;
  downloadUrl: string | null;
  selectedResourceType: ResourceType;
  onResourceTypeChange: (type: ResourceType) => void;
  filters: {
    domainFilter: string;
    statusFilter: string;
    methodFilter: string;
    keywordFilter: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  harContent,
  onHarContentChange,
  onProcess,
  isProcessing,
  statusMessage,
  downloadUrl,
  selectedResourceType,
  onResourceTypeChange,
  filters,
  onFiltersChange
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!isExpanded || isUserTyping) return;

      clearTimeout(autoCollapseTimeoutRef.current);
      autoCollapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 400);
    };

    const handleGlobalClick = (event: MouseEvent) => {
      if (!isExpanded || isUserTyping) return;
      
      const controlPanel = document.getElementById('control-panel');
      if (controlPanel && !controlPanel.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(autoCollapseTimeoutRef.current);
    };
  }, [isExpanded, isUserTyping]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onHarContentChange(content);
      if (!isExpanded) setIsExpanded(true);
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      id="control-panel"
      className={`fixed top-2 left-2 right-2 bg-white rounded-lg shadow-lg z-50 transition-all duration-400 ease-in-out ${
        isExpanded ? 'max-h-screen' : 'max-h-20'
      }`}
    >
      {/* Panel Header */}
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={handleToggle}
      >
        <h1 className="text-xl font-semibold text-gray-800">{t('title')}</h1>
        <button
          className={`text-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          title={t('toggleTooltip')}
        >
          ▼
        </button>
      </div>

      {/* Panel Content */}
      <div className={`transition-all duration-400 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-screen opacity-100 pb-4' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 space-y-4">
          {/* HAR Input */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {t('pasteOrUpload')}
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded text-sm font-mono resize-vertical"
              placeholder={t('pastePlaceholder')}
              value={harContent}
              onChange={(e) => onHarContentChange(e.target.value)}
              onFocus={() => setIsUserTyping(true)}
              onBlur={() => setTimeout(() => setIsUserTyping(false), 200)}
            />
          </div>

          {/* Resource Type Filter */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {t('resourceType')}
            </label>
            <ResourceFilterButtons
              selectedType={selectedResourceType}
              onTypeChange={onResourceTypeChange}
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                {t('statusCode')}
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded text-sm"
                value={filters.statusFilter}
                onChange={(e) => onFiltersChange({ ...filters, statusFilter: e.target.value })}
                onFocus={() => setIsUserTyping(true)}
                onBlur={() => setTimeout(() => setIsUserTyping(false), 200)}
              >
                <option value="">{t('all')}</option>
                <option value="2">{t('success')}</option>
                <option value="3">{t('redirect')}</option>
                <option value="4">{t('clientError')}</option>
                <option value="5">{t('serverError')}</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                {t('reqMethod')}
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded text-sm"
                value={filters.methodFilter}
                onChange={(e) => onFiltersChange({ ...filters, methodFilter: e.target.value })}
                onFocus={() => setIsUserTyping(true)}
                onBlur={() => setTimeout(() => setIsUserTyping(false), 200)}
              >
                <option value="">{t('all')}</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                {t('domainContains')}
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder={t('domainPlaceholder')}
                value={filters.domainFilter}
                onChange={(e) => onFiltersChange({ ...filters, domainFilter: e.target.value })}
                onFocus={() => setIsUserTyping(true)}
                onBlur={() => setTimeout(() => setIsUserTyping(false), 200)}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                {t('keywordSearch')}
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder={t('keywordPlaceholder')}
                value={filters.keywordFilter}
                onChange={(e) => onFiltersChange({ ...filters, keywordFilter: e.target.value })}
                onFocus={() => setIsUserTyping(true)}
                onBlur={() => setTimeout(() => setIsUserTyping(false), 200)}
              />
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleUploadClick}
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded font-medium hover:bg-gray-700 transition-colors"
            >
              {t('uploadButton')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".har"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={onProcess}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {t('processButton')}
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="filtered.har"
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded font-medium hover:bg-green-700 transition-colors text-center"
              >
                {t('downloadButton')}
              </a>
            )}
          </div>

          <StatusMessageComponent status={statusMessage} />
        </div>
      </div>
    </div>
  );
};