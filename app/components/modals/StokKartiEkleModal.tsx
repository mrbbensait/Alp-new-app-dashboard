import React, { useState } from 'react';
import { insertData } from '@/app/lib/supabase';

interface StokKartiEkleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StokKartiEkleModal: React.FC<StokKartiEkleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    'Hammadde Adı': '',
    'Mevcut Stok': '',
    'Birim': '',
    'Stok Kategori': 'Hammadde',
    'Kritik Stok': '',
    'Notlar': '',
    'kategori_detay': '',
    'kg_fiyat': ''
  });
  
  const [kategoriTipi, setKategoriTipi] = useState<string>('Hammadde');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Birim seçenekleri
  const birimOptions = ['Kg', 'Lt', 'Adet'];

  // Radio buton değişikliği
  const handleKategoriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedKategori = e.target.value;
    setKategoriTipi(selectedKategori);
    
    // Form verisini güncelle
    setFormData({
      ...formData,
      'Stok Kategori': selectedKategori
    });
  };

  // Form input değişikliği - string değerler için
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Form input değişikliği - sayısal değerler için
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sadece sayılar ve ondalık noktası kabul edilir
    if (value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Zorunlu alanları kontrol et
      if (!formData['Hammadde Adı'] || !formData['Stok Kategori']) {
        throw new Error('Hammadde Adı ve Stok Kategori alanları zorunludur');
      }

      // Sayısal değerleri dönüştür
      const stokData = {
        'Hammadde Adı': formData['Hammadde Adı'],
        'Mevcut Stok': formData['Mevcut Stok'] ? parseFloat(formData['Mevcut Stok']) : 0,
        'Birim': formData['Birim'] || 'kg',
        'Stok Kategori': formData['Stok Kategori'],
        'Kritik Stok': formData['Kritik Stok'] ? parseFloat(formData['Kritik Stok']) : 0,
        'Notlar': formData['Notlar'] || null,
        'kategori_detay': formData['kategori_detay'] || null,
        'kg_fiyat': formData['kg_fiyat'] ? parseInt(formData['kg_fiyat'], 10) : null
      };

      // Stok kartı ekleme
      await insertData('Stok', stokData);

      // Form verilerini sıfırla
      setFormData({
        'Hammadde Adı': '',
        'Mevcut Stok': '',
        'Birim': '',
        'Stok Kategori': 'Hammadde',
        'Kritik Stok': '',
        'Notlar': '',
        'kategori_detay': '',
        'kg_fiyat': ''
      });
      setKategoriTipi('Hammadde');

      // Başarılı ekleme durumunda
      onSuccess();
    } catch (err: any) {
      console.error('Stok kartı eklerken hata:', err);
      setError(err.message || 'Stok kartı eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-3xl w-full mx-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Stok Kartı Ekle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-200">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hammadde Adı - Zorunlu alan */}
            <div>
              <label htmlFor="hammadde-adi" className="block text-sm font-medium text-gray-700 mb-1">
                Hammadde Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Hammadde Adı"
                id="hammadde-adi"
                required
                value={formData['Hammadde Adı']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. Sodyum Klorür"
              />
            </div>

            {/* Stok Kategorisi - Radio butonlarla */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stok Kategorisi <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="kategori-hammadde"
                    name="kategori-tipi"
                    type="radio"
                    value="Hammadde"
                    checked={kategoriTipi === 'Hammadde'}
                    onChange={handleKategoriChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="kategori-hammadde" className="ml-2 block text-sm text-gray-700">
                    Hammadde
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="kategori-ambalaj"
                    name="kategori-tipi"
                    type="radio"
                    value="Ambalaj"
                    checked={kategoriTipi === 'Ambalaj'}
                    onChange={handleKategoriChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="kategori-ambalaj" className="ml-2 block text-sm text-gray-700">
                    Ambalaj
                  </label>
                </div>
              </div>
            </div>

            {/* Mevcut Stok */}
            <div>
              <label htmlFor="mevcut-stok" className="block text-sm font-medium text-gray-700 mb-1">
                Mevcut Stok
              </label>
              <input
                type="text"
                name="Mevcut Stok"
                id="mevcut-stok"
                value={formData['Mevcut Stok']}
                onChange={handleNumericInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. 100"
              />
            </div>

            {/* Birim */}
            <div>
              <label htmlFor="birim" className="block text-sm font-medium text-gray-700 mb-1">
                Birim
              </label>
              <select
                name="Birim"
                id="birim"
                value={formData['Birim']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Birim Seçin</option>
                {birimOptions.map((birim) => (
                  <option key={birim} value={birim}>{birim}</option>
                ))}
              </select>
            </div>

            {/* Kritik Stok */}
            <div>
              <label htmlFor="kritik-stok" className="block text-sm font-medium text-gray-700 mb-1">
                Kritik Stok
              </label>
              <input
                type="text"
                name="Kritik Stok"
                id="kritik-stok"
                value={formData['Kritik Stok']}
                onChange={handleNumericInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. 10"
              />
            </div>

            {/* Kg Fiyat */}
            <div>
              <label htmlFor="kg-fiyat" className="block text-sm font-medium text-gray-700 mb-1">
                Kg Fiyat (EUR)
              </label>
              <input
                type="text"
                name="kg_fiyat"
                id="kg-fiyat"
                value={formData['kg_fiyat']}
                onChange={handleNumericInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. 50"
              />
            </div>

            {/* Kategori Detay */}
            <div>
              <label htmlFor="kategori-detay" className="block text-sm font-medium text-gray-700 mb-1">
                Kategori Detay
              </label>
              <input
                type="text"
                name="kategori_detay"
                id="kategori-detay"
                value={formData['kategori_detay']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Kategori detayını girin"
              />
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label htmlFor="notlar" className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              name="Notlar"
              id="notlar"
              rows={3}
              value={formData['Notlar']}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Ekstra bilgiler"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Stok Kartı Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StokKartiEkleModal; 