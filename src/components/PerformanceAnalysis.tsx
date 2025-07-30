import React from 'react';
import type { PerformanceStats } from '../types/har';
import { useTranslation } from '../hooks/useTranslation';

interface PerformanceAnalysisProps {
  stats: PerformanceStats;
  onSlowRequestClick?: (index: number) => void;
}

export const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({
  stats,
  onSlowRequestClick
}) => {
  const { t } = useTranslation();

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path.length <= maxLength - 3) return path;
      return '...' + path.slice(-(maxLength - 3));
    } catch {
      return url.length > maxLength ? '...' + url.slice(-(maxLength - 3)) : url;
    }
  };

  if (stats.totalRequests === 0) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md h-full overflow-auto">
        <h2 className="text-center text-gray-800 mt-0 border-b-2 border-gray-200 pb-4 mb-5">
          {t('performanceAnalysis')}
        </h2>
        <div className="text-center text-gray-500 py-8">
          {t('noDataAvailable')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-full overflow-auto">
      <h2 className="text-center text-gray-800 mt-0 border-b-2 border-gray-200 pb-4 mb-5">
        {t('performanceAnalysis')}
      </h2>
      
      <div className="space-y-6">
        {/* 总体统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
            <div className="text-sm text-gray-600">{t('totalRequests')}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{formatTime(stats.totalTime)}</div>
            <div className="text-sm text-gray-600">{t('totalTime')}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{formatTime(stats.averageResponseTime)}</div>
            <div className="text-sm text-gray-600">{t('averageResponseTime')}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {((stats.statusCodeDistribution['2xx'] || 0) / stats.totalRequests * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">{t('successRate')}</div>
          </div>
        </div>

        {/* 响应时间分布 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t('responseTimeDistribution')}</h3>
          <div className="space-y-2">
            {stats.responseTimeDistribution.map((item, index) => {
              const percentage = stats.totalRequests > 0 ? (item.count / stats.totalRequests) * 100 : 0;
              return (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">{item.range}</div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {item.count > 0 && `${item.count}`}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 状态码分布 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t('statusCodeDistribution')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.statusCodeDistribution).map(([status, count]) => {
              const percentage = (count / stats.totalRequests) * 100;
              const getStatusColor = (status: string) => {
                if (status.startsWith('2')) return 'text-green-600 bg-green-50';
                if (status.startsWith('3')) return 'text-yellow-600 bg-yellow-50';
                if (status.startsWith('4')) return 'text-red-600 bg-red-50';
                if (status.startsWith('5')) return 'text-red-700 bg-red-100';
                return 'text-gray-600 bg-gray-50';
              };
              
              return (
                <div key={status} className={`p-3 rounded-lg text-center ${getStatusColor(status)}`}>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-sm">{status}</div>
                  <div className="text-xs opacity-75">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 请求方法分布 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t('methodDistribution')}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.methodDistribution).map(([method, count]) => {
              const percentage = (count / stats.totalRequests) * 100;
              const getMethodColor = (method: string) => {
                const colors: Record<string, string> = {
                  'GET': 'bg-blue-100 text-blue-800',
                  'POST': 'bg-green-100 text-green-800',
                  'PUT': 'bg-orange-100 text-orange-800',
                  'DELETE': 'bg-red-100 text-red-800',
                  'PATCH': 'bg-purple-100 text-purple-800',
                  'OPTIONS': 'bg-gray-100 text-gray-800'
                };
                return colors[method] || 'bg-gray-100 text-gray-800';
              };
              
              return (
                <div key={method} className={`px-3 py-2 rounded-lg ${getMethodColor(method)}`}>
                  <span className="font-medium">{method}</span>
                  <span className="ml-2 text-sm">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 最慢的请求 */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-red-800">{t('slowestRequests')}</h3>
          <div className="space-y-2">
            {stats.slowestRequests.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 transition-colors ${
                  onSlowRequestClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onSlowRequestClick?.(item.index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.entry.request.method} {formatUrl(item.entry.request.url)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('status')}: {item.entry.response.status}
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-bold text-red-600">
                    {formatTime(item.duration)}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{item.index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最快的请求 */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-green-800">{t('fastestRequests')}</h3>
          <div className="space-y-2">
            {stats.fastestRequests.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 transition-colors ${
                  onSlowRequestClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onSlowRequestClick?.(item.index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.entry.request.method} {formatUrl(item.entry.request.url)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('status')}: {item.entry.response.status}
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-bold text-green-600">
                    {formatTime(item.duration)}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{item.index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};