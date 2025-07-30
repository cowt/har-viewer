import React, { useMemo } from 'react';
import type { WaterfallEntry } from '../types/har';
import { useTranslation } from '../hooks/useTranslation';

interface TimelineViewProps {
  waterfallEntries: WaterfallEntry[];
  focusedIndex: number;
  onEntryClick: (index: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  waterfallEntries,
  focusedIndex,
  onEntryClick
}) => {
  const { t } = useTranslation();

  const { maxTime, timeScale } = useMemo(() => {
    if (waterfallEntries.length === 0) return { maxTime: 0, timeScale: 1 };
    
    const maxTime = Math.max(...waterfallEntries.map(e => e.timing.endTime));
    return { maxTime, timeScale: 800 / maxTime }; // 800px 为时间轴总宽度
  }, [waterfallEntries]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 400) return 'bg-red-500';
    if (status >= 300) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-blue-500',
      'POST': 'bg-green-500',
      'PUT': 'bg-orange-500',
      'DELETE': 'bg-red-500',
      'PATCH': 'bg-purple-500',
      'OPTIONS': 'bg-gray-500'
    };
    return colors[method] || 'bg-gray-400';
  };

  // 生成时间刻度
  const timeMarkers = useMemo(() => {
    const markers = [];
    const step = maxTime / 10;
    for (let i = 0; i <= 10; i++) {
      const time = i * step;
      markers.push({
        time,
        position: time * timeScale,
        label: formatTime(time)
      });
    }
    return markers;
  }, [maxTime, timeScale]);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-full overflow-auto">
      <h2 className="text-center text-gray-800 mt-0 border-b-2 border-gray-200 pb-4 mb-5">
        {t('timelineView')}
      </h2>
      
      {waterfallEntries.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {t('noDataAvailable')}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 时间刻度 */}
          <div className="relative h-8 mb-4">
            <div className="absolute inset-0 border-b border-gray-300"></div>
            {timeMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-300"
                style={{ left: `${marker.position}px` }}
              >
                <span className="absolute -top-6 -left-4 text-xs text-gray-600">
                  {marker.label}
                </span>
              </div>
            ))}
          </div>

          {/* 请求条目 */}
          <div className="space-y-2">
            {waterfallEntries.map((entry, index) => {
              const startPos = entry.timing.startTime * timeScale;
              const width = Math.max(entry.timing.duration * timeScale, 2);
              const isFocused = index === focusedIndex;
              
              return (
                <div
                  key={index}
                  className={`relative h-8 cursor-pointer transition-all duration-200 ${
                    isFocused ? 'transform scale-105 z-10' : ''
                  }`}
                  onClick={() => onEntryClick(index)}
                >
                  {/* 背景条 */}
                  <div className="absolute inset-0 bg-gray-100 rounded border border-gray-200"></div>
                  
                  {/* 请求信息 */}
                  <div className="absolute left-2 top-1 text-xs font-medium text-gray-700 truncate max-w-48">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getMethodColor(entry.request.method)}`}></span>
                    {entry.request.method} {new URL(entry.request.url).pathname}
                  </div>
                  
                  {/* 时间条 */}
                  <div
                    className={`absolute top-1 h-6 rounded transition-all duration-200 ${
                      getStatusColor(entry.response.status)
                    } ${isFocused ? 'ring-2 ring-blue-400' : ''}`}
                    style={{
                      left: `${startPos}px`,
                      width: `${width}px`,
                      opacity: isFocused ? 1 : 0.8
                    }}
                    title={`${entry.request.method} ${entry.request.url}\n状态: ${entry.response.status}\n耗时: ${formatTime(entry.timing.duration)}\n开始: ${formatTime(entry.timing.startTime)}`}
                  >
                    {/* 时间段细分 */}
                    {width > 20 && (
                      <div className="h-full flex">
                        {entry.timing.dns && (
                          <div 
                            className="bg-blue-600 h-full"
                            style={{ width: `${(entry.timing.dns / entry.timing.duration) * 100}%` }}
                            title={`DNS: ${formatTime(entry.timing.dns)}`}
                          ></div>
                        )}
                        {entry.timing.connect && (
                          <div 
                            className="bg-orange-600 h-full"
                            style={{ width: `${(entry.timing.connect / entry.timing.duration) * 100}%` }}
                            title={`连接: ${formatTime(entry.timing.connect)}`}
                          ></div>
                        )}
                        {entry.timing.ssl && (
                          <div 
                            className="bg-purple-600 h-full"
                            style={{ width: `${(entry.timing.ssl / entry.timing.duration) * 100}%` }}
                            title={`SSL: ${formatTime(entry.timing.ssl)}`}
                          ></div>
                        )}
                        {entry.timing.wait && (
                          <div 
                            className="bg-yellow-600 h-full"
                            style={{ width: `${(entry.timing.wait / entry.timing.duration) * 100}%` }}
                            title={`等待: ${formatTime(entry.timing.wait)}`}
                          ></div>
                        )}
                        {entry.timing.receive && (
                          <div 
                            className="bg-green-600 h-full"
                            style={{ width: `${(entry.timing.receive / entry.timing.duration) * 100}%` }}
                            title={`接收: ${formatTime(entry.timing.receive)}`}
                          ></div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 持续时间标签 */}
                  <div 
                    className="absolute top-1 text-xs text-white font-medium pointer-events-none"
                    style={{ left: `${startPos + width + 5}px` }}
                  >
                    {formatTime(entry.timing.duration)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 图例 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">{t('legend')}</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium mb-1">{t('requestMethods')}</div>
                <div className="space-y-1">
                  {['GET', 'POST', 'PUT', 'DELETE'].map(method => (
                    <div key={method} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${getMethodColor(method)}`}></div>
                      {method}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">{t('timingPhases')}</div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 mr-2"></div>
                    DNS
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 mr-2"></div>
                    {t('connect')}
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-600 mr-2"></div>
                    {t('waiting')}
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-600 mr-2"></div>
                    {t('receiving')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};