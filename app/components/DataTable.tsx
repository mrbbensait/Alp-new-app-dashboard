import React, { useState, useEffect } from 'react';
import { updateData, insertData } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import FormulationModal from './modals/FormulationModal';
import { useAuth } from '../lib/AuthContext';
import TeslimBilgisiModal from './modals/TeslimBilgisiModal';

interface DataTableProps {
  columns: {
    name: string;
    type: string;
  }[];
  data?: any[];
  tableName: string;
  onReceteClick?: (receteAdi: string, urunId: number) => void;
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

const DataTable: React.FC<DataTableProps> = ({ columns, data = [], tableName, onReceteClick }) => {
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<{ id: number, columnName: string, productName: string } | null>(null);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingCell, setEditingCell] = useState<{rowId: number, columnName: string} | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  // Optimistik güncelleme için geçici değerleri tutacak state
  const [optimisticUpdates, setOptimisticUpdates] = useState<{[key: number]: {[key: string]: any}}>({});
  
  // Formülasyon modalı için state
  const [isFormulationModalOpen, setIsFormulationModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{ name: string, id: string, brand: string } | null>(null);
  
  // Teslim bilgisi modalı için state'ler
  const [isTeslimBilgisiModalOpen, setIsTeslimBilgisiModalOpen] = useState(false);
  const [teslimBilgisi, setTeslimBilgisi] = useState<{
    urunAdi: string;
    personelAdi: string;
    teslimTarihi: string;
  } | null>(null);

  // Auth context'ten kullanıcı bilgisini al
  const { user } = useAuth();

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
      
      // Satınalma siparişleri tablosuna yapılan işlemlerde teslim alan personel bilgisini kaydet
      if (tableName === 'SatınAlma siparişleri' && selectedRow.columnName === 'TeslimDurumu' && user) {
        try {
          // teslim_alan_personel tablosuna kayıt ekle
          await insertData('teslim_alan_personel', {
            siparis_id: selectedRow.id,
            personel_id: user.id,
          });
          console.log(`Teslim alan personel kaydedildi: ${user.ad_soyad}`);
        } catch (personelError) {
          console.error('Teslim alan personel kaydedilirken hata oluştu:', personelError);
          // Ana işlemi etkilememesi için bu hatayı yutuyoruz
        }
      }
      
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

  // Notlar hücresi tıklama işleyicisi
  const handleNotesClick = (rowId: number, columnName: string, currentValue: string) => {
    setEditingCell({ rowId, columnName });
    setInputValue(currentValue || "");
  };

  // Input değişim işleyicisi
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Input blur olayı işleyicisi
  const handleInputBlur = async () => {
    if (editingCell) {
      const { rowId, columnName } = editingCell;
      const rowData = data.find(row => row.id === rowId);
      
      // Değer değiştiyse güncelleme yap
      if (rowData && rowData[columnName] !== inputValue) {
        // Hemen optimistik güncelleme yap
        setOptimisticUpdates(prev => ({
          ...prev,
          [rowId]: {
            ...(prev[rowId] || {}),
            [columnName]: inputValue
          }
        }));
        
        setUpdatingRow(rowId);
        
        try {
          // Veritabanını güncelle
          await updateData(tableName, rowId, { [columnName]: inputValue });
          console.log(`${columnName} güncellendi: ${rowId}`);
          
          // Otomatik yenileme planla (kullanıcının istediği gibi 3 saniye)
          scheduleAutoRefresh();
        } catch (error) {
          console.error(`${columnName} güncellenirken hata oluştu:`, error);
          alert(`${columnName} güncellenirken bir hata oluştu. Lütfen tekrar deneyin.`);
          
          // Hata durumunda optimistik güncellemeyi geri al
          setOptimisticUpdates(prev => {
            const newUpdates = { ...prev };
            if (newUpdates[rowId]) {
              delete newUpdates[rowId][columnName];
              if (Object.keys(newUpdates[rowId]).length === 0) {
                delete newUpdates[rowId];
              }
            }
            return newUpdates;
          });
        } finally {
          setUpdatingRow(null);
        }
      }
      
      setEditingCell(null);
    }
  };

  // Enter veya Escape tuşları için işleyici
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
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

  // Reçeteye tıklama işleyicisi
  const handleRecipeClick = (recipeName: string, recipeId: string, brand: string) => {
    setSelectedRecipe({ name: recipeName, id: recipeId, brand });
    setIsFormulationModalOpen(true);
  };

  // Ürün adına tıklama işleyicisi - teslim bilgilerini göster
  const handleUrunAdiClick = async (urunId: number, urunAdi: string) => {
    try {
      // Teslim alan personel bilgilerini çek
      const { data, error } = await supabase
        .from('teslim_alan_personel')
        .select(`
          id, 
          teslim_tarihi,
          personel:personel_id (
            ad_soyad
          )
        `)
        .eq('siparis_id', urunId)
        .single();
      
      if (error) {
        console.error('Teslim bilgisi çekilirken hata oluştu:', error);
        alert('Bu ürün için teslim bilgisi bulunamadı.');
        return;
      }
      
      if (data) {
        // Veri yapısını kontrol et ve güvenli bir şekilde personel adını çek
        let personelAdi = 'Bilinmiyor';
        
        try {
          if (data.personel && typeof data.personel === 'object' && 'ad_soyad' in data.personel) {
            const adSoyad = data.personel.ad_soyad;
            personelAdi = typeof adSoyad === 'string' ? adSoyad : 'Bilinmiyor';
          }
        } catch (e) {
          console.error('Personel adı ayrıştırılırken hata:', e);
        }
        
        // Teslim bilgilerini gösterecek modalı aç
        setTeslimBilgisi({
          urunAdi,
          personelAdi,
          teslimTarihi: new Date(data.teslim_tarihi).toLocaleString('tr-TR')
        });
        setIsTeslimBilgisiModalOpen(true);
      } else {
        alert('Bu ürün için teslim bilgisi bulunamadı.');
      }
    } catch (error) {
      console.error('Teslim bilgisi alınırken hata oluştu:', error);
      alert('Teslim bilgisi alınırken bir hata oluştu.');
    }
  };

  // Değerleri görüntüleme fonksiyonu - optimistik değerleri de göz önünde bulundur
  const getDisplayValue = (row: any, columnName: string) => {
    // Optimistik güncelleme varsa onu göster
    if (optimisticUpdates[row.id] && optimisticUpdates[row.id][columnName] !== undefined) {
      return optimisticUpdates[row.id][columnName];
    }
    
    // Yoksa original değeri göster
    return row[columnName];
  };

  // Hücre değerini render etme fonksiyonu
  const renderCellValue = (value: any, columnType: string, columnName: string, row: any) => {
    if (value === null || value === undefined) {
      return '-';
    }

    // SatınAlma siparişleri tablosunda ve Alınan Ürün sütununda tıklanabilir link göster
    if (tableName === 'SatınAlma siparişleri' && columnName === 'Alınan Ürün' && row.TeslimDurumu === true) {
      return (
        <span 
          className="cursor-pointer text-indigo-600 hover:text-indigo-900 hover:underline"
          onClick={() => handleUrunAdiClick(row.id, value)}
        >
          {value}
        </span>
      );
    }

    // Bitmiş Ürün Stoğu tablosunda Reçete Adı sütunu tıklanabilir olsun
    if (tableName === 'Bitmiş Ürün Stoğu' && columnName === 'Reçete Adı' && onReceteClick) {
      return (
        <span 
          className="cursor-pointer text-indigo-600 hover:text-indigo-900 hover:underline"
          onClick={() => onReceteClick(value, row.id)}
        >
          {value}
        </span>
      );
    }

    if (columnType === 'numeric') {
      return typeof value === 'number' ? value.toLocaleString('tr-TR') : value;
    }

    if (columnType === 'boolean') {
      return value === true ? 'Evet' : 'Hayır';
    }

    if (columnType === 'date') {
      return value instanceof Date ? value.toLocaleDateString('tr-TR') : value;
    }

    return value;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Onay Modalı */}
      <ConfirmModal 
        isOpen={isModalOpen}
        productName={selectedRow?.productName || ''}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
      
      {/* Formülasyon Modalı */}
      {isFormulationModalOpen && selectedRecipe && (
        <FormulationModal
          isOpen={isFormulationModalOpen}
          onClose={() => setIsFormulationModalOpen(false)}
          recipeName={selectedRecipe.name}
          recipeId={selectedRecipe.id}
          brand={selectedRecipe.brand}
        />
      )}
      
      {/* Teslim Bilgisi Modalı */}
      <TeslimBilgisiModal
        isOpen={isTeslimBilgisiModalOpen}
        teslimBilgisi={teslimBilgisi}
        onClose={() => setIsTeslimBilgisiModalOpen(false)}
      />
    
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
                    
                    // Reçeteler tablosunda Reçete Adı sütunu kontrolü
                    const isRecipeTable = tableName === 'Reçeteler';
                    const isRecipeNameColumn = column.name === 'Reçete Adı';
                    const isRecipeName = isRecipeTable && isRecipeNameColumn;
                    
                    // Notlar sütunu kontrolü
                    const isNotesColumn = column.name === 'Notlar';
                    const isEditingThisCell = editingCell?.rowId === row.id && editingCell?.columnName === column.name;
                    
                    return (
                      <td 
                        key={column.name} 
                        className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 ${isRecipeName ? 'cursor-pointer hover:text-indigo-600 hover:underline' : ''} ${isNotesColumn && isSatinAlmaTable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                        onClick={isRecipeName ? 
                          () => handleRecipeClick(row[column.name], row['Reçete ID'] || '', row['Marka'] || '') : 
                          (isNotesColumn && isSatinAlmaTable && !isEditingThisCell) ? 
                            () => handleNotesClick(row.id, column.name, getDisplayValue(row, column.name) || "") : 
                            undefined
                        }
                      >
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
                                    onChange={() => handleCheckboxChange(
                                      row.id, 
                                      column.name, 
                                      row['Alınan Ürün'] || row['product_name'] || `ID: ${row.id}`
                                    )}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ) : isNotesColumn && isSatinAlmaTable ? (
                          // Notlar sütunu için düzenleme alanı
                          isEditingThisCell ? (
                            <textarea
                              value={inputValue}
                              onChange={handleInputChange}
                              onBlur={handleInputBlur}
                              onKeyDown={handleKeyDown}
                              className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px] text-sm"
                              autoFocus
                            />
                          ) : (
                            updatingRow === row.id && column.name === 'Notlar' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                            ) : (
                              <div className="flex">
                                <span>
                                  {/* Optimistik değeri veya normal değeri göster */}
                                  {getDisplayValue(row, column.name) || '-'}
                                </span>
                                <svg className="h-4 w-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </div>
                            )
                          )
                        ) : column.type === 'boolean' ? (
                          <div className="flex items-center">
                            {row[column.name] === true ? (
                              <svg className="h-5 w-5 text-white bg-indigo-600 rounded" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <input 
                                type="checkbox" 
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                checked={false}
                                onChange={() => handleCheckboxChange(
                                  row.id, 
                                  column.name, 
                                  // Eğer ürün adı sütunu varsa onu al, yoksa ID'yi kullan
                                  row['product_name'] || row['Ürün Adı'] || row['Reçete Adı'] || `ID: ${row.id}`
                                )}
                              />
                            )}
                          </div>
                        ) : (
                          isRecipeName ? (
                            <span className="text-indigo-600 font-medium">{row[column.name]}</span>
                          ) : (
                            renderCellValue(row[column.name], column.type, column.name, row)
                          )
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