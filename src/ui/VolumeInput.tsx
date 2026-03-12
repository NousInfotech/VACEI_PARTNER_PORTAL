import React from 'react';
import NumericInput from './NumericInput';

interface VolumeInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  error?: string;
}

const VolumeInput: React.FC<VolumeInputProps> = ({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  error,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
            {label}
          </label>
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
            {value}%
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex-1 relative group">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary group-hover:bg-gray-200 transition-colors"
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-lg pointer-events-none transition-all duration-200"
            style={{ width: `${(value - min) / (max - min) * 100}%` }}
          />
        </div>
        
        <NumericInput
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-24 bg-white! border-gray-100 shadow-sm"
        />
      </div>
      
      {error && (
        <p className="text-[10px] text-red-500 font-medium leading-tight animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default VolumeInput;
