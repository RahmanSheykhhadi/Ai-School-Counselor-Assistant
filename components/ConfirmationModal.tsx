import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'تایید',
  cancelButtonText = 'انصراف',
  confirmButtonVariant = 'danger',
}) => {
  const confirmButtonClasses = {
    danger: 'bg-red-500 hover:bg-red-600',
    primary: 'bg-sky-500 hover:bg-sky-600',
  };

  return (
    <Modal onClose={onCancel}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="text-slate-600">{message}</div>
        <div className="flex justify-end space-x-reverse space-x-2 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
            aria-label={cancelButtonText}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${confirmButtonClasses[confirmButtonVariant]}`}
            aria-label={confirmButtonText}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
