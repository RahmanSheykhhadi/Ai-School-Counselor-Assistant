import React, { useState, useEffect, useMemo, useRef } from 'react';
import moment from 'jalali-moment';
import { toPersianDigits } from '../utils/helpers';

interface PersianDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  showTime?: boolean;
}

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);

// Helper to create a valid jalali-moment object, defaulting to now() if input is invalid.
function createSafeMoment(date: any): moment.Moment {
    const m = moment(date).locale('fa');
    if (m.isValid()) {
        return m;
    }
    return moment().locale('fa');
}

export default function PersianDatePicker({ selectedDate, onChange, showTime = true }: PersianDatePickerProps) {
  const [displayMoment, setDisplayMoment] = useState(() => createSafeMoment(selectedDate));
  const [pickerMoment, setPickerMoment] = useState(() => createSafeMoment(selectedDate));
  const [showPicker, setShowPicker] = useState(false);
  
  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync with external prop changes
  useEffect(() => {
    const safeMoment = createSafeMoment(selectedDate);
    setDisplayMoment(safeMoment);
    setPickerMoment(safeMoment);
  }, [selectedDate]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerRef]);

  const calendarGrid = useMemo(() => {
    const startOfMonth = pickerMoment.clone().startOf('jMonth');
    const endOfMonth = pickerMoment.clone().endOf('jMonth');
    const days = [];
    let day = startOfMonth.clone().startOf('week');
    
    while (day.isSameOrBefore(endOfMonth.clone().endOf('week'))) {
        days.push(day.clone());
        day.add(1, 'day');
    }
    return days;
  }, [pickerMoment]);
  
  const handleDayClick = (dayMoment: moment.Moment) => {
    const newMoment = displayMoment.clone()
        .jYear(dayMoment.jYear())
        .jMonth(dayMoment.jMonth())
        .jDate(dayMoment.jDate());
    
    onChange(newMoment.toDate());
    setShowPicker(false);
  };
  
  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
      let numericValue = parseInt(value, 10);
      if (isNaN(numericValue)) numericValue = 0;
      
      const newMoment = displayMoment.clone();
      
      if (type === 'hour') {
          if (numericValue < 0) numericValue = 23;
          if (numericValue > 23) numericValue = 0;
          newMoment.hour(numericValue);
      } else {
          if (numericValue < 0) numericValue = 59;
          if (numericValue > 59) numericValue = 0;
          newMoment.minute(numericValue);
      }
      onChange(newMoment.toDate());
  };

  const changeMonth = (amount: number) => {
    setPickerMoment(prev => prev.clone().add(amount, 'jMonth'));
  };
  
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  
  const getDisplayValue = () => {
    const jYear = displayMoment.jYear();
    if (showTime) {
        return toPersianDigits(displayMoment.format('dddd jD jMMMM ') + jYear);
    } else {
        return toPersianDigits(jYear + '/' + displayMoment.format('jMM/jDD'));
    }
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      <div className="flex space-x-2 space-x-reverse">
          <input
            type="text"
            readOnly
            value={getDisplayValue()}
            onClick={() => setShowPicker(!showPicker)}
            className="flex-grow p-2 border border-slate-300 rounded-md cursor-pointer focus:ring-sky-500 focus:border-sky-500 min-w-0"
          />
          {showTime && (
            <div className="flex-shrink-0 w-28 flex items-center space-x-1 p-2 border border-slate-300 rounded-md">
                <input type="number" value={displayMoment.format('mm')} onChange={e => handleTimeChange('minute', e.target.value)} className="w-1/2 text-center bg-transparent focus:outline-none" min="0" max="59" />
                <span>:</span>
                <input type="number" value={displayMoment.format('HH')} onChange={e => handleTimeChange('hour', e.target.value)} className="w-1/2 text-center bg-transparent focus:outline-none" min="0" max="23" />
            </div>
          )}
      </div>

      {showPicker && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-white border rounded-lg shadow-xl z-10 w-full min-w-[20rem]">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
            <span className="font-semibold">{toPersianDigits(pickerMoment.format('jMMMM jYYYY'))}</span>
            <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map(day => <div key={day} className="text-xs font-bold text-slate-500 p-2">{day}</div>)}
            {calendarGrid.map((dayMoment, index) => {
              const isCurrentMonth = dayMoment.isSame(pickerMoment, 'jMonth');
              const isSelected = isCurrentMonth && displayMoment.isSame(dayMoment, 'day');
              const isToday = isCurrentMonth && moment().isSame(dayMoment, 'day');
              
              return (
                <div key={index}
                  onClick={() => isCurrentMonth && handleDayClick(dayMoment)}
                  className={`p-2 rounded-full transition-colors
                    ${!isCurrentMonth ? 'text-slate-400 cursor-default' : 'cursor-pointer'}
                    ${isSelected ? 'bg-sky-500 text-white font-bold' : ''}
                    ${!isSelected && isToday ? 'text-sky-600 font-bold border border-sky-500' : ''}
                    ${!isSelected && isCurrentMonth ? 'hover:bg-slate-100' : ''}
                  `}
                >
                  {toPersianDigits(dayMoment.format('jD'))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
