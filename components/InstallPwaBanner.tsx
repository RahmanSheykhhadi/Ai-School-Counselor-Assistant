import React from 'react';

interface InstallPwaBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallPwaBanner: React.FC<InstallPwaBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-20 md:bottom-auto md:top-4 right-4 bg-sky-600 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-4 animate-fade-in-up">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
      <span className="text-sm">نصب اپلیکیشن برای دسترسی آفلاین</span>
      <button onClick={onInstall} className="bg-white text-sky-700 font-bold py-1 px-3 rounded-md hover:bg-sky-100 text-sm">
        نصب
      </button>
      <button onClick={onDismiss} className="text-sky-200 hover:text-white font-bold text-lg leading-none" aria-label="بستن">
        &times;
      </button>
    </div>
  );
};

export default InstallPwaBanner;
