import type { HAREntry, HARData, FilterOptions, ResourceType } from '../types/har';
import type { TimingData, WaterfallEntry, PerformanceStats } from '../types/har';

const HEADERS_TO_KEEP = new Set([
  'content-type', 'accept', 'origin', 'referer', 'authorization', 'cookie', 
  'set-cookie', 'x-csrf-token', 'x-tt-passport-csrf-token', 'sign', 
  'sign-ver', 'appid', 'appvr', 'device-time', 'lan', 'loc', 'pf'
]);

export const getResourceType = (entry: HAREntry): ResourceType => {
  const { request, response } = entry;
  const url = request.url.toLowerCase();
  const contentType = (response.headers?.find(h => h.name.toLowerCase() === 'content-type')?.value || '').toLowerCase();
  
  // WebSocket
  if (url.includes('websocket') || contentType.includes('websocket')) {
    return 'socket';
  }
  
  // WebAssembly - 先检查，避免被其他规则覆盖
  if (contentType.includes('application/wasm') || url.endsWith('.wasm')) {
    return 'wasm';
  }
  
  // Manifest - 检查manifest文件
  if (contentType.includes('application/manifest') || 
      url.includes('manifest.json') || 
      (url.endsWith('.json') && url.includes('manifest'))) {
    return 'manifest';
  }
  
  // 图片 - 优先检查，避免SVG被当作其他类型
  if (contentType.includes('image/') || url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|avif)(\?|$)/)) {
    return 'img';
  }
  
  // 字体
  if (contentType.includes('font/') || 
      contentType.includes('application/font') ||
      url.match(/\.(woff2?|ttf|otf|eot)(\?|$)/)) {
    return 'font';
  }
  
  // 样式表
  if (contentType.includes('text/css') || url.endsWith('.css')) {
    return 'css';
  }
  
  // JavaScript
  if (contentType.includes('javascript') || 
      contentType.includes('ecmascript') ||
      contentType.includes('application/javascript') ||
      url.match(/\.(js|mjs|ts|jsx|tsx)(\?|$)/)) {
    return 'js';
  }
  
  // 媒体文件
  if (contentType.includes('video/') || 
      contentType.includes('audio/') ||
      url.match(/\.(mp4|mp3|wav|ogg|webm|avi|mov|flv|m4v|m4a|aac)(\?|$)/)) {
    return 'media';
  }
  
  // 文档类型
  if (contentType.includes('text/html') || 
      url.match(/\.(html?|htm)(\?|$)/) ||
      response.status === 200 && !contentType && url === url.split('?')[0] && !url.includes('.')) {
    return 'doc';
  }
  
  // XHR/Fetch - 改进检测逻辑
  if (contentType.includes('application/json') || 
      contentType.includes('application/xml') ||
      contentType.includes('text/xml') ||
      contentType.includes('text/plain') ||
      url.includes('/api/') || 
      url.includes('/ajax/') || 
      url.includes('xmlhttprequest') ||
      (request.method !== 'GET' && contentType.includes('json')) ||
      (request.method !== 'GET' && contentType.includes('xml'))) {
    return 'xhr';
  }
  
  return 'other';
};

export const harEntryToCurl = (entry: HAREntry): string => {
  const req = entry.request;
  let curl = `curl '${req.url}'`;
  
  // 添加请求方法
  if (req.method.toUpperCase() !== 'GET') {
    curl += ` \\\n  -X ${req.method.toUpperCase()}`;
  }
  
  // 保留更多请求头，只过滤掉浏览器自动生成的头
  const skipHeaders = new Set([
    'host', 'connection', 'content-length', 'accept-encoding',
    'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
    'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-user',
    'upgrade-insecure-requests'
  ]);
  
  (req.headers || []).forEach(h => {
    if (!skipHeaders.has(h.name.toLowerCase())) {
      curl += ` \\\n  -H '${h.name}: ${h.value.replace(/'/g, "'\\''")}'`;
    }
  });
  
  // 添加POST数据
  if (req.postData && req.postData.text) {
    const escapedData = req.postData.text.replace(/'/g, "'\\''");
    const contentType = req.headers?.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      curl += ` \\\n  --data-urlencode '${escapedData}'`;
    } else if (contentType.includes('multipart/form-data')) {
      curl += ` \\\n  --data-raw '${escapedData}'`;
    } else {
      curl += ` \\\n  --data-raw '${escapedData}'`;
    }
  }
  
  // 添加查询参数（如果不在URL中）
  if (req.queryString && req.queryString.length > 0 && !req.url.includes('?')) {
    const params = req.queryString.map(q => `${q.name}=${encodeURIComponent(q.value)}`).join('&');
    curl += ` \\\n  --get --data '${params}'`;
  }
  
  // 添加其他有用选项
  curl += ' \\\n  --compressed';
  curl += ' \\\n  --location'; // 跟随重定向
  curl += ' \\\n  --silent --show-error'; // 安静模式但显示错误
  
  return curl;
};

export const slimRequest = (req: any) => ({
  method: req.method,
  url: req.url,
  headers: (req.headers || []).filter((h: any) => HEADERS_TO_KEEP.has((h.name || '').toLowerCase())),
  queryString: req.queryString,
  postData: req.postData ? { mimeType: req.postData.mimeType, text: req.postData.text } : undefined
});

export const slimResponse = (res: any) => ({
  status: res.status,
  statusText: res.statusText,
  headers: (res.headers || []).filter((h: any) => HEADERS_TO_KEEP.has((h.name || '').toLowerCase())),
  redirectURL: res.redirectURL || '',
  content: res.content ? { mimeType: res.content.mimeType, text: res.content.text } : undefined
});

export const slimHAR = (harData: any, filters: FilterOptions): HARData => {
  const slimmedData: HARData = {
    log: {
      version: '1.2',
      creator: { name: 'Focused HAR Viewer', version: '2.0' },
      entries: []
    }
  };

  if (!harData?.log?.entries) {
    throw new Error("Invalid HAR format.");
  }

  harData.log.entries.forEach((entry: any) => {
    const { request, response } = entry;
    if (!request?.url || !response) return;

    // 域名筛选
    try {
      const domain = new URL(request.url).hostname;
      if (filters.domainFilters.length > 0 && !filters.domainFilters.some(f => domain.includes(f))) return;
    } catch (e) {
      return;
    }

    // 状态码筛选
    if (filters.statusFilter && !String(response.status).startsWith(filters.statusFilter)) {
      return;
    }

    // 请求方法筛选
    if (filters.methodFilter && request.method.toUpperCase() !== filters.methodFilter.toUpperCase()) {
      return;
    }

    // 关键字筛选
    if (filters.keywordFilter) {
      const kw = filters.keywordFilter.toLowerCase();
      if (!(
        request.url.toLowerCase().includes(kw) ||
        (request.postData?.text || '').toLowerCase().includes(kw) ||
        (response.content?.text || '').toLowerCase().includes(kw)
      )) return;
    }

    // 资源类型筛选
    if (filters.resourceType && filters.resourceType !== 'all') {
      const resourceType = getResourceType(entry);
      if (resourceType !== filters.resourceType) return;
    }

    slimmedData.log.entries.push({
      request: slimRequest(request),
      response: slimResponse(response)
    });
  });

  return slimmedData;
};

export const calculateTiming = (entry: any, baseTime?: number): TimingData => {
  const timings = entry.timings || {};
  const startedDateTime = entry.startedDateTime ? new Date(entry.startedDateTime).getTime() : 0;
  const actualBaseTime = baseTime || startedDateTime;
  
  const startTime = startedDateTime - actualBaseTime;
  const duration = Math.max(
    (timings.dns || 0) + 
    (timings.connect || 0) + 
    (timings.ssl || 0) + 
    (timings.send || 0) + 
    (timings.wait || 0) + 
    (timings.receive || 0),
    entry.time || 0
  );
  
  return {
    startTime,
    endTime: startTime + duration,
    duration,
    dns: timings.dns > 0 ? timings.dns : undefined,
    connect: timings.connect > 0 ? timings.connect : undefined,
    ssl: timings.ssl > 0 ? timings.ssl : undefined,
    send: timings.send > 0 ? timings.send : undefined,
    wait: timings.wait > 0 ? timings.wait : undefined,
    receive: timings.receive > 0 ? timings.receive : undefined,
  };
};

export const prepareWaterfallData = (entries: HAREntry[], originalEntries: any[]): WaterfallEntry[] => {
  if (originalEntries.length === 0) return [];
  
  // 找到最早的开始时间作为基准
  const baseTime = Math.min(
    ...originalEntries
      .filter(entry => entry.startedDateTime)
      .map(entry => new Date(entry.startedDateTime).getTime())
  );
  
  return entries.map((entry, index) => {
    // 找到对应的原始条目以获取时间信息
    const originalEntry = originalEntries.find(orig => 
      orig.request?.url === entry.request?.url && 
      orig.request?.method === entry.request?.method
    ) || {};
    
    return {
      ...entry,
      timing: calculateTiming(originalEntry, baseTime),
      index
    };
  });
};

export const calculatePerformanceStats = (waterfallEntries: WaterfallEntry[]): PerformanceStats => {
  if (waterfallEntries.length === 0) {
    return {
      totalRequests: 0,
      totalTime: 0,
      averageResponseTime: 0,
      slowestRequests: [],
      fastestRequests: [],
      statusCodeDistribution: {},
      methodDistribution: {},
      responseTimeDistribution: []
    };
  }
  
  const totalTime = Math.max(...waterfallEntries.map(e => e.timing.endTime));
  const durations = waterfallEntries.map(e => e.timing.duration);
  const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  // 最慢和最快的请求
  const sortedByDuration = waterfallEntries
    .map((entry, index) => ({ entry, duration: entry.timing.duration, index }))
    .sort((a, b) => b.duration - a.duration);
  
  const slowestRequests = sortedByDuration.slice(0, 5);
  const fastestRequests = sortedByDuration.slice(-5).reverse();
  
  // 状态码分布
  const statusCodeDistribution: Record<string, number> = {};
  waterfallEntries.forEach(entry => {
    const statusRange = `${Math.floor(entry.response.status / 100)}xx`;
    statusCodeDistribution[statusRange] = (statusCodeDistribution[statusRange] || 0) + 1;
  });
  
  // 请求方法分布
  const methodDistribution: Record<string, number> = {};
  waterfallEntries.forEach(entry => {
    const method = entry.request.method;
    methodDistribution[method] = (methodDistribution[method] || 0) + 1;
  });
  
  // 响应时间分布
  const ranges = [
    { min: 0, max: 100, label: '0-100ms' },
    { min: 100, max: 500, label: '100-500ms' },
    { min: 500, max: 1000, label: '500ms-1s' },
    { min: 1000, max: 3000, label: '1-3s' },
    { min: 3000, max: Infinity, label: '3s+' }
  ];
  
  const responseTimeDistribution = ranges.map(range => ({
    range: range.label,
    count: durations.filter(d => d >= range.min && d < range.max).length
  }));
  
  return {
    totalRequests: waterfallEntries.length,
    totalTime,
    averageResponseTime,
    slowestRequests,
    fastestRequests,
    statusCodeDistribution,
    methodDistribution,
    responseTimeDistribution
  };
};