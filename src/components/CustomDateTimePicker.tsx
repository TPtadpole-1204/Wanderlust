import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { formatDateStr, parseDateStr } from '../services/itineraryUtils';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minDate?: string;
  className?: string;
  variant?: 'default' | 'badge' | 'minimal';
  label?: string;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = '選擇日期',
  minDate,
  className = '',
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseDateStr(value);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth()); // 0-11

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = parseDateStr(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return placeholder;
    const d = parseDateStr(dateStr);
    const weekday = WEEKDAYS[d.getDay()];
    return `${dateStr} (週${weekday})`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {variant === 'badge' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-lg text-xs font-bold text-white transition-all cursor-pointer border border-white/20 shadow-xs"
          title="點擊修改當日或旅程日期"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-primary-200" />
          <span>{formatDisplayDate(value)}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-xs cursor-pointer text-left"
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span className={value ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}>
              {formatDisplayDate(value)}
            </span>
          </span>
        </button>
      )}

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-[70] mt-2 left-0 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-4 animate-in fade-in zoom-in-95 duration-150 text-neutral-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-black tracking-tight">
              {viewYear} 年 {viewMonth + 1} 月
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS.map((w, idx) => (
              <div
                key={w}
                className={`text-[11px] font-bold py-1 ${
                  idx === 0 || idx === 6
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-8" />;
              }
              const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = cellDateStr === value;
              const isDisabled = Boolean(minDate && cellDateStr < minDate);
              const isToday = cellDateStr === formatDateStr(new Date());

              return (
                <button
                  key={cellDateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(cellDateStr);
                    setIsOpen(false);
                  }}
                  className={`h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30 scale-105'
                      : isDisabled
                      ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                      : isToday
                      ? 'border border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const todayStr = formatDateStr(new Date());
                if (!minDate || todayStr >= minDate) {
                  onChange(todayStr);
                  setIsOpen(false);
                }
              }}
              className="text-primary-600 dark:text-primary-400 font-bold hover:underline cursor-pointer"
            >
              選擇今天
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomTimePickerProps {
  value: string; // 'HH:mm' or ''
  onChange: (timeStr: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  className?: string;
  fineTuneOnly?: boolean;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  placeholder = '未設定',
  isClearable = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourColumnRef = useRef<HTMLDivElement>(null);
  const minuteColumnRef = useRef<HTMLDivElement>(null);

  const [selectedHour, setSelectedHour] = useState<string>(() => {
    if (value && value.includes(':')) return value.split(':')[0].padStart(2, '0');
    return '10';
  });
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    if (value && value.includes(':')) return value.split(':')[1].padStart(2, '0');
    return '00';
  });

  // minute display mode: 5-minute multiples vs all 00-59
  const [minuteViewMode, setMinuteViewMode] = useState<'5min' | 'all'>(() => {
    const minNum = parseInt(selectedMinute, 10);
    return minNum % 5 === 0 ? '5min' : 'all';
  });

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      const padH = h.padStart(2, '0');
      const padM = m.padStart(2, '0');
      setSelectedHour(padH);
      setSelectedMinute(padM);
      if (parseInt(padM, 10) % 5 !== 0) {
        setMinuteViewMode('all');
      }
    }
  }, [value]);

  // Auto-scroll selected elements into view when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const activeHour = hourColumnRef.current?.querySelector('[data-selected="true"]');
        activeHour?.scrollIntoView({ block: 'center', behavior: 'auto' });

        const activeMin = minuteColumnRef.current?.querySelector('[data-selected="true"]');
        activeMin?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, minuteViewMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const fiveMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const allMinutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const displayedMinutes = minuteViewMode === '5min' ? fiveMinutes : allMinutes;

  const getPeriodLabel = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return '';
    const h = parseInt(timeStr.split(':')[0], 10);
    if (h < 6) return '凌晨';
    if (h < 12) return '上午';
    if (h === 12) return '中午';
    if (h < 18) return '下午';
    return '晚上';
  };

  const handleSetTime = (newH: string, newM: string) => {
    setSelectedHour(newH);
    setSelectedMinute(newM);
    onChange(`${newH}:${newM}`);
  };

  const handleAdjustMinutes = (delta: number) => {
    const curH = parseInt(selectedHour || '10', 10);
    const curM = parseInt(selectedMinute || '00', 10);
    let total = curH * 60 + curM + delta;
    if (total < 0) total += 24 * 60;
    total = total % (24 * 60);

    const h = String(Math.floor(total / 60)).padStart(2, '0');
    const m = String(total % 60).padStart(2, '0');
    if (parseInt(m, 10) % 5 !== 0) {
      setMinuteViewMode('all');
    }
    handleSetTime(h, m);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (parseInt(m, 10) % 5 !== 0) {
      setMinuteViewMode('all');
    }
    handleSetTime(h, m);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-xs cursor-pointer text-left"
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            {value ? (
              <span className="font-mono text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span className="text-[11px] font-sans px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                  {getPeriodLabel(value)}
                </span>
                <span>{value}</span>
              </span>
            ) : (
              <span className="text-neutral-400">{placeholder}</span>
            )}
          </span>
        </button>

        {isClearable && value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-2.5 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="清除時間"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-[70] mt-2 left-0 w-72 sm:w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3.5 animate-in fade-in zoom-in-95 duration-150 text-neutral-900 dark:text-white space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>精確微調時間</span>
            </span>

            {/* Live Time Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 font-mono text-xs font-black">
              <span>{selectedHour}:{selectedMinute}</span>
              <span className="text-[10px] font-sans font-bold text-primary-600/80">
                ({getPeriodLabel(`${selectedHour}:${selectedMinute}`)})
              </span>
            </div>
          </div>

          {/* Precision Fine-Tuning UI */}
          <div className="space-y-2.5">
            {/* Stepper Buttons */}
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">快速微調：</span>
              <div className="flex items-center gap-1">
                {[-15, -5, -1, 1, 5, 15].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleAdjustMinutes(delta)}
                    className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-50 dark:hover:bg-primary-950/60 hover:text-primary-600 text-neutral-600 dark:text-neutral-300 font-mono text-[10px] transition-colors cursor-pointer"
                    title={`微調 ${delta > 0 ? `+${delta}` : delta} 分鐘`}
                  >
                    {delta > 0 ? `+${delta}` : delta}m
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dual Scrollable Column Selector */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-50 dark:bg-neutral-950/70 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
              {/* Hours Column */}
              <div>
                <div className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
                  時 (00 ~ 23)
                </div>
                <div
                  ref={hourColumnRef}
                  className="max-h-48 overflow-y-auto space-y-1 p-1 pr-1.5 scrollbar-thin"
                >
                  {hours.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSetTime(h, selectedMinute)}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-xs font-black'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{h} 時</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes Column */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
                  <span>分 (MIN)</span>
                  <button
                    type="button"
                    onClick={() => setMinuteViewMode(minuteViewMode === '5min' ? 'all' : '5min')}
                    className="text-[9px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer lowercase"
                  >
                    {minuteViewMode === '5min' ? '切換全部0-59' : '切換每5分'}
                  </button>
                </div>
                <div
                  ref={minuteColumnRef}
                  className="max-h-48 overflow-y-auto space-y-1 p-1 pr-1.5 scrollbar-thin"
                >
                  {displayedMinutes.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSetTime(selectedHour, m)}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-xs font-black'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{m} 分</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="text-primary-600 dark:text-primary-400 font-bold hover:underline cursor-pointer text-[11px]"
              >
                現在時間
              </button>
              {isClearable && value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="text-neutral-500 hover:text-red-500 font-bold hover:underline cursor-pointer text-[11px]"
                >
                  清除
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                handleSetTime(selectedHour, selectedMinute);
                setIsOpen(false);
              }}
              className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomDateTimePickerProps {
  value: string; // 'YYYY-MM-DD HH:mm'
  onChange: (dateTimeStr: string) => void;
  placeholder?: string;
  className?: string;
  fineTuneOnly?: boolean;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  placeholder = '選擇日期與時間',
  className = '',
  fineTuneOnly = true,
}) => {
  const parts = value ? value.trim().split(' ') : [];
  const datePart = parts[0] && /^\d{4}-\d{2}-\d{2}$/.test(parts[0]) ? parts[0] : formatDateStr(new Date());
  const timePart = parts[1] && /^\d{2}:\d{2}$/.test(parts[1]) ? parts[1] : '09:00';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      <CustomDatePicker
        value={value ? datePart : ''}
        placeholder={placeholder}
        onChange={(newDate) => {
          onChange(`${newDate} ${timePart}`);
        }}
      />
      <CustomTimePicker
        value={value ? timePart : ''}
        placeholder="選擇時間"
        fineTuneOnly={fineTuneOnly}
        onChange={(newTime) => {
          onChange(`${datePart} ${newTime || '09:00'}`);
        }}
      />
    </div>
  );
};
