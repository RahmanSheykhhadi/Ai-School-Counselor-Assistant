import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { toPersianDigits } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';
import type { Student, ThinkingEvaluation } from '../types';
import { PrintIcon, TrashIcon, UserIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import Modal from './Modal';

interface ThinkingLifestyleViewProps {
    onBack: () => void;
}

type SubTab = 'select-classes' | 'grouping' | 'observations' | 'evaluation';

const thinkingQuestions = [
    "به محتوای فیلم، داستان، صحبت دیگران، با دقت توجه می‌کند.",
    "یک موضوع را همه جانبه و دقیق بررسی می‌کند.",
    "به نظر دیگران با تامل می‌نگرد و با پرسش مناسب، دیگران را به توضیح نظرات خود تشویق می‌کند.",
    "هنگام گفتگو با دیگران به احساسات آنها توجه می‌کند، هم احساسات دیگران را درک می‌کند و هم هنگام مخالفت با احترام صحبت می‌کند.",
    "برای توضیح ایده‌ها و تصمیم‌های خود از زبان صحیح و دقیق استفاده می‌کند.",
    "در مباحثات، نظرات غیر تکراری است و سیر تکاملی دارد.",
    "برای تبیین نظر خود استدلال می‌کند، توانایی دفاع منطقی از نظر خود را دارد.",
    "هنگام بحث، هیجانات خود چون خشم، نفرت و غیره را کنترل می‌کند.",
    "تفاوت‌ها، شباهت‌ها و روابط بین نظرات، پدیده‌ها، امور، وقایع، یا اجزای آنها را شناسایی و بیان می‌کند.",
    "قادر به ایجاد ارتباط بین تجارب خود و اطرافیان با موضوع بحث است.",
    "سوال‌های جدید می‌پرسد که پاسخ آن در فعالیت‌هایی که انجام شده نمی‌باشد یا می‌خواهد نظر دیگران را درباره‌ی آن بداند.",
    "از عملکرد عجولانه و بدون فکر پرهیز می‌کند.",
    "تحمل شنیدن نظر دیگران را دارد و در صورت لزوم نظر خود را اصلاح می‌کند.",
    "در برخورد با پدیده‌ها و مسائل زود قضاوت نمی‌کند.",
    "هنگام نقد، قضاوت و ارزشیابی درباره هر موضوعی از معیار مناسب استفاده می‌کند.",
    "قادر به توضیح احساسات و تجربیات و ارزیابی خود در مواجهه با یک موقعیت یادگیری است.",
    "با بررسی مسئله، راه‌های یافتن پاسخ سوال را تشخیص می‌دهد.",
    "برای روش مشاهده و نظرسنجی، پرسش مناسب طرح می‌کند.",
    "برای حل مسئله به روش‌های مختلف اطلاعات جمع‌آوری می‌کند.",
    "برای دستیابی به پاسخ، برای خود برنامه ریزی می‌کند."
];

export const ThinkingLifestyleView: React.FC<ThinkingLifestyleViewProps> = ({ onBack }) => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('select-classes');

    const TabButton = ({ tab, label }: { tab: SubTab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeSubTab === tab ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به بیشتر</button>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">تفکر و سبک زندگی</h1>
                <p className="text-slate-500 mt-1">ابزارهای مدیریت کلاس و گروه‌بندی دانش‌آموزان برای این درس.</p>
            </div>
            
            <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm">
                <div className="flex border-b flex-wrap">
                    <TabButton tab="select-classes" label="کلاس‌ها" />
                    <TabButton tab="grouping" label="گروه‌بندی" />
                    <TabButton tab="observations" label="ثبت مشاهدات" />
                    <TabButton tab="evaluation" label="ارزشیابی" />
                </div>
                
                <div className="p-2 sm:p-4">
                    {activeSubTab === 'select-classes' && <SelectClasses />}
                    {activeSubTab === 'grouping' && <Grouping />}
                    {activeSubTab === 'observations' && <Observations />}
                    {activeSubTab === 'evaluation' && <Evaluation />}
                </div>
            </div>
        </div>
    );
};

const SelectClasses: React.FC = () => {
    const { classrooms, appSettings, setAppSettings } = useAppContext();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(appSettings.thinkingClassroomIds || []));
    const [toastMessage, setToastMessage] = useState('');

    const handleToggle = (classroomId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(classroomId)) {
                newSet.delete(classroomId);
            } else {
                newSet.add(classroomId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        await setAppSettings(prev => ({
            ...prev,
            thinkingClassroomIds: Array.from(selectedIds)
        }));
        setToastMessage('کلاس‌ها با موفقیت ذخیره شدند.');
        setTimeout(() => setToastMessage(''), 3000);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700">کلاس‌هایی که در آن‌ها «تفکر و سبک زندگی» تدریس می‌کنید را انتخاب کنید:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {classrooms.map(c => (
                    <div key={c.id} className="flex items-center p-2 bg-slate-50 rounded-md">
                        <input
                            type="checkbox"
                            id={`class-${c.id}`}
                            checked={selectedIds.has(c.id)}
                            onChange={() => handleToggle(c.id)}
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor={`class-${c.id}`} className="mr-2 text-sm font-medium text-slate-700">{c.name}</label>
                    </div>
                ))}
            </div>
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-600"
                >
                    ذخیره کلاس‌ها
                </button>
            </div>
             {toastMessage && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

const Grouping: React.FC = () => {
    const { students, classrooms, appSettings, studentGroups, handleSaveGroup, handleDeleteGroup } = useAppContext();
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    const thinkingClassrooms = useMemo(() => {
        const selectedIds = new Set(appSettings.thinkingClassroomIds || []);
        return classrooms.filter(c => selectedIds.has(c.id));
    }, [classrooms, appSettings.thinkingClassroomIds]);

    const studentsInSelectedClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classroomId === selectedClassId).sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, selectedClassId]);

    const groupsInSelectedClass = useMemo(() => {
        if (!selectedClassId) return [];
        return studentGroups.filter(g => g.classroomId === selectedClassId);
    }, [studentGroups, selectedClassId]);
    
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedClassId(e.target.value);
        setSelectedStudentIds(new Set());
    };

    const handleStudentToggle = (studentId: string) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        if (selectedStudentIds.size === studentsInSelectedClass.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(studentsInSelectedClass.map(s => s.id)));
        }
    };
    
    const handleGroup = () => {
        const groupName = prompt('نام گروه را وارد کنید:', `گروه ${groupsInSelectedClass.length + 1}`);
        if (groupName && selectedStudentIds.size > 0) {
            handleSaveGroup({
                name: groupName,
                classroomId: selectedClassId,
                studentIds: Array.from(selectedStudentIds)
            });
            setSelectedStudentIds(new Set());
        }
    };

    const handleExportHtml = () => {
        if (groupsInSelectedClass.length === 0) return;
    
        const sanitize = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
        const groupsHtml = groupsInSelectedClass.map(group => {
            const memberList = group.studentIds
                .map(id => studentMap.get(id))
                .filter(Boolean)
                .sort((a, b) => a!.lastName.localeCompare(b!.lastName, 'fa'))
                .map(s => `<li>${sanitize(s!.firstName)} ${sanitize(s!.lastName)}</li>`).join('');
            
            return `
                <div class="group-card">
                    <h2>${sanitize(group.name)}</h2>
                    <ul>${memberList}</ul>
                </div>
            `;
        }).join('');
    
        const html = `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>گروه‌بندی کلاس</title>
                <style>
                    @font-face {
                      font-family: 'B Yekan';
                      src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2');
                      font-weight: normal;
                    }
                    body { font-family: 'B Yekan', sans-serif; font-size: 14pt; direction: rtl; }
                    @page { size: A4 portrait; margin: 1.5cm; }
                    h1 { text-align: center; }
                    .container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1.5cm;
                        grid-auto-rows: min-content;
                    }
                    .group-card {
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        padding: 10px;
                        page-break-inside: avoid;
                    }
                    .group-card h2 {
                        margin-top: 0;
                        padding-bottom: 5px;
                        border-bottom: 1px solid #eee;
                        text-align: center;
                        font-size: 1.1em;
                    }
                    .group-card ul {
                        list-style-type: decimal;
                        padding-right: 20px;
                        margin: 0;
                        line-height: 1;
                    }
                </style>
            </head>
            <body>
                <h1>گروه‌بندی کلاس ${sanitize(classrooms.find(c => c.id === selectedClassId)?.name || '')}</h1>
                <div class="container">${groupsHtml}</div>
            </body>
            </html>
        `;
    
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'groups.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <select value={selectedClassId} onChange={handleClassChange} className="w-full sm:w-1/3 p-2 border border-slate-300 rounded-md bg-white">
                    <option value="">-- یک کلاس را انتخاب کنید --</option>
                    {thinkingClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleGroup} disabled={!selectedClassId || selectedStudentIds.size === 0} className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-slate-400">
                    ایجاد گروه جدید
                </button>
                <button onClick={handleExportHtml} disabled={groupsInSelectedClass.length === 0} className="w-full sm:w-auto flex items-center justify-center bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:bg-slate-400">
                    <PrintIcon className="w-5 h-5 ml-2" />
                    خروجی HTML
                </button>
            </div>
            {selectedClassId && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">دانش‌آموزان کلاس</h3>
                        <div className="p-2 border rounded-lg bg-slate-50 max-h-96 overflow-y-auto">
                            <div className="p-2 border-b">
                                <label className="flex items-center text-sm font-semibold">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIds.size === studentsInSelectedClass.length && studentsInSelectedClass.length > 0}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="mr-2">انتخاب همه</span>
                                </label>
                            </div>
                            {studentsInSelectedClass.map(s => (
                                <div key={s.id} className="p-2 border-b last:border-b-0 hover:bg-slate-100">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.has(s.id)}
                                            onChange={() => handleStudentToggle(s.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className="mr-3 text-sm">{s.firstName} {s.lastName}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">گروه‌های ایجاد شده</h3>
                         <div className="space-y-3">
                            {groupsInSelectedClass.map(g => (
                                <div key={g.id} className="p-3 border rounded-lg bg-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-800">{g.name}</h4>
                                        <button onClick={() => setGroupToDelete(g.id)} className="p-1 text-slate-400 hover:text-red-600" title="حذف گروه"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                    <ul className="text-sm text-slate-600 list-decimal list-inside">
                                        {g.studentIds.map(id => studentMap.get(id)).filter(Boolean).map(s => (
                                            <li key={s!.id}>{s!.firstName} {s!.lastName}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {groupsInSelectedClass.length === 0 && <p className="text-slate-500 text-center pt-8">هنوز گروهی ایجاد نشده است.</p>}
                        </div>
                    </div>
                 </div>
            )}
            {groupToDelete && (
                 <ConfirmationModal
                    title="حذف گروه"
                    message="آیا از حذف این گروه اطمینان دارید؟"
                    onConfirm={() => { handleDeleteGroup(groupToDelete); setGroupToDelete(null); }}
                    onCancel={() => setGroupToDelete(null)}
                    confirmButtonText="بله، حذف کن"
                />
            )}
        </div>
    );
};

const ReportStudentSelectionModal: React.FC<{
    onClose: () => void;
    onGenerate: (studentIds: string[]) => void;
}> = ({ onClose, onGenerate }) => {
    const { students, classrooms, appSettings } = useAppContext();
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const thinkingClassrooms = useMemo(() => {
        const selectedIds = new Set(appSettings.thinkingClassroomIds || []);
        return classrooms.filter(c => selectedIds.has(c.id));
    }, [classrooms, appSettings.thinkingClassroomIds]);

    const studentsByClass = useMemo(() => {
        const map = new Map<string, Student[]>();
        thinkingClassrooms.forEach(c => {
            map.set(c.id, []);
        });
        const thinkingClassroomIds = new Set(thinkingClassrooms.map(c => c.id));
        students.forEach(s => {
            if (thinkingClassroomIds.has(s.classroomId)) {
                map.get(s.classroomId)?.push(s);
            }
        });
        // Sort students within each class
        map.forEach(studentList => studentList.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa')));
        return map;
    }, [students, thinkingClassrooms]);

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleToggleClass = (classroomId: string) => {
        const studentIdsInClass = studentsByClass.get(classroomId)?.map(s => s.id) || [];
        const areAllSelected = studentIdsInClass.every(id => selectedStudentIds.has(id));
        
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (areAllSelected) {
                studentIdsInClass.forEach(id => newSet.delete(id));
            } else {
                studentIdsInClass.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleGenerateClick = () => {
        onGenerate(Array.from(selectedStudentIds));
    };

    return (
        <Modal onClose={onClose}>
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">انتخاب دانش‌آموزان برای گزارش</h2>
                <div className="max-h-96 overflow-y-auto space-y-3 p-2 border rounded-md bg-slate-50">
                    {thinkingClassrooms.map(c => {
                        const studentList = studentsByClass.get(c.id) || [];
                        const studentIdsInClass = studentList.map(s => s.id);
                        const areAllSelected = studentIdsInClass.length > 0 && studentIdsInClass.every(id => selectedStudentIds.has(id));

                        return (
                            <div key={c.id}>
                                <div className="p-2 border-b bg-slate-100">
                                    <label className="flex items-center text-sm font-bold">
                                        <input
                                            type="checkbox"
                                            checked={areAllSelected}
                                            onChange={() => handleToggleClass(c.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className="mr-2">{c.name}</span>
                                    </label>
                                </div>
                                {studentList.map(s => (
                                    <div key={s.id} className="p-2 border-b last:border-b-0 hover:bg-slate-100">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.has(s.id)}
                                                onChange={() => handleToggleStudent(s.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            <span className="mr-3 text-sm">{s.firstName} {s.lastName}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
                 <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="button" onClick={handleGenerateClick} disabled={selectedStudentIds.size === 0} className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-slate-400">
                        تولید گزارش
                    </button>
                </div>
            </div>
        </Modal>
    );
};


const Observations: React.FC = () => {
    const { students, classrooms, appSettings, thinkingObservations, handleUpdateThinkingObservation } = useAppContext();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const thinkingClassrooms = useMemo(() => {
        const selectedIds = new Set(appSettings.thinkingClassroomIds || []);
        return classrooms.filter(c => selectedIds.has(c.id));
    }, [classrooms, appSettings.thinkingClassroomIds]);

    const classroomMap = useMemo(() => new Map(classrooms.map(c => [c.id, c.name])), [classrooms]);
    
    const thinkingStudents = useMemo(() => {
        const classroomIds = new Set(thinkingClassrooms.map(c => c.id));
        let filtered = students.filter(s => classroomIds.has(s.classroomId));
        if (selectedClassId) {
            filtered = filtered.filter(s => s.classroomId === selectedClassId);
        }
        return filtered.sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, thinkingClassrooms, selectedClassId]);

    const studentObservation = useMemo(() => {
        return thinkingObservations.find(obs => obs.studentId === selectedStudentId);
    }, [thinkingObservations, selectedStudentId]);

    const handleScoreChange = (questionIndex: number, score: number) => {
        if (!selectedStudentId) return;
        const currentScores = studentObservation?.scores || {};
        const newScores = { ...currentScores, [questionIndex]: score };
        handleUpdateThinkingObservation({ studentId: selectedStudentId, scores: newScores });
    };

    const handleScoreAllFive = () => {
        if (!selectedStudentId) return;
        const newScores: Record<number, number> = {};
        for (let i = 0; i < thinkingQuestions.length; i++) {
            newScores[i] = 5;
        }
        handleUpdateThinkingObservation({ studentId: selectedStudentId, scores: newScores });
    };

    const handleExport = (selectedStudentIdsForReport: string[]) => {
        setIsReportModalOpen(false);
        if (selectedStudentIdsForReport.length === 0) return;
    
        const selectedStudents = selectedStudentIdsForReport
            .map(id => students.find(s => s.id === id))
            .filter((s): s is Student => !!s)
            .sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    
        const sanitize = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
        const header = `<thead><tr><th class="question-col">معیار</th>${selectedStudents.map(s => `<th class="student-col vertical"><div>${sanitize(s.firstName)} ${sanitize(s.lastName)}</div></th>`).join('')}</tr></thead>`;

        const bodyRows = thinkingQuestions.map((q, index) => {
            const scores = selectedStudents.map(s => {
                const obs = thinkingObservations.find(o => o.studentId === s.id);
                const score = obs?.scores?.[index];
                return `<td>${score ? toPersianDigits(score) : '-'}</td>`;
            }).join('');
            return `<tr><td>${toPersianDigits(index + 1)}. ${sanitize(q)}</td>${scores}</tr>`;
        }).join('');

        const averages = selectedStudents.map(s => {
            const obs = thinkingObservations.find(o => o.studentId === s.id);
            if (obs && Object.keys(obs.scores).length > 0) {
                const scoreValues = Object.values(obs.scores);
                // FIX: Explicitly type reducer parameters to avoid type inference issues with arithmetic operations.
                const avg = scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length;
                return `<td><strong>${toPersianDigits(avg.toFixed(2))}</strong></td>`;
            }
            return '<td>-</td>';
        }).join('');
        const footerRow = `<tr class="footer-row"><td><strong>میانگین نمره کل</strong></td>${averages}</tr>`;
        
        const html = `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8"><title>گزارش مشاهدات تفکر و سبک زندگی</title>
                <style>
                    @font-face {
                        font-family: 'B Yekan';
                        src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2');
                    }
                    body { font-family: 'B Yekan', sans-serif; direction: rtl; font-size: 10pt; background-color: #f8f9fa; }
                    .container { max-width: 1200px; margin: 1em auto; background: white; padding: 1em; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #dee2e6; padding: 6px; text-align: center; }
                    th.question-col, td:first-child { text-align: right; vertical-align: middle; }
                    th { background-color: #e9ecef; }
                    tbody tr:nth-child(even) { background-color: #f8f9fa; }
                    .footer-row { background-color: #e9ecef; font-weight: bold; }
                    th.vertical { height: 150px; white-space: nowrap; padding: 5px; }
                    th.vertical > div {
                        writing-mode: vertical-rl;
                        transform: rotate(180deg);
                        text-align: center;
                    }
                    .controls { padding: 10px; background: #343a40; color: white; text-align: center; border-radius: 5px; margin-bottom: 1em; }
                    .controls button { background: #6c757d; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer; border-radius: 3px; }
                    .controls button:hover { background: #5a6268; }
                    .controls label { margin: 0 10px; }
                    @page { size: A4 portrait; margin: 1cm; }
                    @media print {
                        body { background-color: #fff; font-size: 8pt; }
                        .container { box-shadow: none; margin: 0; padding: 0; }
                        .controls { display: none; }
                        th.vertical { height: 120px; }
                        td, th { padding: 4px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="controls">
                        <label>اندازه فونت:</label>
                        <button id="font-dec">-</button>
                        <span id="font-size-display">10</span>pt
                        <button id="font-inc">+</button>
                    </div>
                    <h1>گزارش مشاهدات تفکر و سبک زندگی</h1>
                    <table>
                        ${header}
                        <tbody>${bodyRows}</tbody>
                        <tfoot>${footerRow}</tfoot>
                    </table>
                </div>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const body = document.body;
                        const display = document.getElementById('font-size-display');
                        let currentSize = 10;
                        
                        document.getElementById('font-inc').addEventListener('click', function() {
                            currentSize++;
                            updateFontSize();
                        });
                        
                        document.getElementById('font-dec').addEventListener('click', function() {
                            if (currentSize > 6) {
                                currentSize--;
                                updateFontSize();
                            }
                        });

                        function updateFontSize() {
                            body.style.fontSize = currentSize + 'pt';
                            display.textContent = currentSize;
                        }
                    });
                </script>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `observations-report.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                    <option value="">-- فیلتر کلاس --</option>
                    {thinkingClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full sm:col-span-2 p-2 border border-slate-300 rounded-md bg-white">
                    <option value="">-- یک دانش‌آموز را انتخاب کنید --</option>
                    {thinkingStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({classroomMap.get(s.classroomId)})</option>)}
                </select>
            </div>
             <div className="flex justify-end">
                <button onClick={() => setIsReportModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:bg-slate-400">
                    <PrintIcon className="w-5 h-5 ml-2" />
                    خروجی HTML گروهی
                </button>
            </div>
            {selectedStudentId ? (
                <div className="space-y-3 pt-4 border-t max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex justify-end mb-3">
                         <button
                            onClick={handleScoreAllFive}
                            className="px-4 py-1 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600"
                        >
                            ثبت همه موارد با نمره ۵
                        </button>
                    </div>
                    {thinkingQuestions.map((q, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <p className="text-sm text-slate-700 flex-grow">{toPersianDigits(index + 1)}. {q}</p>
                            <div className="flex justify-center items-center gap-2 flex-shrink-0 self-center">
                                {[1, 2, 3, 4, 5].map(score => (
                                    <button
                                        key={score}
                                        onClick={() => handleScoreChange(index, score)}
                                        className={`w-8 h-8 rounded-full transition-colors ${studentObservation?.scores[index] === score ? 'bg-sky-500 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                                    >
                                        {toPersianDigits(score)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-center text-slate-500 pt-8">برای ثبت نمرات، ابتدا یک دانش‌آموز را انتخاب کنید.</p>}
            {isReportModalOpen && <ReportStudentSelectionModal onClose={() => setIsReportModalOpen(false)} onGenerate={handleExport} />}
        </div>
    );
};

const Evaluation: React.FC = () => {
    const { students, classrooms, appSettings, thinkingObservations, thinkingEvaluations, handleUpdateThinkingEvaluation } = useAppContext();
    const [filterClassId, setFilterClassId] = useState('');

    const thinkingClassrooms = useMemo(() => {
        const selectedIds = new Set(appSettings.thinkingClassroomIds || []);
        return classrooms.filter(c => selectedIds.has(c.id));
    }, [classrooms, appSettings.thinkingClassroomIds]);

    const thinkingStudents = useMemo(() => {
        const selectedIds = new Set(appSettings.thinkingClassroomIds || []);
        let filteredStudents = students.filter(s => selectedIds.has(s.classroomId));
        if (filterClassId) {
            filteredStudents = filteredStudents.filter(s => s.classroomId === filterClassId);
        }
        return filteredStudents.sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [students, appSettings.thinkingClassroomIds, filterClassId]);

    const observationScores = useMemo(() => {
        const scoresMap = new Map<string, number>();
        thinkingObservations.forEach(obs => {
            const scores = Object.values(obs.scores);
            if (scores.length > 0) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                scoresMap.set(obs.studentId, parseFloat(avg.toFixed(2)));
            }
        });
        return scoresMap;
    }, [thinkingObservations]);
    
    const evaluationMap = useMemo(() => new Map(thinkingEvaluations.map(e => [e.studentId, e])), [thinkingEvaluations]);

    const handleScoreChange = (studentId: string, field: keyof Omit<ThinkingEvaluation, 'studentId'>, value: string) => {
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        if (numValue < 0) numValue = 0;
        if (numValue > 5) numValue = 5;

        const currentEval = evaluationMap.get(studentId) || { studentId };
        const newEval = { ...currentEval, [field]: numValue };
        handleUpdateThinkingEvaluation(newEval);
    };
    
    const handleExport = () => {
        if (!filterClassId) {
            alert('لطفا برای دریافت خروجی، یک کلاس را از فیلتر انتخاب کنید.');
            return;
        }
        const studentsToExport = thinkingStudents.filter(s => s.classroomId === filterClassId);
        if (studentsToExport.length === 0) return;

        const sanitize = (str: string | undefined) => (str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;

        const tableRows = studentsToExport.map(student => {
            const evaluation = evaluationMap.get(student.id);
            const obsScore = observationScores.get(student.id) || 0;
            const actScore = evaluation?.activityScore || 0;
            const proScore = evaluation?.projectScore || 0;
            const exmScore = evaluation?.examScore || 0;
            // FIX: Ensure all operands are numbers before performing addition.
            const total = Number(obsScore) + Number(actScore) + Number(proScore) + Number(exmScore);
            
            const photoContent = student.photoUrl 
                ? `<img src="${student.photoUrl}" alt="photo" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-left: 8px;">`
                : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #e9ecef; display:flex; align-items:center; justify-content:center; margin-left: 8px;">${userIconSvg}</div>`;

            return `
                <tr>
                    <td class="student-cell">${photoContent}<span>${sanitize(student.firstName)} ${sanitize(student.lastName)}</span></td>
                    <td>${toPersianDigits(obsScore.toFixed(2))}</td>
                    <td>${toPersianDigits(actScore)}</td>
                    <td>${toPersianDigits(proScore)}</td>
                    <td>${toPersianDigits(exmScore)}</td>
                    <td class="total-cell">${toPersianDigits(total.toFixed(2))}</td>
                </tr>
            `;
        }).join('');

        const selectedClass = classrooms.find(c => c.id === filterClassId);
        const title = `ارزشیابی تفکر و سبک زندگی - کلاس ${sanitize(selectedClass?.name)}`;

        const html = `
            <!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
            <style>
                @font-face {
                  font-family: 'B Yekan';
                  src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2');
                }
                body{font-family:'B Yekan', sans-serif;direction:rtl; background: #f8f9fa; font-size: 10pt;}
                .container { max-width: 1200px; margin: 1em auto; background: white; padding: 1em; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #dee2e6; padding: 8px; text-align: center; vertical-align: middle; }
                th { background-color: #e9ecef; }
                tbody tr:nth-child(even) { background-color: #f8f9fa; }
                .student-cell { display: flex; align-items: center; text-align: right; }
                .total-cell { font-weight: bold; background-color: #e9ecef; }
                .controls { padding: 10px; background: #343a40; color: white; text-align: center; border-radius: 5px; margin-bottom: 1em; }
                .controls button { background: #6c757d; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer; border-radius: 3px; }
                @page { size: A4 portrait; margin: 1cm; }
                @media print {
                    body { background: none; font-size: 9pt; }
                    .container { box-shadow: none; padding: 0; margin: 0; }
                    .controls { display: none; }
                    td, th { padding: 5px; }
                }
            </style>
            </head><body>
                <div class="container">
                    <div class="controls">
                        <label>اندازه فونت:</label>
                        <button id="font-dec">-</button>
                        <span id="font-size-display">10</span>pt
                        <button id="font-inc">+</button>
                    </div>
                    <h1>${title}</h1>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30%;">دانش‌آموز</th>
                                <th>مشاهدات (۵)</th>
                                <th>فعالیت (۵)</th>
                                <th>پروژه (۵)</th>
                                <th>امتحان (۵)</th>
                                <th>مجموع (۲۰)</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const body = document.body;
                        const display = document.getElementById('font-size-display');
                        let currentSize = 10;
                        
                        document.getElementById('font-inc').addEventListener('click', function() {
                            currentSize++;
                            updateFontSize();
                        });
                        
                        document.getElementById('font-dec').addEventListener('click', function() {
                            if (currentSize > 6) {
                                currentSize--;
                                updateFontSize();
                            }
                        });

                        function updateFontSize() {
                            body.style.fontSize = currentSize + 'pt';
                            display.textContent = currentSize;
                        }
                    });
                </script>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'evaluation-report.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                 <select value={filterClassId} onChange={e => setFilterClassId(e.target.value)} className="w-full sm:w-1/3 p-2 border border-slate-300 rounded-md bg-white">
                    <option value="">-- همه کلاس‌ها --</option>
                    {thinkingClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleExport} disabled={!filterClassId} title={!filterClassId ? "برای دریافت خروجی، ابتدا یک کلاس را فیلتر کنید" : "دریافت خروجی HTML برای کلاس انتخاب شده"} className="w-full sm:w-auto flex items-center justify-center bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    <PrintIcon className="w-5 h-5 ml-2" />
                    خروجی HTML کلاس
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">دانش‌آموز</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase">مشاهدات (۵)</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase">فعالیت (۵)</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase">پروژه (۵)</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase">امتحان (۵)</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase">مجموع (۲۰)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {thinkingStudents.map(student => {
                            const evaluation = evaluationMap.get(student.id);
                            const obsScore = observationScores.get(student.id) || 0;
                            const activityScore = evaluation?.activityScore ?? 0;
                            const projectScore = evaluation?.projectScore ?? 0;
                            const examScore = evaluation?.examScore ?? 0;
                            const totalScore = obsScore + activityScore + projectScore + examScore;

                            return (
                                <tr key={student.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <ProfilePhoto photoUrl={student.photoUrl} alt={student.firstName} className="w-8 h-8 rounded-full ml-3 flex-shrink-0" />
                                            <p className="text-sm font-medium text-slate-900">{student.firstName} {student.lastName}</p>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-center text-sm font-bold text-sky-700 bg-sky-50">{toPersianDigits(obsScore.toFixed(2))}</td>
                                    <td className="px-2 py-2"><input type="number" step="0.25" min="0" max="5" value={evaluation?.activityScore ?? ''} onChange={e => handleScoreChange(student.id, 'activityScore', e.target.value)} className="w-16 p-1 text-center border rounded-md" /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.25" min="0" max="5" value={evaluation?.projectScore ?? ''} onChange={e => handleScoreChange(student.id, 'projectScore', e.target.value)} className="w-16 p-1 text-center border rounded-md" /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.25" min="0" max="5" value={evaluation?.examScore ?? ''} onChange={e => handleScoreChange(student.id, 'examScore', e.target.value)} className="w-16 p-1 text-center border rounded-md" /></td>
                                    <td className="px-2 py-2 text-center text-sm font-bold text-green-700 bg-green-50">{toPersianDigits(totalScore.toFixed(2))}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {thinkingStudents.length === 0 && (
                    <div className="text-center p-8 text-slate-500">
                        <p>دانش‌آموزی در کلاس(های) انتخاب شده یافت نشد.</p>
                    </div>
                )}
            </div>
        </div>
    );
};