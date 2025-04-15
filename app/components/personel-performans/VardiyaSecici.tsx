'use client';

import React from 'react';
import { Vardiya } from '@/app/lib/types/index';
import { Sun, Moon } from 'lucide-react';

interface VardiyaSeciciProps {
  seciliVardiya: Vardiya;
  onVardiyaDegistir: (vardiya: Vardiya) => void;
  disabled?: boolean;
}

const VardiyaSecici: React.FC<VardiyaSeciciProps> = ({
  seciliVardiya,
  onVardiyaDegistir,
  disabled = false
}) => {
  return (
    <div className="inline-flex shadow-sm rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => onVardiyaDegistir(Vardiya.Gunduz)}
        disabled={disabled}
        className={`
          relative px-4 py-2 text-sm font-medium flex items-center
          ${seciliVardiya === Vardiya.Gunduz
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'}
          border border-gray-300 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Sun size={16} className="mr-2" />
        Gündüz Vardiyası
      </button>
      
      <button
        type="button"
        onClick={() => onVardiyaDegistir(Vardiya.Gece)}
        disabled={disabled}
        className={`
          relative px-4 py-2 text-sm font-medium flex items-center
          ${seciliVardiya === Vardiya.Gece
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'}
          border border-l-0 border-gray-300 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Moon size={16} className="mr-2" />
        Gece Vardiyası
      </button>
    </div>
  );
};

export default VardiyaSecici; 