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
  const [tables, setTables] = useState<string[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
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
    fetchTables();
    fetchUsers();
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
  
  const fetchTables = async () => {
    try {
      // Benzersiz tablo adlarını getir
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('tablo_adi')
        .order('tablo_adi')
        .not('tablo_adi', 'is', null);
      
      if (error) throw error;
      
      // Benzersiz tablo adlarını filtrele - Map kullanarak
      const uniqueTablesMap = new Map();
      data.forEach(item => {
        if (item.tablo_adi) {
          uniqueTablesMap.set(item.tablo_adi, item.tablo_adi);
        }
      });
      
      setTables(Array.from(uniqueTablesMap.values()));
    } catch (error) {
      console.error('Tablo adları çekilirken hata:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      // Benzersiz kullanıcı adlarını getir
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('kullanici_id, kullanici_adi')
        .order('kullanici_adi');
      
      if (error) throw error;
      
      // Benzersiz kullanıcıları filtrele
      const uniqueUsers = Array.from(
        new Map(data.map(item => [item.kullanici_id, { id: item.kullanici_id, name: item.kullanici_adi }]))
        .values()
      );
      
      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Kullanıcılar çekilirken hata:', error);
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
      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm">
        <div className="mb-2 sm:mb-0">
          Toplam <span className="font-bold">{pagination.total}</span> kayıt,
          Sayfa <span className="font-bold">{currentPage}</span>/{totalPages}
        </div>
        
        <div className="flex space-x-1">
          <button 
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs sm:text-sm"
            disabled={currentPage === 1}
            onClick={() => goToPage(0)}
          >
            İlk
          </button>
          
          <button 
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs sm:text-sm"
            disabled={currentPage === 1}
            onClick={() => goToPage(Math.max(0, pagination.offset - pagination.limit))}
          >
            Önceki
          </button>
          
          <button 
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs sm:text-sm"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(pagination.offset + pagination.limit)}
          >
            Sonraki
          </button>
          
          <button 
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs sm:text-sm"
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
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm">Loglar yükleniyor...</span>
        </div>
      );
    }
    
    if (logs.length === 0) {
      return (
        <div className="text-center py-8 bg-white border rounded text-sm">
          Gösterilecek log kaydı bulunamadı.
        </div>
      );
    }
    
    return (
      <div>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full bg-white border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 sm:px-3 py-2 border text-left">Kullanıcı</th>
                <th className="px-2 sm:px-3 py-2 border text-left">İşlem</th>
                <th className="px-2 sm:px-3 py-2 border text-left">Tablo</th>
                <th className="px-2 sm:px-3 py-2 border text-left">ID</th>
                <th className="px-2 sm:px-3 py-2 border text-left">Tarih</th>
                <th className="px-2 sm:px-3 py-2 border text-center w-20">Detay</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-1.5 border">{log.kullanici_adi}</td>
                  <td className="px-2 sm:px-3 py-1.5 border whitespace-nowrap">
                    {log.islem_turu === 'INSERT' && <span className="text-green-600">Ekleme</span>}
                    {log.islem_turu === 'UPDATE' && <span className="text-blue-600">Güncelleme</span>}
                    {log.islem_turu === 'DELETE' && <span className="text-red-600">Silme</span>}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 border truncate max-w-[120px]">{log.tablo_adi}</td>
                  <td className="px-2 sm:px-3 py-1.5 border truncate max-w-[60px]">{log.kayit_id || '-'}</td>
                  <td className="px-2 sm:px-3 py-1.5 border whitespace-nowrap text-xs">
                    {formatDate(log.olusturma_tarihi)}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 border text-center">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 px-1.5 py-0.5 rounded text-xs"
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
      <div className="p-2 sm:p-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-3">Kullanıcı Hareketleri</h1>
        
        {/* Filtre formu - Mobil uyumlu yapıldı */}
        <form onSubmit={applyFilters} className="bg-white p-3 rounded shadow mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-700 text-sm">Kullanıcı</label>
              <select
                name="kullanici_id"
                value={filter.kullanici_id}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border text-sm p-1.5 text-gray-700"
              >
                <option value="">Tüm Kullanıcılar</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm">İşlem Türü</label>
              <select
                name="islem_turu"
                value={filter.islem_turu}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border text-sm p-1.5 text-gray-700"
              >
                <option value="">Tümü</option>
                <option value="INSERT">Ekleme</option>
                <option value="UPDATE">Güncelleme</option>
                <option value="DELETE">Silme</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm">Tablo Adı</label>
              <select
                name="tablo_adi"
                value={filter.tablo_adi}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border text-sm p-1.5 text-gray-700"
              >
                <option value="">Tüm Tablolar</option>
                {tables.map(table => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm">Başlangıç</label>
              <input
                type="date"
                name="baslangic_tarihi"
                value={filter.baslangic_tarihi}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border p-1.5 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm">Bitiş</label>
              <input
                type="date"
                name="bitis_tarihi"
                value={filter.bitis_tarihi}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border p-1.5 text-sm"
              />
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
            >
              Filtrele
            </button>
          </div>
        </form>
        
        {/* Log tablosu */}
        {renderLogTable()}
        
        {/* Detay modali */}
        <div id="detailModal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
          <div className="relative top-20 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-lg font-bold">Log Detayları</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-bold text-red-500 text-sm">Eski Değerler</h4>
                  <pre id="oldDataContent" className="bg-gray-100 p-2 rounded overflow-auto max-h-60 text-xs"></pre>
                </div>
                
                <div>
                  <h4 className="font-bold text-green-500 text-sm">Yeni Değerler</h4>
                  <pre id="newDataContent" className="bg-gray-100 p-2 rounded overflow-auto max-h-60 text-xs"></pre>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-right">
              <button
                onClick={() => {
                  const detailModal = document.getElementById('detailModal');
                  if (detailModal) detailModal.classList.add('hidden');
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-sm"
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