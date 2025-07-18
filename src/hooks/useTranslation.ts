import { useState } from 'react';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    title: "HAR Viewer",
    toggleFilters: "Toggle Filters",
    pasteOrUpload: "Paste HAR content or Open File:",
    pastePlaceholder: "Paste the content of your .har file here...",
    statusCode: "Status Code",
    all: "All",
    success: "2xx Success",
    redirect: "3xx Redirect",
    clientError: "4xx Client Error",
    serverError: "5xx Server Error",
    reqMethod: "Request Method",
    domainContains: "Domain Contains",
    domainPlaceholder: "e.g., api.example.com",
    keywordSearch: "Keyword Search",
    keywordPlaceholder: "In URL or Body",
    uploadButton: "Open .har File",
    processButton: "Process & Visualize",
    downloadButton: "Download Filtered HAR",
    apiFlowchart: "API Flowchart",
    harDetails: "HAR Details",
    statusFileLoaded: 'File "{fileName}" loaded.',
    statusFileError: 'Error reading file.',
    statusProcessing: 'Processing...',
    statusEmpty: 'Input is empty. Please paste HAR content or open a file.',
    statusNoMatch: 'No entries match the filter criteria.',
    statusSuccess: 'Processed and showing {count}/{total} entries.',
    statusError: 'Error processing HAR: {message}',
    copy: "Copy",
    copied: "Copied!",
    sendRequest: "Send Request",
    showCurl: "Show cURL",
    modalTitle: "Send Request via cURL",
    modalNotice: "Due to browser security (CORS), requests cannot be sent directly. Please copy the cURL command below and run it in your terminal.",
    deleteEntry: "Delete",
    restore: "Restore",
    deletedEntries: "Deleted Entries",
    clearAll: "Clear All",
    restoreAll: "Restore All",
    confirmDelete: "Are you sure you want to delete this entry?",
    confirmClearAll: "Are you sure you want to clear all deleted entries?",
    restoreToPosition: "Restore to original position",
    resourceType: "Resource Type",
    fetchXhr: "Fetch/XHR",
    document: "Doc",
    stylesheet: "CSS",
    script: "JS",
    font: "Font",
    image: "Img",
    media: "Media",
    manifest: "Manifest",
    websocket: "Socket",
    webassembly: "Wasm",
    other: "Other",
    toggleTooltip: "Click to toggle • Scroll/Click outside/ESC to collapse",
  },
  zh: {
    title: "HAR 查看器",
    toggleFilters: "切换筛选器",
    pasteOrUpload: "粘贴 HAR 内容或打开文件:",
    pastePlaceholder: "在此处粘贴 .har 文件的内容...",
    statusCode: "状态码",
    all: "全部",
    success: "2xx 成功",
    redirect: "3xx 重定向",
    clientError: "4xx 客户端错误",
    serverError: "5xx 服务器错误",
    reqMethod: "请求方法",
    domainContains: "域名包含",
    domainPlaceholder: "例如 api.example.com",
    keywordSearch: "关键字搜索",
    keywordPlaceholder: "在 URL 或 Body 中",
    uploadButton: "打开 .har 文件",
    processButton: "处理并可视化",
    downloadButton: "下载已过滤的 HAR",
    apiFlowchart: "API 流程图",
    harDetails: "HAR 详情",
    statusFileLoaded: '文件 "{fileName}" 已加载。',
    statusFileError: '读取文件时出错。',
    statusProcessing: '正在处理中...',
    statusEmpty: '输入为空。请粘贴 HAR 内容或打开文件。',
    statusNoMatch: '没有条目符合筛选条件。',
    statusSuccess: '处理完成，共显示 {count}/{total} 条记录。',
    statusError: '处理 HAR 时出错: {message}',
    copy: "复制",
    copied: "已复制!",
    sendRequest: "发送请求",
    showCurl: "显示 cURL",
    modalTitle: "通过 cURL 发送请求",
    modalNotice: "由于浏览器安全限制 (CORS)，无法直接从页面发送请求。请复制下方的 cURL 命令并在您的终端中运行。",
    deleteEntry: "删除",
    restore: "恢复",
    deletedEntries: "已删除条目",
    clearAll: "清空全部",
    restoreAll: "恢复全部",
    confirmDelete: "确定要删除此条目吗？",
    confirmClearAll: "确定要清空所有已删除的条目吗？",
    restoreToPosition: "恢复到原始位置",
    resourceType: "资源类型",
    fetchXhr: "Fetch/XHR",
    document: "文档",
    stylesheet: "CSS",
    script: "脚本",
    font: "字体",
    image: "图片",
    media: "媒体",
    manifest: "Manifest",
    websocket: "Socket",
    webassembly: "Wasm",
    other: "其他",
    toggleTooltip: "点击切换 • 滚动/点击外部/ESC键收起",
  }
};

export const useTranslation = () => {
  const [currentLang, setCurrentLang] = useState<'en' | 'zh'>('zh');

  const t = (key: string, params: Record<string, string | number> = {}): string => {
    let text = (translations[currentLang] && translations[currentLang][key]) || 
               translations['en'][key] || key;
    
    for (const param in params) {
      text = text.replace(new RegExp(`{${param}}`, 'g'), String(params[param]));
    }
    
    return text;
  };

  const setLanguage = (lang: 'en' | 'zh') => {
    setCurrentLang(lang);
  };

  return { t, currentLang, setLanguage };
};