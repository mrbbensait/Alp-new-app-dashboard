'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import PerformansGirisFormu from '../components/personel-performans/PerformansGirisFormu';
import VardiyaSecici from '../components/personel-performans/VardiyaSecici';
import { PerformansRaporu, Vardiya } from '../lib/types/index';
import { getBugununTarihi } from '../utils/date-utils';

export default function PersonelRaporPage() {
  const router = useRouter();
  const [vardiya, setVardiya] = useState<Vardiya>(Vardiya.Gunduz);
  const [mevcutRapor, setMevcutRapor] = useState<PerformansRaporu | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hata, setHata] = useState<string>('');
  const [basarili, setBasarili] = useState<boolean>(false);
  
  // Geçerli bir UUID formatı kullanıyoruz (standart UUID formatı)
  const personelId = '123e4567-e89b-12d3-a456-426614174000';
  
  // Sunucu saati (sadece demo için)
  const getBugununSaati = () => {
    return new Date().getHours();
  };
  
  useEffect(() => {
    const bugununRaporunuGetir = async () => {
      setIsLoading(true);
      setHata('');
      
      try {
        // Bugünün tarihini al
        const bugun = getBugununTarihi();
        
        // Bugünün raporunu API'den getir
        const response = await fetch(`/api/performans?tarih=${bugun}&vardiya=${vardiya}&personel_id=${personelId}`);
        
        if (!response.ok) {
          throw new Error('Rapor verisi alınamadı');
        }
        
        const data = await response.json();
        
        // Eğer bu tarih için rapor varsa
        if (data.success && data.data && data.data.length > 0) {
          setMevcutRapor(data.data[0] as PerformansRaporu);
        } else {
          setMevcutRapor(undefined);
        }
      } catch (error) {
        console.error('Rapor verisi alınırken hata:', error);
        setHata('Rapor verisi alınırken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
      } finally {
        setIsLoading(false);
      }
    };
    
    bugununRaporunuGetir();
  }, [vardiya, personelId]);
  
  const handleVardiyaDegistir = (yeniVardiya: Vardiya) => {
    setVardiya(yeniVardiya);
  };
  
  const handleRaporGonder = async (rapor: Omit<PerformansRaporu, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    setHata('');
    setBasarili(false);
    
    try {
      // API'ye raporu gönder
      const response = await fetch('/api/performans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rapor,
          personel_id: personelId, // Aynı UUID'yi burada da kullanıyoruz
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rapor kaydedilemedi');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBasarili(true);
        
        // Başarılı mesajını 3 saniye sonra kapat
        setTimeout(() => setBasarili(false), 3000);
        
        // Mevcut raporu güncelle
        if (data.data && data.data.length > 0) {
          setMevcutRapor(data.data[0] as PerformansRaporu);
        }
      } else {
        throw new Error(data.error || 'Rapor kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Rapor gönderilirken hata:', error);
      setHata(error.message || 'Rapor kaydedilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sayfanın içeriğini render et
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Personel Performans Raporu</h1>
        
        {hata && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {hata}
          </div>
        )}
        
        {basarili && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            Rapor başarıyla kaydedildi!
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700 mb-2 sm:mb-0">Vardiya Seçimi</h2>
            <VardiyaSecici
              seciliVardiya={vardiya}
              onVardiyaDegistir={handleVardiyaDegistir}
              disabled={isSubmitting}
            />
          </div>
          <p className="text-sm text-gray-600">
            Not: Vardiyayı değiştirdiğinizde, o vardiya için girilen veriler gösterilecektir.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <PerformansGirisFormu
            mevcutRapor={mevcutRapor}
            vardiya={vardiya}
            onSubmit={handleRaporGonder}
            isSubmitting={isSubmitting}
          />
        )}
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
          <p className="font-medium mb-1">Bilgi</p>
          <p className="text-sm">
            Bu sayfadan günlük performans verilerinizi girebilir ve gün içinde güncelleyebilirsiniz.
            Gün sonunda veriler kaydedilecek ve istatistiklere yansıyacaktır.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
} 