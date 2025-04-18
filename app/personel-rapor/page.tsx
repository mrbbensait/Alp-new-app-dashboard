'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import PerformansGirisFormu from '../components/personel-performans/PerformansGirisFormu';
import { PerformansRaporu } from '../lib/types/index';
import { getBugununTarihi } from '../utils/date-utils';
import { useAuth } from '../lib/AuthContext';
import PageGuard from '../components/PageGuard';

export default function PersonelRaporPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mevcutRapor, setMevcutRapor] = useState<PerformansRaporu | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hata, setHata] = useState<string>('');
  const [basarili, setBasarili] = useState<boolean>(false);
  
  useEffect(() => {
    if (user && user.id) {
      bugununRaporunuGetir(String(user.id));
    } else {
      setIsLoading(false);
      setHata('Giriş yapmış kullanıcı bilgisi bulunamadı.');
    }
  }, [user]);
  
  const bugununRaporunuGetir = async (personelId: string) => {
    setIsLoading(true);
    setHata('');
    
    try {
      const bugun = getBugununTarihi();
      
      const response = await fetch(`/api/performans?tarih=${bugun}&personel_id=${personelId}`);
      
      if (!response.ok) {
        throw new Error('Rapor verisi alınamadı');
      }
      
      const data = await response.json();
      
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
  
  const handleRaporGonder = async (rapor: Omit<PerformansRaporu, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !user.id) {
      setHata('Lütfen giriş yapınız.');
      return;
    }
    
    setIsSubmitting(true);
    setHata('');
    setBasarili(false);
    
    try {
      const response = await fetch('/api/performans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rapor,
          personel_id: String(user.id),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rapor kaydedilemedi');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBasarili(true);
        
        setTimeout(() => setBasarili(false), 3000);
        
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
  
  return (
    <PageGuard sayfaYolu="/personel-rapor">
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Personel Performans Raporu</h1>
          
          {user && user.ad_soyad && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-lg font-medium text-gray-800">Personel: {user.ad_soyad}</p>
            </div>
          )}
          
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
          ) : user && user.id ? (
            <PerformansGirisFormu
              mevcutRapor={mevcutRapor}
              onSubmit={handleRaporGonder}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
              Raporu görüntülemek veya göndermek için lütfen giriş yapınız. 
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageGuard>
  );
} 