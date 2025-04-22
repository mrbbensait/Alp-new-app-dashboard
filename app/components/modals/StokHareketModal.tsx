import React, { useState, useEffect } from 'react';
import { updateData, fetchAllFromTable } from '@/app/lib/supabase';

interface StokHareketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StokHareketModal: React.FC<StokHareketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [stokItems, setStokItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [selectedStok, setSelectedStok] = useState<any | null>(null);
  const [hareketTipi, setHareketTipi] = useState<'giris' | 'cikis'>('giris');
  const [miktar, setMiktar] = useState<string>('');

  // Modal açıldığında stok verilerini yükle
  useEffect(() => {
    if (isOpen) {
      loadStokItems();
    }
  }, [isOpen]);

  // Stok verilerini yükle
  const loadStokItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchAllFromTable('Stok');
      setStokItems(data);
      setFilteredItems(data);
    } catch (err: any) {
      console.error('Stok verileri yüklenirken hata:', err);
      setError('Stok verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Arama sorgusu değiştiğinde filtreleme yap
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(stokItems);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = stokItems.filter(
      item => item['Hammadde Adı']?.toLowerCase().includes(query)
    );
    
    setFilteredItems(filtered);
  }, [searchQuery, stokItems]);

  // Stok seç
  const handleStokSelect = (stok: any) => {
    // Seçilen stok detaylarını ve ID/id alanlarını konsola yazdırmayı kaldır
    // console.log('Seçilen stok detayları:', stok);
    // console.log('Stok ID:', stok.ID);
    // console.log('Stok id:', stok.id);
    
    setSelectedStok(stok);
    // Arama kutusunu temizle
    setSearchQuery('');
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!selectedStok) {
      setError('Lütfen bir stok seçin.');
      setIsSubmitting(false);
      return;
    }

    if (!miktar || isNaN(Number(miktar)) || Number(miktar) <= 0) {
      setError('Lütfen geçerli bir miktar girin.');
      setIsSubmitting(false);
      return;
    }

    const miktarSayi = Number(miktar);
    
    try {
      // Mevcut stok miktarı
      const mevcutStok = selectedStok['Mevcut Stok'] || 0;
      
      // Yeni stok miktarı hesapla
      let yeniStok = hareketTipi === 'giris' 
        ? mevcutStok + miktarSayi 
        : mevcutStok - miktarSayi;
      
      // Stok çıkışı için kontrol - negatif olamaz
      if (hareketTipi === 'cikis' && yeniStok < 0) {
        setError('Çıkış miktarı mevcut stoktan fazla olamaz.');
        setIsSubmitting(false);
        return;
      }

      // Hata ayıklama için stok bilgilerini konsola yazdırmayı kaldır
      // console.log('Seçilen stok:', selectedStok);
      
      // Stok güncelleme - ID (büyük harf) kullan
      // Önceki adımda updateData fonksiyonu dinamik hale getirildi, 
      // bu yüzden burada doğru ID alanını (selectedStok.ID) göndermek yeterli.
      await updateData('Stok', selectedStok.ID, { // .id yerine .ID kullan
        'Mevcut Stok': yeniStok,
        'kategori_detay': selectedStok['kategori_detay'],
        'kg_fiyat': selectedStok['kg_fiyat']
      });

      // Formu sıfırla
      setSelectedStok(null);
      setMiktar('');
      setHareketTipi('giris');

      // Başarılı işlem
      onSuccess();
    } catch (err: any) {
      console.error('Stok güncellenirken hata:', err);
      setError(err.message || 'Stok güncellenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-3xl w-full mx-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Stok Giriş/Çıkış İşlemi</h2>
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
          {/* Stok Seçimi */}
          <div>
            <label htmlFor="stok-search" className="block text-sm font-medium text-gray-700 mb-1">
              Stok Kalemini Seçin <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="stok-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Stok adı ile arama yapın..."
                autoComplete="off"
              />
              
              {/* Arama Sonuçları */}
              {searchQuery.trim() !== '' && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Yükleniyor...</div>
                  ) : filteredItems.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Sonuç bulunamadı</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <li 
                          key={item.ID} 
                          onClick={() => handleStokSelect(item)}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item['Hammadde Adı']}</p>
                            <p className="text-xs text-gray-500">{item['Stok Kategori']}</p>
                          </div>
                          <span className="text-sm text-gray-600">{item['Mevcut Stok']} {item['Birim']}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Seçilen Stok Bilgisi */}
          {selectedStok && (
            <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
              <h3 className="text-md font-medium text-indigo-800 mb-2">Seçilen Stok</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Stok Adı:</span> {selectedStok['Hammadde Adı']}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Kategori:</span> {selectedStok['Stok Kategori']}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Mevcut Stok:</span> {selectedStok['Mevcut Stok']} {selectedStok['Birim']}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Kritik Stok:</span> {selectedStok['Kritik Stok']} {selectedStok['Birim']}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* İşlem Tipi (Giriş/Çıkış) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Tipi <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-6">
              <div className="flex items-center">
                <input
                  id="giris"
                  name="hareket-tipi"
                  type="radio"
                  value="giris"
                  checked={hareketTipi === 'giris'}
                  onChange={() => setHareketTipi('giris')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="giris" className="ml-2 block text-sm text-gray-700">
                  Stok Giriş
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="cikis"
                  name="hareket-tipi"
                  type="radio"
                  value="cikis"
                  checked={hareketTipi === 'cikis'}
                  onChange={() => setHareketTipi('cikis')}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <label htmlFor="cikis" className="ml-2 block text-sm text-gray-700">
                  Stok Çıkış
                </label>
              </div>
            </div>
          </div>

          {/* Miktar */}
          <div>
            <label htmlFor="miktar" className="block text-sm font-medium text-gray-700 mb-1">
              {hareketTipi === 'giris' ? 'Girilecek Miktar' : 'Çıkılacak Miktar'} <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                name="miktar"
                id="miktar"
                value={miktar}
                onChange={(e) => {
                  // Sadece sayı ve nokta kabul et
                  if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                    setMiktar(e.target.value);
                  }
                }}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {selectedStok?.['Birim'] || 'Birim'}
                </span>
              </div>
            </div>
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
              disabled={isSubmitting || !selectedStok}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                hareketTipi === 'giris' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center`}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {hareketTipi === 'giris' ? 'Stok Girişi Yap' : 'Stok Çıkışı Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StokHareketModal; 