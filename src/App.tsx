import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { FlowchartViewer } from './components/FlowchartViewer';
import { DetailsPanel } from './components/DetailsPanel';
import { DeletedEntriesPanel } from './components/DeletedEntriesPanel';
import { CurlModal } from './components/CurlModal';
import { useTranslation } from './hooks/useTranslation';
import { slimHAR } from './utils/harUtils';
import type { HAREntry, ResourceType, StatusMessage, DeletedEntry, FilterOptions } from './types/har';
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
  const [deletedEntries, setDeletedEntries] = useState<DeletedEntry[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showMainContainer, setShowMainContainer] = useState(false);
  
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-screen-2xl mx-auto h-[calc(100vh-120px)]">
          <FlowchartViewer
            entries={slimmedEntries}
            focusedIndex={focusedIndex}
            onNodeClick={handleNodeClick}
          />
          <DetailsPanel
            entries={slimmedEntries}
            focusedIndex={focusedIndex}
            onFocusChange={setFocusedIndex}
            onCurlRequest={handleCurlRequest}
            onDelete={deleteEntry}
          />
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