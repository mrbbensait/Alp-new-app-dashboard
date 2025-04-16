'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { tables } from '../data/schema';
import { fetchAllFromTable, subscribeToTable, unsubscribeFromChannel, updateData } from '../lib/supabase';
import UretimEmriModal from '../components/modals/UretimEmriModal';

// Özel DataTable bileşeni
interface UretimKuyruguTableProps {
  columns: {
    name: string;
    type: string;
    displayName?: string; // Ekstra kolon başlığı değiştirme özelliği
    editable?: boolean; // Düzenlenebilir sütun
  }[];
  data?: any[];
  tableName: string;
  onCheckboxChange: (rowId: number, recipeName: string) => void;
  onCellValueChange: (rowId: number, columnName: string, value: any) => void;
  onReceteClick: (row: any) => void;
}

const UretimKuyruguTable: React.FC<UretimKuyruguTableProps> = ({ 
  columns, 
  data = [], 
  tableName,
  onCheckboxChange,
  onCellValueChange,
  onReceteClick
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingCell, setEditingCell] = useState<{rowId: number, columnName: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  
  // Sıralama mantığını uygula
  const sortedData = [...data].sort((a, b) => {
    if (sortColumn) {
      const aValue = a[sortColumn as keyof typeof a];
      const bValue = b[sortColumn as keyof typeof b];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    }
    return 0;
  });
  
  const displayData = sortedData;

  // Başlangıçta veya veri değiştiğinde varsayılan sıralamayı uygula
  useEffect(() => {
    if (data && data.length > 0) {
      setSortColumn('id');
      setSortDirection('desc');
    }
  }, [data]);

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const handleCellClick = (rowId: number, columnName: string, currentValue: any) => {
    const column = columns.find(col => col.name === columnName);
    if (column?.editable) {
      setEditingCell({ rowId, columnName });
      setTempValue(currentValue?.toString() || "");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Sadece sayı girişine izin ver
    if (/^\d*$/.test(value)) {
      setTempValue(value);
    }
  };

  const handleInputBlur = () => {
    if (editingCell) {
      const { rowId, columnName } = editingCell;
      // Sadece değer değiştiyse güncelleme yap
      const currentValue = data.find(row => row.id === rowId)?.[columnName]?.toString() || "";
      if (tempValue !== currentValue) {
        onCellValueChange(rowId, columnName, tempValue ? parseInt(tempValue, 10) : null);
      }
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Hücre içeriğini tipine göre render eder
  const renderCellContent = (row: any, column: any) => {
    const columnName = column.name;
    const value = row[columnName];
    
    switch (column.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={value === true}
              onChange={() => onCheckboxChange(row.id, row['Reçete Adı'])}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              disabled={row['Üretim Yapıldı mı?'] === true}
            />
          </div>
        );
      case 'numeric':
        if (column.editable) {
          return (
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onCellValueChange(row.id, columnName, e.target.value ? Number(e.target.value) : null)}
              className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          );
        }
        return value !== null && value !== undefined ? value.toLocaleString('tr-TR') : '-';
      case 'date':
        if (!value) return '-';
        return new Date(value).toLocaleDateString('tr-TR');
      case 'text':
        if (columnName === 'Reçete Adı') {
          return (
            <span 
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
              onClick={() => onReceteClick(row)}
            >
              {value || '-'}
            </span>
          );
        }
        return value || '-';
      default:
        return value || '-';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.name)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.displayName || column.name}</span>
                    {sortColumn === column.name && (
                      <span>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.name} className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {renderCellContent(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {displayData.length === 0 && (
        <div className="px-6 py-4 text-center text-sm text-gray-500">
          Veri bulunamadı
        </div>
      )}
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Toplam {displayData.length} kayıt
            {sortColumn === 'id' && sortDirection === 'desc' && (
              <span className="ml-2 text-xs text-gray-500">(Yeni girişler üstte)</span>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {/* Sayfalama bileşeni burada eklenebilir */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal bileşeni
interface ConfirmModalProps {
  isOpen: boolean;
  recipeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, recipeName, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Onay</h3>
          
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-lg text-indigo-700 block mb-2">{recipeName}</span>
              reçetesi için üretimi yapıldı olarak işaretlemek istediğinize emin misiniz?
            </p>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              className="w-full sm:col-start-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onConfirm}
            >
              Evet, Onayla
            </button>
            <button
              type="button"
              className="mt-3 sm:mt-0 sm:col-start-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onCancel}
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UretimKuyruguPersonelPage() {
  const tableName = 'Üretim Kuyruğu';
  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<{ id: number, recipeName: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Sayfayı yenilemek için kullanılacak key
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUretimEmriModalOpen, setIsUretimEmriModalOpen] = useState(false);
  const [selectedRecete, setSelectedRecete] = useState<any>(null);

  // Tablo şeması bulma
  const tableSchema = tables.find(table => table.name === tableName);
  
  // İstenen sütunlar - tüm ekranlarda aynı sütunları göster
  const filteredColumns = [
    { name: 'Reçete Adı', type: 'text' },
    { name: 'Marka', type: 'text' },
    { name: 'Bulk Üretim Emri(Kg)', type: 'numeric' },
    { name: 'Ambalaj Emri (ml)', type: 'numeric' },
    { name: 'Üretim Durumu', type: 'text' },
    { name: 'Kalan Bulk (Kg)', type: 'numeric' },
    { name: 'Beklenen Adet', type: 'numeric' },
    { name: 'Gerçekleşen Adet', type: 'numeric' },
    { name: 'Üretim Yapıldı mı?', type: 'boolean' },
    { name: 'Ambalajlanan Adet', type: 'numeric', displayName: '1.Ambalajlama', editable: true },
    { name: 'Ambalajlama 2', type: 'numeric', displayName: '2.Ambalajlama', editable: true }
  ];
  
  // Ekran boyutu değişimini takip et (boyuta göre filtreleme yapmıyoruz, sadece yenileme için)
  useEffect(() => {
    const handleResize = () => {
      // Ekran boyutu değişince sayfayı yenile
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Verileri yeniden yükleme fonksiyonu
  const refreshData = useCallback(async (forceRefresh = false) => {
    if (!tableSchema) return;
    
    setLoading(true);
    try {
      // Veri yükleme başladığında yükleme zamanını hatırlamak için timestamp oluştur
      const startTime = Date.now();
      
      const data = await fetchAllFromTable(tableName, forceRefresh);
      
      // Minimum 500ms yükleme göstermek için, eğer yükleme çok hızlı olduysa biraz bekle
      // Bu kullanıcıya işlemin gerçekleştiğini göstermek için önemli
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
      }
      
      setTableData(data);
      filterData(searchQuery, data);
      setError(null);
    } catch (err) {
      console.error(`Tablo verisi yüklenirken hata: ${tableName}`, err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setTableData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [tableSchema, tableName, searchQuery]);
  
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
  
  // Checkbox tıklama işleyicisi
  const handleCheckboxChange = (rowId: number, recipeName: string) => {
    setSelectedRow({ id: rowId, recipeName });
    setIsModalOpen(true);
  };
  
  // Hücre değerini değiştirme işleyicisi
  const handleCellValueChange = async (rowId: number, columnName: string, value: any) => {
    setUpdating(true);
    try {
      // Veritabanını güncelle
      await updateData(tableName, rowId, {
        [columnName]: value
      });
      
      // UI'ı optimistik olarak güncelle
      setTableData(prevData => 
        prevData.map(row => 
          row.id === rowId ? { ...row, [columnName]: value } : row
        )
      );
      
      filterData(searchQuery, 
        tableData.map(row => 
          row.id === rowId ? { ...row, [columnName]: value } : row
        )
      );
      
      // Veri değiştiğinde 3 saniye sonra otomatik yenileme planla
      scheduleAutoRefresh();
      
    } catch (error) {
      console.error('Veri güncellenirken hata oluştu:', error);
      alert('Veri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      
      // Hata durumunda yenileme yapalım
      refreshData(true);
    } finally {
      setUpdating(false);
    }
  };
  
  // Modal onaylama işleyicisi
  const handleConfirm = async () => {
    if (!selectedRow) return;
    
    setUpdating(true);
    try {
      // Veriyi güncelle
      await updateData(tableName, selectedRow.id, {
        'Üretim Yapıldı mı?': true,
        'Üretim Durumu': 'Üretim YAPILDI'
      });
      
      // UI'ı optimistik olarak güncelle (beklemeden önce)
      setTableData(prevData => 
        prevData.map(row => 
          row.id === selectedRow.id 
            ? { ...row, 'Üretim Yapıldı mı?': true, 'Üretim Durumu': 'Üretim YAPILDI' } 
            : row
        )
      );
      
      filterData(searchQuery, 
        tableData.map(row => 
          row.id === selectedRow.id 
            ? { ...row, 'Üretim Yapıldı mı?': true, 'Üretim Durumu': 'Üretim YAPILDI' } 
            : row
        )
      );
      
      // Modal kapatılıyor
      setIsModalOpen(false);
      setSelectedRow(null);
      
      // Veri değiştiğinde 3 saniye sonra otomatik yenileme planla
      scheduleAutoRefresh();
      
    } catch (error) {
      console.error('Veri güncellenirken hata oluştu:', error);
      alert('Veri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      
      // Hata durumunda yenileme yapalım
      refreshData(true);
    } finally {
      setUpdating(false);
    }
  };
  
  // Modal iptal işleyicisi
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };
  
  useEffect(() => {
    // İlk yüklemede verileri çek
    refreshData();

    // Realtime aboneliği oluştur
    const subscription = subscribeToTable(tableName, (payload) => {
      console.log('Realtime değişiklik algılandı:', payload);
      
      // Değişiklik türüne göre işlem yap
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      // Optimistik güncellemeler kullan, gereksiz yeniden yüklemeleri önle
      if (eventType === 'INSERT') {
        // Yeni kayıt eklendiğinde, mevcut verilere ekle
        setTableData(prevData => {
          const newData = [...prevData, newRecord];
          // Arama filtresini yeni veri üzerinde tekrar uygula
          filterData(searchQuery, newData);
          return newData;
        });
        
        // Değişiklik olunca 3 saniye sonra yenileme planla
        scheduleAutoRefresh();
      } 
      else if (eventType === 'UPDATE') {
        // Kayıt güncellendiğinde, ilgili kaydı güncelle
        setTableData(prevData => {
          const newData = prevData.map(item => item.id === newRecord.id ? newRecord : item);
          // Arama filtresini güncellenen veri üzerinde tekrar uygula
          filterData(searchQuery, newData);
          return newData;
        });
        
        // Değişiklik olunca 3 saniye sonra yenileme planla
        scheduleAutoRefresh();
      } 
      else if (eventType === 'DELETE') {
        // Kayıt silindiğinde, ilgili kaydı kaldır
        setTableData(prevData => {
          const newData = prevData.filter(item => item.id !== oldRecord.id);
          // Arama filtresini güncellenen veri üzerinde tekrar uygula
          filterData(searchQuery, newData);
          return newData;
        });
        
        // Değişiklik olunca 3 saniye sonra yenileme planla
        scheduleAutoRefresh();
      }
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
  }, [tableName, tableSchema, refreshKey, searchQuery, refreshData, scheduleAutoRefresh]);
  
  // Arama fonksiyonu
  const filterData = (query: string, data = tableData) => {
    // Önce "Bitti" durumunda olanları filtrele
    let filteredByStatus = data.filter(row => row['Üretim Durumu'] !== 'Bitti');
    
    // Arama sorgusu boşsa sadece duruma göre filtrelenmiş veriyi kullan
    if (!query.trim()) {
      setFilteredData(filteredByStatus);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    // Tablonun tüm sütunlarında arama yap
    const filtered = filteredByStatus.filter(row => {
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
  }, [searchQuery]);

  // Reçete adına tıklama işleyicisi
  const handleReceteClick = (row: any) => {
    console.log('Reçete tıklandı:', row);
    setSelectedRecete(row);
    setIsUretimEmriModalOpen(true);
    console.log('Modal durumu değişti:', { isUretimEmriModalOpen: true, selectedRecete: row });
  };

  if (!tableSchema) {
    return (
      <DashboardLayout>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Hata</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Tablo bulunamadı: {tableName}</p>
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
      {/* Onay Modalı */}
      <ConfirmModal 
        isOpen={isModalOpen}
        recipeName={selectedRow?.recipeName || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      {/* Üretim Emri Modal */}
      {selectedRecete && (
        <UretimEmriModal
          isOpen={isUretimEmriModalOpen}
          onClose={() => {
            console.log('Modal kapatıldı');
            setIsUretimEmriModalOpen(false);
            setSelectedRecete(null);
          }}
          receteAdi={selectedRecete['Reçete Adı']}
          uretimMiktari={selectedRecete['Bulk Üretim Emri(Kg)'] || 0}
        />
      )}
      
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900 whitespace-normal sm:whitespace-nowrap">Üretim Kuyruğu Personel</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-md">
            Personel kullanımı için özelleştirilmiş üretim kuyruğu görünümü. Sadece aktif üretimler gösterilmektedir.
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                filterData(e.target.value);
              }}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 h-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Aktif üretimlerde ara..."
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
        <UretimKuyruguTable
          columns={filteredColumns}
          data={filteredData}
          tableName={tableName}
          onCheckboxChange={handleCheckboxChange}
          onCellValueChange={handleCellValueChange}
          onReceteClick={handleReceteClick}
        />
      )}
      
      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
            <p>Güncelleniyor...</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 