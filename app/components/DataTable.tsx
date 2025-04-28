import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { updateData, insertData, deleteData } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import FormulationModal from './modals/FormulationModal';
import { useAuth } from '../lib/AuthContext';
import TeslimBilgisiModal from './modals/TeslimBilgisiModal';
import { fetchAllFromTable, fetchFilteredData } from '../lib/supabase';
import AmbalajlamaModal from './modals/AmbalajlamaModal';
import UretimEmriModal from './modals/UretimEmriModal';
import UretimUyariModal from './modals/UretimUyariModal';
import StokHareketModal from './modals/StokHareketModal';
import KritikHammaddeModal from './modals/KritikHammaddeModal';
import { 
  Pencil, 
  Check, 
  X, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  Trash
} from 'lucide-react';
import { AdjustmentsVerticalIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DataTableProps {
  columns: {
    name: string;
    type: string;
  }[];
  data?: any[];
  tableName: string;
  onReceteClick?: (receteAdi: string, urunId: number, marka: string, row?: any) => void;
  onTeslimatClick?: (rowId: number, recipeName: string) => void;
}

// Modal bileşeni
interface ConfirmModalProps {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  tableName: string;
  isDelete?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, productName, onConfirm, onCancel, tableName, isDelete }) => {
  if (!isOpen) return null;

  // Üretim Kuyruğu tablosuna özel başlık ve içerik
  const isUretimKuyrugu = tableName === 'Üretim Kuyruğu';
  const isMusteriler = tableName === 'Müşteriler';
  
  let modalTitle = isUretimKuyrugu ? 'ÜRETİM ONAYI' : 'Teslim Onayı';
  let modalContent = isUretimKuyrugu 
    ? 'Bu reçetenin BULK üretiminin yapıldığına dair ONAY veriyorsunuz:'
    : 'Bu siparişin teslim edildiğini onaylıyorsunuz:';
  
  // Eğer bu silme işlemi için onay modalıysa
  if (isDelete) {
    modalTitle = 'SİLME ONAYI';
    modalContent = `Aşağıdaki ${isMusteriler ? 'müşteriyi' : 'kaydı'} silmek istediğinize emin misiniz?`;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
        <div className="text-center">
          {isDelete ? (
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          
          <h3 className={`text-xl ${isUretimKuyrugu || isDelete ? 'text-2xl' : 'text-lg'} leading-6 font-medium ${isDelete ? 'text-red-600' : 'text-gray-900'} mt-4`}>
            {modalTitle}
          </h3>
          
          <div className="mt-3">
            <p className={`${isUretimKuyrugu || isDelete ? 'text-base font-medium' : 'text-sm'} text-gray-600 mb-3`}>
              {modalContent}
            </p>
            <div className={`${isDelete ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'} py-3 px-4 rounded-md border`}>
              <span className={`font-bold text-lg ${isDelete ? 'text-red-700' : 'text-indigo-700'}`}>{productName}</span>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              className={`w-full sm:col-start-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isDelete ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={onConfirm}
            >
              {isDelete ? 'Evet, Sil' : 'Evet, Onayla'}
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

const DataTable: React.FC<DataTableProps> = ({ columns, data = [], tableName, onReceteClick, onTeslimatClick }) => {
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
  const [localData, setLocalData] = useState(data); // Yerel veri tutmak için eklendi
  const [localFilteredData, setLocalFilteredData] = useState<any[]>([]); // Yerel filtrelenmiş veri
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteRow, setSelectedDeleteRow] = useState<{ id: number, name: string } | null>(null);
  
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

  // Arama sorgusu
  const [searchQuery, setSearchQuery] = useState('');

  // Auth context'ten kullanıcı bilgisini al
  const { user } = useAuth();
  const [userRolBilgileri, setUserRolBilgileri] = useState<any>(null);
  
  // Kullanıcının rol bilgilerini veritabanından çek
  useEffect(() => {
    const fetchRolBilgileri = async () => {
      if (user?.rol_id) {
        try {
          const { data, error } = await supabase
            .from('roller')
            .select('*')
            .eq('id', user.rol_id)
            .single();
            
          if (!error && data) {
            console.log('Kullanıcı rol bilgileri:', data);
            setUserRolBilgileri(data);
          }
        } catch (err) {
          console.error('Rol bilgileri alınırken hata:', err);
        }
      }
    };
    
    fetchRolBilgileri();
  }, [user]);
  
  // Ambalajlama modalı için state
  const [isAmbalajlamaModalOpen, setIsAmbalajlamaModalOpen] = useState(false);
  const [selectedAmbalajlamaRow, setSelectedAmbalajlamaRow] = useState<any>(null);

  // Üretim Emri modalı için state
  const [isUretimEmriModalOpen, setIsUretimEmriModalOpen] = useState(false);
  const [selectedUretimEmri, setSelectedUretimEmri] = useState<{receteAdi: string, uretimMiktari: number, uretimTarihi?: string} | null>(null);

  // Üretim uyarı modalı için state
  const [isUretimUyariModalOpen, setIsUretimUyariModalOpen] = useState(false);
  const [uyariReceteAdi, setUyariReceteAdi] = useState<string>('');

  // Kritik Hammadde modalı için state
  const [isKritikHammaddeModalOpen, setIsKritikHammaddeModalOpen] = useState(false);
  const [kritikHammaddeReceteAdi, setKritikHammaddeReceteAdi] = useState<string>('');

  // Stok Hareket modalı için state
  const [isStokHareketModalOpen, setIsStokHareketModalOpen] = useState(false);

  // Tamamlanmış ürünleri gösterme durumu (0 adeti kalanlar)
  const [showCompletedItems, setShowCompletedItems] = useState(false);
  
  // Üretim durumu "Bitti" olan satırları gösterme durumu
  const [showFinishedProductions, setShowFinishedProductions] = useState(false);

  // İlk veri değiştiğinde yerel veriye ayarla
  useEffect(() => {
    setLocalData(data);
    filterLocalData('', data);
  }, [data]);

  // Başlangıçta veya veri değiştiğinde varsayılan sıralamayı uygula
  useEffect(() => {
    if (localData.length > 0 && localData[0]?.id) {
      setSortColumn('id');
      setSortDirection('desc');
    }
  }, [localData]);

  // Temizlik fonksiyonu
  useEffect(() => {
    return () => {
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
    };
  }, [autoRefreshTimer]);

  // Yerel veriyi filtreleme fonksiyonu
  const filterLocalData = (query: string, dataToFilter = localData) => {
    if (!query.trim()) {
      setLocalFilteredData(dataToFilter);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    const filtered = dataToFilter.filter(row => {
      return Object.keys(row).some(key => {
        const value = row[key];
        if (value === null || value === undefined) return false;
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseQuery);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          return value.toString().toLowerCase().includes(lowercaseQuery);
        } else if (value instanceof Date) {
          return value.toLocaleDateString('tr-TR').includes(lowercaseQuery);
        } else if (typeof value === 'object') {
          try {
            return JSON.stringify(value).toLowerCase().includes(lowercaseQuery);
          } catch {
            return false;
          }
        }
        return false;
      });
    });
    
    setLocalFilteredData(filtered);
  };

  // Arama sorgusu değiştiğinde
  useEffect(() => {
    filterLocalData(searchQuery);
  }, [searchQuery, localData]);

  // Otomatik yenileme planlama fonksiyonu
  const scheduleAutoRefresh = () => {
    // Eğer önceden bir zamanlayıcı varsa temizle
    if (autoRefreshTimer) {
      clearTimeout(autoRefreshTimer);
    }
    
    // 3 saniye sonra verileri yenileyecek
    const timer = setTimeout(async () => {
      try {
        console.log("Otomatik yenileme yapılıyor, veriler yeniden yükleniyor...");
        const freshData = await fetchAllFromTable(tableName, true);
        setLocalData(freshData);
        filterLocalData(searchQuery, freshData);
      } catch (err) {
        console.error("Veri yenileme sırasında hata:", err);
      }
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
      // Önce client tarafında optimistik güncelleme yapıyoruz
      // Bu sayede kullanıcıya daha hızlı geri bildirim sağlıyoruz
      const updatedData = localData.map(row => {
        if (row.id === selectedRow.id) {
          // Eğer bu Üretim Kuyruğu tablosunda bir Üretim Yapıldı mı? checkbox'ı ise, Üretim Durumu'nu da güncelle
          if (tableName === 'Üretim Kuyruğu' && selectedRow.columnName === 'Üretim Yapıldı mı?') {
            return { 
              ...row, 
              [selectedRow.columnName]: true, 
              'Üretim Durumu': 'Üretim YAPILDI' 
            };
          }
          return { ...row, [selectedRow.columnName]: true };
        }
        return row;
      });
      setLocalData(updatedData);
      filterLocalData(searchQuery, updatedData);
      
      // Modal kapatılıyor
      setIsModalOpen(false);
      setSelectedRow(null);
      
      // Supabase'de güncelleştirme yap
      if (tableName === 'Üretim Kuyruğu' && selectedRow.columnName === 'Üretim Yapıldı mı?') {
        // Üretim Kuyruğu için iki alanı birden güncelle
        await updateData(tableName, selectedRow.id, { 
          [selectedRow.columnName]: true,
          'Üretim Durumu': 'Üretim YAPILDI'
        });
      } else {
        // Diğer tablolar için normal güncelleme yap
        await updateData(tableName, selectedRow.id, { 
          [selectedRow.columnName]: true
        });
      }
      console.log(`${selectedRow.columnName} güncellendi: ${selectedRow.id}`);
      
      // Satınalma siparişleri tablosuna yapılan işlemlerde teslim alan personel bilgisini kaydet
      if (tableName === 'SatınAlma siparişleri' && selectedRow.columnName === 'TeslimDurumu' && user) {
        try {
          // teslim_alan_personel tablosuna kayıt ekle
          await insertData('teslim_alan_personel', {
            siparis_id: selectedRow.id,
            personel_id: user.id,
          });
          console.log(`Teslim alan personel kaydedildi: ${user.kullanici_adi}`);
        } catch (personelError) {
          console.error('Teslim alan personel kaydedilirken hata oluştu:', personelError);
          // Ana işlemi etkilememesi için bu hatayı yutuyoruz
        }
      }
      
      // Sayfa yenileme planla - verileri yeniden çekmek için
      scheduleAutoRefresh();
    } catch (error) {
      console.error(`${selectedRow.columnName} güncellenirken hata oluştu:`, error);
      alert(`${selectedRow.columnName} güncellenirken bir hata oluştu. Lütfen tekrar deneyin.`);
      
      // Hata durumunda optimistik güncellemeyi geri al
      const originalData = localData.map(row => {
        if (row.id === selectedRow.id) {
          const { [selectedRow.columnName]: _, ...rest } = row;
          return { ...rest, [selectedRow.columnName]: false };
        }
        return row;
      });
      setLocalData(originalData);
      filterLocalData(searchQuery, originalData);
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
      const rowData = localData.find(row => row.id === rowId);
      
      // Değer değiştiyse güncelleme yap
      if (rowData && rowData[columnName] !== inputValue) {
        // Hemen optimistik güncelleme yap
        const updatedData = localData.map(row => {
          if (row.id === rowId) {
            return { ...row, [columnName]: inputValue };
          }
          return row;
        });
        
        setLocalData(updatedData);
        filterLocalData(searchQuery, updatedData);
        
        setUpdatingRow(rowId);
        
        try {
          // Veritabanını güncelle
          await updateData(tableName, rowId, { [columnName]: inputValue });
          console.log(`${columnName} güncellendi: ${rowId}`);
          
          // Otomatik yenileme planla
          scheduleAutoRefresh();
        } catch (error) {
          console.error(`${columnName} güncellenirken hata oluştu:`, error);
          alert(`${columnName} güncellenirken bir hata oluştu. Lütfen tekrar deneyin.`);
          
          // Hata durumunda optimistik güncellemeyi geri al
          const originalData = localData.map(row => {
            if (row.id === rowId) {
              return { ...row, [columnName]: rowData[columnName] };
            }
            return row;
          });
          
          setLocalData(originalData);
          filterLocalData(searchQuery, originalData);
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
  const sortedData = [...(localFilteredData.length > 0 ? localFilteredData : localData)].sort((a, b) => {
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

  // Tamamlanmış ve tamamlanmamış ürünleri ayrı listelerde topla
  // Bu şekilde önce aktif ürünleri, sonra tamamlanmış ürünleri gösterebiliriz
  const activeItems = sortedData.filter(row => (row['Kalan Adet'] || 0) > 0);
  const completedItems = sortedData.filter(row => (row['Kalan Adet'] || 0) <= 0);
  
  // Üretim durumu bitti olan ve olmayan ürünleri ayrı listelerde topla
  const activeProductions = sortedData.filter(row => row['Üretim Durumu'] !== 'Bitti');
  const finishedProductions = sortedData.filter(row => row['Üretim Durumu'] === 'Bitti');
  
  // Bitmiş Ürün Stoğu veya Üretim Kuyruğu için özel filtreleme
  const filteredByCompletionStatus = 
    tableName === 'Bitmiş Ürün Stoğu' 
      ? (!showCompletedItems ? activeItems : [...activeItems, ...completedItems])
      : tableName === 'Üretim Kuyruğu'
        ? (!showFinishedProductions ? activeProductions : [...activeProductions, ...finishedProductions])
        : sortedData;

  // id sütunu içerip içermediğini kontrol et
  const hasIdColumn = columns.some(col => col.name === 'id' || col.name === 'ID');

  console.log('Tablo adı:', tableName);
  console.log('Tüm Sütunlar:', columns.map(c => c.name).join(', '));
  if (localData.length > 0) {
    console.log('İlk satır verisi:', JSON.stringify(localData[0], null, 2));
  }

  // Reçeteye tıklama işleyicisi
  const handleRecipeClick = (recipeName: string, recipeId: string, brand: string, row?: any) => {
    console.log('Reçete tıklandı:', recipeName, recipeId, brand);
    if (tableName === 'Reçeteler') {
      setSelectedRecipe({ name: recipeName, id: recipeId, brand });
      setIsFormulationModalOpen(true);
    } else if (tableName === 'Üretim Kuyruğu') {
      // row parametresi ile doğrudan tıklanan satır bilgisini alabiliriz
      if (row) {
        // Bulk Üretim Emri(Kg) değeri 0 veya boş ise varsayılan olarak 100kg kullan
        const bulkUretimMiktari = row['Bulk Üretim Emri(Kg)'];
        const uretimMiktari = bulkUretimMiktari && bulkUretimMiktari > 0 ? bulkUretimMiktari : 100;
        
        // Üretim Emir Tarihi değerini al - formatlanmış string olarak
        let uretimTarihi = row['Üretim Emir Tarihi'];
        
        // Eğer tarih bir Date objesi ise veya tarih string'i ise formatla
        if (uretimTarihi) {
          if (uretimTarihi instanceof Date) {
            uretimTarihi = uretimTarihi.toLocaleDateString('tr-TR');
          } else if (typeof uretimTarihi === 'string') {
            try {
              // Tarih string'i olabilir, Date objesine çevirip formatlayalım
              const dateObj = new Date(uretimTarihi);
              if (!isNaN(dateObj.getTime())) {
                uretimTarihi = dateObj.toLocaleDateString('tr-TR');
              }
            } catch (e) {
              console.error('Tarih formatlanırken hata:', e);
            }
          }
        }
        
        console.log('Üretim Emri Tarihi:', uretimTarihi);
        
        setSelectedUretimEmri({
          receteAdi: recipeName,
          uretimMiktari: uretimMiktari,
          uretimTarihi: uretimTarihi
        });
        setIsUretimEmriModalOpen(true);
      }
    }
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
            kullanici_adi
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
          if (data.personel && typeof data.personel === 'object' && 'kullanici_adi' in data.personel) {
            const kullaniciAdi = data.personel.kullanici_adi;
            personelAdi = typeof kullaniciAdi === 'string' ? kullaniciAdi : 'Bilinmiyor';
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
          onClick={() => onReceteClick(value, row.id, row['Marka'] || '', row)}
        >
          {value}
        </span>
      );
    }
    
    // Üretim Kuyruğu tablosunda Reçete Adı sütunu - rol bazlı yetkilendirme
    if (tableName === 'Üretim Kuyruğu' && columnName === 'Reçete Adı') {
      // Rol bilgilerine göre reçete görüntüleme yetkisi kontrolü
      const kullaniciReceteGoruntulebilir = userRolBilgileri?.recete_goruntulebilir === true;
      
      if (kullaniciReceteGoruntulebilir) {
        return (
          <span 
            className="cursor-pointer text-indigo-600 hover:text-indigo-900 hover:underline"
            onClick={() => handleRecipeClick(value, row.id || '', '', row)}
          >
            {value}
          </span>
        );
      } else {
        // Yetkisiz roller için normal metin olarak göster
        return <span>{value}</span>;
      }
    }
    
    // Üretim Kuyruğu tablosundaki tarih sütunlarını formatla
    if (tableName === 'Üretim Kuyruğu' && 
        (columnName === 'Üretim Emir Tarihi' || 
         columnName === 'Üretildiği Tarih' || 
         columnName === 'Son Güncelleme Tarihi')) {
      if (!value) return '-';
      
      // Tarih nesnesine çevir
      const date = value instanceof Date ? value : new Date(value);
      
      // Geçerli bir tarih ise sadece gün-ay-yıl formatında göster
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('tr-TR');
      }
      return value;
    }

    // Müşteriler tablosunda Telefon sütunu için özel format (sadece sayı olarak göster)
    if (tableName === 'Müşteriler' && columnName === 'Telefon') {
      return value;
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

  // Ambalajlama Adet Gir butonuna tıklanınca
  const handleAmbalajlamaClick = (row: any) => {
    // Üretim Kuyruğu tablosunda ve Üretim Yapıldı mı? değeri false ise uyarı ver
    if (tableName === 'Üretim Kuyruğu' && row['Üretim Yapıldı mı?'] !== true) {
      // Üretim yapılmamış, uyarı modalini göster
      setUyariReceteAdi(row['Reçete Adı'] || `ID: ${row.id}`);
      setIsUretimUyariModalOpen(true);
      return;
    }
    
    // Normal durumda ambalajlama modalını aç
    setSelectedAmbalajlamaRow(row);
    setIsAmbalajlamaModalOpen(true);
  };
  
  // Ambalajlama miktarı onaylandığında
  const handleAmbalajlamaConfirm = async (miktar: number) => {
    if (!selectedAmbalajlamaRow) return;
    
    setUpdatingRow(selectedAmbalajlamaRow.id);
    
    try {
      const ambalajlananAdet = selectedAmbalajlamaRow['Ambalajlanan Adet'] || 0;
      const ambalajlama2 = selectedAmbalajlamaRow['Ambalajlama 2'] || 0;
      
      let updateFields: any = {};
      
      // İlk kez ambalajlama yapılıyorsa
      if (ambalajlananAdet === 0) {
        updateFields = {
          'Ambalajlanan Adet': miktar
        };
      } 
      // İkinci kez ambalajlama yapılıyorsa
      else if (ambalajlama2 === 0) {
        updateFields = {
          'Ambalajlama 2': miktar
        };
      } 
      // Üçüncü veya daha sonraki ambalajlamalar için
      else {
        updateFields = {
          'Ambalajlama 2': ambalajlama2 + miktar
        };
      }
      
      // Optimistik güncelleme
      const updatedData = localData.map(row => {
        if (row.id === selectedAmbalajlamaRow.id) {
          return { ...row, ...updateFields };
        }
        return row;
      });
      
      setLocalData(updatedData);
      filterLocalData(searchQuery, updatedData);
      
      // Veritabanını güncelle
      await updateData(tableName, selectedAmbalajlamaRow.id, updateFields);
      
      // AmbalajlamaKayitlari tablosuna yeni kayıt ekle
      try {
        // Reçeteler tablosundan ilgili reçete bilgilerini al
        const { data: receteData } = await supabase
          .from('Reçeteler')
          .select('*')
          .eq('Reçete Adı', selectedAmbalajlamaRow['Reçete Adı'])
          .maybeSingle();
        
        // Kullanıcı bilgisini belirle
        const kullaniciEmail = userRolBilgileri?.email || 'Bilinmiyor';
        
        // AmbalajlamaKayitlari tablosuna eklenecek verileri hazırla
        const ambalajlamaKayit = {
          uretim_kuyrugu_id: selectedAmbalajlamaRow.id,
          recete_adi: selectedAmbalajlamaRow['Reçete Adı'],
          marka: selectedAmbalajlamaRow['Marka'],
          musteri: selectedAmbalajlamaRow['Müşteri'],
          ambalajlanan_adet: miktar,
          ambalajlama_tarihi: new Date().toISOString(),
          
          // Reçeteler tablosundan alınan bilgiler
          ml_bilgisi: receteData?.ml_bilgisi || null,
          birim_satis_fiyati: receteData?.birim_satis_fiyati || null,
          kg_bulk_maliyet: receteData?.kg_bulk_maliyet || null,
          adet_bulk_maliyet: receteData?.adet_bulk_maliyet || null,
          ambalaj_maliyeti: receteData?.ambalaj_maliyeti || null,
          adet_ambalajli_maliyet: receteData?.adet_ambalajli_maliyet || null,
          
          // Hesaplanan değerler - ml dönüşümü ile
          toplam_satis_degeri: miktar * (receteData?.birim_satis_fiyati || 0),
          toplam_maliyet: miktar * (receteData?.adet_ambalajli_maliyet || 0),
          kar: miktar * ((receteData?.birim_satis_fiyati || 0) - (receteData?.adet_ambalajli_maliyet || 0)),
          
          // Kullanıcı bilgisi
          kullanici: user?.kullanici_adi || 'Bilinmiyor'
        };
        
        // Verileri AmbalajlamaKayitlari tablosuna ekle
        await insertData('AmbalajlamaKayitlari', ambalajlamaKayit);
        console.log('Ambalajlama kaydı başarıyla eklendi:', ambalajlamaKayit);
      } catch (kayitHatasi) {
        console.error('AmbalajlamaKayitlari tablosuna veri eklenirken hata:', kayitHatasi);
        // Ana işlemi etkilememesi için burada hata fırlatmıyoruz
      }
      
      // Modalı kapat
      setIsAmbalajlamaModalOpen(false);
      setSelectedAmbalajlamaRow(null);
      
      // Otomatik yenileme planla
      scheduleAutoRefresh();
    } catch (error) {
      console.error('Ambalajlama verileri güncellenirken hata oluştu:', error);
      alert('Ambalajlama verileri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setUpdatingRow(null);
    }
  };

  // Özel Ambalajlama hücresi render fonksiyonu
  const renderAmbalajlamaCell = (row: any) => {
    return (
      <div className="flex items-center justify-center">
        <button
          onClick={() => handleAmbalajlamaClick(row)}
          className="px-4 py-2 text-sm font-semibold bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          disabled={updatingRow === row.id}
        >
          {updatingRow === row.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
          ) : (
            'ADET GİR'
          )}
        </button>
      </div>
    );
  };

  // Tablo hücreleri için temel stil sınıfları
  const cell_base_classes = "px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500";

  // Silme işlemi için onay
  const handleDeleteClick = (rowId: number, firmaAdi: string) => {
    setSelectedDeleteRow({ id: rowId, name: firmaAdi });
    setIsDeleteModalOpen(true);
  };

  // Silme onaylandığında
  const handleDeleteConfirm = async () => {
    if (!selectedDeleteRow) return;

    try {
      setUpdatingRow(selectedDeleteRow.id);
      await deleteData(tableName, selectedDeleteRow.id);

      // Başarılı silme sonrası yenileme işlemini planla
      scheduleAutoRefresh();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(`${tableName} tablosundan kayıt silinirken hata:`, error);
      alert('Kayıt silinirken bir hata oluştu.');
    } finally {
      setUpdatingRow(null);
    }
  };

  // Silme modalını iptal et
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedDeleteRow(null);
  };

  // Reçete sütununu render etme
  const renderReceteColumn = (value: any, row: any) => {
    // Üretim kuyruğu tablosunda ve 'Üretim Yapıldı mı?' false olan satırlar için
    if (tableName === 'Üretim Kuyruğu' && row) {
      // Kritik stok durumu kontrolü
      const receteAdi = value;
      const uretimKuyrukId = row.id;
      const marka = row['Marka'] || '';
      
      // Kritik hammadde modalını açan fonksiyon
      const handleKritikHammaddeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Tıklama olayının butonun üst elementlerine yayılmasını engelle
        setKritikHammaddeReceteAdi(receteAdi);
        setIsKritikHammaddeModalOpen(true);
      };
      
      // Kritik stok durumu olan reçete için özel stil
      return (
        <div className="flex items-center">
          <button
            onClick={() => {
              console.log('Reçete tıklandı (DataTable)', receteAdi, uretimKuyrukId, marka, row);
              if (onReceteClick) onReceteClick(receteAdi, uretimKuyrukId, marka, row);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none text-left"
          >
            {receteAdi}
          </button>
          
          {/* Kritik stok kontrolü için ünlem işareti - useState değeri kullan */}
          {row._hasKritikStok && (
            <button 
              onClick={handleKritikHammaddeClick}
              className="ml-2 flex items-center justify-center p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
              title="Bu reçetede kritik stok seviyesinin altında olan hammaddeler var! (Detay için tıklayın)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      );
    }

    // Diğer durumlar için normal render
    if (onReceteClick && row) {
      const marka = row['Marka'] || '';
      return (
        <button
          onClick={() => {
            console.log('Reçete tıklandı (genel)', value, row.id, marka, row);
            onReceteClick(value, row.id, marka, row);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none text-left"
        >
          {value}
        </button>
      );
    }
    
    return value;
  };

  // Üretim kuyruğu için kritik stok kontrolü
  useEffect(() => {
    // Sadece Üretim Kuyruğu tablosu ve data varsa işlem yap
    if (tableName === 'Üretim Kuyruğu' && localData.length > 0) {
      const checkKritikStok = async () => {
        try {
          // Tüm stok verileri
          const stokVerileri = await fetchAllFromTable('Stok', true);
          
          // Her bir üretim kaydı için kritik stok kontrolü yap
          const updatedData = await Promise.all(localData.map(async (item) => {
            // Sadece üretimi yapılmamış kayıtlar için kontrol et
            if (item['Üretim Yapıldı mı?'] === false) {
              try {
                // Formülasyon bilgilerini getir
                const formulasyonlar = await fetchFilteredData('Formülasyonlar', 'Reçete Adı', item['Reçete Adı'], true);
                
                // Kritik stok durumu var mı kontrol et
                const hasKritikStok = formulasyonlar.some((formul: any) => {
                  const hammaddeAdi = formul['Hammadde Adı'];
                  const stokItem = stokVerileri.find((s: any) => s['Hammadde Adı'] === hammaddeAdi);
                  
                  if (stokItem) {
                    const netStok = stokItem['Net Stok'] || (stokItem['Mevcut Stok'] - (stokItem['Rezerve Edildi'] || 0));
                    const kritikStok = stokItem['Kritik Stok'] || 0;
                    
                    // Net stok, kritik stok değerinin altındaysa true döndür
                    return netStok < kritikStok;
                  }
                  return false;
                });
                
                // Kritik stok durumunu kaydet
                return { ...item, _hasKritikStok: hasKritikStok };
              } catch (err) {
                console.error('Formülasyon kontrolünde hata:', err);
                return item;
              }
            }
            return item;
          }));
          
          setLocalData(updatedData);
        } catch (err) {
          console.error('Kritik stok kontrolünde hata:', err);
        }
      };
      
      checkKritikStok();
    }
  }, [tableName, data]);

  // Sütunlara göre içeriği render etme - Reçete kontrolü ekle
  const renderCellContent = (column: string, value: any, row: any) => {
    // Reçete adı sütunu için özel render
    if (column === 'Reçete Adı') {
      return renderReceteColumn(value, row);
    }
    
    // Var olan koşullu gösterim mantığı
    if (column === 'Satış Fiyatı' && typeof value === 'number') {
      return `${value.toFixed(2)} TL`;
    }
    
    // ... existing code ...
  };

  return (
    <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
      {/* Onay Modalı */}
      <ConfirmModal 
        isOpen={isModalOpen}
        productName={selectedRow?.productName || ''}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        tableName={tableName}
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
      
      {/* Üretim Uyarı Modalı */}
      <UretimUyariModal
        isOpen={isUretimUyariModalOpen}
        onClose={() => setIsUretimUyariModalOpen(false)}
        receteAdi={uyariReceteAdi}
      />
      
      {/* Kritik Hammadde Modalı */}
      <KritikHammaddeModal
        isOpen={isKritikHammaddeModalOpen}
        onClose={() => setIsKritikHammaddeModalOpen(false)}
        receteAdi={kritikHammaddeReceteAdi}
      />
      
      {/* Ambalajlama Modalı */}
      {selectedAmbalajlamaRow && (
        <AmbalajlamaModal
          isOpen={isAmbalajlamaModalOpen}
          onClose={() => setIsAmbalajlamaModalOpen(false)}
          onConfirm={handleAmbalajlamaConfirm}
          receteAdi={selectedAmbalajlamaRow['Reçete Adı'] || `ID: ${selectedAmbalajlamaRow.id}`}
          ambalajlananAdet={selectedAmbalajlamaRow['Ambalajlanan Adet']}
          ambalajlama2={selectedAmbalajlamaRow['Ambalajlama 2']}
        />
      )}
      
      {/* Üretim Emri Modal */}
      {selectedUretimEmri && (
        <UretimEmriModal
          isOpen={isUretimEmriModalOpen}
          onClose={() => {
            setIsUretimEmriModalOpen(false);
            setSelectedUretimEmri(null);
          }}
          receteAdi={selectedUretimEmri.receteAdi}
          uretimMiktari={selectedUretimEmri.uretimMiktari}
          uretimTarihi={selectedUretimEmri.uretimTarihi}
        />
      )}
    
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns
               .filter(column => !(tableName === 'Üretim Kuyruğu' && column.name === '2. Ambalajlama'))
               .map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.name)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name === 'Ambalajlanan Adet' ? 'Ambalajlama' : column.name}</span>
                    {sortColumn === column.name && (
                      <span>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              
              {/* Teslimat Gir sütun başlığı - sadece Bitmiş Ürün Stoğu tablosunda göster */}
              {tableName === 'Bitmiş Ürün Stoğu' && onTeslimatClick && (
                <th
                  scope="col"
                  className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium uppercase tracking-wider bg-indigo-100 text-indigo-700 font-bold"
                >
                  <div className="flex justify-center items-center">
                    <span className="animate-pulse">Teslimat Gir</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredByCompletionStatus.length > 0 ? (
              <>
                {/* Önce aktif ürünleri göster */}
                {(tableName === 'Bitmiş Ürün Stoğu' ? activeItems : (tableName === 'Üretim Kuyruğu' ? activeProductions : filteredByCompletionStatus)).map((row, rowIndex) => (
                  <tr 
                    key={`active-${rowIndex}`} 
                    className={`hover:bg-gray-50 ${
                      (tableName === 'Bitmiş Ürün Stoğu' && (row['Kalan Adet'] <= 0)) || 
                      (tableName === 'Üretim Kuyruğu' && row['Üretim Durumu'] === 'Bitti')
                        ? 'bg-green-50' 
                        : ''
                    }`}
                  >
                    {columns
                    .filter(column => !(tableName === 'Üretim Kuyruğu' && column.name === '2. Ambalajlama'))
                    .map((column) => {
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
                      
                      // Üretim Yapıldı mı? sütunu kontrolü
                      const isUretimYapildiColumn = column.name === 'Üretim Yapıldı mı?';
                      const isUretimKuyrugu = tableName === 'Üretim Kuyruğu';
                      
                      // Ambalajlama sütunu için özel işlem
                      const isAmbalajlamaColumn = tableName === 'Üretim Kuyruğu' && (
                        column.name === 'Ambalajlanan Adet' || 
                        column.name === 'Ambalajlama 2'
                      );
                      
                      // İlk Ambalajlama sütunu için özel işlem yap, ikincisini gizle
                      if (isAmbalajlamaColumn) {
                        if (column.name === 'Ambalajlanan Adet') {
                          return (
                            <td key={column.name} className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {renderAmbalajlamaCell(row)}
                            </td>
                          );
                        } else {
                          // Ambalajlama 2 sütununu gösterme
                          return null;
                        }
                      }
                      
                      // Üretim Kuyruğu tablosunda Reçete Adı sütunu için özel işlem
                      if (tableName === 'Üretim Kuyruğu' && column.name === 'Reçete Adı') {
                        return (
                          <td 
                            key={column.name} 
                            className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                          >
                            {renderReceteColumn(row[column.name], row)}
                          </td>
                        );
                      }
                      
                      return (
                        <td 
                          key={column.name} 
                          className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 ${isRecipeName ? 'cursor-pointer hover:text-indigo-600 hover:underline' : ''} ${isNotesColumn && isSatinAlmaTable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          onClick={isRecipeName ? 
                            () => handleRecipeClick(row[column.name], row['Reçete ID'] || '', row['Marka'] || '', row) : 
                            (isNotesColumn && isSatinAlmaTable && !isEditingThisCell) ? 
                              () => handleNotesClick(row.id, column.name, getDisplayValue(row, column.name) || "") : 
                              undefined
                          }
                        >
                          {tableName === 'Üretim Kuyruğu' && column.name === 'Reçete Adı' ? (
                            renderReceteColumn(row[column.name], row)
                          ) : (isTeslimColumn && isSatinAlmaTable) || (isUretimYapildiColumn && isUretimKuyrugu) ? (
                            // Teslim Durumu veya Üretim Yapıldı mı? sütunu için checkbox göster
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
                                        isUretimKuyrugu ? row['Reçete Adı'] || `ID: ${row.id}` : row['Alınan Ürün'] || row['product_name'] || `ID: ${row.id}`
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
                          ) : column.type === 'boolean' && !isUretimYapildiColumn ? (
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
                    
                    {/* Teslimat Gir butonu - sadece Bitmiş Ürün Stoğu tabosu için */}
                    {(tableName === 'Bitmiş Ürün Stoğu' && onTeslimatClick && row['Kalan Adet'] > 0) ? (
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onTeslimatClick(row.id, row['Ürün Adı'] || `ID: ${row.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 py-1 px-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-1"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Teslimat Gir
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </>
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
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm text-gray-700 mb-4">
            Toplam {filteredByCompletionStatus.length} kayıt
            {hasIdColumn && sortColumn === 'id' && sortDirection === 'desc' && (
              <span className="ml-2 text-xs text-gray-500">(Yeni girişler üstte)</span>
            )}
          </div>
          
          {/* Tamamlanmış ürünleri gösterme butonu - Bitmiş Ürün Stoğu tablosu için */}
          {tableName === 'Bitmiş Ürün Stoğu' && (
            <button
              onClick={() => setShowCompletedItems(!showCompletedItems)}
              className="px-6 py-3 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
            >
              {showCompletedItems ? 'SADECE TESLİMATI TAMAMLANMAMIŞ OLANLARI GÖSTER' : 'TESLİMATI TAMAMLANMIŞ OLANLARI GÖSTER'}
            </button>
          )}
          
          {/* Üretim Durumu Bitti olanları gösterme butonu - Üretim Kuyruğu tablosu için */}
          {tableName === 'Üretim Kuyruğu' && (
            <button
              onClick={() => setShowFinishedProductions(!showFinishedProductions)}
              className="px-6 py-3 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
            >
              {showFinishedProductions ? 'SADECE ÜRETİM DURUMU BİTTİ OLANLARI GÖSTER' : 'ÜRETİM DURUMU "BİTTİ" OLANLARI GÖSTER'}
            </button>
          )}
        </div>
      </div>

      {/* Silme onay modalı */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        productName={selectedDeleteRow?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        tableName={tableName}
        isDelete={true}
      />
    </div>
  );
};

export default DataTable; 