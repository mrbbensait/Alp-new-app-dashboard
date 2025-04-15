'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import PerformansGirisFormu from '../components/personel-performans/PerformansGirisFormu';
import { PerformansRaporu } from '../lib/types/index';
import { getBugununTarihi } from '../utils/date-utils';

export default function PersonelRaporPage() {
  const router = useRouter();
  const [mevcutRapor, setMevcutRapor] = useState<PerformansRaporu | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hata, setHata] = useState<string>('');
  const [basarili, setBasarili] = useState<boolean>(false);
  
  // Geçerli bir UUID formatı kullanıyoruz (standart UUID formatı)
  const personelId = '123e4567-e89b-12d3-a456-426614174000';
  
  useEffect(() => {
    const bugununRaporunuGetir = async () => {
      setIsLoading(true);
      setHata('');
      
      try {
        // Bugünün tarihini al
        const bugun = getBugununTarihi();
        
        // Bugünün raporunu API'den getir
        const response = await fetch(`/api/performans?tarih=${bugun}&personel_id=${personelId}`);
        
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
  }, [personelId]);
  
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
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <PerformansGirisFormu
            mevcutRapor={mevcutRapor}
            onSubmit={handleRaporGonder}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 