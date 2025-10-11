import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowRightIcon, PlusIcon, TrashIcon, PrintIcon, SaveIcon, ChevronDownIcon, SearchIcon, Bars2Icon, EditIcon } from './icons';
import { Student, StudentGroup, ThinkingObservation, ThinkingEvaluation } from '../types';
import ProfilePhoto from './ProfilePhoto';
import { toPersianDigits, normalizePersianChars } from '../utils/helpers';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';

const observationQuestionsCount = 20;

const OBSERVATION_QUESTIONS = [
    "۱. به محتوای فیلم، داستان و صحبت دیگران با دقت توجه می‌کند.",
    "۲. یک موضوع را همه‌جانبه و دقیق بررسی می‌کند.",
    "۳. به نظر دیگران با تأمل می‌نگرد و با پرسش مناسب، دیگران را به توضیح نظرات خود تشویق می‌کند.",
    "۴. هنگام گفتگو به احساسات دیگران توجه کرده و هنگام مخالفت، با احترام صحبت می‌کند.",
    "۵. برای توضیح ایده‌ها و تصمیم‌های خود از زبان صحیح و دقیق استفاده می‌کند.",
    "۶. در مباحثات، نظراتش غیرتکراری است و سیر تکاملی دارد.",
    "۷. برای تبیین نظر خود استدلال می‌کند و توانایی دفاع منطقی از آن را دارد.",
    "۸. به هنگام بحث، هیجانات خود (مانند خشم و نفرت) را کنترل می‌کند.",
    "۹. تفاوت‌ها، شباهت‌ها و روابط بین پدیده‌ها و نظرات را شناسایی و بیان می‌کند.",
    "۱۰. قادر به ایجاد ارتباط بین تجارب خود و دیگران با موضوع بحث است.",
    "۱۱. سؤال‌های جدیدی می‌پرسد که فراتر از فعالیت‌های انجام شده است.",
    "۱۲. از عملکرد عجولانه و بدون فکر پرهیز می‌کند.",
    "۱۳. تحمل شنیدن نظر دیگران را دارد و در صورت لزوم، نظر خود را اصلاح می‌کند.",
    "۱۴. در برخورد با پدیده‌ها و مسائل، زود قضاوت نمی‌کند.",
    "۱۵. هنگام نقد، قضاوت و ارزشیابی هر موضوع، از معیار مناسب استفاده می‌کند.",
    "۱۶. قادر به توضیح احساسات، تجربیات و ارزیابی خود در یک موقعیت یادگیری است.",
    "۱۷. با بررسی مسئله، راه‌های یافتن پاسخ سؤال را تشخیص می‌دهد.",
    "۱۸. برای روش مشاهده و نظرسنجی، پرسش مناسب طرح می‌کند.",
    "۱۹. برای حل مسئله، به روش‌های مختلف اطلاعات جمع‌آوری می‌کند.",
    "۲۰. برای دستیابی به پاسخ پرسش‌های خود برنامه‌ریزی می‌کند."
];


type Tab = 'classes' | 'grouping' | 'observation' | 'evaluation';

// Re-usable Tab Button Component
const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
            active
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        {children}
    </button>
);

// Tab 1: Classes Selection
const ClassesTab: React.FC = () => {
    const { classrooms, appSettings, setAppSettings } = useAppContext();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(appSettings.thinkingClassroomIds || []));
    const [toast, setToast] = useState('');

    const handleToggle = (classroomId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(classroomId)) {
            newIds.delete(classroomId);
        } else {
            newIds.add(classroomId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = async () => {
        await setAppSettings(prev => ({ ...prev, thinkingClassroomIds: Array.from(selectedIds) }));
        setToast('تغییرات با موفقیت ذخیره شد.');
        setTimeout(() => setToast(''), 2000);
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-700">انتخاب کلاس‌های تفکر و سبک زندگی</h2>
            <p className="text-sm text-slate-500">کلاس‌هایی که این درس را دارند انتخاب کنید تا در سایر بخش‌ها نمایش داده شوند.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {classrooms.map(c => (
                    <div key={c.id} className="flex items-center p-3 bg-slate-50 rounded-md border">
                        <input
                            type="checkbox"
                            id={`class-${c.id}`}
                            checked={selectedIds.has(c.id)}
                            onChange={() => handleToggle(c.id)}
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor={`class-${c.id}`} className="mr-3 text-sm font-medium text-slate-800">{c.name}</label>
                    </div>
                ))}
            </div>
            <div className="flex justify-center pt-4">
                <button onClick={handleSave} title="ذخیره" className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                    <SaveIcon className="w-6 h-6" />
                </button>
            </div>
            {toast && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg">
                    {toast}
                </div>
            )}
        </div>
    );
};

// Tab 2: Grouping
const GroupingTab: React.FC<{ thinkingClassrooms: any[] }> = ({ thinkingClassrooms }) => {
    const { students, studentGroups, handleSaveGroup, handleUpdateGroup, handleDeleteGroup, handleMoveStudentToGroup, handleReorderStudentGroups } = useAppContext();
    const [selectedClassroomId, setSelectedClassroomId] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<StudentGroup | null>(null);
    const [ungroupedSearchTerm, setUngroupedSearchTerm] = useState('');
    const [selectedUngroupedIds, setSelectedUngroupedIds] = useState<Set<string>>(new Set());

    const dragStudentId = useRef<string | null>(null);
    const dragSourceGroupId = useRef<string | null>(null);
    const dragGroupIndex = useRef<number | null>(null);
    const dragOverGroupIndex = useRef<number | null>(null);
    
    const studentsInClass = useMemo(() => {
        return students.filter(s => s.classroomId === selectedClassroomId);
    }, [students, selectedClassroomId]);

    const groupsInClass = useMemo(() => {
        return studentGroups
            .filter(g => g.classroomId === selectedClassroomId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [studentGroups, selectedClassroomId]);
    
    const [localGroupsInClass, setLocalGroupsInClass] = useState(groupsInClass);
    useEffect(() => {
        setLocalGroupsInClass(groupsInClass);
    }, [groupsInClass]);

    const ungroupedStudents = useMemo(() => {
        const groupedStudentIds = new Set(groupsInClass.flatMap(g => g.studentIds));
        return studentsInClass
            .filter(s => !groupedStudentIds.has(s.id))
            .sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [studentsInClass, groupsInClass]);

    const filteredUngroupedStudents = useMemo(() => {
        if (!ungroupedSearchTerm) return ungroupedStudents;
        const normalizedSearch = normalizePersianChars(ungroupedSearchTerm.toLowerCase());
        return ungroupedStudents.filter(s => 
            normalizePersianChars(`${s.firstName} ${s.lastName}`).toLowerCase().includes(normalizedSearch)
        );
    }, [ungroupedStudents, ungroupedSearchTerm]);

    const handleAddGroup = (name: string) => {
        if (selectedClassroomId && selectedUngroupedIds.size > 0) {
            const maxOrder = Math.max(-1, ...groupsInClass.map(g => g.order ?? -1));
            
            handleSaveGroup({ 
                name, 
                classroomId: selectedClassroomId, 
                studentIds: Array.from(selectedUngroupedIds),
                order: maxOrder + 1
            });
            setIsAddModalOpen(false);
            setSelectedUngroupedIds(new Set());
        }
    };

    const confirmDeleteGroup = () => {
        if (groupToDelete) {
            handleDeleteGroup(groupToDelete.id);
            setGroupToDelete(null);
        }
    };
    
    const handleStudentDrop = (destinationGroupId: string | null) => {
        if (dragStudentId.current) {
            handleMoveStudentToGroup(dragStudentId.current, dragSourceGroupId.current, destinationGroupId);
        }
        dragStudentId.current = null;
        dragSourceGroupId.current = null;
    };
    
    const handleGroupDragEnd = () => {
        if (dragGroupIndex.current !== null && dragOverGroupIndex.current !== null && dragGroupIndex.current !== dragOverGroupIndex.current) {
            const reordered = [...localGroupsInClass];
            const draggedItem = reordered.splice(dragGroupIndex.current, 1)[0];
            reordered.splice(dragOverGroupIndex.current, 0, draggedItem);
            setLocalGroupsInClass(reordered);
            handleReorderStudentGroups(reordered);
        }
        dragGroupIndex.current = null;
        dragOverGroupIndex.current = null;
    };

    const handleUngroupedSelection = (studentId: string) => {
        const newSelection = new Set(selectedUngroupedIds);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedUngroupedIds(newSelection);
    };

    const handleExportHtml = () => {
        const classroomName = thinkingClassrooms.find(c => c.id === selectedClassroomId)?.name || 'کلاس';
        const studentMap = new Map(studentsInClass.map(s => [s.id, s]));

        const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;

        const groupHtml = localGroupsInClass.map(group => {
            // FIX: Ensure student objects exist before sorting to prevent accessing 'lastName' on undefined.
            const sortedStudentIds = [...group.studentIds].sort((aId, bId) => {
                const studentA = studentMap.get(aId);
                const studentB = studentMap.get(bId);
                return studentA && studentB ? studentA.lastName.localeCompare(studentB.lastName, 'fa') : 0;
            });

            // FIX: Ensure student object exists before accessing its properties to generate HTML.
            const studentsHtml = sortedStudentIds.map(studentId => {
                const student = studentMap.get(studentId);
                if (!student) return '';
                const photoContent = student.photoUrl 
                    ? `<img src="${student.photoUrl}" alt="photo" class="profile-photo">`
                    : `<div class="profile-photo icon-placeholder">${userIconSvg}</div>`;

                return `<li class="student-item">${photoContent} ${student.firstName} ${student.lastName}</li>`;
            }).join('');

            return `
                <div class="group-card">
                    <h3 class="group-title">${group.name}</h3>
                    <ul class="student-list">${studentsHtml}</ul>
                    <div class="notes-section">
                        <h4>توضیحات:</h4>
                        <div class="notes-lines"></div>
                    </div>
                </div>
            `;
        }).join('');

        const htmlTemplate = `
            <!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>گروه‌بندی کلاس ${classroomName}</title>
            <style>
                @font-face { font-family: 'B Yekan'; src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2'); }
                body { font-family: 'B Yekan', sans-serif; background: #f0f2f5; }
                .container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding: 15px; }
                h1 { text-align: center; width: 100%; grid-column: 1 / -1; }
                .group-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 15px; page-break-inside: avoid; display: flex; flex-direction: column; }
                .group-title { margin: 0 0 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; font-size: 1.1em; color: #333; }
                .student-list { list-style: none; padding: 0; margin: 0; flex-grow: 1; }
                .student-item { display: flex; align-items: center; margin-bottom: 8px; font-size: 0.9em; }
                .profile-photo { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-left: 8px; flex-shrink: 0; }
                .icon-placeholder { background: #e9ecef; display:flex; align-items:center; justify-content:center; }
                .notes-section { margin-top: 15px; }
                .notes-section h4 { margin: 0 0 5px; font-size: 0.8em; color: #666; }
                .notes-lines { border-top: 1px dashed #ccc; height: 50px; }
                @page { size: A4; margin: 1cm; }
                @media print { body { background: none; } .container { grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0;} .group-card { box-shadow: none; border: 1px solid #ccc;} }
            </style></head><body>
            <h1>گروه‌بندی کلاس: ${classroomName}</h1>
            <div class="container">${groupHtml}</div></body></html>`;

        const blob = new Blob([htmlTemplate], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `grouping-${classroomName}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="space-y-4">
             <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div className="max-w-xs flex-grow">
                        <label htmlFor="classroom-select-grouping" className="block text-sm font-medium text-slate-700 mb-1">انتخاب کلاس:</label>
                        <select
                            id="classroom-select-grouping"
                            value={selectedClassroomId}
                            onChange={e => setSelectedClassroomId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="">-- یک کلاس را انتخاب کنید --</option>
                            {thinkingClassrooms.map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
                        </select>
                    </div>
                     <div className="flex gap-2">
                        <button onClick={() => setIsAddModalOpen(true)} disabled={!selectedClassroomId || selectedUngroupedIds.size === 0} className="flex items-center bg-sky-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-sky-600 transition-colors text-sm disabled:bg-slate-400">
                            <PlusIcon className="w-4 h-4" /><span className="mr-2">ایجاد گروه با افراد منتخب</span>
                        </button>
                        <button onClick={handleExportHtml} disabled={groupsInClass.length === 0} className="flex items-center bg-teal-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-teal-600 transition-colors text-sm disabled:bg-slate-400">
                            <PrintIcon className="w-4 h-4" /><span className="mr-2">خروجی</span>
                        </button>
                    </div>
                </div>
            </div>

            {selectedClassroomId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {/* Ungrouped Students */}
                    <div 
                        onDrop={() => handleStudentDrop(null)} 
                        onDragOver={(e) => e.preventDefault()}
                        className="bg-white p-3 rounded-xl shadow-sm border-2 border-dashed border-slate-300 min-h-[200px]"
                    >
                        <h3 className="font-bold text-slate-700 mb-3 text-right">گروه‌بندی نشده ({toPersianDigits(ungroupedStudents.length)})</h3>
                        <div className="relative mb-2">
                            <input
                                type="text"
                                placeholder="جستجو..."
                                value={ungroupedSearchTerm}
                                onChange={e => setUngroupedSearchTerm(e.target.value)}
                                className="w-full p-1.5 pr-8 border rounded-md text-sm"
                            />
                            <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto force-scrollbar-right">
                            {filteredUngroupedStudents.map(student => (
                                <div
                                    key={student.id}
                                    draggable
                                    onDragStart={(e) => { e.stopPropagation(); dragStudentId.current = student.id; dragSourceGroupId.current = null; }}
                                    className="p-2 bg-slate-100 rounded-md flex items-center gap-2 cursor-grab"
                                >
                                    <input type="checkbox" checked={selectedUngroupedIds.has(student.id)} onChange={() => handleUngroupedSelection(student.id)} className="h-4 w-4 rounded" />
                                    <ProfilePhoto photoUrl={student.photoUrl} alt={student.firstName} className="w-6 h-6 rounded-full" />
                                    <label className="text-sm flex-grow cursor-pointer" onClick={() => handleUngroupedSelection(student.id)}>{student.firstName} {student.lastName}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Groups */}
                    {localGroupsInClass.map((group, index) => (
                        <div 
                            key={group.id} 
                            onDrop={() => handleStudentDrop(group.id)} 
                            onDragOver={(e) => e.preventDefault()}
                            draggable
                            onDragStart={() => dragGroupIndex.current = index}
                            onDragEnter={() => dragOverGroupIndex.current = index}
                            onDragEnd={handleGroupDragEnd}
                            className={`bg-white p-3 rounded-xl shadow-sm border-2 border-solid border-slate-200 min-h-[200px] transition-opacity ${dragGroupIndex.current === index ? 'opacity-50' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-800">{group.name}</h3>
                                <div className='flex items-center'>
                                    <button onClick={() => setEditingGroup(group)} className="p-1 text-slate-400 hover:text-sky-500" title="ویرایش نام گروه"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setGroupToDelete(group)} className="p-1 text-slate-400 hover:text-red-500" title="حذف گروه"><TrashIcon className="w-4 h-4"/></button>
                                    <Bars2Icon className="w-5 h-5 text-slate-400 cursor-grab" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {[...group.studentIds]
                                .map(id => students.find(s => s.id === id))
                                .filter((s): s is Student => !!s)
                                .sort((a,b) => a.lastName.localeCompare(b.lastName, 'fa'))
                                .map(student => {
                                    return (
                                        <div
                                            key={student.id}
                                            draggable
                                            onDragStart={(e) => { e.stopPropagation(); dragStudentId.current = student.id; dragSourceGroupId.current = group.id; }}
                                            className="p-2 bg-sky-50 rounded-md cursor-grab flex items-center gap-2"
                                        >
                                            <ProfilePhoto photoUrl={student.photoUrl} alt={student.firstName} className="w-6 h-6 rounded-full" />
                                            <span className="text-sm">{student.firstName} {student.lastName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {isAddModalOpen && <AddGroupModal onAdd={handleAddGroup} onClose={() => setIsAddModalOpen(false)} />}
            {editingGroup && <EditGroupModal group={editingGroup} onClose={() => setEditingGroup(null)} onSave={(newName) => { handleUpdateGroup({ ...editingGroup, name: newName }); setEditingGroup(null); }} />}
            {groupToDelete && <ConfirmationModal title="حذف گروه" message={<p>آیا از حذف گروه <strong>{groupToDelete.name}</strong> اطمینان دارید؟ دانش‌آموزان آن به لیست گروه‌بندی نشده منتقل می‌شوند.</p>} onConfirm={confirmDeleteGroup} onCancel={() => setGroupToDelete(null)} confirmButtonText="بله، حذف کن" />}
        </div>
    );
};

// Tab 3 & 4: Observation & Evaluation
const ScoresTab: React.FC<{
    mode: 'observation' | 'evaluation';
    thinkingClassrooms: any[];
}> = ({ mode, thinkingClassrooms }) => {
    const { 
        students, 
        thinkingObservations, 
        thinkingEvaluations,
        handleUpdateThinkingObservation,
        handleUpdateThinkingEvaluation
    } = useAppContext();

    const [selectedClassroomId, setSelectedClassroomId] = useState('');
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
    
    const observationMap = useMemo(() => new Map(thinkingObservations.map(o => [o.studentId, o])), [thinkingObservations]);
    const evaluationMap = useMemo(() => new Map(thinkingEvaluations.map(e => [e.studentId, e])), [thinkingEvaluations]);
    
    const studentsInClass = useMemo(() => {
        if (!selectedClassroomId) return [];
        return students.filter(s => s.classroomId === selectedClassroomId)
            .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fa'));
    }, [selectedClassroomId, students]);

    const handleObservationChange = (studentId: string, questionIndex: number, score: number) => {
        const currentObservation = observationMap.get(studentId) || { studentId, scores: {} };
        let newScore = score;
        if (newScore > 5) newScore = 5;
        if (newScore < 0) newScore = 0;

        const updatedScores = { ...currentObservation.scores };
        if (newScore >= 1 && newScore <=5) {
             updatedScores[questionIndex] = newScore;
        } else {
            delete updatedScores[questionIndex];
        }

        const updatedObservation = { ...currentObservation, scores: updatedScores };
        handleUpdateThinkingObservation(updatedObservation);
    };

    const handleEvaluationChange = (studentId: string, field: keyof Omit<ThinkingEvaluation, 'studentId'>, score: number) => {
        const currentEvaluation = evaluationMap.get(studentId) || { studentId };
        let newScore = score;
        if (newScore > 5) newScore = 5;
        if (newScore < 0) newScore = 0;
        
        const updatedEvaluation = { ...currentEvaluation, [field]: newScore };
        handleUpdateThinkingEvaluation(updatedEvaluation);
    };
    
    const handleToggleExportSelection = (studentId: string) => {
        const newSelection = new Set(selectedForExport);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedForExport(newSelection);
    };

    const handleExportObservation = () => {
        const classroomName = thinkingClassrooms.find(c => c.id === selectedClassroomId)?.name || 'کلاس';
        const selectedStudents = studentsInClass.filter(s => selectedForExport.has(s.id));
        if (selectedStudents.length === 0) return;

        const studentHeaders = selectedStudents.map(s => `<th style="writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; padding: 10px 4px;">${s.firstName} ${s.lastName}</th>`).join('');
        
        let totalScoresRow = '<tr><td style="font-weight: bold; text-align: right;">جمع کل</td>';
        let averageScoresRow = '<tr><td style="font-weight: bold; text-align: right;">میانگین نمره (از ۵)</td>';
        
        const questionRows = OBSERVATION_QUESTIONS.map((q, index) => {
            const scores = selectedStudents.map(s => {
                const obs = observationMap.get(s.id);
                return `<td>${toPersianDigits(obs?.scores[index] || '-')}</td>`;
            }).join('');
            return `<tr><td style="text-align: right; white-space: nowrap; max-width: 300px;">${q}</td>${scores}</tr>`;
        }).join('');
        
        selectedStudents.forEach(s => {
            const obs = observationMap.get(s.id);
            const total = obs ? Object.values(obs.scores).reduce((sum, score) => sum + (Number(score) || 0), 0) : 0;
            totalScoresRow += `<td style="font-weight: bold;">${toPersianDigits(total)}</td>`;

            const averageOutOf5 = (total / (observationQuestionsCount * 5)) * 5;
            averageScoresRow += `<td style="font-weight: bold;">${toPersianDigits(averageOutOf5.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'))}</td>`;
        });
        totalScoresRow += '</tr>';
        averageScoresRow += '</tr>';

        const html = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>فرم مشاهده - ${classroomName}</title>
            <style>
                @font-face { font-family: 'B Yekan'; src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2'); }
                body { font-family: 'B Yekan', sans-serif; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; table-layout: fixed; }
                th, td { border: 1px solid #ccc; padding: 5px; text-align: center; }
                thead th { background: #f2f2f2; }
                td:first-child { width: auto !important; } /* Let the first column size itself */
                @page { size: A4 landscape; margin: 1cm; }
            </style></head><body>
            <h2 style="text-align:center;">فرم مشاهده تفکر و سبک زندگی - کلاس: ${classroomName}</h2>
            <table><thead><tr><th style="text-align: right; width: 30%;">سوالات</th>${studentHeaders}</tr></thead><tbody>${questionRows}${totalScoresRow}${averageScoresRow}</tbody></table></body></html>`;

        const blob = new Blob([html,], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `observation-${classroomName}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleExportEvaluation = () => {
        const classroomName = thinkingClassrooms.find(c => c.id === selectedClassroomId)?.name || 'کلاس';
        const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
        
        const studentRows = studentsInClass.map((student, index) => {
            const obs = observationMap.get(student.id);
            const totalRawScore = obs ? Object.values(obs.scores).reduce((sum, score: unknown) => sum + (Number(score) || 0), 0) : 0;
            const observationScoreOutOf5 = (totalRawScore / 100) * 5;

            const eva = evaluationMap.get(student.id);
            const activity = Number(eva?.activityScore || 0);
            const project = Number(eva?.projectScore || 0);
            const exam = Number(eva?.examScore || 0);
            const final = observationScoreOutOf5 + activity + project + exam;
            
            const photoContent = student.photoUrl ? `<img src="${student.photoUrl}" class="profile-photo">` : `<div class="profile-photo icon-placeholder">${userIconSvg}</div>`;

            const format = (n: number) => toPersianDigits(n.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'));

            return `<tr>
                <td>${toPersianDigits(index + 1)}</td>
                <td class="student-cell">${photoContent}${student.firstName} ${student.lastName}</td>
                <td>${format(observationScoreOutOf5)}</td>
                <td>${format(activity)}</td>
                <td>${format(project)}</td>
                <td>${format(exam)}</td>
                <td style="font-weight:bold;">${format(final)}</td>
            </tr>`;
        }).join('');

        const html = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>ارزشیابی - ${classroomName}</title>
            <style>
                @font-face { font-family: 'B Yekan'; src: url('https://cdn.jsdelivr.net/gh/s-amir-p/F fonts/BYekan/BYekan+.woff2') format('woff2'); }
                body { font-family: 'B Yekan', sans-serif; font-size: 8pt; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 2px; text-align: center; }
                thead th { background: #f2f2f2; white-space: nowrap; }
                .student-cell { text-align: right; display: flex; align-items: center; gap: 3px; }
                .profile-photo { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
                .icon-placeholder { background: #e9ecef; display:flex; align-items:center; justify-content:center; }
                .icon-placeholder svg { width: 14px; height: 14px; }
                @page { size: A4 portrait; margin: 0.5cm; }
            </style></head><body>
            <h2 style="text-align:center;">فرم ارزشیابی تفکر و سبک زندگی - کلاس: ${classroomName}</h2>
            <table><thead>
                <tr>
                    <th style="width: 3%;">#</th>
                    <th style="text-align: right;">دانش‌آموز</th>
                    <th style="width: 8%;">مشاهده (۵)</th>
                    <th style="width: 8%;">فعالیت (۵)</th>
                    <th style="width: 8%;">پروژه (۵)</th>
                    <th style="width: 8%;">امتحان (۵)</th>
                    <th style="width: 10%;">نمره نهایی (۲۰)</th>
                </tr>
            </thead><tbody>${studentRows}</tbody></table></body></html>`;

        const blob = new Blob([html,], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `evaluation-${classroomName}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    const ScoresComponent = mode === 'observation' ? ObservationScores : EvaluationScores;

    return (
        <div className="space-y-4">
             <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="max-w-md flex-grow">
                        <label htmlFor={`classroom-select-${mode}`} className="block text-sm font-medium text-slate-700 mb-1">انتخاب کلاس:</label>
                        <select
                            id={`classroom-select-${mode}`}
                            value={selectedClassroomId}
                            onChange={e => { setSelectedClassroomId(e.target.value); setExpandedStudentId(null); setSelectedForExport(new Set()); }}
                            className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="">-- یک کلاس را انتخاب کنید --</option>
                            {thinkingClassrooms.map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
                        </select>
                    </div>
                     <button 
                        onClick={mode === 'observation' ? handleExportObservation : handleExportEvaluation}
                        disabled={selectedClassroomId === '' || (mode === 'observation' && selectedForExport.size === 0)}
                        className="flex items-center bg-teal-500 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-teal-600 transition-colors text-sm disabled:bg-slate-400"
                    >
                        <PrintIcon className="w-4 h-4" /><span className="mr-2">خروجی</span>
                    </button>
                </div>
            </div>
            
            {selectedClassroomId && (
                <div className="space-y-3">
                    {studentsInClass.map(student => (
                        <div key={student.id} className="bg-white p-3 rounded-xl shadow-sm">
                            <div className="w-full flex justify-between items-center">
                                {mode === 'observation' && 
                                    <input 
                                        type="checkbox"
                                        className="h-4 w-4 rounded ml-3"
                                        checked={selectedForExport.has(student.id)}
                                        onChange={() => handleToggleExportSelection(student.id)}
                                    />
                                }
                                <button
                                    onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                                    className="flex-grow flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <ProfilePhoto photoUrl={student.photoUrl} alt={student.firstName} className="w-10 h-10 rounded-full" />
                                        <span className="font-semibold">{student.firstName} {student.lastName}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${expandedStudentId === student.id ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            {expandedStudentId === student.id && (
                                <div className="mt-4 pt-4 border-t">
                                    <ScoresComponent
                                        student={student}
                                        observation={observationMap.get(student.id)}
                                        evaluation={evaluationMap.get(student.id)}
                                        onObservationChange={handleObservationChange}
                                        onEvaluationChange={handleEvaluationChange}
                                        handleUpdateThinkingObservation={handleUpdateThinkingObservation}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                     {studentsInClass.length === 0 && (
                        <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                            <p className="text-slate-500">کلاس انتخاب شده دانش‌آموزی ندارد.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ObservationScores: React.FC<any> = ({ student, observation, onObservationChange, handleUpdateThinkingObservation }) => {
    const totalObservationScore = useMemo(() => {
        if (!observation?.scores) return 0;
        // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'.
        return Object.values(observation.scores).reduce((sum, score) => sum + Number(score), 0);
    }, [observation]);

    const handleScoreAllFive = () => {
        const newScores: Record<number, number> = {};
        for (let i = 0; i < observationQuestionsCount; i++) {
            newScores[i] = 5;
        }
        handleUpdateThinkingObservation({ studentId: student.id, scores: newScores });
    };

    return (
        <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-700">فرم مشاهده (مجموع: {toPersianDigits(totalObservationScore)})</h4>
                <button onClick={handleScoreAllFive} className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-md hover:bg-green-200">به همه ۵ بده</button>
            </div>
            <table className="min-w-full">
                <tbody>
                    {OBSERVATION_QUESTIONS.map((question, index) => (
                        <tr key={index} className="border-b">
                            <td className="py-2 pr-2 text-sm text-slate-600 text-right">{question}</td>
                            <td className="py-2 pl-2 w-20">
                                <input
                                    type="number" min="1" max="5" value={observation?.scores[index] || ''}
                                    onChange={(e) => onObservationChange(student.id, index, parseInt(e.target.value) || 0)}
                                    className="w-full text-center p-1 border rounded-md"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const EvaluationScores: React.FC<any> = ({ student, observation, evaluation, onEvaluationChange }) => {
    
    const observationScoreOutOf5 = useMemo(() => {
        if (!observation?.scores) return 0;
        // FIX: Argument of type 'unknown' is not assignable to parameter of type 'string | number'.
        const totalRawScore = Object.values(observation.scores).reduce((sum, score) => sum + Number(score), 0);
        return (totalRawScore / 100) * 5;
    }, [observation]);

    const finalScore = useMemo(() => {
        if (!evaluation) return observationScoreOutOf5;
        // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'. Also ensures properties are treated as numbers, handling undefined.
        return observationScoreOutOf5 + (Number(evaluation.activityScore) || 0) + (Number(evaluation.projectScore) || 0) + (Number(evaluation.examScore) || 0);
    }, [evaluation, observationScoreOutOf5]);
    
    const formattedFinalScore = finalScore.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

    return (
         <div>
            <h4 className="font-semibold text-slate-700 mb-2">ارزشیابی پایانی (نمره نهایی از ۲۰: {toPersianDigits(formattedFinalScore)})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                 <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">مشاهده (۵)</label>
                    <p className="p-2 bg-slate-100 text-slate-800 font-bold rounded-md text-center h-[42px] flex items-center justify-center">
                       {toPersianDigits(observationScoreOutOf5.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'))}
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">فعالیت کلاسی (۵)</label>
                    <input type="number" min="0" max="5" step="0.25" value={evaluation?.activityScore ?? ''} onChange={(e) => onEvaluationChange(student.id, 'activityScore', parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">پروژه (۵)</label>
                    <input type="number" min="0" max="5" step="0.25" value={evaluation?.projectScore ?? ''} onChange={(e) => onEvaluationChange(student.id, 'projectScore', parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">امتحان کتبی (۵)</label>
                    <input type="number" min="0" max="5" step="0.25" value={evaluation?.examScore ?? ''} onChange={(e) => onEvaluationChange(student.id, 'examScore', parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">نمره نهایی</label>
                    <p className="p-2 bg-sky-100 text-sky-800 font-bold text-xl rounded-md text-center h-[42px] flex items-center justify-center">
                        {toPersianDigits(formattedFinalScore)}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Component for adding a new group
const AddGroupModal: React.FC<{ onAdd: (name: string) => void; onClose: () => void; }> = ({ onAdd, onClose }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAdd(normalizePersianChars(name.trim()));
        }
    };
    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">افزودن گروه جدید</h2>
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 mb-1">نام گروه</label>
                    <input id="groupName" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md" autoFocus required />
                </div>
                <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">افزودن</button>
                </div>
            </form>
        </Modal>
    );
};

// Component for editing a group name
const EditGroupModal: React.FC<{ group: StudentGroup; onSave: (name: string) => void; onClose: () => void; }> = ({ group, onSave, onClose }) => {
    const [name, setName] = useState(group.name);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(normalizePersianChars(name.trim()));
        }
    };
    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">ویرایش نام گروه</h2>
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 mb-1">نام جدید گروه</label>
                    <input id="groupName" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md" autoFocus required />
                </div>
                <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">ذخیره</button>
                </div>
            </form>
        </Modal>
    );
};


export const ThinkingLifestyleView: React.FC<{}> = () => {
    const { appSettings, classrooms } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('classes');
    
    const thinkingClassrooms = useMemo(() => {
        const thinkingIds = new Set(appSettings.thinkingClassroomIds || []);
        return classrooms.filter(c => thinkingIds.has(c.id));
    }, [appSettings.thinkingClassroomIds, classrooms]);

    const renderContent = () => {
        switch (activeTab) {
            case 'classes':
                return <ClassesTab />;
            case 'grouping':
                return <GroupingTab thinkingClassrooms={thinkingClassrooms} />;
            case 'observation':
                return <ScoresTab mode="observation" thinkingClassrooms={thinkingClassrooms} />;
            case 'evaluation':
                return <ScoresTab mode="evaluation" thinkingClassrooms={thinkingClassrooms} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="relative text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">تفکر و سبک زندگی</h1>
            </div>
            
            <div className="bg-white p-2 rounded-xl shadow-sm flex flex-wrap gap-2 justify-center">
                <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')}>کلاس‌ها</TabButton>
                <TabButton active={activeTab === 'grouping'} onClick={() => setActiveTab('grouping')}>گروه‌بندی</TabButton>
                <TabButton active={activeTab === 'observation'} onClick={() => setActiveTab('observation')}>فرم مشاهده</TabButton>
                <TabButton active={activeTab === 'evaluation'} onClick={() => setActiveTab('evaluation')}>ارزشیابی</TabButton>
            </div>
            
            <div>{renderContent()}</div>

        </div>
    );
};
