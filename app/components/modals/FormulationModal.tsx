'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchFilteredData, insertData, updateData, deleteData } from '../../lib/supabase';
import { useReactToPrint } from 'react-to-print';

interface FormulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  recipeId: string;
  brand: string;
}

interface FormulationItem {
  id?: number;
  "Reçete Adı": string;
  "Reçete ID": string;
  "Marka": string;
  "Hammadde Adı": string;
  "Oran(100Kg)": number;
  "Birim": string;
  "Stok Kategori": string;
  "Notlar"?: string;
  isNew?: boolean;
  isEditing?: boolean;
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
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Yazdırma işlevi
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `${recipeName} - Formülasyon`,
    onAfterPrint: () => console.log('Yazdırma tamamlandı'),
  });

  // Modal açıldığında formülasyonları ve stok verilerini yükle
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, recipeName, recipeId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Formülasyonları yükle
      const formulationData = await fetchFilteredData('Formülasyonlar', 'Reçete Adı', recipeName);
      setFormulations(formulationData || []);

      // Stok verilerini yükle (hammadde seçimi için)
      const stockData = await fetchAllFromTable('Stok');
      setStockItems(stockData || []);
    } catch (err) {
      console.error('Veri yüklenirken hata oluştu:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Formülasyon silme işlemi
  const handleDelete = async (id?: number) => {
    if (!id) return;
    
    if (!confirm('Bu formülasyonu silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteData('Formülasyonlar', id);
      setFormulations(prev => prev.filter(item => item.id !== id));
      showSuccess('Formülasyon başarıyla silindi');
    } catch (err) {
      console.error('Formülasyon silinirken hata oluştu:', err);
      setError('Formülasyon silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Yeni formülasyon ekleme
  const handleAddFormulation = () => {
    const newFormulation: FormulationItem = {
      "Reçete Adı": recipeName,
      "Reçete ID": recipeId,
      "Marka": brand,
      "Hammadde Adı": "",
      "Oran(100Kg)": 0,
      "Birim": "kg",
      "Stok Kategori": "",
      isNew: true,
      isEditing: true
    };

    setFormulations(prev => [...prev, newFormulation]);
  };

  // Formülasyon düzenleme moduna geçme
  const handleEdit = (index: number) => {
    const updatedFormulations = [...formulations];
    updatedFormulations[index].isEditing = true;
    setFormulations(updatedFormulations);
  };

  // Formülasyon değişikliklerini kaydetme
  const handleSave = async (index: number) => {
    const formulation = formulations[index];
    
    // Validasyon kontrolleri
    if (!formulation["Hammadde Adı"]) {
      setError('Hammadde adı boş olamaz');
      return;
    }
    
    try {
      const { isNew, isEditing, ...formulationData } = formulation;
      
      if (isNew) {
        // Yeni formülasyon ekleme
        const result = await insertData('Formülasyonlar', formulationData);
        const updatedFormulations = [...formulations];
        updatedFormulations[index] = { ...result[0], isEditing: false };
        setFormulations(updatedFormulations);
      } else {
        // Mevcut formülasyonu güncelleme
        const result = await updateData('Formülasyonlar', formulation.id!, formulationData);
        const updatedFormulations = [...formulations];
        updatedFormulations[index] = { ...result[0], isEditing: false };
        setFormulations(updatedFormulations);
      }
      
      showSuccess('Formülasyon başarıyla kaydedildi');
    } catch (err) {
      console.error('Formülasyon kaydedilirken hata oluştu:', err);
      setError('Formülasyon kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Formülasyon değişikliklerini iptal etme
  const handleCancel = (index: number) => {
    const updatedFormulations = [...formulations];
    
    if (updatedFormulations[index].isNew) {
      // Yeni eklenen formülasyonu kaldır
      updatedFormulations.splice(index, 1);
    } else {
      // Düzenlemeyi iptal et
      updatedFormulations[index].isEditing = false;
    }
    
    setFormulations(updatedFormulations);
  };

  // Input değişikliklerini takip etme
  const handleInputChange = (index: number, field: keyof FormulationItem, value: any) => {
    const updatedFormulations = [...formulations];
    updatedFormulations[index][field] = value;
    setFormulations(updatedFormulations);
  };

  // Başarı mesajı gösterme
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Modal kapalıysa render etme
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative bg-white rounded-lg max-w-4xl mx-auto my-10 p-5 shadow-xl">
        {/* Modal başlığı ve kontrol butonları */}
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {recipeName} - Formülasyon Detayları
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Yazdır
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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
              <h3 className="text-lg font-semibold">Reçete Bilgileri</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Reçete Adı:</span> {recipeName}
                </div>
                <div>
                  <span className="text-gray-600">Reçete ID:</span> {recipeId}
                </div>
                <div>
                  <span className="text-gray-600">Marka:</span> {brand}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2">Veriler yükleniyor...</span>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hammadde Adı
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oran (100Kg)
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birim
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Kategori
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formulations.map((formulation, index) => (
                      <tr key={formulation.id || `new-${index}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {formulation.isEditing ? (
                            <select
                              value={formulation["Hammadde Adı"]}
                              onChange={(e) => handleInputChange(index, "Hammadde Adı", e.target.value)}
                              className="form-select rounded-md shadow-sm border-gray-300 w-full"
                              required
                            >
                              <option value="">Hammadde Seçin</option>
                              {stockItems.map((item) => (
                                <option key={item.id} value={item["Hammadde Adı"]}>
                                  {item["Hammadde Adı"]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            formulation["Hammadde Adı"]
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {formulation.isEditing ? (
                            <input
                              type="number"
                              value={formulation["Oran(100Kg)"]}
                              onChange={(e) => handleInputChange(index, "Oran(100Kg)", parseFloat(e.target.value))}
                              className="form-input rounded-md shadow-sm border-gray-300 w-full"
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
                              className="form-select rounded-md shadow-sm border-gray-300 w-full"
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                            </select>
                          ) : (
                            formulation["Birim"]
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {formulation.isEditing ? (
                            <select
                              value={formulation["Stok Kategori"]}
                              onChange={(e) => handleInputChange(index, "Stok Kategori", e.target.value)}
                              className="form-select rounded-md shadow-sm border-gray-300 w-full"
                              required
                            >
                              <option value="">Kategori Seçin</option>
                              {Array.from(new Set(stockItems.map(item => item["Stok Kategori"]).filter(Boolean))).map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          ) : (
                            formulation["Stok Kategori"]
                          )}
                        </td>
                        <td className="px-3 py-2 print:hidden">
                          {formulation.isEditing ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSave(index)}
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
                                onClick={() => handleDelete(formulation.id)}
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