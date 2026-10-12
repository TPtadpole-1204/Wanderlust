import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  options,
  placeholder = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFiltering(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = isFiltering && value.trim()
    ? options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
    : options;

  // If filtering yielded 0 results, still show all options below a hint so user is never trapped
  const displayOptions = filteredOptions.length > 0 ? filteredOptions : options;

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsFiltering(true);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsFiltering(false);
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className={`${className} pr-14`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setIsFiltering(false);
              setIsOpen(true);
            }}
            title="清除重新選擇"
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button 
          type="button"
          onClick={() => {
            setIsFiltering(false);
            setIsOpen(!isOpen);
          }}
          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl py-1">
          {isFiltering && filteredOptions.length === 0 && (
            <div className="px-3.5 py-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/30 border-b border-neutral-100 dark:border-neutral-800 font-bold">
              可使用自訂輸入「{value}」，或從下方熱門選項挑選：
            </div>
          )}
          {displayOptions.map((opt, idx) => {
            const isSelected = opt === value;
            return (
              <button
                key={idx}
                type="button"
                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
                onClick={() => {
                  onChange(opt);
                  setIsFiltering(false);
                  setIsOpen(false);
                }}
              >
                <span>{opt}</span>
                {isSelected && <span className="text-xs text-primary-600">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

