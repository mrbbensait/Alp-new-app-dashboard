'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/lib/AuthContext';
import { createPage } from '@/app/lib/createPage';
import DashboardLayout from '@/app/components/DashboardLayout';

interface Log {
  id: number;
  kullanici_id: string;
  kullanici_adi: string;
  islem_turu: 'INSERT' | 'UPDATE' | 'DELETE';
  tablo_adi: string;
  kayit_id?: string;
  eski_degerler?: any;
  yeni_degerler?: any;
  ip_adresi?: string;
  tarayici_bilgisi?: string;
  olusturma_tarihi: string;
}

function KullaniciHareketleriPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    kullanici_id: '',
    islem_turu: '',
    tablo_adi: '',
    baslangic_tarihi: '',
    bitis_tarihi: ''
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });
  
  const { user } = useAuth();
  
  useEffect(() => {
    fetchLogs();
  }, [pagination.offset, pagination.limit]);
  
  const fetchLogs = async () => {
    setLoading(true);
    
    try {
      // API üzerinden logları çek
      const queryParams = new URLSearchParams();
      
      if (filter.kullanici_id) queryParams.append('kullanici_id', filter.kullanici_id);
      if (filter.islem_turu) queryParams.append('islem_turu', filter.islem_turu);
      if (filter.tablo_adi) queryParams.append('tablo_adi', filter.tablo_adi);
      if (filter.baslangic_tarihi) queryParams.append('baslangic_tarihi', filter.baslangic_tarihi);
      if (filter.bitis_tarihi) queryParams.append('bitis_tarihi', filter.bitis_tarihi);
      
      queryParams.append('limit', pagination.limit.toString());
      queryParams.append('offset', pagination.offset.toString());
      
      const response = await fetch(`/api/kullanici-hareketleri?${queryParams}`);
      const responseData = await response.json();
      
      if (responseData.success) {
        setLogs(responseData.data);
        setPagination(prev => ({
          ...prev,
          total: responseData.meta.count || 0
        }));
      } else {
        console.error('Loglar çekilirken hata:', responseData.error);
      }
    } catch (error) {
      console.error('Loglar çekilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Filtreleme yapıldığında offset'i sıfırla
    setPagination(prev => ({
      ...prev,
      offset: 0
    }));
    fetchLogs();
  };
  
  const goToPage = (newOffset: number) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset
    }));
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR');
    } catch (error) {
      return dateString;
    }
  };
  
  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
    
    return (
      <div className="flex justify-between items-center mt-4">
        <div>
          Toplam <span className="font-bold">{pagination.total}</span> kayıt,
          Sayfa <span className="font-bold">{currentPage}</span>/{totalPages}
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => goToPage(0)}
          >
            İlk
          </button>
          
          <button 
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => goToPage(Math.max(0, pagination.offset - pagination.limit))}
          >
            Önceki
          </button>
          
          <button 
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(pagination.offset + pagination.limit)}
          >
            Sonraki
          </button>
          
          <button 
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => goToPage((totalPages - 1) * pagination.limit)}
          >
            Son
          </button>
        </div>
      </div>
    );
  };
  
  const renderLogTable = () => {
    if (loading) {
      return (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          Loglar yükleniyor...
        </div>
      );
    }
    
    if (logs.length === 0) {
      return (
        <div className="text-center py-10 bg-white border rounded">
          Gösterilecek log kaydı bulunamadı.
        </div>
      );
    }
    
    return (
      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Kullanıcı</th>
                <th className="px-4 py-2 border">İşlem Türü</th>
                <th className="px-4 py-2 border">Tablo</th>
                <th className="px-4 py-2 border">Kayıt ID</th>
                <th className="px-4 py-2 border">Tarih</th>
                <th className="px-4 py-2 border">Detaylar</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{log.kullanici_adi}</td>
                  <td className="px-4 py-2 border">
                    {log.islem_turu === 'INSERT' && <span className="text-green-600">Ekleme</span>}
                    {log.islem_turu === 'UPDATE' && <span className="text-blue-600">Güncelleme</span>}
                    {log.islem_turu === 'DELETE' && <span className="text-red-600">Silme</span>}
                  </td>
                  <td className="px-4 py-2 border">{log.tablo_adi}</td>
                  <td className="px-4 py-2 border">{log.kayit_id || '-'}</td>
                  <td className="px-4 py-2 border">
                    {formatDate(log.olusturma_tarihi)}
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
                      onClick={() => {
                        const detailModal = document.getElementById('detailModal');
                        const oldDataContent = document.getElementById('oldDataContent');
                        const newDataContent = document.getElementById('newDataContent');
                        
                        if (detailModal && oldDataContent && newDataContent) {
                          oldDataContent.textContent = log.eski_degerler ? JSON.stringify(log.eski_degerler, null, 2) : 'Veri yok';
                          newDataContent.textContent = log.yeni_degerler ? JSON.stringify(log.yeni_degerler, null, 2) : 'Veri yok';
                          detailModal.classList.remove('hidden');
                        }
                      }}
                    >
                      Detaylar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {renderPagination()}
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Kullanıcı Hareketleri</h1>
        
        {/* Filtre formu */}
        <form onSubmit={applyFilters} className="bg-white p-4 rounded shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700">İşlem Türü</label>
              <select
                name="islem_turu"
                value={filter.islem_turu}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="">Tümü</option>
                <option value="INSERT">Ekleme</option>
                <option value="UPDATE">Güncelleme</option>
                <option value="DELETE">Silme</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700">Tablo Adı</label>
              <input
                type="text"
                name="tablo_adi"
                value={filter.tablo_adi}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border p-2"
                placeholder="Tablo adı..."
              />
            </div>
            
            <div>
              <label className="block text-gray-700">Başlangıç Tarihi</label>
              <input
                type="date"
                name="baslangic_tarihi"
                value={filter.baslangic_tarihi}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </div>
            
            <div>
              <label className="block text-gray-700">Bitiş Tarihi</label>
              <input
                type="date"
                name="bitis_tarihi"
                value={filter.bitis_tarihi}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Filtrele
            </button>
          </div>
        </form>
        
        {/* Log tablosu */}
        {renderLogTable()}
        
        {/* Detay modali */}
        <div id="detailModal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold">Log Detayları</h3>
              <button 
                onClick={() => {
                  const detailModal = document.getElementById('detailModal');
                  if (detailModal) detailModal.classList.add('hidden');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                X
              </button>
            </div>
            
            <div className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-red-500">Eski Değerler</h4>
                  <pre id="oldDataContent" className="bg-gray-100 p-3 rounded overflow-auto max-h-96"></pre>
                </div>
                
                <div>
                  <h4 className="font-bold text-green-500">Yeni Değerler</h4>
                  <pre id="newDataContent" className="bg-gray-100 p-3 rounded overflow-auto max-h-96"></pre>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-right">
              <button
                onClick={() => {
                  const detailModal = document.getElementById('detailModal');
                  if (detailModal) detailModal.classList.add('hidden');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// createPage fonksiyonu ile sayfayı PageGuard ile sarmalıyoruz
export default createPage(KullaniciHareketleriPage, '/ayarlar/kullanici-hareketleri'); 