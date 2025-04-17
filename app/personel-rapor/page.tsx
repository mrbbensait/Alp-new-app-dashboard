'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import PerformansGirisFormu from '../components/personel-performans/PerformansGirisFormu';
import { PerformansRaporu } from '../lib/types/index';
import { getBugununTarihi } from '../utils/date-utils';
import { useAuth } from '../lib/AuthContext';

export default function PersonelRaporPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mevcutRapor, setMevcutRapor] = useState<PerformansRaporu | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hata, setHata] = useState<string>('');
  const [basarili, setBasarili] = useState<boolean>(false);
  const [personeller, setPersoneller] = useState<{id: string, ad_soyad: string}[]>([]);
  const [selectedPersonelId, setSelectedPersonelId] = useState<string>('');
  
  useEffect(() => {
    const fetchPersoneller = async () => {
      try {
        const response = await fetch('/api/personel');
        if (!response.ok) {
          throw new Error('Personel listesi alınamadı');
        }
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          setPersoneller(data.data.map((p: any) => ({ id: p.id, ad_soyad: p.ad_soyad })));
          
          if (user && user.id) {
            setSelectedPersonelId(user.id);
          } else if (data.data.length > 0) {
            setSelectedPersonelId(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Personel listesi alınırken hata:', error);
        setHata('Personel listesi alınırken bir hata oluştu.');
      }
    };
    
    fetchPersoneller();
  }, [user]);
  
  useEffect(() => {
    if (selectedPersonelId) {
      bugununRaporunuGetir(selectedPersonelId);
    }
  }, [selectedPersonelId]);
  
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
    if (!selectedPersonelId) {
      setHata('Lütfen bir personel seçiniz.');
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
          personel_id: selectedPersonelId,
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
        
        {personeller.length > 0 && (
          <div className="mb-6">
            <label htmlFor="personel-select" className="block text-sm font-medium text-gray-700 mb-1">
              Personel Seçin
            </label>
            <select
              id="personel-select"
              value={selectedPersonelId}
              onChange={(e) => setSelectedPersonelId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Personel Seçiniz</option>
              {personeller.map((personel) => (
                <option key={personel.id} value={personel.id}>
                  {personel.ad_soyad}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : selectedPersonelId ? (
          <PerformansGirisFormu
            mevcutRapor={mevcutRapor}
            onSubmit={handleRaporGonder}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            Lütfen rapor için personel seçin.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 