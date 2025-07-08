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