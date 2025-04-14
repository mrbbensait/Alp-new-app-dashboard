'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import { tables } from '../../data/schema';
import { 
  fetchAllFromTable, 
  fetchFilteredData, 
  subscribeToTable, 
  unsubscribeFromChannel 
} from '../../lib/supabase';

export default function TablePage() {
  const { tableName } = useParams<{ tableName: string }>();
  const decodedTableName = decodeURIComponent(tableName as string);
  
  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Tablo şeması bulma
  const tableSchema = tables.find(table => table.name === decodedTableName);
  
  // Verileri yeniden yükleme fonksiyonu
  const refreshData = useCallback(async (forceRefresh = false) => {
    if (!tableSchema) return;
    
    setLoading(true);
    try {
      // Veri yükleme başladığında yükleme zamanını hatırlamak için timestamp oluştur
      const startTime = Date.now();
      
      const data = await fetchAllFromTable(decodedTableName, forceRefresh);
      
      // Minimum 500ms yükleme göstermek için, eğer yükleme çok hızlı olduysa biraz bekle
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
      }
      
      setTableData(data);
      filterData(searchQuery, data);
      setError(null);
    } catch (err) {
      console.error(`Tablo verisi yüklenirken hata: ${decodedTableName}`, err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setTableData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [tableSchema, decodedTableName, searchQuery]);
  
  // Manuel olarak sayfayı yenileme - önbelleği bypass et
  const handleRefresh = () => {
    console.log("Manuel yenileme yapılıyor, önbellek bypass ediliyor...");
    refreshData(true); // forceRefresh=true ile önbelleği bypass et
    setRefreshKey(prev => prev + 1);
  };
  
  // Otomatik yenileme planlama fonksiyonu
  const scheduleAutoRefresh = useCallback(() => {
    // Eğer önceden bir zamanlayıcı varsa temizle
    if (autoRefreshTimer) {
      clearTimeout(autoRefreshTimer);
    }
    
    // 3 saniye sonra otomatik yenileme yapacak zamanlayıcı oluştur
    const timer = setTimeout(() => {
      console.log("Veri değişikliği sonrası otomatik yenileme yapılıyor...");
      refreshData(true); // Önbelleği bypass et
      setAutoRefreshTimer(null);
    }, 3000);
    
    setAutoRefreshTimer(timer);
  }, [refreshData, autoRefreshTimer]);
  
  useEffect(() => {
    // İlk yüklemede verileri çek
    refreshData();

    // Realtime aboneliği oluştur
    const subscription = subscribeToTable(decodedTableName, () => {
      // Veri değişikliği olunca 3 saniye sonra yenileme planla
      scheduleAutoRefresh();
    });
    
    // Temizlik fonksiyonu - component unmount olduğunda aboneliği iptal et
    return () => {
      if (subscription) {
        unsubscribeFromChannel(subscription);
      }
      
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
    };
  }, [decodedTableName, tableSchema, refreshKey, refreshData, scheduleAutoRefresh]);
  
  // Arama fonksiyonu
  const filterData = (query: string, data = tableData) => {
    if (!query.trim()) {
      setFilteredData(data);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    // Tablonun tüm sütunlarında arama yap
    const filtered = data.filter(row => {
      // Tüm sütunlarda ara
      return Object.keys(row).some(key => {
        const value = row[key];
        // null veya undefined değerler için kontrol
        if (value === null || value === undefined) return false;
        
        // Değer türüne göre arama yap
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseQuery);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          return value.toString().toLowerCase().includes(lowercaseQuery);
        } else if (value instanceof Date) {
          return value.toLocaleDateString('tr-TR').includes(lowercaseQuery);
        } else if (typeof value === 'object') {
          // JSON veya nesne değerleri için
          try {
            return JSON.stringify(value).toLowerCase().includes(lowercaseQuery);
          } catch {
            return false;
          }
        }
        return false;
      });
    });
    
    setFilteredData(filtered);
  };

  // Arama kutusundan gelen değişiklikleri izle
  useEffect(() => {
    filterData(searchQuery);
  }, [searchQuery, tableData]);
  
  // Component unmount olduğunda zamanlayıcıları temizle
  useEffect(() => {
    return () => {
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
    };
  }, [autoRefreshTimer]);
  
  if (!tableSchema) {
    return (
      <DashboardLayout>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Hata</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Tablo bulunamadı: {decodedTableName}</p>
            </div>
            <div className="mt-5">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900 whitespace-normal sm:whitespace-nowrap">{decodedTableName}</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-md">
            {`${decodedTableName} tablosundaki verileri görüntüleyin ve yönetin.`}
          </p>
        </div>
        
        {/* Arama kutusu ve Yenile butonu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 w-full sm:w-auto">
          {/* Arama kutusu - yenile butonunun 3 katı genişliğinde */}
          <div className="relative rounded-md shadow-sm w-full sm:w-64 md:w-80 mb-2 sm:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 h-10 sm:text-sm border-gray-300 rounded-md"
              placeholder={`${decodedTableName} tablosunda ara...`}
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setSearchQuery('')}>
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Yenile Butonu */}
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Yenile
          </button>
        </div>
      </div>

      {/* Arama sonuç bilgisi */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-500">
          Arama sonucu: {filteredData.length} kayıt bulundu
        </div>
      )}
      
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2">Veriler yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      ) : (
        <DataTable 
          columns={tableSchema.columns}
          tableName={decodedTableName} 
          data={filteredData}
        />
      )}
    </DashboardLayout>
  );
} 