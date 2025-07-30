import React from 'react';
import { Modal } from './Modal';
import { useTranslation } from '../hooks/useTranslation';

interface CurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  curlCommand: string;
}

export const CurlModal: React.FC<CurlModalProps> = ({ isOpen, onClose, curlCommand }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modalTitle')}>
      <div>
        <p className="text-sm leading-relaxed bg-gray-100 p-2 rounded mb-4">
          {t('modalNotice')}
        </p>
        <textarea
          className="w-full h-64 p-3 border border-gray-300 rounded text-sm font-mono resize-none"
          value={curlCommand}
          readOnly
        />
      </div>
    </Modal>
  );
};