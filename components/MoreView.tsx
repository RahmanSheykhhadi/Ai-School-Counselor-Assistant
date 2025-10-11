import React, { useState, useRef, useEffect } from 'react';
import type { View } from '../types';
import { ChartBarIcon, CogIcon, CalculatorIcon, Bars2Icon, StarIcon, ClipboardDocumentListIcon, BookIcon, QuestionMarkCircleIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface MoreViewProps {
  onNavigate: (view: View) => void;
}

const allItems: { [key in View]?: { icon: React.FC<any>, title: string } } = {
    'special-students': { icon: StarIcon, title: 'دانش‌آموزان خاص' },
    'counseling-needed-students': { icon: ClipboardDocumentListIcon, title: 'نیازمند مشاوره' },
    'grade-nine-quorum': { icon: CalculatorIcon, title: 'حد نصاب نهم' },
    'reports': { icon: ChartBarIcon, title: 'گزارشات' },
    'settings': { icon: CogIcon, title: 'تنظیمات' },
    'help': { icon: QuestionMarkCircleIcon, title: 'توافق نامه و راهنما' },
};

const MoreView: React.FC<MoreViewProps> = ({ onNavigate }) => {
  const { appSettings, handleReorderMoreMenu } = useAppContext();
  const defaultOrder: View[] = ['special-students', 'counseling-needed-students', 'grade-nine-quorum', 'reports', 'settings', 'help'];
  
  const getInitialOrder = () => {
      const savedOrder = appSettings.moreMenuOrder || defaultOrder;
      const validOrder = savedOrder.filter(view => allItems[view]);
      
      const fixedViewItems: View[] = ['reports', 'settings', 'help'];
      const otherItems = validOrder.filter(item => !fixedViewItems.includes(item));
      const fixedItems = fixedViewItems.filter(item => validOrder.includes(item));

      return [...otherItems, ...fixedItems];
  };

  const [orderedViews, setOrderedViews] = useState<View[]>(getInitialOrder());

  useEffect(() => {
    const newOrder = getInitialOrder();
    // Avoid unnecessary re-renders if the order hasn't changed.
    if (JSON.stringify(newOrder) !== JSON.stringify(orderedViews)) {
        setOrderedViews(newOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSettings.moreMenuOrder]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const draggableItemCount = orderedViews.filter(v => v !== 'reports' && v !== 'settings' && v !== 'help').length;

  const handleDragEnd = () => {
      if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
          dragItem.current = null;
          dragOverItem.current = null;
          setOrderedViews(prev => [...prev]); // Force re-render to remove dragging styles
          return;
      }
      
      // Prevent dropping a draggable item into the fixed section
      if (dragOverItem.current >= draggableItemCount) {
          dragItem.current = null;
          dragOverItem.current = null;
          setOrderedViews(prev => [...prev]);
          return;
      }

      const reorderedViews = [...orderedViews];
      const draggedItemContent = reorderedViews.splice(dragItem.current, 1)[0];
      reorderedViews.splice(dragOverItem.current, 0, draggedItemContent);
      
      dragItem.current = null;
      dragOverItem.current = null;
      
      setOrderedViews(reorderedViews);
      handleReorderMoreMenu(reorderedViews);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">بیشتر</h1>
      </div>

      <div className="flex flex-col gap-3 max-w-xl mx-auto">
        {orderedViews.map((view, index) => {
          const item = allItems[view];
          if (!item) return null;
          
          const isDraggable = index < draggableItemCount;

          return (
            <div
              key={view}
              draggable={isDraggable}
              onDragStart={isDraggable ? () => (dragItem.current = index) : undefined}
              onDragEnter={isDraggable ? () => (dragOverItem.current = index) : undefined}
              onDragEnd={isDraggable ? handleDragEnd : undefined}
              onDragOver={isDraggable ? (e) => e.preventDefault() : undefined}
              className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between transition-shadow hover:shadow-md group ${dragItem.current === index ? 'opacity-50 border-2 border-dashed border-sky-500' : ''}`}
            >
              <div 
                onClick={() => onNavigate(view)} 
                className="flex items-center gap-4 flex-grow cursor-pointer"
              >
                <item.icon className="w-8 h-8 text-slate-600" />
                <h2 className="text-base font-semibold text-slate-800">{item.title}</h2>
              </div>
              
              {isDraggable ? (
                <div 
                  className="cursor-grab p-2 -mr-2"
                  onMouseDown={(e) => e.stopPropagation()} // Prevents navigation when grabbing
                >
                  <Bars2Icon className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors"/>
                </div>
              ) : (
                 <div className="p-2 -mr-2 text-xs text-slate-400 font-semibold select-none">
                    ثابت
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoreView;