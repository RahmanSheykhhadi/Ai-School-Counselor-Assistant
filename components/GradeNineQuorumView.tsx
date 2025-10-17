import React, { useState } from 'react';
import { toPersianDigits } from '../utils/helpers';
import { ArrowRightIcon } from './icons';

interface GradeNineQuorumViewProps {
    onBack: () => void;
}

const QuorumCalculator: React.FC = () => {
    const fieldsOfStudy: { [key: string]: string[] } = {
        'علوم تجربی': ['ریاضی', 'علوم تجربی'],
        'ریاضی فیزیک': ['ریاضی', 'علوم تجربی'],
        'علوم انسانی': ['فارسی', 'مطالعات اجتماعی', 'عربی'],
        'علوم معارف': ['فارسی', 'پیام‌های آسمان', 'عربی'],
        'فنی‌حرفه‌ای (صنعت)': ['ریاضی', 'کار و فناوری'],
        'فنی‌حرفه‌ای (خدمات)': ['کار و فناوری', 'فرهنگ و هنر'],
        'فنی‌حرفه‌ای (هنر)': ['کار و فناوری', 'فرهنگ و هنر'],
    };

    type Grades = {
        [subject: string]: {
            '7': string;
            '8': string;
            '9': string;
        };
    };

    const [selectedField, setSelectedField] = useState<string>('');
    const [grades, setGrades] = useState<Grades>({});

    const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newField = e.target.value;
        setSelectedField(newField);

        // Reset grades when field changes
        const newGrades: Grades = {};
        if (newField && fieldsOfStudy[newField]) {
            fieldsOfStudy[newField].forEach(subject => {
                newGrades[subject] = { '7': '', '8': '', '9': '' };
            });
        }
        setGrades(newGrades);
    };

    const handleGradeChange = (subject: string, year: '7' | '8' | '9', value: string) => {
        // Clamp value between 0 and 20
        let numValue = parseFloat(value);
        if (isNaN(numValue)) {
            value = '';
        } else {
            if (numValue > 20) numValue = 20;
            if (numValue < 0) numValue = 0;
            value = numValue.toString();
        }

        setGrades(prev => ({
            ...prev,
            [subject]: {
                ...prev[subject],
                [year]: value,
            },
        }));
    };

    const calculateFinalScore = (subject: string): string => {
        const subjectGrades = grades[subject];
        if (!subjectGrades) return '-';

        const g7 = parseFloat(subjectGrades['7']);
        const g8 = parseFloat(subjectGrades['8']);
        const g9 = parseFloat(subjectGrades['9']);

        if (isNaN(g7) || isNaN(g8) || isNaN(g9)) {
            return '-';
        }

        const finalScore = (g7 + g8 + (g9 * 3)) / 5;
        // Return with max 2 decimal places, and remove trailing zeros
        return toPersianDigits(finalScore.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'));
    };

    const subjects = selectedField ? fieldsOfStudy[selectedField] : [];
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm transition-shadow hover:shadow-md">
                <div className="max-w-md">
                    <label htmlFor="field-select" className="block text-sm font-medium text-slate-700 mb-1">انتخاب رشته تحصیلی:</label>
                    <select
                        id="field-select"
                        value={selectedField}
                        onChange={handleFieldChange}
                        className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                    >
                        <option value="">-- یک رشته را انتخاب کنید --</option>
                        {Object.keys(fieldsOfStudy).map(field => (
                            <option key={field} value={field}>{field}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedField && (
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm transition-shadow hover:shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">دروس مرتبط با رشته: {selectedField}</h2>
                    <div className="space-y-6">
                        {subjects.map(subject => (
                            <div key={subject} className="p-4 border rounded-lg bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-700 mb-3">{subject}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                                    {['7', '8', '9'].map(year => (
                                        <div key={year}>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">نمره پایه {toPersianDigits(year === '7' ? 'هفتم' : year === '8' ? 'هشتم' : 'نهم')}</label>
                                            <input
                                                type="number"
                                                step="0.25"
                                                min="0"
                                                max="20"
                                                value={grades[subject]?.[year as '7'|'8'|'9'] ?? ''}
                                                onChange={e => handleGradeChange(subject, year as '7'|'8'|'9', e.target.value)}
                                                className="w-full p-2 border border-slate-300 rounded-md"
                                                placeholder="مثال: ۱۸.۵"
                                            />
                                        </div>
                                    ))}
                                    <div className="text-center sm:text-right mt-4 sm:mt-0">
                                        <label className="block text-xs font-medium text-slate-600 mb-1">نمره نهایی محاسبه شده</label>
                                        <p className="p-2 bg-sky-100 text-sky-800 font-bold text-xl rounded-md text-center h-[42px] flex items-center justify-center">
                                            {calculateFinalScore(subject)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-md mt-6">
                        <p className="font-semibold">فرمول محاسبه:</p>
                        <p className="text-center font-mono tracking-wider mt-1">(نمره هفتم + نمره هشتم + (نمره نهم × ۳)) ÷ ۵</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const GradeNineQuorumView: React.FC<GradeNineQuorumViewProps> = ({ onBack }) => {
    return (
        <div className="space-y-6">
            <div className="relative text-center hidden md:block">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">محاسبه حد نصاب نهم برای انتخاب رشته</h1>
                <p className="text-red-600 font-bold text-lg mt-2">«حتما باید نمره پایانی نوبت دوم (نمره برگه امتحان نوبت دوم) را وارد کنید»</p>
            </div>
            
            <QuorumCalculator />

        </div>
    );
};

export default GradeNineQuorumView;