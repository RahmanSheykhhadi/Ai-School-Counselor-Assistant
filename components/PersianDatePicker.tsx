import React, { useState, useEffect, useMemo, useRef } from 'react';
import moment from 'jalali-moment';

interface PersianDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);

export default function PersianDatePicker({ selectedDate, onChange }: PersianDatePickerProps) {
  const [currentMoment, setCurrentMoment] = useState(() => moment(selectedDate).locale('fa'));
  const [showPicker, setShowPicker] = useState(false);
  
  const [hour, setHour] = useState(() => selectedDate.getHours().toString().padStart(2, '0'));
  const [minute, setMinute] = useState(() => selectedDate.getMinutes().toString().padStart(2, '0'));
  
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentMoment(moment(selectedDate).locale('fa'));
    setHour(selectedDate.getHours().toString().padStart(2, '0'));
    setMinute(selectedDate.getMinutes().toString().padStart(2, '0'));
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerRef]);


  const daysInMonth = useMemo(() => {
    const startOfMonth = currentMoment.clone().startOf('jMonth');
    const endOfMonth = currentMoment.clone().endOf('jMonth');
    
    const days = [];
    let day = startOfMonth.clone();
    
    const firstDayOfWeek = (startOfMonth.jDay() + 1) % 7; 
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    while (day.isSameOrBefore(endOfMonth)) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    return days;
  }, [currentMoment]);
  
  const handleDayClick = (dayMoment: any) => {
    if (!dayMoment) return;
    const newDate = dayMoment.toDate();
    const currentHour = parseInt(hour, 10) || 0;
    const currentMinute = parseInt(minute, 10) || 0;
    newDate.setHours(currentHour);
    newDate.setMinutes(currentMinute);
    onChange(newDate);
    setShowPicker(false);
  };
  
  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
      let numericValue = parseInt(value, 10);
      if (isNaN(numericValue)) numericValue = 0;
      
      let newDate = new Date(selectedDate);
      
      if (type === 'hour') {
          if (numericValue < 0) numericValue = 23;
          if (numericValue > 23) numericValue = 0;
          setHour(numericValue.toString().padStart(2, '0'));
          newDate.setHours(numericValue);
      } else {
          if (numericValue < 0) numericValue = 59;
          if (numericValue > 59) numericValue = 0;
          setMinute(numericValue.toString().padStart(2, '0'));
          newDate.setMinutes(numericValue);
      }
      onChange(newDate);
  };

  const changeMonth = (amount: number) => {
    if (amount > 0) {
        setCurrentMoment(prev => prev.clone().add(1, 'jMonth'));
    } else {
        setCurrentMoment(prev => prev.clone().subtract(1, 'jMonth'));
    }
  };
  
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  return (
    <div className="relative w-full" ref={pickerRef}>
      <div className="flex space-x-2 space-x-reverse">
          <input
            type="text"
            readOnly
            value={moment(selectedDate).locale('fa').format('dddd jD jMMMM jYYYY')}
            onClick={() => setShowPicker(!showPicker)}
            className="flex-grow p-2 border border-slate-300 rounded-md cursor-pointer focus:ring-sky-500 focus:border-sky-500"
          />
          <div className="w-28 flex items-center space-x-1 p-2 border border-slate-300 rounded-md">
              <input type="number" value={minute} onChange={e => handleTimeChange('minute', e.target.value)} className="w-1/2 text-center bg-transparent focus:outline-none" min="0" max="59" />
              <span>:</span>
              <input type="number" value={hour} onChange={e => handleTimeChange('hour', e.target.value)} className="w-1/2 text-center bg-transparent focus:outline-none" min="0" max="23" />
          </div>
      </div>

      {showPicker && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-white border rounded-lg shadow-xl z-10 w-full">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
            <span className="font-semibold">{currentMoment.format('jMMMM jYYYY')}</span>
            <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map(day => <div key={day} className="text-xs font-bold text-slate-500 p-2">{day}</div>)}
            {daysInMonth.map((dayMoment, index) => {
              const isSelected = dayMoment && moment(selectedDate).isSame(dayMoment, 'day');
              const isToday = dayMoment && moment().isSame(dayMoment, 'day');
              
              return (
                <div key={index}
                  onClick={() => handleDayClick(dayMoment)}
                  className={`p-2 rounded-full cursor-pointer transition-colors
                    ${!dayMoment ? 'cursor-default' : ''}
                    ${isSelected ? 'bg-sky-500 text-white font-bold' : ''}
                    ${!isSelected && isToday ? 'text-sky-600 font-bold border border-sky-500' : ''}
                    ${!isSelected && dayMoment ? 'hover:bg-slate-100' : ''}
                  `}
                >
                  {dayMoment ? dayMoment.format('jD') : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}