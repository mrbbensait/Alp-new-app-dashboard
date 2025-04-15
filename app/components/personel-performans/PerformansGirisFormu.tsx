'use client';

import React, { useState, useEffect } from 'react';
import { PerformansRaporu } from '@/app/lib/types/index';
import { getBugununTarihi, formatDateTR } from '@/app/utils/date-utils';

interface PerformansGirisFormuProps {
  mevcutRapor?: PerformansRaporu;
  onSubmit: (rapor: Omit<PerformansRaporu, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isSubmitting?: boolean;
}

const PerformansGirisFormu: React.FC<PerformansGirisFormuProps> = ({
  mevcutRapor,
  onSubmit,
  isSubmitting = false
}) => {
  // Form durumu
  const [dolum, setDolum] = useState<number>(0);
  const [etiketleme, setEtiketleme] = useState<number>(0);
  const [kutulama, setKutulama] = useState<number>(0);
  const [selefon, setSelefon] = useState<number>(0);
  const [formHata, setFormHata] = useState<string>('');
  
  // Mevcut rapor verilerini yükle
  useEffect(() => {
    if (mevcutRapor) {
      setDolum(mevcutRapor.dolum);
      setEtiketleme(mevcutRapor.etiketleme);
      setKutulama(mevcutRapor.kutulama);
      setSelefon(mevcutRapor.selefon);
    } else {
      // Mevcut rapor yoksa sıfırla
      setDolum(0);
      setEtiketleme(0);
      setKutulama(0);
      setSelefon(0);
    }
    
    // Form hatasını temizle
    setFormHata('');
  }, [mevcutRapor]);
  
  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Doğrulama: negatif değer olmamalı
    if (dolum < 0 || etiketleme < 0 || kutulama < 0 || selefon < 0) {
      setFormHata("Negatif değerler girilemez.");
      return;
    }
    
    // En az bir değer sıfırdan büyük olmalı
    if (dolum === 0 && etiketleme === 0 && kutulama === 0 && selefon === 0) {
      setFormHata("Lütfen en az bir işlem türü için değer giriniz.");
      return;
    }
    
    try {
      // Form verilerini hazırla
      const raporData: Omit<PerformansRaporu, 'id' | 'created_at' | 'updated_at'> = {
        tarih: getBugununTarihi(),
        personel_id: mevcutRapor?.personel_id || '', // Bu normalde oturum açan kullanıcının ID'si olacak
        dolum,
        etiketleme,
        kutulama,
        selefon
      };
      
      // Formu gönder
      await onSubmit(raporData);
      
      // Başarılı mesajı gösterilebilir (isteğe bağlı)
    } catch (error) {
      console.error("Form gönderilirken hata oluştu:", error);
      setFormHata("Veri kaydedilirken bir hata oluştu. Lütfen tekrar deneyiniz.");
    }
  };
  
  const bugun = getBugununTarihi();
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-5 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Günlük Performans Raporu</h2>
        <div className="text-sm font-medium text-gray-600">
          {formatDateTR(bugun)}
        </div>
      </div>
      
      {formHata && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {formHata}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dolum" className="block text-sm font-medium text-gray-700 mb-1">
              Dolum
            </label>
            <input
              type="number"
              id="dolum"
              value={dolum}
              onChange={(e) => setDolum(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="etiketleme" className="block text-sm font-medium text-gray-700 mb-1">
              Etiketleme
            </label>
            <input
              type="number"
              id="etiketleme"
              value={etiketleme}
              onChange={(e) => setEtiketleme(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="kutulama" className="block text-sm font-medium text-gray-700 mb-1">
              Kutulama
            </label>
            <input
              type="number"
              id="kutulama"
              value={kutulama}
              onChange={(e) => setKutulama(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="selefon" className="block text-sm font-medium text-gray-700 mb-1">
              Selefon
            </label>
            <input
              type="number"
              id="selefon"
              value={selefon}
              onChange={(e) => setSelefon(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              px-4 py-2 text-base font-medium rounded-md shadow-sm text-white 
              bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}
            `}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Raporu Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PerformansGirisFormu; 