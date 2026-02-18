import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Button } from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 animate-in fade-in zoom-in duration-500 ${className}`}>
      <div className="p-4 bg-white rounded-2xl shadow-sm mb-6">
        <Icon size={40} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95 font-bold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
