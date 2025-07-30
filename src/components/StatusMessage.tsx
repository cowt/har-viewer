import React from 'react';
import type { StatusMessage } from '../types/har';

interface StatusMessageProps {
  status: StatusMessage | null;
}

export const StatusMessageComponent: React.FC<StatusMessageProps> = ({ status }) => {
  if (!status) return null;

  const getStatusClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`mt-4 p-3 border rounded-md text-center font-medium ${getStatusClass(status.type)}`}>
      {status.text}
    </div>
  );
};