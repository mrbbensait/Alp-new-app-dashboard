import React, { useState } from 'react';
import { insertData } from '@/app/lib/supabase';

interface TedarikciEkleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TedarikciEkleModal: React.FC<TedarikciEkleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    'Tedarikçi Adı': '',
    'Şehir': '',
    'Email': '',
    'Adres': '',
    'Telefon': '',
    'Tedarikçi Kategorisi': '',
    'Notlar': ''
  });
  
  const [kategoriTipi, setKategoriTipi] = useState<string>('');
  const [digerKategori, setDigerKategori] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Radio buton değişikliği
  const handleKategoriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedKategori = e.target.value;
    setKategoriTipi(selectedKategori);
    
    // Eğer seçilen kategori "Diğer" değilse, doğrudan form verisini güncelle
    if (selectedKategori !== 'Diğer') {
      setFormData({
        ...formData,
        'Tedarikçi Kategorisi': selectedKategori
      });
    } else {
      // Diğer seçildiğinde, digerKategori değerini kullan
      setFormData({
        ...formData,
        'Tedarikçi Kategorisi': digerKategori
      });
    }
  };

  // Diğer kategorisi için text input değişikliği
  const handleDigerKategoriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDigerKategori(value);
    setFormData({
      ...formData,
      'Tedarikçi Kategorisi': value
    });
  };

  // Form input değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Zorunlu alanları kontrol et
      if (!formData['Tedarikçi Adı'] || !formData['Şehir'] || !formData['Email'] || !formData['Telefon'] || !formData['Tedarikçi Kategorisi']) {
        throw new Error('Tedarikçi Adı, Şehir, Email, Telefon ve Tedarikçi Kategorisi alanları zorunludur');
      }

      // Tedarikçi ekleme
      const result = await insertData('suppliers', {
        'Tedarikçi Adı': formData['Tedarikçi Adı'],
        'Şehir': formData['Şehir'],
        'Email': formData['Email'],
        'Telefon': formData['Telefon'],
        'Tedarikçi Kategorisi': formData['Tedarikçi Kategorisi'],
        'Adres': formData['Adres'] || null,
        'Notlar': formData['Notlar'] || null
      });

      // Form verilerini sıfırla
      setFormData({
        'Tedarikçi Adı': '',
        'Şehir': '',
        'Email': '',
        'Adres': '',
        'Telefon': '',
        'Tedarikçi Kategorisi': '',
        'Notlar': ''
      });
      setKategoriTipi('');
      setDigerKategori('');

      // Başarılı ekleme durumunda
      onSuccess();
    } catch (err: any) {
      console.error('Tedarikçi eklerken hata:', err);
      setError(err.message || 'Tedarikçi eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-3xl w-full mx-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Tedarikçi Ekle</h2>
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
            {/* Tedarikçi Adı - Zorunlu alan */}
            <div>
              <label htmlFor="tedarikci-adi" className="block text-sm font-medium text-gray-700 mb-1">
                Tedarikçi Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Tedarikçi Adı"
                id="tedarikci-adi"
                required
                value={formData['Tedarikçi Adı']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. ABC Tedarikçi"
              />
            </div>

            {/* Tedarikçi Kategorisi - Radio butonlarla */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tedarikçi Kategorisi <span className="text-red-500">*</span>
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
                <div>
                  <div className="flex items-center">
                    <input
                      id="kategori-diger"
                      name="kategori-tipi"
                      type="radio"
                      value="Diğer"
                      checked={kategoriTipi === 'Diğer'}
                      onChange={handleKategoriChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="kategori-diger" className="ml-2 block text-sm text-gray-700">
                      Diğer
                    </label>
                  </div>
                  
                  {/* Diğer seçilirse gösterilecek input alanı */}
                  {kategoriTipi === 'Diğer' && (
                    <div className="mt-2 ml-6">
                      <input
                        type="text"
                        value={digerKategori}
                        onChange={handleDigerKategoriChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Kategori adını girin"
                        required={kategoriTipi === 'Diğer'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Şehir - Zorunlu alan */}
            <div>
              <label htmlFor="sehir" className="block text-sm font-medium text-gray-700 mb-1">
                Şehir <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Şehir"
                id="sehir"
                required
                value={formData['Şehir']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. İstanbul"
              />
            </div>

            {/* Email - Zorunlu alan */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="Email"
                id="email"
                required
                value={formData['Email']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="örnek@email.com"
              />
            </div>

            {/* Telefon - Zorunlu alan */}
            <div>
              <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Telefon"
                id="telefon"
                required
                value={formData['Telefon']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="5XX XXX XXXX"
              />
            </div>

            {/* Adres */}
            <div>
              <label htmlFor="adres" className="block text-sm font-medium text-gray-700 mb-1">
                Adres
              </label>
              <input
                type="text"
                name="Adres"
                id="adres"
                value={formData['Adres']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Tedarikçi adresi"
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
              placeholder="Tedarikçi ile ilgili notlar"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediyor...
                </div>
              ) : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TedarikciEkleModal; 