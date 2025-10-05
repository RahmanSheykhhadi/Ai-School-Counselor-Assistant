import React, { useState, useEffect } from 'react';
import type { Student, Session } from '../types';
import Modal from './Modal';
import PersianDatePicker from './PersianDatePicker';
import * as geminiService from '../services/geminiService';
import { SparklesIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { normalizePersianChars } from '../utils/helpers';

interface SessionModalProps {
    student: Student;
    session: Session | null;
    onClose: () => void;
    onSave: (session: Session | Omit<Session, 'id' | 'academicYear'>) => void;
}

export default function SessionModal({ student, session, onClose, onSave }: SessionModalProps) {
    const { sessionTypes } = useAppContext();
    const [date, setDate] = useState<Date>(session ? new Date(session.date) : new Date());
    const [typeId, setTypeId] = useState<string>(session ? session.typeId : (sessionTypes[0]?.id || ''));
    const [notes, setNotes] = useState(session?.notes || '');
    const [actionItems, setActionItems] = useState(session?.actionItems || '');
    const [isAiLoadingSummary, setIsAiLoadingSummary] = useState(false);
    const [isAiLoadingActions, setIsAiLoadingActions] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeId.trim()) {
            alert('لطفا نوع جلسه را انتخاب کنید.');
            return;
        }

        const sessionData = {
            studentId: student.id,
            date: date.toISOString(),
            typeId,
            notes,
            actionItems,
            ...(session ? { id: session.id } : {})
        };
        onSave(sessionData);
    };

    const handleSummarize = async () => {
        if (!notes.trim()) return;
        setIsAiLoadingSummary(true);
        try {
            const summarizedText = await geminiService.summarizeNotes(notes);
            setNotes(summarizedText);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoadingSummary(false);
        }
    };

    const handleSuggestActions = async () => {
        if (!notes.trim()) return;
        setIsAiLoadingActions(true);
        try {
            const suggestedText = await geminiService.suggestActionItems(notes);
            setActionItems(suggestedText);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoadingActions(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">
                    {session ? 'ویرایش جلسه' : 'افزودن جلسه جدید'} برای {`${student.firstName} ${student.lastName}`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sessionType" className="block text-sm font-medium text-slate-700 mb-1">نوع جلسه</label>
                        <select
                            id="sessionType"
                            value={typeId}
                            onChange={(e) => setTypeId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                            required
                        >
                            <option value="" disabled>یک گزینه را انتخاب کنید</option>
                            {sessionTypes.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">تاریخ و ساعت جلسه</label>
                        <PersianDatePicker selectedDate={date} onChange={setDate} />
                    </div>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">خلاصه و نتایج جلسه</label>
                    <div className="relative">
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(normalizePersianChars(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            rows={10}
                            placeholder="مشاهدات، موارد مطرح شده، توافقات و..."
                        />
                         <button 
                            type="button" 
                            onClick={handleSummarize}
                            disabled={isAiLoadingSummary || !notes.trim()}
                            className="absolute bottom-2 left-2 flex items-center px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-md hover:bg-yellow-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                           <SparklesIcon className="w-4 h-4 ml-1" />
                           {isAiLoadingSummary ? 'در حال پردازش...' : 'خلاصه‌سازی هوشمند'}
                        </button>
                    </div>
                </div>
                 <div>
                    <label htmlFor="actionItems" className="block text-sm font-medium text-slate-700 mb-1">اقدامات پیشنهادی</label>
                    <div className="relative">
                        <textarea
                            id="actionItems"
                            value={actionItems}
                            onChange={(e) => setActionItems(normalizePersianChars(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            rows={7}
                            placeholder="اقدامات عملی برای دانش‌آموز..."
                        />
                        <button 
                            type="button" 
                            onClick={handleSuggestActions}
                            disabled={isAiLoadingActions || !notes.trim()}
                            title={!notes.trim() ? "برای پیشنهاد اقدام، ابتدا باید خلاصه‌ای از جلسه وجود داشته باشد" : "دریافت پیشنهاد"}
                            className="absolute bottom-2 left-2 flex items-center px-3 py-1 bg-teal-400 text-teal-900 text-xs font-semibold rounded-md hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="w-4 h-4 ml-1" />
                            {isAiLoadingActions ? 'در حال پردازش...' : 'پیشنهاد اقدام'}
                        </button>
                    </div>
                </div>
                <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                        انصراف
                    </button>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">
                        ذخیره جلسه
                    </button>
                </div>
            </form>
        </Modal>
    );
}