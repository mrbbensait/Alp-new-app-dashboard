'use client';

import React, { useState, useEffect } from 'react';
import { PerformansRaporu, Vardiya } from '@/app/lib/types/index';
import { getBugununTarihi, formatDateTR } from '@/app/utils/date-utils';

interface PerformansGirisFormuProps {
  mevcutRapor?: PerformansRaporu;
  vardiya: Vardiya;
  onSubmit: (rapor: Omit<PerformansRaporu, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isSubmitting?: boolean;
}

const PerformansGirisFormu: React.FC<PerformansGirisFormuProps> = ({
  mevcutRapor,
  vardiya,
  onSubmit,
  isSubmitting = false
}) => {
  const [dolum, setDolum] = useState<number>(mevcutRapor?.dolum || 0);
  const [etiketleme, setEtiketleme] = useState<number>(mevcutRapor?.etiketleme || 0);
  const [kutulama, setKutulama] = useState<number>(mevcutRapor?.kutulama || 0);
  const [selefon, setSelefon] = useState<number>(mevcutRapor?.selefon || 0);
  const [formHata, setFormHata] = useState<string>("");
  
  // Form resetleme
  const resetForm = () => {
    setDolum(mevcutRapor?.dolum || 0);
    setEtiketleme(mevcutRapor?.etiketleme || 0);
    setKutulama(mevcutRapor?.kutulama || 0);
    setSelefon(mevcutRapor?.selefon || 0);
    setFormHata("");
  };
  
  // Props değiştiğinde formu güncelle
  useEffect(() => {
    resetForm();
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
        vardiya,
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
          {formatDateTR(bugun)} - {vardiya === Vardiya.Gunduz ? 'Gündüz Vardiyası' : 'Gece Vardiyası'}
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
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Sıfırla
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kaydediliyor...
              </span>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PerformansGirisFormu; 