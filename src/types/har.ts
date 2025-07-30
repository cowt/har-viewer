export interface HARHeader {
  name: string;
  value: string;
}

export interface HARQueryString {
  name: string;
  value: string;
}

export interface HARPostData {
  mimeType: string;
  text?: string;
}

export interface HARRequest {
  method: string;
  url: string;
  headers: HARHeader[];
  queryString?: HARQueryString[];
  postData?: HARPostData;
}

export interface HARContent {
  mimeType: string;
  text?: string;
}

export interface HARResponse {
  status: number;
  statusText: string;
  headers: HARHeader[];
  redirectURL?: string;
  content?: HARContent;
}

export interface HAREntry {
  request: HARRequest;
  response: HARResponse;
}

export interface HARData {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    entries: HAREntry[];
  };
}

export interface FilterOptions {
  domainFilters: string[];
  statusFilter: string;
  methodFilter: string;
  keywordFilter: string;
  resourceType: string;
}

export interface DeletedEntry {
  entry: HAREntry;
  originalIndex: number;
  displayIndex: number;
  originalPosition: number;
}

export type ResourceType = 'all' | 'xhr' | 'doc' | 'css' | 'js' | 'font' | 'img' | 'media' | 'manifest' | 'socket' | 'wasm' | 'other';

export type StatusMessage = {
  text: string;
  type: 'success' | 'error' | 'info';
};

export interface TimingData {
  startTime: number;
  endTime: number;
  duration: number;
  dns?: number;
  connect?: number;
  ssl?: number;
  send?: number;
  wait?: number;
  receive?: number;
}

export interface WaterfallEntry extends HAREntry {
  timing: TimingData;
  index: number;
}

export interface PerformanceStats {
  totalRequests: number;
  totalTime: number;
  averageResponseTime: number;
  slowestRequests: Array<{
    entry: HAREntry;
    duration: number;
    index: number;
  }>;
  fastestRequests: Array<{
    entry: HAREntry;
    duration: number;
    index: number;
  }>;
  statusCodeDistribution: Record<string, number>;
  methodDistribution: Record<string, number>;
  responseTimeDistribution: Array<{
    range: string;
    count: number;
  }>;
}