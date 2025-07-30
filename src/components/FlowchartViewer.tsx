import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import type { HAREntry } from '../types/har';
import { getResourceType } from '../utils/harUtils';
import { useTranslation } from '../hooks/useTranslation';

interface FlowchartViewerProps {
  entries: HAREntry[];
  focusedIndex: number;
  onNodeClick: (index: number) => void;
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({
  entries,
  focusedIndex,
  onNodeClick
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'default', 
      flowchart: { htmlLabels: true } 
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || entries.length === 0) return;

    const renderFlowchart = async () => {
      let mermaidGraph = 'graph TD\n';
      
      entries.forEach((entry, index) => {
        const { url, method } = entry.request;
        const { status } = entry.response;
        
        let path: string;
        try {
          path = new URL(url).pathname;
          if (path.length > 30) path = '...' + path.slice(-27);
        } catch (e) {
          path = url.length > 30 ? url.substring(0, 27) + '...' : url;
        }

        const escapedPath = path
          .replace(/"/g, '"')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        const resourceType = getResourceType(entry);
        const resourceTypeLabel = resourceType.toUpperCase();
        const nodeText = `<b>[${resourceTypeLabel}] ${method} ${status}</b><br/><small>${escapedPath}</small>`;
        
        mermaidGraph += `    A${index}["${nodeText}"]\n`;
        
        let style = '';
        if (status >= 400) {
          style = `style A${index} fill:#f8d7da,stroke:#721c24,stroke-width:2px,color:#721c24`;
        } else if (status >= 300) {
          style = `style A${index} fill:#fff3cd,stroke:#856404,stroke-width:2px,color:#856404`;
        } else {
          style = `style A${index} fill:#d4edda,stroke:#155724,stroke-width:2px,color:#155724`;
        }
        mermaidGraph += `    ${style}\n`;
        
        if (index > 0) {
          mermaidGraph += `    A${index - 1} --> A${index}\n`;
        }
      });

      try {
        containerRef.current!.innerHTML = '';
        const { svg } = await mermaid.render(`mermaid-graph-${Date.now()}`, mermaidGraph);
        containerRef.current!.innerHTML = svg;
        
        // Add click handlers to nodes
        setTimeout(() => {
          const nodes = containerRef.current?.querySelectorAll('g.node');
          nodes?.forEach((node, index) => {
            if (index < entries.length) {
              (node as HTMLElement).style.cursor = 'pointer';
              node.addEventListener('click', (e) => {
                e.stopPropagation();
                onNodeClick(index);
              });
            }
          });
        }, 100);
      } catch (error) {
        console.error('Error rendering mermaid chart:', error);
      }
    };

    renderFlowchart();
  }, [entries, onNodeClick]);

  // Update focused node styling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const nodes = containerRef.current.querySelectorAll('g.node');
    nodes.forEach((node, index) => {
      node.classList.toggle('active-node', index === focusedIndex);
    });

    // Scroll to focused node
    if (focusedIndex >= 0) {
      const activeNode = containerRef.current.querySelector('.active-node');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [focusedIndex]);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-full overflow-auto">
      <h2 className="text-center text-gray-800 mt-0 border-b-2 border-gray-200 pb-4 mb-5">
        {t('apiFlowchart')}
      </h2>
      <div ref={containerRef} className="text-center" />
      
      <style jsx>{`
        :global(.active-node rect),
        :global(.active-node polygon),
        :global(.active-node circle) {
          stroke: #3b82f6 !important;
          stroke-width: 4px !important;
        }
      `}</style>
    </div>
  );
};