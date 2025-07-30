import React, { useMemo } from 'react';
import type { WaterfallEntry } from '../types/har';
import { getResourceType } from '../utils/harUtils';
import { useTranslation } from '../hooks/useTranslation';

interface WaterfallChartProps {
  waterfallEntries: WaterfallEntry[];
  focusedIndex: number;
  onEntryClick: (index: number) => void;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  waterfallEntries,
  focusedIndex,
  onEntryClick
}) => {
  const { t } = useTranslation();

  const { maxTime, timeScale, concurrentRequests } = useMemo(() => {
    if (waterfallEntries.length === 0) return { maxTime: 0, timeScale: 1, concurrentRequests: [] };
    
    const maxTime = Math.max(...waterfallEntries.map(e => e.timing.endTime));
    const timeScale = 600 / maxTime; // 600px 为图表宽度
    
    // 计算并发请求数量
    const concurrentRequests: number[] = [];
    const timeStep = maxTime / 100; // 将时间分成100个步长
    
    for (let i = 0; i <= 100; i++) {
      const currentTime = i * timeStep;
      const concurrent = waterfallEntries.filter(entry => 
        entry.timing.startTime <= currentTime && entry.timing.endTime >= currentTime
      ).length;
      concurrentRequests.push(concurrent);
    }
    
    return { maxTime, timeScale, concurrentRequests };
  }, [waterfallEntries]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getResourceTypeColor = (entry: WaterfallEntry) => {
    const resourceType = getResourceType(entry);
    const colors: Record<string, string> = {
      'xhr': 'bg-blue-500',
      'doc': 'bg-gray-600',
      'css': 'bg-green-500',
      'js': 'bg-yellow-500',
      'font': 'bg-purple-500',
      'img': 'bg-pink-500',
      'media': 'bg-red-500',
      'other': 'bg-gray-400'
    };
    return colors[resourceType] || 'bg-gray-400';
  };

  const getStatusOpacity = (status: number) => {
    if (status >= 400) return 'opacity-90 border-red-300';
    if (status >= 300) return 'opacity-80 border-yellow-300';
    return 'opacity-70 border-green-300';
  };

  // 生成时间刻度
  const timeMarkers = useMemo(() => {
    const markers = [];
    const step = maxTime / 8;
    for (let i = 0; i <= 8; i++) {
      const time = i * step;
      markers.push({
        time,
        position: time * timeScale,
        label: formatTime(time)
      });
    }
    return markers;
  }, [maxTime, timeScale]);

  const maxConcurrent = Math.max(...concurrentRequests);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-full overflow-auto">
      <h2 className="text-center text-gray-800 mt-0 border-b-2 border-gray-200 pb-4 mb-5">
        {t('waterfallChart')}
      </h2>
      
      {waterfallEntries.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {t('noDataAvailable')}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 并发请求数图表 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-3">{t('concurrentRequests')}</h4>
            <div className="relative h-16">
              <svg width="100%" height="64" className="border border-gray-200 rounded">
                <defs>
                  <linearGradient id="concurrentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                <polyline
                  fill="url(#concurrentGradient)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  points={concurrentRequests.map((count, index) => 
                    `${(index / concurrentRequests.length) * 600},${64 - (count / maxConcurrent) * 60}`
                  ).join(' ')}
                />
              </svg>
              <div className="absolute top-0 left-0 text-xs text-gray-600">
                {maxConcurrent}
              </div>
              <div className="absolute bottom-0 left-0 text-xs text-gray-600">
                0
              </div>
            </div>
          </div>

          {/* 时间刻度 */}
          <div className="relative h-6 mb-4">
            {timeMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-300"
                style={{ left: `${marker.position}px` }}
              >
                <span className="absolute -top-5 -left-4 text-xs text-gray-600">
                  {marker.label}
                </span>
              </div>
            ))}
          </div>

          {/* 瀑布图主体 */}
          <div className="space-y-1">
            {waterfallEntries.map((entry, index) => {
              const startPos = entry.timing.startTime * timeScale;
              const width = Math.max(entry.timing.duration * timeScale, 3);
              const isFocused = index === focusedIndex;
              
              const url = new URL(entry.request.url);
              const displayUrl = url.pathname.length > 40 
                ? '...' + url.pathname.slice(-37) 
                : url.pathname;

              return (
                <div
                  key={index}
                  className={`relative h-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    isFocused ? 'bg-blue-50 transform scale-105 z-10' : ''
                  }`}
                  onClick={() => onEntryClick(index)}
                >
                  {/* 序号和URL */}
                  <div className="absolute left-0 top-0 w-48 h-full flex items-center text-xs truncate pr-2">
                    <span className="text-gray-500 mr-2 font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate" title={entry.request.url}>
                      {displayUrl}
                    </span>
                  </div>
                  
                  {/* 瀑布条 */}
                  <div className="absolute left-52 top-0 h-full">
                    <div
                      className={`h-4 mt-1 rounded border-2 transition-all duration-200 ${
                        getResourceTypeColor(entry)
                      } ${getStatusOpacity(entry.response.status)} ${
                        isFocused ? 'ring-2 ring-blue-400' : ''
                      }`}
                      style={{
                        left: `${startPos}px`,
                        width: `${width}px`
                      }}
                      title={`${entry.request.method} ${entry.request.url}\n状态: ${entry.response.status}\n类型: ${getResourceType(entry)}\n耗时: ${formatTime(entry.timing.duration)}\n开始: ${formatTime(entry.timing.startTime)}`}
                    >
                      {/* 详细时间段 */}
                      {width > 30 && (
                        <div className="h-full flex rounded overflow-hidden">
                          {entry.timing.dns && (
                            <div 
                              className="bg-blue-700 h-full"
                              style={{ width: `${(entry.timing.dns / entry.timing.duration) * 100}%` }}
                            ></div>
                          )}
                          {entry.timing.connect && (
                            <div 
                              className="bg-orange-700 h-full"
                              style={{ width: `${(entry.timing.connect / entry.timing.duration) * 100}%` }}
                            ></div>
                          )}
                          {entry.timing.ssl && (
                            <div 
                              className="bg-purple-700 h-full"
                              style={{ width: `${(entry.timing.ssl / entry.timing.duration) * 100}%` }}
                            ></div>
                          )}
                          {entry.timing.wait && (
                            <div 
                              className="bg-yellow-700 h-full"
                              style={{ width: `${(entry.timing.wait / entry.timing.duration) * 100}%` }}
                            ></div>
                          )}
                          {entry.timing.receive && (
                            <div 
                              className="bg-green-700 h-full"
                              style={{ width: `${(entry.timing.receive / entry.timing.duration) * 100}%` }}
                            ></div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 持续时间 */}
                    <div 
                      className="absolute top-1 text-xs text-gray-600 font-mono"
                      style={{ left: `${startPos + width + 5}px` }}
                    >
                      {formatTime(entry.timing.duration)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 图例 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">{t('legend')}</h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-medium mb-1">{t('resourceTypes')}</div>
                <div className="space-y-1">
                  {[
                    { type: 'xhr', label: 'XHR/Fetch' },
                    { type: 'doc', label: t('document') },
                    { type: 'css', label: 'CSS' },
                    { type: 'js', label: 'JavaScript' }
                  ].map(({ type, label }) => (
                    <div key={type} className="flex items-center">
                      <div className={`w-3 h-3 mr-2 ${getResourceTypeColor({ request: { method: 'GET', url: '', headers: [] }, response: { status: 200, statusText: '', headers: [] }, timing: { startTime: 0, endTime: 0, duration: 0 }, index: 0 } as WaterfallEntry)}`}></div>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">{t('timingPhases')}</div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-700 mr-2"></div>
                    DNS
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-700 mr-2"></div>
                    {t('connect')}
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-700 mr-2"></div>
                    {t('waiting')}
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-700 mr-2"></div>
                    {t('receiving')}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">{t('statusCodes')}</div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 opacity-70 border border-green-300 mr-2"></div>
                    2xx {t('success')}
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 opacity-80 border border-yellow-300 mr-2"></div>
                    3xx {t('redirect')}
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 opacity-90 border border-red-300 mr-2"></div>
                    4xx/5xx {t('error')}
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