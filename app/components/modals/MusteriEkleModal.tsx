import React, { useState } from 'react';
import { insertData } from '@/app/lib/supabase';

interface MusteriEkleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MusteriEkleModal: React.FC<MusteriEkleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    'Müşteri Firma': '',
    'Yetkili İsim': '',
    'Marka': '',
    'Email': '',
    'Telefon': '',
    'Şehir': '',
    'Adres': '',
    'Notlar': ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form input değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Telefon alanı için sayısal değer kontrolü
    if (name === 'Telefon') {
      // Sadece sayıları kabul et
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue
      });
    } else {
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
      if (!formData['Müşteri Firma'] || !formData['Marka']) {
        throw new Error('Müşteri Firma ve Marka alanları zorunludur');
      }

      // Müşteri ekleme
      const result = await insertData('Müşteriler', {
        'Müşteri Firma': formData['Müşteri Firma'],
        'Yetkili İsim': formData['Yetkili İsim'] || null,
        'Marka': formData['Marka'],
        'Email': formData['Email'] || null,
        'Telefon': formData['Telefon'] ? Number(formData['Telefon']) : null,
        'Şehir': formData['Şehir'] || null,
        'Adres': formData['Adres'] || null,
        'Notlar': formData['Notlar'] || null
      });

      // Form verilerini sıfırla
      setFormData({
        'Müşteri Firma': '',
        'Yetkili İsim': '',
        'Marka': '',
        'Email': '',
        'Telefon': '',
        'Şehir': '',
        'Adres': '',
        'Notlar': ''
      });

      // Başarılı ekleme durumunda
      onSuccess();
    } catch (err: any) {
      console.error('Müşteri eklerken hata:', err);
      setError(err.message || 'Müşteri eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-3xl w-full mx-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Müşteri Ekle</h2>
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
            {/* Müşteri Firma - Zorunlu alan */}
            <div>
              <label htmlFor="musteri-firma" className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri Firma <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Müşteri Firma"
                id="musteri-firma"
                required
                value={formData['Müşteri Firma']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. ABC Şirketi"
              />
            </div>

            {/* Yetkili İsim */}
            <div>
              <label htmlFor="yetkili-isim" className="block text-sm font-medium text-gray-700 mb-1">
                Yetkili İsim
              </label>
              <input
                type="text"
                name="Yetkili İsim"
                id="yetkili-isim"
                value={formData['Yetkili İsim']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. Ahmet Yılmaz"
              />
            </div>

            {/* Marka - Zorunlu alan */}
            <div>
              <label htmlFor="marka" className="block text-sm font-medium text-gray-700 mb-1">
                Marka <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Marka"
                id="marka"
                required
                value={formData['Marka']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. XYZ Markası"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="Email"
                id="email"
                value={formData['Email']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="örnek@email.com"
              />
            </div>

            {/* Telefon */}
            <div>
              <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                name="Telefon"
                id="telefon"
                value={formData['Telefon']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="5XX XXX XXXX"
              />
            </div>

            {/* Şehir */}
            <div>
              <label htmlFor="sehir" className="block text-sm font-medium text-gray-700 mb-1">
                Şehir
              </label>
              <input
                type="text"
                name="Şehir"
                id="sehir"
                value={formData['Şehir']}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Örn. İstanbul"
              />
            </div>
          </div>

          {/* Adres */}
          <div>
            <label htmlFor="adres" className="block text-sm font-medium text-gray-700 mb-1">
              Adres
            </label>
            <textarea
              name="Adres"
              id="adres"
              rows={2}
              value={formData['Adres']}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Müşteri adresi"
            />
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
              placeholder="Ek bilgiler..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                "Müşteri Ekle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MusteriEkleModal; 