'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { getBugununTarihi, formatDate } from '../utils/date-utils';

// Performans verileri için tip tanımı
export interface PerformansProps {
  dunkuPerformans?: number;
  haftaPerformans?: number;
}

// Performans context için tip tanımı
interface PerformansContextType {
  performansVerileri: PerformansProps;
  updatePerformansVerileri: (veriler: PerformansProps) => void;
  fetchPerformansVerileri: () => Promise<void>;
}

// Context oluşturma
const PerformansContext = createContext<PerformansContextType | undefined>(undefined);

// Context provider bileşeni
export const PerformansProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [performansVerileri, setPerformansVerileri] = useState<PerformansProps>({});

  // Sayfa yüklendiğinde performans verilerini getir
  useEffect(() => {
    fetchPerformansVerileri();
  }, []);

  // Performans verilerini güncelleme
  const updatePerformansVerileri = (veriler: PerformansProps) => {
    setPerformansVerileri(veriler);
  };

  // Performans verilerini alma fonksiyonu
  const fetchPerformansVerileri = async (): Promise<void> => {
    try {
      // Bugün ve dün için tarih oluştur
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);
      
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      const dunTarihi = formatTarih(dun);
      
      // Pazartesi gününü hesapla
      const bugunGun = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ...
      const pazartesiGunu = new Date(bugun);
      const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1; // Pazar günü için 6 gün geriye git, diğer günler için güncel gün - 1
      pazartesiGunu.setDate(bugun.getDate() - gunFarki);
      const pazartesiTarihi = formatTarih(pazartesiGunu);
      const bugunTarihi = formatTarih(bugun);
      
      // Supabase'den performans verilerini getir
      const { data, error } = await supabase
        .from('performans_raporlari')
        .select('*')
        .gte('tarih', pazartesiTarihi)
        .lte('tarih', bugunTarihi);
      
      if (error) {
        console.error('Performans verileri alınırken hata:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Dünkü performansı hesapla
        const dunkuRaporlar = data.filter(rapor => rapor.tarih === dunTarihi);
        let dunkuPerformans = 0;
        
        if (dunkuRaporlar.length > 0) {
          let dunkuToplamIs = 0;
          dunkuRaporlar.forEach(rapor => {
            dunkuToplamIs += rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
          });
          dunkuPerformans = (dunkuToplamIs / 12500) * 100; // 12500 = %100 performans
        }
        
        // Haftalık performansı hesapla
        const gunlukRaporlar = new Map<string, number>();
        
        data.forEach(rapor => {
          const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
          if (gunlukRaporlar.has(rapor.tarih)) {
            gunlukRaporlar.set(rapor.tarih, gunlukRaporlar.get(rapor.tarih)! + gunlukToplam);
          } else {
            gunlukRaporlar.set(rapor.tarih, gunlukToplam);
          }
        });
        
        let haftaToplamIs = 0;
        gunlukRaporlar.forEach((toplamIs) => {
          haftaToplamIs += toplamIs;
        });
        
        const gunSayisi = gunlukRaporlar.size;
        const haftaOrtalamaIs = gunSayisi > 0 ? haftaToplamIs / gunSayisi : 0;
        const haftaPerformans = (haftaOrtalamaIs / 12500) * 100; // 12500 = %100 performans
        
        // Performans verilerini set et
        setPerformansVerileri({
          dunkuPerformans,
          haftaPerformans
        });
      }
    } catch (error) {
      console.error('Performans verileri hesaplanırken hata:', error);
    }
  };
  
  // Tarih formatını YYYY-MM-DD şeklinde döndüren yardımcı fonksiyon
  const formatTarih = (tarih: Date): string => {
    const yil = tarih.getFullYear();
    const ay = String(tarih.getMonth() + 1).padStart(2, '0');
    const gun = String(tarih.getDate()).padStart(2, '0');
    return `${yil}-${ay}-${gun}`;
  };

  // Context değeri
  const value = {
    performansVerileri,
    updatePerformansVerileri,
    fetchPerformansVerileri
  };

  return <PerformansContext.Provider value={value}>{children}</PerformansContext.Provider>;
};

// Hook olarak kullanım
export const usePerformans = (): PerformansContextType => {
  const context = useContext(PerformansContext);
  if (context === undefined) {
    throw new Error('usePerformans must be used within a PerformansProvider');
  }
  return context;
};

export default PerformansContext; 