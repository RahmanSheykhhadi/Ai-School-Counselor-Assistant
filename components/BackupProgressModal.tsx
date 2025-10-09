import React, { useState, useEffect } from 'react';

interface BackupProgressModalProps {
  onBackup: (onProgress: (update: { progress: number; message: string }) => void) => Promise<void>;
  onClose: () => void;
}

const BackupProgressModal: React.FC<BackupProgressModalProps> = ({ onBackup, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('شروع عملیات پشتیبان‌گیری...');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const processBackup = async () => {
      try {
        await onBackup((update) => {
          setProgress(update.progress);
          setMessage(update.message);
        });
        setIsDone(true);
        setTimeout(() => {
            onClose();
        }, 2000); 

      } catch (error: unknown) {
        let errorMessage = 'An unknown error occurred during backup.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            errorMessage = String(error);
        }
        alert(errorMessage);
        onClose();
      }
    };

    processBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">پشتیبان‌گیری از اطلاعات</h2>
        <p className="text-slate-600 mb-2">{message}</p>
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ease-in-out ${isDone ? 'bg-green-500' : 'bg-sky-500'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-center font-semibold text-slate-700 mt-2">{progress}%</p>
      </div>
    </div>
  );
};

export default BackupProgressModal;
