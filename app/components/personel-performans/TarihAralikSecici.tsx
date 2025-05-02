'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { 
  getBugununTarihi, 
  getSonHaftaTarihAraligi, 
  getSonAyTarihAraligi, 
  formatDateTR
} from '@/app/utils/date-utils';

export type TarihAraligi = 'bugun' | 'dun' | 'haftalik' | 'gecenhafta' | 'aylik' | 'gecenay' | 'son30gun' | 'ozel';

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
    
    const bugun = new Date();
    
    switch (aralik) {
      case 'bugun':
        baslangic = getBugununTarihi();
        bitis = getBugununTarihi();
        break;
        
      case 'dun': {
        const dun = new Date(bugun);
        dun.setDate(bugun.getDate() - 1);
        const dunTarihi = formatDate(dun);
        baslangic = dunTarihi;
        bitis = dunTarihi;
        break;
      }
        
      case 'haftalik': {
        // Bu hafta (Pazartesi-Bugün arası)
        const bugunGun = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ...
        const pazartesiGunu = new Date(bugun);
        const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1; // Pazar günü için 6 gün geriye git, diğer günler için güncel gün - 1
        pazartesiGunu.setDate(bugun.getDate() - gunFarki);
        
        baslangic = formatDate(pazartesiGunu);
        bitis = getBugununTarihi();
        break;
      }
        
      case 'gecenhafta': {
        // Geçen hafta (önceki Pazartesi-Pazar arası)
        const bugunGun = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ...
        
        // Bu haftanın başlangıcı (Pazartesi)
        const pazartesiGunu = new Date(bugun);
        const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1;
        pazartesiGunu.setDate(bugun.getDate() - gunFarki);
        
        // Geçen haftanın başlangıcı (önceki Pazartesi)
        const gecenHaftaPazartesi = new Date(pazartesiGunu);
        gecenHaftaPazartesi.setDate(gecenHaftaPazartesi.getDate() - 7);
        
        // Geçen haftanın sonu (önceki Pazar)
        const gecenHaftaPazar = new Date(pazartesiGunu);
        gecenHaftaPazar.setDate(gecenHaftaPazar.getDate() - 1);
        
        baslangic = formatDate(gecenHaftaPazartesi);
        bitis = formatDate(gecenHaftaPazar);
        break;
      }
        
      case 'aylik': {
        const [aylikBaslangic, aylikBitis] = getSonAyTarihAraligi();
        baslangic = aylikBaslangic;
        bitis = aylikBitis;
        break;
      }
      
      case 'gecenay': {
        // Geçen ayın başlangıcı ve bitişi
        const gecenAyBasi = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
        const gecenAySonu = new Date(bugun.getFullYear(), bugun.getMonth(), 0);
        
        baslangic = formatDate(gecenAyBasi);
        bitis = formatDate(gecenAySonu);
        break;
      }

      case 'son30gun': {
        // Son 30 gün
        const otuzGunOnce = new Date(bugun);
        otuzGunOnce.setDate(bugun.getDate() - 30);
        
        baslangic = formatDate(otuzGunOnce);
        bitis = formatDate(bugun);
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
  
  // Tarih formatı helper fonksiyonu (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const yil = date.getFullYear();
    const ay = String(date.getMonth() + 1).padStart(2, '0');
    const gun = String(date.getDate()).padStart(2, '0');
    return `${yil}-${ay}-${gun}`;
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
          onClick={() => handleAralikDegistir('dun')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'dun' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Dün
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
          Bu Hafta
        </button>
        
        <button
          type="button"
          onClick={() => handleAralikDegistir('gecenhafta')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'gecenhafta' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Geçen Hafta
        </button>

        <button
          type="button"
          onClick={() => handleAralikDegistir('son30gun')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'son30gun' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Son 30 Gün
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
          Bu Ay
        </button>
        
        <button
          type="button"
          onClick={() => handleAralikDegistir('gecenay')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            seciliAralik === 'gecenay' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Geçen Ay
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
          {seciliAralik === 'dun' && (() => {
            const dun = new Date();
            dun.setDate(dun.getDate() - 1);
            return formatDateTR(formatDate(dun));
          })()}
          {seciliAralik === 'haftalik' && (() => {
            // Bu hafta (Pazartesi-Bugün)
            const bugun = new Date();
            const bugunGun = bugun.getDay();
            const pazartesi = new Date(bugun);
            const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1;
            pazartesi.setDate(bugun.getDate() - gunFarki);
            
            return `${formatDateTR(formatDate(pazartesi))} - ${formatDateTR(getBugununTarihi())}`;
          })()}
          {seciliAralik === 'gecenhafta' && (() => {
            // Geçen hafta
            const bugun = new Date();
            const bugunGun = bugun.getDay();
            
            // Bu haftanın Pazartesi'si
            const pazartesi = new Date(bugun);
            const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1;
            pazartesi.setDate(bugun.getDate() - gunFarki);
            
            // Geçen haftanın Pazartesi ve Pazar'ı
            const gecenHaftaPazartesi = new Date(pazartesi);
            gecenHaftaPazartesi.setDate(gecenHaftaPazartesi.getDate() - 7);
            
            const gecenHaftaPazar = new Date(pazartesi);
            gecenHaftaPazar.setDate(gecenHaftaPazar.getDate() - 1);
            
            return `${formatDateTR(formatDate(gecenHaftaPazartesi))} - ${formatDateTR(formatDate(gecenHaftaPazar))}`;
          })()}
          {seciliAralik === 'son30gun' && (() => {
            // Son 30 gün
            const bugun = new Date();
            const otuzGunOnce = new Date(bugun);
            otuzGunOnce.setDate(bugun.getDate() - 30);
            
            return `${formatDateTR(formatDate(otuzGunOnce))} - ${formatDateTR(formatDate(bugun))}`;
          })()}
          {seciliAralik === 'aylik' && (() => {
            const bugun = new Date();
            const ayBasi = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
            const aySonu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0);
            
            return `${formatDateTR(formatDate(ayBasi))} - ${formatDateTR(formatDate(aySonu))}`;
          })()}
          {seciliAralik === 'gecenay' && (() => {
            const bugun = new Date();
            const gecenAyBasi = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
            const gecenAySonu = new Date(bugun.getFullYear(), bugun.getMonth(), 0);
            
            return `${formatDateTR(formatDate(gecenAyBasi))} - ${formatDateTR(formatDate(gecenAySonu))}`;
          })()}
        </div>
      )}
    </div>
  );
};

export default TarihAralikSecici; 