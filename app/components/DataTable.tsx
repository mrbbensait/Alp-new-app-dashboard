import React, { useState, useEffect } from 'react';
import { updateData } from '../lib/supabase';

interface DataTableProps {
  columns: {
    name: string;
    type: string;
  }[];
  data?: any[];
  tableName: string;
}

// Modal bileşeni
interface ConfirmModalProps {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, productName, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Teslim Onayı</h3>
          
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-3">
              Bu siparişin teslim edildiğini onaylıyorsunuz:
            </p>
            <div className="bg-indigo-50 py-3 px-4 rounded-md border border-indigo-200">
              <span className="font-bold text-lg text-indigo-700">{productName}</span>
            </div>
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

const DataTable: React.FC<DataTableProps> = ({ columns, data = [], tableName }) => {
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<{ id: number, columnName: string, productName: string } | null>(null);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Başlangıçta veya veri değiştiğinde varsayılan sıralamayı uygula
  useEffect(() => {
    if (data.length > 0 && data[0]?.id) {
      setSortColumn('id');
      setSortDirection('desc');
    }
  }, [data]);

  // Temizlik fonksiyonu
  useEffect(() => {
    return () => {
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
    };
  }, [autoRefreshTimer]);

  // Otomatik yenileme planlama fonksiyonu
  const scheduleAutoRefresh = () => {
    // Eğer önceden bir zamanlayıcı varsa temizle
    if (autoRefreshTimer) {
      clearTimeout(autoRefreshTimer);
    }
    
    // 3 saniye sonra sayfayı yenileyecek
    const timer = setTimeout(() => {
      window.location.reload();
    }, 3000);
    
    setAutoRefreshTimer(timer);
  };

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  // Checkbox değişim işleyicisi - şimdi modal açıyor
  const handleCheckboxChange = (rowId: number, columnName: string, productName: string) => {
    setSelectedRow({ id: rowId, columnName, productName });
    setIsModalOpen(true);
  };
  
  // Modal onaylama işleyicisi
  const handleModalConfirm = async () => {
    if (!selectedRow) return;
    
    // Güncellenecek satırı işaretle
    setUpdatingRow(selectedRow.id);
    
    try {
      // Supabase'de güncelleştirme yap
      await updateData(tableName, selectedRow.id, { 
        [selectedRow.columnName]: true
      });
      console.log(`${selectedRow.columnName} güncellendi: ${selectedRow.id}`);
      
      // Modal kapatılıyor
      setIsModalOpen(false);
      setSelectedRow(null);
      
      // Sayfa yenileme planla
      scheduleAutoRefresh();
    } catch (error) {
      console.error(`${selectedRow.columnName} güncellenirken hata oluştu:`, error);
      alert(`${selectedRow.columnName} güncellenirken bir hata oluştu. Lütfen tekrar deneyin.`);
    } finally {
      // İşlem tamamlandı
      setUpdatingRow(null);
    }
  };
  
  // Modal iptal işleyicisi
  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  // Sütuna göre sıralama
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    
    if (valueA === valueB) return 0;
    
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (valueA === null || valueA === undefined) return 1 * direction;
    if (valueB === null || valueB === undefined) return -1 * direction;
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB, 'tr') * direction;
    }
    
    return (valueA < valueB ? -1 : 1) * direction;
  });

  // id sütunu içerip içermediğini kontrol et
  const hasIdColumn = columns.some(col => col.name === 'id' || col.name === 'ID');

  console.log('Tablo adı:', tableName);
  console.log('Tüm Sütunlar:', columns.map(c => c.name).join(', '));
  if (data.length > 0) {
    console.log('İlk satır verisi:', JSON.stringify(data[0], null, 2));
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Onay Modalı */}
      <ConfirmModal 
        isOpen={isModalOpen}
        productName={selectedRow?.productName || ''}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.name)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
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
            {sortedData.length > 0 ? (
              sortedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => {
                    // Teslim Durumu sütununu işaretle - tüm olası yazılışları kontrol et
                    const isTeslimColumn = 
                      column.name === 'TESLIMDURUMU' || 
                      column.name === 'TESLİMDURUMU' || 
                      column.name === 'Teslim Durumu' || 
                      column.name === 'teslimdurumu' ||
                      column.name === 'TeslimDurumu';
                    
                    // Satın Alma tablosuna ait mi kontrol et
                    const isSatinAlmaTable = 
                      tableName.includes('Satın') || 
                      tableName.includes('Satin') || 
                      tableName.includes('SatınAlma') || 
                      tableName.includes('Sipariş');
                    
                    return (
                      <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isTeslimColumn && isSatinAlmaTable ? (
                          // Teslim Durumu sütunu için checkbox göster
                          <div className="flex items-center">
                            {updatingRow === row.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                            ) : (
                              <div className="flex items-center">
                                {row[column.name] === true || row[column.name] === 'Evet' || row[column.name] === 'evet' ? (
                                  <svg className="h-5 w-5 text-white bg-indigo-600 rounded" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <input 
                                    type="checkbox" 
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    checked={false}
                                    onChange={() => {
                                      // Ürün adını satırdan al
                                      const productName = row['Alınan Ürün'] || row['Hammadde ID'] || row['Tedarikçi'];
                                      handleCheckboxChange(row.id, column.name, productName);
                                    }}
                                    disabled={updatingRow !== null}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ) : column.type === 'boolean' ? (
                          row[column.name] ? 'Evet' : 'Hayır'
                        ) : (
                          row[column.name]
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  Veri bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Toplam {sortedData.length} kayıt
            {hasIdColumn && sortColumn === 'id' && sortDirection === 'desc' && (
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

export default DataTable; 