"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  className = "", 
  label = "Back" 
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`
        flex items-center space-x-1 text-gray-400 hover:text-gray-700 
        transition-colors duration-200 group w-fit ${className}
      `}
    >
      <ChevronLeft 
        size={18} 
        className="transform group-hover:-translate-x-0.5 transition-transform duration-200" 
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default BackButton;
