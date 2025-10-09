import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { normalizePersianChars } from '../utils/helpers';
import type { Classroom } from '../types';

interface ClassroomFormProps {
    onSave: (name: string) => void;
    onCancel: () => void;
    initialData?: { name: string };
    title: string;
}

const ClassroomForm: React.FC<ClassroomFormProps> = ({ onSave, onCancel, initialData, title }) => {
    const [name, setName] = useState(initialData?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">نام کلاس <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(normalizePersianChars(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="مثال: هفتم اخلاص"
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">ذخیره</button>
            </div>
        </form>
    );
};

const ClassroomManagerView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { classrooms, handleAddClassroom, handleUpdateClassroom, handleDeleteClassroom } = useAppContext();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
    const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);

    const handleSave = (name: string) => {
        if (editingClassroom) {
            handleUpdateClassroom({ ...editingClassroom, name });
        } else {
            handleAddClassroom(name);
        }
        setIsFormModalOpen(false);
        setEditingClassroom(null);
    };

    const confirmDelete = () => {
        if (deletingClassroom) {
            handleDeleteClassroom(deletingClassroom.id);
            setDeletingClassroom(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-sm text-sky-600 hover:underline mb-2">&larr; بازگشت به لیست دانش‌آموزان</button>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">مدیریت و تعریف کلاس‌ها</h1>
                        <p className="text-slate-500 mt-1">کلاس‌های مدرسه را در این بخش تعریف یا ویرایش کنید.</p>
                    </div>
                    <button
                        onClick={() => { setEditingClassroom(null); setIsFormModalOpen(true); }}
                        className="flex items-center bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-sky-600 transition-colors"
                    >
                        <PlusIcon />
                        <span className="mr-2">افزودن کلاس جدید</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">نام کلاس</th>
                                <th className="px-4 py-2 text-center text-sm font-semibold text-slate-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classrooms.length > 0 ? classrooms.map(c => (
                                <tr key={c.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => { setEditingClassroom(c); setIsFormModalOpen(true); }} className="p-2 text-slate-500 hover:text-sky-600" title="ویرایش"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeletingClassroom(c)} className="p-2 text-slate-500 hover:text-red-600" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={2} className="text-center p-8 text-slate-500">
                                        هیچ کلاسی تعریف نشده است.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormModalOpen && (
                <Modal onClose={() => setIsFormModalOpen(false)}>
                    <ClassroomForm
                        title={editingClassroom ? "ویرایش کلاس" : "افزودن کلاس جدید"}
                        initialData={editingClassroom ? { name: editingClassroom.name } : undefined}
                        onSave={handleSave}
                        onCancel={() => { setIsFormModalOpen(false); setEditingClassroom(null); }}
                    />
                </Modal>
            )}

            {deletingClassroom && (
                <ConfirmationModal
                    title="حذف کلاس"
                    message={<p>آیا از حذف کلاس <strong>{deletingClassroom.name}</strong> اطمینان دارید؟ دانش‌آموزان این کلاس بی‌کلاس خواهند شد.</p>}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingClassroom(null)}
                    confirmButtonText="بله، حذف کن"
                />
            )}
        </div>
    );
};

export default ClassroomManagerView;