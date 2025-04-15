'use client';

import React from 'react';
import { BarChart, LineChart, PieChart } from 'lucide-react';

export type GrafikTuru = 'cizgi' | 'bar' | 'pasta' | 'alan';

interface GrafikTurSeciciProps {
  seciliGrafikTuru: GrafikTuru;
  onGrafikTuruDegistir: (grafikTuru: GrafikTuru) => void;
}

const GrafikTurSecici: React.FC<GrafikTurSeciciProps> = ({
  seciliGrafikTuru,
  onGrafikTuruDegistir
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-md inline-flex">
      <button
        type="button"
        onClick={() => onGrafikTuruDegistir('cizgi')}
        className={`relative p-2 flex items-center justify-center ${
          seciliGrafikTuru === 'cizgi' 
            ? 'bg-blue-50 text-blue-600 border-blue-200' 
            : 'text-gray-600 hover:bg-gray-50'
        } rounded-l-md`}
        title="Çizgi Grafik"
      >
        <LineChart size={20} />
      </button>
      
      <button
        type="button"
        onClick={() => onGrafikTuruDegistir('bar')}
        className={`relative p-2 flex items-center justify-center ${
          seciliGrafikTuru === 'bar' 
            ? 'bg-blue-50 text-blue-600 border-blue-200' 
            : 'text-gray-600 hover:bg-gray-50'
        } border-l border-gray-200`}
        title="Bar Grafik"
      >
        <BarChart size={20} />
      </button>
      
      <button
        type="button"
        onClick={() => onGrafikTuruDegistir('pasta')}
        className={`relative p-2 flex items-center justify-center ${
          seciliGrafikTuru === 'pasta' 
            ? 'bg-blue-50 text-blue-600 border-blue-200' 
            : 'text-gray-600 hover:bg-gray-50'
        } border-l border-gray-200 rounded-r-md`}
        title="Pasta Grafik"
      >
        <PieChart size={20} />
      </button>
    </div>
  );
};

export default GrafikTurSecici; 