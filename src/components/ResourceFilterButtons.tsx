import React from 'react';
import type { ResourceType } from '../types/har';
import { useTranslation } from '../hooks/useTranslation';

interface ResourceFilterSelectProps {
  selectedType: ResourceType;
  onTypeChange: (type: ResourceType) => void;
}

const resourceTypes: { type: ResourceType; labelKey: string }[] = [
  { type: 'all', labelKey: 'all' },
  { type: 'xhr', labelKey: 'fetchXhr' },
  { type: 'doc', labelKey: 'document' },
  { type: 'css', labelKey: 'stylesheet' },
  { type: 'js', labelKey: 'script' },
  { type: 'font', labelKey: 'font' },
  { type: 'img', labelKey: 'image' },
  { type: 'media', labelKey: 'media' },
  { type: 'manifest', labelKey: 'manifest' },
  { type: 'socket', labelKey: 'websocket' },
  { type: 'wasm', labelKey: 'webassembly' },
  { type: 'other', labelKey: 'other' }
];

export const ResourceFilterButtons: React.FC<ResourceFilterSelectProps> = ({
  selectedType,
  onTypeChange
}) => {
  const { t } = useTranslation();

  return (
    <select
      className="w-full p-2 border border-gray-300 rounded text-sm"
      value={selectedType}
      onChange={(e) => onTypeChange(e.target.value as ResourceType)}
    >
      {resourceTypes.map(({ type, labelKey }) => (
        <option key={type} value={type}>
          {t(labelKey)}
        </option>
      ))}
    </select>
  );
};