import React, { useState } from 'react';
import { X, GripVertical, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeftRight, Check, Sparkles, MapPin } from 'lucide-react';
import { Trip, DayPlan } from '../types';
import { reorderDaysInTrip, swapTwoDaysInTrip } from '../services/itineraryUtils';

interface ReorderDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSaveTrip: (updatedTrip: Trip) => void;
  onSelectDay: (dayNumber: number) => void;
}

export const ReorderDaysModal: React.FC<ReorderDaysModalProps> = ({
  isOpen,
  onClose,
  trip,
  onSaveTrip,
  onSelectDay,
}) => {
  const [workingTrip, setWorkingTrip] = useState<Trip>(trip);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Quick swap state
  const [swapDayA, setSwapDayA] = useState<number>(1);
  const [swapDayB, setSwapDayB] = useState<number>(Math.min(2, trip.days.length));

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setWorkingTrip(trip);
      setSwapDayA(1);
      setSwapDayB(Math.min(2, trip.days.length));
    }
  }, [isOpen, trip]);

  if (!isOpen) return null;

  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIdx === null || draggedIdx === index) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = reorderDaysInTrip(workingTrip, draggedIdx, index);
    setWorkingTrip(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= workingTrip.days.length) return;
    const updated = reorderDaysInTrip(workingTrip, index, targetIndex);
    setWorkingTrip(updated);
  };

  const handleQuickSwap = () => {
    if (swapDayA === swapDayB) return;
    const updated = swapTwoDaysInTrip(workingTrip, swapDayA, swapDayB);
    setWorkingTrip(updated);
  };

  const handleConfirm = () => {
    onSaveTrip(workingTrip);
    onSelectDay(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-neutral-900 via-primary-950 to-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <ArrowLeftRight className="w-5 h-5 text-primary-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                <span>行程天數順序管理</span>
                <span className="text-[11px] px-2 py-0.5 bg-primary-500/30 text-primary-200 rounded-full font-normal">
                  支援拖曳 & 對調
                </span>
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                拖曳卡片或使用箭頭重新排列天數，各天所屬景點與主題將完整保留並自動對齊日期
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Swap Bar */}
        {workingTrip.days.length > 1 && (
          <div className="bg-neutral-50 dark:bg-neutral-950/60 px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary-500" />
              <span>快速指定對調：</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={swapDayA}
                onChange={(e) => setSwapDayA(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {workingTrip.days.map((d) => (
                  <option key={d.dayNumber} value={d.dayNumber}>
                    Day {d.dayNumber} ({d.date.substring(5)})
                  </option>
                ))}
              </select>
              <span className="text-neutral-400 font-bold">⇄</span>
              <select
                value={swapDayB}
                onChange={(e) => setSwapDayB(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {workingTrip.days.map((d) => (
                  <option key={d.dayNumber} value={d.dayNumber}>
                    Day {d.dayNumber} ({d.date.substring(5)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleQuickSwap}
                disabled={swapDayA === swapDayB}
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-lg font-bold transition-all cursor-pointer shadow-xs"
              >
                互換這兩天
              </button>
            </div>
          </div>
        )}

        {/* Days Draggable List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh]">
          {workingTrip.days.map((day, idx) => {
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx;

            return (
              <div
                key={day.id || idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isDragging
                    ? 'opacity-40 border-dashed border-primary-500 bg-primary-50/50 scale-98'
                    : isDragOver
                    ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/60 dark:bg-primary-950/40 translate-y-1'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                }`}
              >
                {/* Drag Grip + Day Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title="按住拖曳重新排列"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="flex-shrink-0 text-center min-w-[65px] px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="block text-xs font-black text-neutral-900 dark:text-white">
                      Day {day.dayNumber}
                    </span>
                    <span className="block text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                      {day.date}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                        {day.themeTitle || `第 ${day.dayNumber} 天行程`}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 flex-shrink-0">
                        {day.items.length} 個行程點
                      </span>
                    </div>

                    {/* Preview of items */}
                    {day.items.length > 0 ? (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        <span className="truncate">
                          {day.items.map((it) => it.title).join(' → ')}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400 dark:text-neutral-600 italic mt-1">
                        尚無行程項目
                      </p>
                    )}
                  </div>
                </div>

                {/* Move buttons for quick clicks / mobile */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveStep(idx, 'up')}
                    title="往上移"
                    className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-20 cursor-pointer transition-all"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === workingTrip.days.length - 1}
                    onClick={() => handleMoveStep(idx, 'down')}
                    title="往下移"
                    className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-20 cursor-pointer transition-all"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            調整後出發日保持為 <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{workingTrip.startDate}</strong>，日期自動依序遞增。
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>確定套用順序</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
