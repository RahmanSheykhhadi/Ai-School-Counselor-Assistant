import React, { useState } from 'react';
import type { Student } from '../types';
import Modal from './Modal';
import { normalizePersianChars } from '../utils/helpers';

interface EditStudentModalProps {
    student: Student;
    onClose: () => void;
    onSave: (student: Student) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        firstName: student.firstName,
        lastName: student.lastName,
        fatherName: student.fatherName || '',
        nationalId: student.nationalId || '',
        address: student.address || '',
        mobile: student.mobile || '',
        nationality: student.nationality || '',
        birthDate: student.birthDate || '',
        grade: student.grade || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: normalizePersianChars(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.firstName.trim() && formData.lastName.trim()) {
            onSave({
                ...student,
                ...formData,
            });
        }
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">ویرایش اطلاعات {student.firstName} {student.lastName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">نام <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="fatherName" className="block text-sm font-medium text-slate-700 mb-1">نام پدر</label>
                        <input
                            type="text"
                            id="fatherName"
                            name="fatherName"
                            value={formData.fatherName}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="nationalId" className="block text-sm font-medium text-slate-700 mb-1">کد ملی</label>
                        <input
                            type="text"
                            id="nationalId"
                            name="nationalId"
                            value={formData.nationalId}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1">پایه تحصیلی</label>
                        <input
                            type="text"
                            id="grade"
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-1">تاریخ تولد</label>
                        <input
                            type="text"
                            id="birthDate"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 mb-1">شماره موبایل</label>
                        <input
                            type="text"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 mb-1">ملیت</label>
                        <input
                            type="text"
                            id="nationality"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">آدرس</label>
                    <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        rows={2}
                    />
                </div>
                <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                        انصراف
                    </button>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">
                        ذخیره تغییرات
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditStudentModal;