import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { FlowchartViewer } from './components/FlowchartViewer';
import { DetailsPanel } from './components/DetailsPanel';
import { TimelineView } from './components/TimelineView';
import { WaterfallChart } from './components/WaterfallChart';
import { PerformanceAnalysis } from './components/PerformanceAnalysis';
import { DeletedEntriesPanel } from './components/DeletedEntriesPanel';
import { CurlModal } from './components/CurlModal';
import { useTranslation } from './hooks/useTranslation';
import { slimHAR, prepareWaterfallData, calculatePerformanceStats } from './utils/harUtils';
import type { HAREntry, ResourceType, StatusMessage, DeletedEntry, FilterOptions, WaterfallEntry, PerformanceStats } from './types/har';
import 'highlight.js/styles/atom-one-dark.css';

function App() {
  const { t } = useTranslation();
  
  // State management
  const [harContent, setHarContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>('all');
  const [filters, setFilters] = useState({
    domainFilter: '',
    statusFilter: '',
    methodFilter: '',
    keywordFilter: ''
  });
  
  // Data state
  const [slimmedEntries, setSlimmedEntries] = useState<HAREntry[]>([]);
  const [allEntries, setAllEntries] = useState<HAREntry[]>([]);
  const [originalHarEntries, setOriginalHarEntries] = useState<any[]>([]);
  const [waterfallEntries, setWaterfallEntries] = useState<WaterfallEntry[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [deletedEntries, setDeletedEntries] = useState<DeletedEntry[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showMainContainer, setShowMainContainer] = useState(false);
  const [activeView, setActiveView] = useState<'flowchart' | 'timeline' | 'waterfall' | 'performance'>('flowchart');
  
  // Modal state
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [currentCurlCommand, setCurrentCurlCommand] = useState('');

  // Reset UI function
  const resetUI = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setShowMainContainer(false);
    setSlimmedEntries([]);
    setAllEntries([]);
    setOriginalHarEntries([]);
    setWaterfallEntries([]);
    setPerformanceStats(null);
    setDeletedEntries([]);
    setFocusedIndex(-1);
    setIsProcessing(false);
    setStatusMessage(null);
  }, [downloadUrl]);

  // Show status message
  const showStatus = useCallback((key: string, type: 'success' | 'error' | 'info', params: Record<string, string | number> = {}) => {
    setStatusMessage({ text: t(key, params), type });
  }, [t]);

  // Process HAR data
  const processHARData = useCallback(async () => {
    resetUI();
    
    if (!harContent.trim()) {
      showStatus('statusEmpty', 'error');
      return;
    }

    showStatus('statusProcessing', 'info');
    setIsProcessing(true);
    
    // Small delay to show processing state
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const harData = JSON.parse(harContent);
      
      // 保存原始HAR条目用于时间分析
      setOriginalHarEntries(harData.log.entries || []);
      
      const filterOptions: FilterOptions = {
        domainFilters: filters.domainFilter.trim().split(' ').filter(Boolean),
        statusFilter: filters.statusFilter,
        methodFilter: filters.methodFilter,
        keywordFilter: filters.keywordFilter.trim(),
        resourceType: selectedResourceType
      };

      const slimmedData = slimHAR(harData, filterOptions);
      const entries = slimmedData.log.entries;
      
      if (entries.length === 0) {
        showStatus('statusNoMatch', 'error');
        return;
      }

      setSlimmedEntries(entries);
      setAllEntries([...entries]);
      
      // 准备瀑布图数据
      const waterfallData = prepareWaterfallData(entries, harData.log.entries || []);
      setWaterfallEntries(waterfallData);
      
      // 计算性能统计
      const stats = calculatePerformanceStats(waterfallData);
      setPerformanceStats(stats);
      
      setShowMainContainer(true);
      setFocusedIndex(0);

      // Create download link
      const blob = new Blob([JSON.stringify(slimmedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Build filter description
      const activeFilters = [];
      if (selectedResourceType !== 'all') {
        // 获取正确的翻译键
        const resourceTypeMap: Record<ResourceType, string> = {
          'all': 'all',
          'xhr': 'fetchXhr',
          'doc': 'document',
          'css': 'stylesheet',
          'js': 'script',
          'font': 'font',
          'img': 'image',
          'media': 'media',
          'manifest': 'manifest',
          'socket': 'websocket',
          'wasm': 'webassembly',
          'other': 'other'
        };
        const typeLabel = t(resourceTypeMap[selectedResourceType] || selectedResourceType);
        activeFilters.push(`类型: ${typeLabel}`);
      }
      if (filterOptions.statusFilter) {
        activeFilters.push(`${filterOptions.statusFilter}xx`);
      }
      if (filterOptions.methodFilter) {
        activeFilters.push(filterOptions.methodFilter);
      }
      if (filterOptions.domainFilters.length > 0) {
        activeFilters.push(`域名: ${filterOptions.domainFilters.join(', ')}`);
      }
      if (filterOptions.keywordFilter) {
        activeFilters.push(`关键字: ${filterOptions.keywordFilter}`);
      }

      const filterText = activeFilters.length > 0 ? ` (筛选: ${activeFilters.join(' + ')})` : '';
      showStatus('statusSuccess', 'success', { 
        count: entries.length, 
        total: harData.log.entries.length 
      });
      
      // Append filter text to status
      setTimeout(() => {
        if (filterText) {
          setStatusMessage(prev => prev ? { ...prev, text: prev.text + filterText } : null);
        }
      }, 100);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showStatus('statusError', 'error', { message });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [harContent, filters, selectedResourceType, resetUI, showStatus, t]);

  // Delete entry
  const deleteEntry = useCallback((index: number) => {
    if (index < 0 || index >= slimmedEntries.length) return;

    const entry = slimmedEntries[index];
    const originalIndex = allEntries.findIndex(e => e === entry);
    const originalPosition = allEntries.findIndex(e => e === entry);

    // Add to deleted list
    setDeletedEntries(prev => [...prev, {
      entry,
      originalIndex,
      displayIndex: index,
      originalPosition
    }]);

    // Remove from current display
    setSlimmedEntries(prev => prev.filter((_, i) => i !== index));

    // Adjust focused index
    setFocusedIndex(prev => {
      if (prev >= slimmedEntries.length - 1) {
        return Math.max(0, slimmedEntries.length - 2);
      }
      return prev >= index ? prev : prev;
    });
  }, [slimmedEntries, allEntries]);

  // Restore entry
  const restoreEntry = useCallback((deletedIndex: number) => {
    if (deletedIndex < 0 || deletedIndex >= deletedEntries.length) return;

    const deletedItem = deletedEntries[deletedIndex];
    
    // Find correct insert position
    let insertPosition = 0;
    for (let i = 0; i < slimmedEntries.length; i++) {
      const currentEntryOriginalPos = allEntries.findIndex(e => e === slimmedEntries[i]);
      if (currentEntryOriginalPos > deletedItem.originalPosition) {
        insertPosition = i;
        break;
      }
      insertPosition = i + 1;
    }

    // Insert entry back
    setSlimmedEntries(prev => {
      const newEntries = [...prev];
      newEntries.splice(insertPosition, 0, deletedItem.entry);
      return newEntries;
    });

    // Remove from deleted list
    setDeletedEntries(prev => prev.filter((_, i) => i !== deletedIndex));
  }, [deletedEntries, slimmedEntries, allEntries]);

  // Restore all entries
  const restoreAllEntries = useCallback(() => {
    if (deletedEntries.length === 0) return;

    // Sort deleted entries by original position
    const sortedDeletedEntries = [...deletedEntries].sort((a, b) => 
      a.originalPosition - b.originalPosition
    );

    // Add all entries back in correct order
    const restoredEntries = [...slimmedEntries];
    sortedDeletedEntries.forEach(item => {
      let insertPosition = 0;
      for (let i = 0; i < restoredEntries.length; i++) {
        const currentEntryOriginalPos = allEntries.findIndex(e => e === restoredEntries[i]);
        if (currentEntryOriginalPos > item.originalPosition) {
          insertPosition = i;
          break;
        }
        insertPosition = i + 1;
      }
      restoredEntries.splice(insertPosition, 0, item.entry);
    });

    setSlimmedEntries(restoredEntries);
    setDeletedEntries([]);
  }, [deletedEntries, slimmedEntries, allEntries]);

  // Clear all deleted entries
  const clearAllDeletedEntries = useCallback(() => {
    setDeletedEntries([]);
  }, []);

  // Handle resource type change
  const handleResourceTypeChange = useCallback((type: ResourceType) => {
    setSelectedResourceType(type);
  }, []);

  // Handle cURL request
  const handleCurlRequest = useCallback((curlCommand: string) => {
    setCurrentCurlCommand(curlCommand);
    setCurlModalOpen(true);
  }, []);

  // Handle node click from flowchart
  const handleNodeClick = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((view: 'flowchart' | 'timeline' | 'waterfall' | 'performance') => {
    setActiveView(view);
  }, []);

  // Handle performance analysis click
  const handlePerformanceClick = useCallback((index: number) => {
    setFocusedIndex(index);
    setActiveView('flowchart'); // Switch to flowchart to show the focused entry
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 pt-20 px-4">
      <ControlPanel
        harContent={harContent}
        onHarContentChange={setHarContent}
        onProcess={processHARData}
        isProcessing={isProcessing}
        statusMessage={statusMessage}
        downloadUrl={downloadUrl}
        selectedResourceType={selectedResourceType}
        onResourceTypeChange={handleResourceTypeChange}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <DeletedEntriesPanel
        deletedEntries={deletedEntries}
        onRestore={restoreEntry}
        onRestoreAll={restoreAllEntries}
        onClearAll={clearAllDeletedEntries}
      />

      {showMainContainer && (
        <div className="max-w-screen-2xl mx-auto">
          {/* View Tabs */}
          <div className="flex justify-center mb-5">
            <div className="bg-white rounded-lg shadow-md p-1 flex">
              {[
                { key: 'flowchart', label: t('apiFlowchart') },
                { key: 'timeline', label: t('timelineView') },
                { key: 'waterfall', label: t('waterfallChart') },
                { key: 'performance', label: t('performanceAnalysis') }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleViewChange(key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* View Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[calc(100vh-180px)]">
            {/* Left Panel - Different Views */}
            {activeView === 'flowchart' && (
              <FlowchartViewer
                entries={slimmedEntries}
                focusedIndex={focusedIndex}
                onNodeClick={handleNodeClick}
              />
            )}
            {activeView === 'timeline' && (
              <TimelineView
                waterfallEntries={waterfallEntries}
                focusedIndex={focusedIndex}
                onEntryClick={handleNodeClick}
              />
            )}
            {activeView === 'waterfall' && (
              <WaterfallChart
                waterfallEntries={waterfallEntries}
                focusedIndex={focusedIndex}
                onEntryClick={handleNodeClick}
              />
            )}
            {activeView === 'performance' && (
              <PerformanceAnalysis
                stats={performanceStats || {
                  totalRequests: 0,
                  totalTime: 0,
                  averageResponseTime: 0,
                  slowestRequests: [],
                  fastestRequests: [],
                  statusCodeDistribution: {},
                  methodDistribution: {},
                  responseTimeDistribution: []
                }}
                onSlowRequestClick={handlePerformanceClick}
              />
            )}

            {/* Right Panel - Details (always visible except in performance view) */}
            {activeView !== 'performance' && (
              <DetailsPanel
                entries={slimmedEntries}
                focusedIndex={focusedIndex}
                onFocusChange={setFocusedIndex}
                onCurlRequest={handleCurlRequest}
                onDelete={deleteEntry}
              />
            )}
          </div>
        </div>
      )}

      <CurlModal
        isOpen={curlModalOpen}
        onClose={() => setCurlModalOpen(false)}
        curlCommand={currentCurlCommand}
      />
    </div>
  );
}

export default App;