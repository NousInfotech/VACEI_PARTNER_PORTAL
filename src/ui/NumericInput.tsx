import React, { useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}

/**
 * Controlled numeric input with +/− buttons (step 1 by default).
 * - Allows free typing of numbers; letters are blocked.
 * - Clearing the field temporarily shows "" and falls back to 0 on blur.
 * - Default value is 0, minimum is 0.
 */
const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  className = '',
  placeholder = '0',
}) => {
  const [raw, setRaw] = useState<string>(String(value));

  // Sync external value → raw when it changes from outside
  React.useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const commit = useCallback(
    (str: string) => {
      const parsed = parseFloat(str);
      const clamped = isNaN(parsed) ? min : Math.max(min, max !== undefined ? Math.min(max, parsed) : parsed);
      onChange(clamped);
      setRaw(String(clamped));
    },
    [onChange, min, max]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // Allow: digits, single dot, leading minus only if min < 0
    if (/^-?\d*\.?\d*$/.test(v) || v === '' || v === '-') {
      setRaw(v);
      const parsed = parseFloat(v);
      if (!isNaN(parsed)) onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
    
    // Block any non-numeric key except control keys
    const allowed = ['Backspace','Delete','Tab', 'Escape', 'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','.', '-','Enter'];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleBlur = () => commit(raw);

  const increment = () => {
    const next = Math.round((value + step) * 1e10) / 1e10;
    const clamped = max !== undefined ? Math.min(max, next) : next;
    onChange(clamped);
    setRaw(String(clamped));
  };

  const decrement = () => {
    const next = Math.round((value - step) * 1e10) / 1e10;
    const clamped = Math.max(min, next);
    onChange(clamped);
    setRaw(String(clamped));
  };

  return (
    <div className={`flex items-center overflow-hidden border border-gray-200 rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all ${className}`}>
      <button
        type="button"
        onClick={decrement}
        className="shrink-0 px-3 py-3 text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
        tabIndex={-1}
        aria-label="Decrease"
      >
        <Minus size={14} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 min-w-0 px-2 py-3 bg-transparent outline-none text-sm font-semibold text-gray-800 text-center"
      />
      <button
        type="button"
        onClick={increment}
        className="shrink-0 px-3 py-3 text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
        tabIndex={-1}
        aria-label="Increase"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default NumericInput;
