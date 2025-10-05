import React, { useState } from 'react';
import Modal from './Modal';

interface PasswordPromptModalProps {
    onClose: () => void;
    onConfirm: (password: string) => Promise<boolean>;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({ onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await onConfirm(password);
        if (!success) {
            setError('رمز عبور اشتباه است.');
            setIsLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold text-slate-800 mb-4">ورود رمز عبور</h2>
                <p className="text-slate-600 mb-4">برای مشاهده جزئیات این جلسه، لطفا رمز عبور را وارد کنید.</p>
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-center"
                        autoFocus
                        dir="ltr"
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <div className="flex justify-end space-x-reverse space-x-2 pt-6">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 disabled:opacity-50">
                        انصراف
                    </button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-sky-300">
                        {isLoading ? 'در حال بررسی...' : 'تایید'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PasswordPromptModal;