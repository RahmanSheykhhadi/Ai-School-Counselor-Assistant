import React from 'react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  
  const handleHelpClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
        const response = await fetch('/sca-help.html');
        if (!response.ok) throw new Error(`Help file not found (status: ${response.status})`);
        
        const htmlContent = await response.text();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const helpWindow = window.open(url, '_blank');
        
        if (helpWindow) {
            helpWindow.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        } else {
            alert('مرورگر شما مانع از باز شدن پنجره راهنما شد. لطفا pop-up ها را برای این سایت فعال کنید.');
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Failed to open help file:', error);
        alert('متاسفانه فایل راهنما یافت نشد.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-800 bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">به همیار مشاور هوشمند خوش آمدید</h1>
        
        <p className="text-slate-600 text-justify">
          قبل از شروع، لطفاً توجه داشته باشید که تمام اطلاعات شما به صورت محلی و امن در حافظه مرورگر دستگاه شما ذخیره می‌شود. مسئولیت حفظ و نگهداری اطلاعات (از جمله تهیه پشتیبان) بر عهده شماست.
        </p>

        <p className="text-slate-700 font-semibold">
          من{' '}
          <a href="/sca-help.html" onClick={handleHelpClick} className="text-sky-600 underline hover:text-sky-700">
            توافق‌نامه و راهنما
          </a>
          {' '}را مطالعه کرده و مسئولیت آن را می‌پذیرم.
        </p>
        
        <p className="text-sm text-slate-500" dir="ltr">
          I have read the{' '}
          <a href="/sca-help.html" onClick={handleHelpClick} className="text-sky-600 underline hover:text-sky-700">
            Agreement and Guide
          </a>
          {' '}and I accept responsibility for it.
        </p>

        <button
          onClick={onAccept}
          className="w-full px-6 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 transition-colors"
        >
          می‌پذیرم / I Accept
        </button>
      </div>
    </div>
  );
};

export default DisclaimerModal;