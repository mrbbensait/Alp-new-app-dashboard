'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { 
  getBugununTarihi, 
  getSonHaftaTarihAraligi, 
  getSonAyTarihAraligi, 
  formatDateTR
} from '@/app/utils/date-utils';

export type TarihAraligi = 'bugun' | 'haftalik' | 'aylik' | 'ozel';

interface TarihAralikSeciciProps {
  onTarihAralikiDegistir: (baslangic: string, bitis: string, aralikTur: TarihAraligi) => void;
  defaultAralik?: TarihAraligi;
}

const TarihAralikSecici: React.FC<TarihAralikSeciciProps> = ({
  onTarihAralikiDegistir,
  defaultAralik = 'bugun'
}) => {
  const [seciliAralik, setSeciliAralik] = useState<TarihAraligi>(defaultAralik);
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>('');
  const [bitisTarihi, setBitisTarihi] = useState<string>('');
  const [hataOzel, setHataOzel] = useState<string>('');
  
  const handleAralikDegistir = (aralik: TarihAraligi) => {
    setSeciliAralik(aralik);
    setHataOzel('');
    
    let baslangic = '';
    let bitis = '';
    
    switch (aralik) {
      case 'bugun':
        baslangic = getBugununTarihi();
        bitis = getBugununTarihi();
        break;
        
      case 'haftalik': {
        const [haftalikBaslangic, haftalikBitis] = getSonHaftaTarihAraligi();
        baslangic = haftalikBaslangic;
        bitis = haftalikBitis;
        break;
      }
        
      case 'aylik': {
        const [aylikBaslangic, aylikBitis] = getSonAyTarihAraligi();
        baslangic = aylikBaslangic;
        bitis = aylikBitis;
        break;
      }
        
      case 'ozel':
        // Özel aralık seçiminde mevcut değerleri koru
        return;
    }
    
    // Tarihleri giriş alanlarına yansıt
    setBaslangicTarihi(baslangic);
    setBitisTarihi(bitis);
    
    // Callback'i çağır
    onTarihAralikiDegistir(baslangic, bitis, aralik);
  };
  
  const handleOzelAralikUygula = () => {
    // Boş tarih kontrolü
    if (!baslangicTarihi || !bitisTarihi) {
      setHataOzel('Lütfen her iki tarihi de seçin.');
      return;
    }
    
    // Tarih sırası kontrolü
    if (baslangicTarihi > bitisTarihi) {
      setHataOzel('Başlangıç tarihi, bitiş tarihinden sonra olamaz.');
      return;
    }
    
    setHataOzel('');
    onTarihAralikiDegistir(baslangicTarihi, bitisTarihi, 'ozel');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleAralikDegistir('bugun')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'bugun' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bugün
        </button>
        
        <button
          type="button"
          onClick={() => handleAralikDegistir('haftalik')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'haftalik' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Son 7 Gün
        </button>
        
        <button
          type="button"
          onClick={() => handleAralikDegistir('aylik')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'aylik' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Son 30 Gün
        </button>
        
        <button
          type="button"
          onClick={() => handleAralikDegistir('ozel')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'ozel' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Özel Aralık
        </button>
      </div>
      
      {seciliAralik === 'ozel' && (
        <div className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="baslangic-tarihi" className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                id="baslangic-tarihi"
                value={baslangicTarihi}
                onChange={(e) => setBaslangicTarihi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="bitis-tarihi" className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                id="bitis-tarihi"
                value={bitisTarihi}
                onChange={(e) => setBitisTarihi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {hataOzel && (
            <div className="mt-2 text-sm text-red-600">
              {hataOzel}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleOzelAralikUygula}
            className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Uygula
          </button>
        </div>
      )}
      
      {seciliAralik !== 'ozel' && (
        <div className="mt-2 text-sm text-gray-600 flex items-center">
          <Calendar size={16} className="mr-1.5" />
          {seciliAralik === 'bugun' && `${formatDateTR(getBugununTarihi())}`}
          {seciliAralik === 'haftalik' && (() => {
            const [baslangic, bitis] = getSonHaftaTarihAraligi();
            return `${formatDateTR(baslangic)} - ${formatDateTR(bitis)}`;
          })()}
          {seciliAralik === 'aylik' && (() => {
            const [baslangic, bitis] = getSonAyTarihAraligi();
            return `${formatDateTR(baslangic)} - ${formatDateTR(bitis)}`;
          })()}
        </div>
      )}
    </div>
  );
};

export default TarihAralikSecici; 