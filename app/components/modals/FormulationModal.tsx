'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFilteredData, insertData, updateData, deleteData } from '../../lib/supabase';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

// Yazdırma seçenekleri tip tanımı
interface ReactToPrintProps {
  content: () => React.ReactInstance | null;
  documentTitle?: string;
  onBeforePrint?: () => Promise<void>;
  onAfterPrint?: () => Promise<void>;
  removeAfterPrint?: boolean;
  pageStyle?: string;
}

interface FormulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  recipeId: string;
  brand: string;
}

interface FormulationItem {
  id?: number;
  "Hammadde Adı": string;
  "Marka": string;
  "Oran(100Kg)": number;
  "Reçete Adı": string;
  "Reçete ID"?: string | number;
  "Stok Kategori"?: string;
  isEditing?: boolean;
  isNew?: boolean;
  _primaryKeyColumn?: string; // Veritabanındaki gerçek birincil anahtar sütun adı
  [key: string]: any; // Dinamik özellikler için
}

interface StockItem {
  id?: number;
  ID?: number;
  "Hammadde Adı": string;
  "Stok Kategori": string;
  [key: string]: any;
}

const FormulationModal: React.FC<FormulationModalProps> = ({
  isOpen,
  onClose,
  recipeName,
  recipeId,
  brand
}) => {
  const [formulations, setFormulations] = useState<FormulationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [primaryKeyColumn, setPrimaryKeyColumn] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Yazdırma işlevi
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `${recipeName} - Formülasyon`,
    onBeforePrint: () => {
      console.log('Yazdırma başlıyor', contentRef.current);
      // Yazdırma stili için CSS sınıfı ekle
      document.body.classList.add('printing');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Yazdırma tamamlandı');
      // Yazdırma stili için CSS sınıfı kaldır
      document.body.classList.remove('printing');
      return Promise.resolve();
    },
    removeAfterPrint: false,
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        .print:hidden {
          display: none !important;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  } as ReactToPrintProps);

  // Yazdırma için güvenli wrapper fonksiyon
  const handlePrintClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Yazdırma butonu tıklandı', contentRef.current);
    if (contentRef.current) {
      // requestAnimationFrame kullanarak tarayıcının bir sonraki çizimini bekle
      requestAnimationFrame(() => {
        try {
          handlePrint();
        } catch (err) {
          console.error('Yazdırma işlemi sırasında hata:', err);
          toast.error('Yazdırma işlemi sırasında hata oluştu');
        }
      });
    } else {
      console.error('Yazdırılacak içerik bulunamadı (contentRef.current null)');
      toast.error('Yazdırma işlemi yapılamadı: İçerik bulunamadı');
    }
  };

  // Modal açıldığında formülasyonları ve stok verilerini yükle
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, recipeName, recipeId]);

  // Tablodan birincil anahtar sütun adını belirle
  const getTableStructure = async () => {
    try {
      console.log("Formülasyonlar tablosu yapısı inceleniyor...");
      
      // İlk önce tablodan bir kayıt alarak mevcut sütunları kontrol edelim
      const { data: firstRow, error: firstRowError } = await supabase
        .from('Formülasyonlar')
        .select('*')
        .limit(1);
      
      if (firstRowError) {
        console.error("Tablo yapısı kontrol edilirken hata:", firstRowError.message);
        toast.error(`Tablo yapısı belirlenirken hata: ${firstRowError.message}`);
        return null;
      }
      
      if (!firstRow || firstRow.length === 0) {
        console.log("Tablo boş, yeni bir kayıt oluşturulabilir");
        return 'id'; // Varsayılan olarak 'id' kullanacağız
      }
      
      console.log("Mevcut kayıt anahtarları:", Object.keys(firstRow[0]));
      
      // Olası ID sütunlarını kontrol et
      const possibleIdColumns = [
        'id', 'ID', 'formülasyon_id', 'formülasyonId', 'formulation_id', 
        'Formülasyon ID', 'formülasyonlar_id'
      ];
      
      for (const column of possibleIdColumns) {
        if (column in firstRow[0] && firstRow[0][column] !== null) {
          console.log(`Birincil anahtar '${column}' olarak belirlendi`);
          setPrimaryKeyColumn(column);
          return column;
        }
      }
      
      // Sütun adında "id" içeren herhangi bir sütun var mı?
      for (const key in firstRow[0]) {
        if (key.toLowerCase().includes('id')) {
          console.log(`Olası birincil anahtar '${key}' olarak belirlendi`);
          setPrimaryKeyColumn(key);
          return key;
        }
      }
      
      // Son çare: İlk sütunu kullan
      const firstKey = Object.keys(firstRow[0])[0];
      console.log(`Birincil anahtar belirlenemedi, ilk sütun '${firstKey}' kullanılacak`);
      setPrimaryKeyColumn(firstKey);
      return firstKey;
    } catch (error) {
      console.error("Tablo yapısı belirlenirken hata:", error);
      return null;
    }
  };

  // Verileri yükle
  const loadData = useCallback(async () => {
    if (!recipeId) return;
    
    setLoading(true);
    try {
      // Önce tablo yapısını belirle
      const pkColumn = primaryKeyColumn || await getTableStructure();
      
      // Formülasyon verilerini yükle
      const { data, error } = await supabase
        .from('Formülasyonlar')
        .select('*')
        .eq('Reçete ID', recipeId);

      if (error) {
        console.error('Formülasyon verileri yüklenirken hata:', error);
        setFormulations([]);
      } else {
        // Verileri hazırla ve birincil anahtar sütununu işaretle
        const processedData = data.map(item => ({
          ...item,
          isEditing: false,
          isNew: false,
          _primaryKeyColumn: pkColumn
        }));
        setFormulations(processedData);
      }

      // Stok verilerini yükle
      const { data: stockData, error: stockError } = await supabase
        .from('Stok')
        .select('*');

      if (stockError) {
        console.error('Stok verileri yüklenirken hata:', stockError);
        setStockItems([]);
      } else {
        setStockItems(stockData || []);
      }
    } catch (err) {
      console.error('Veri yüklenirken beklenmeyen hata:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, primaryKeyColumn]);

  // Formülasyon sil
  const handleDelete = async (item: FormulationItem) => {
    if (!confirm('Bu formülasyonu silmek istediğinizden emin misiniz?')) return;
    
    try {
      setIsDeleting(true);
      
      // Birincil anahtar sütununu belirle
      const pkColumn = item._primaryKeyColumn || primaryKeyColumn || await getTableStructure();
      
      if (!pkColumn || !item[pkColumn]) {
        toast.error('Silme işlemi için gerekli kimlik bilgisi bulunamadı');
        return;
      }
      
      const { error } = await supabase
        .from('Formülasyonlar')
        .delete()
        .eq(pkColumn, item[pkColumn]);

      if (error) {
        toast.error(`Silme hatası: ${error.message}`);
      } else {
        toast.success('Formülasyon başarıyla silindi');
        loadData();
      }
    } catch (err) {
      console.error('Silme işlemi sırasında hata:', err);
      toast.error('Silme işlemi sırasında bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  // Hammadde seçildiğinde kategoriyi otomatik doldur
  const handleHammaddeChange = (index: number, value: string) => {
    console.log(`Hammadde seçildi: ${value} (index: ${index})`);
    const updatedFormulations = [...formulations];
    const selectedStock = stockItems.find(item => item["Hammadde Adı"] === value);
    
    updatedFormulations[index]["Hammadde Adı"] = value;
    
    // Stok kategorisini otomatik doldur
    if (selectedStock) {
      console.log('Seçilen stok bilgisi:', selectedStock);
      updatedFormulations[index]["Stok Kategori"] = selectedStock["Stok Kategori"];
    } else {
      console.warn('Seçilen hammadde için stok bilgisi bulunamadı');
    }
    
    setFormulations(updatedFormulations);
    setSearchTerm(''); // Seçimden sonra arama terimini temizle
  };

  // Yeni formülasyon ekleme
  const handleAddFormulation = () => {
    const newFormulation: FormulationItem = {
      "Reçete Adı": recipeName,
      "Reçete ID": recipeId,
      "Marka": brand,
      "Hammadde Adı": "",
      "Oran(100Kg)": 0,
      "Birim": "Kg",
      "Stok Kategori": "",
      isNew: true,
      isEditing: true
    };

    setFormulations(prev => [...prev, newFormulation]);
  };

  // Formülasyon düzenleme moduna geçme
  const handleEdit = (index: number) => {
    console.log(`${index} indeksindeki formülasyon düzenleniyor`);
    const updatedFormulations = [...formulations];
    updatedFormulations[index].isEditing = true;
    setFormulations(updatedFormulations);
  };

  // Formülasyonu kaydet
  const handleSaveFormulation = async (formulation: any) => {
    try {
      setIsSaving(true);
      const saveData = { ...formulation };
      
      // "id" alanını kontrol et ve varsa number türüne dönüştür
      if (saveData.id && typeof saveData.id === 'string') {
        saveData.id = parseInt(saveData.id, 10);
      }
      
      // isEditing ve isNew alanlarını temizle (bunlar sadece UI için)
      delete saveData.isEditing;
      delete saveData.isNew;
      delete saveData._primaryKeyColumn;
      
      // İpucu ekleyelim
      console.log("Kaydedilecek veri:", saveData);
      
      if (formulation.isNew) {
        // Yeni kayıt için, birincil anahtar alanını temizle
        if (primaryKeyColumn) {
          delete saveData[primaryKeyColumn];
        }
        
        // "Reçete ID" text olarak kalmalı, dönüştürme yapmıyoruz
        
        // "Oran(100Kg)" sayısal değer olmalı
        if (saveData["Oran(100Kg)"]) {
          saveData["Oran(100Kg)"] = convertToNumber(saveData["Oran(100Kg)"]);
        }
        
        console.log("Eklenecek veri (temizlenmiş):", saveData);
        
        const { data, error } = await supabase
          .from('Formülasyonlar')
          .insert(saveData)
          .select();

        if (error) {
          console.error("Ekleme hatası:", error.message, error.details, error.hint);
          toast.error(`Kayıt hatası: ${error.message}`);
        } else {
          console.log("Eklenen veri cevabı:", data);
          toast.success('Formülasyon başarıyla eklendi');
          loadData();
        }
      } else {
        // "Reçete ID" text olarak kalmalı, dönüştürme yapmıyoruz
        
        // "Oran(100Kg)" sayısal değer olmalı
        if (saveData["Oran(100Kg)"]) {
          saveData["Oran(100Kg)"] = convertToNumber(saveData["Oran(100Kg)"]);
        }
        
        if (!primaryKeyColumn) {
          console.error("Güncelleme için birincil anahtar sütunu bulunamadı");
          toast.error('Güncelleme için gerekli tablo yapısı belirlenemedi');
          return;
        }
        
        if (!formulation[primaryKeyColumn]) {
          console.error(`${primaryKeyColumn} değeri bulunamadı:`, formulation);
          toast.error('Güncelleme için gerekli kayıt kimliği bulunamadı');
          return;
        }
        
        console.log(`Güncelleme yapılıyor: ${primaryKeyColumn} = ${formulation[primaryKeyColumn]}`);
        console.log("Güncellenecek veri:", saveData);
        
        const { data, error } = await supabase
          .from('Formülasyonlar')
          .update(saveData)
          .eq(primaryKeyColumn, formulation[primaryKeyColumn])
          .select();

        if (error) {
          console.error("Güncelleme hatası:", error.message, error.details, error.hint);
          toast.error(`Güncelleme hatası: ${error.message}`);
        } else {
          console.log("Güncellenen veri cevabı:", data);
          toast.success('Formülasyon başarıyla güncellendi');
          loadData();
        }
      }
    } catch (err) {
      console.error('Kaydetme işlemi sırasında hata:', err);
      toast.error('Kaydetme işlemi sırasında bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Formülasyon değişikliklerini iptal etme
  const handleCancel = (index: number) => {
    console.log(`${index} indeksindeki formülasyon düzenlemesi iptal ediliyor`);
    const updatedFormulations = [...formulations];
    
    if (updatedFormulations[index].isNew) {
      // Yeni eklenen formülasyonu kaldır
      updatedFormulations.splice(index, 1);
    } else {
      // Düzenlemeyi iptal et
      updatedFormulations[index].isEditing = false;
    }
    
    setFormulations(updatedFormulations);
    setSearchTerm(''); // Aramayı temizle
  };

  // Input değişikliklerini takip etme
  const handleInputChange = (index: number, field: keyof FormulationItem, value: string | number) => {
    const updatedFormulations = [...formulations];
    
    // "Oran(100Kg)" alanı için değerin sayı tipinde olmasını sağla
    if (field === "Oran(100Kg)" && typeof value === 'string') {
      updatedFormulations[index][field] = parseFloat(value) || 0;
    } else {
      updatedFormulations[index][field] = value as any;
    }
    
    setFormulations(updatedFormulations);
  };

  // Başarı mesajı gösterme
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Arama terimine göre stok öğelerini filtrele
  const filteredStockItems = stockItems.filter(item => {
    if (!item["Hammadde Adı"]) return false;
    return item["Hammadde Adı"].toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Toplam oran hesaplama
  const calculateTotalPercentage = () => {
    if (!formulations.length) return 0;
    
    // Stok kategorisi "Hammadde" olan ürünlerin oranlarını topla
    const total = formulations
      .filter(item => item["Stok Kategori"]?.toLowerCase() === 'hammadde')
      .reduce((sum, item) => sum + (Number(item["Oran(100Kg)"]) || 0), 0);
    
    return Math.round(total * 100) / 100; // En yakın 2 ondalığa yuvarla
  };

  // Sayısal alanlara sayısal dönüşüm yapan yardımcı fonksiyon
  const convertToNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed as number) ? 0 : (parsed as number);
  };

  // Modal kapalıysa render etme
  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {recipeName} - Formülasyon
            </h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handlePrintClick}
                className="inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Yazdır
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-white rounded-md p-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Hata mesajı */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
          )}

          {/* Başarı mesajı */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Modal içeriği - Formülasyon tablosu */}
          <div ref={contentRef} className="overflow-y-auto max-h-[calc(100vh-200px)] p-2">
            <div className="printable-content">
              {/* Reçete bilgileri */}
              <div className="mb-4 print:block">
                <h3 className="text-base font-semibold">Reçete Bilgileri</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Reçete Adı:</span> {recipeName}
                  </div>
                  <div>
                    <span className="text-gray-600">Reçete ID:</span> {recipeId}
                  </div>
                  <div>
                    <span className="text-gray-600">Marka:</span> {brand}
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      Toplam%: {calculateTotalPercentage()}
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm">Veriler yükleniyor...</span>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                          Hammadde Adı
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Oran (100Kg)
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Birim
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                          Stok Kategori
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formulations.map((formulation, index) => (
                        <tr key={formulation.id || `new-${index}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            {formulation.isEditing ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  placeholder="Hammadde ara..."
                                  className="form-input rounded-md shadow-sm border-gray-300 w-full text-xs mb-1"
                                />
                                {searchTerm && (
                                  <div className="absolute z-10 w-full bg-white shadow-lg rounded-md max-h-32 overflow-y-auto border border-gray-300">
                                    {filteredStockItems.length > 0 ? (
                                      filteredStockItems.map((item) => (
                                        <button
                                          key={item.id || item.ID}
                                          type="button"
                                          onClick={() => handleHammaddeChange(index, item["Hammadde Adı"])}
                                          className="w-full text-left px-2 py-1 text-xs hover:bg-blue-100"
                                        >
                                          {item["Hammadde Adı"]}
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-2 text-xs text-gray-500">Hammadde bulunamadı</div>
                                    )}
                                  </div>
                                )}
                                {/* Seçilen hammadde gösterimi */}
                                <div className="mt-1 p-1 border rounded-md bg-gray-50 text-xs">
                                  {formulation["Hammadde Adı"] || "Henüz hammadde seçilmedi"}
                                </div>
                              </div>
                            ) : (
                              formulation["Hammadde Adı"]
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {formulation.isEditing ? (
                              <input
                                type="number"
                                value={formulation["Oran(100Kg)"]}
                                onChange={(e) => handleInputChange(index, "Oran(100Kg)", parseFloat(e.target.value) || 0)}
                                className="form-input rounded-md shadow-sm border-gray-300 w-full text-xs"
                                step="0.01"
                                min="0"
                                required
                              />
                            ) : (
                              formulation["Oran(100Kg)"]
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {formulation.isEditing ? (
                              <select
                                value={formulation["Birim"]}
                                onChange={(e) => handleInputChange(index, "Birim", e.target.value)}
                                className="form-select rounded-md shadow-sm border-gray-300 w-full text-xs"
                              >
                                <option value="Kg">Kg</option>
                                <option value="Adet">Adet</option>
                              </select>
                            ) : (
                              formulation["Birim"]
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {formulation.isEditing ? (
                              <input
                                type="text"
                                value={formulation["Stok Kategori"]}
                                className="form-input rounded-md shadow-sm border-gray-300 w-full text-xs bg-gray-100"
                                readOnly
                              />
                            ) : (
                              formulation["Stok Kategori"]
                            )}
                          </td>
                          <td className="px-3 py-2 print:hidden">
                            {formulation.isEditing ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveFormulation(formulation)}
                                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                >
                                  Kaydet
                                </button>
                                <button
                                  onClick={() => handleCancel(index)}
                                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                                >
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(index)}
                                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                >
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => handleDelete(formulation)}
                                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                >
                                  Sil
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Yeni formülasyon ekleme butonu */}
                  <div className="mt-4 print:hidden">
                    <button
                      onClick={handleAddFormulation}
                      className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Hammadde Ekle
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Yardımcı fonksiyon: Tüm stok verilerini çeken fonksiyon
async function fetchAllFromTable(tableName: string) {
  try {
    const data = await fetchFilteredData(tableName, 'id', 'id', true);
    return data;
  } catch (error) {
    console.error(`Stok verileri alınırken hata oluştu:`, error);
    return [];
  }
}

export default FormulationModal; 