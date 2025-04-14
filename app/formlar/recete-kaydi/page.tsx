'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Plus, Trash2, Search } from 'lucide-react';
import { fetchAllFromTable } from '../../lib/supabase';

interface StokItem {
  'Hammadde Adı': string;
  'Stok Kategori': string;
  'Hammadde ID': string; 
  [key: string]: any;
}

interface Musteri {
  'Marka': string;
  'Müşteri Firma': string;
  'Müşteri ID': string;
  [key: string]: any;
}

interface Bilesen {
  adi: string;
  kategori: string;
  oran: string;
  hammaddeId?: string;
}

export default function ReceteKaydiPage() {
  const [receteAdi, setReceteAdi] = useState('');
  const [marka, setMarka] = useState('');
  const [bilesenler, setBilesenler] = useState<Bilesen[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  
  // Marka arama/seçme için state
  const [markalar, setMarkalar] = useState<Musteri[]>([]);
  const [markaSearchTerm, setMarkaSearchTerm] = useState('');
  const [filteredMarkalar, setFilteredMarkalar] = useState<Musteri[]>([]);
  const [showMarkaDropdown, setShowMarkaDropdown] = useState(false);
  
  // Bileşen ekleme ve arama için state 
  const [stokItems, setStokItems] = useState<StokItem[]>([]);
  const [filteredStokItems, setFilteredStokItems] = useState<StokItem[]>([]);
  const [bilesenSearchTerm, setBilesenSearchTerm] = useState('');
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  
  // API durumu için state
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verileri yükleme
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Müşteriler tablosundan marka verilerini çek
      const musteriData = await fetchAllFromTable('Müşteriler');
      setMarkalar(musteriData);
      setFilteredMarkalar(musteriData);

      // Stok tablosundan bileşen verilerini çek
      const stokData = await fetchAllFromTable('Stok');
      setStokItems(stokData);
      setFilteredStokItems(stokData);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setErrorMessage('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toplam yüzde hesaplama
  const calculateTotalPercentage = () => {
    return bilesenler
      .filter(b => b.kategori !== 'Ambalaj')
      .reduce((total, bilesen) => total + (parseFloat(bilesen.oran) || 0), 0);
  };

  // Bileşen ekleme
  const addComponent = () => {
    setBilesenler([...bilesenler, { adi: '', kategori: '', oran: '' }]);
  };

  // Bileşen silme
  const removeComponent = (index: number) => {
    const newBilesenler = [...bilesenler];
    newBilesenler.splice(index, 1);
    setBilesenler(newBilesenler);
  };

  // Bileşen güncelleme
  const updateComponent = (index: number, field: keyof Bilesen, value: string) => {
    const newBilesenler = [...bilesenler];
    newBilesenler[index] = { ...newBilesenler[index], [field]: value };
    setBilesenler(newBilesenler);
  };

  // Stok öğesi seçildiğinde bileşeni güncelle
  const selectBilesen = (index: number, stokItem: StokItem) => {
    const newBilesenler = [...bilesenler];
    newBilesenler[index] = { 
      ...newBilesenler[index], 
      adi: stokItem['Hammadde Adı'], 
      kategori: stokItem['Stok Kategori'],
      hammaddeId: stokItem['Hammadde ID']
    };
    setBilesenler(newBilesenler);
    setActiveDropdownIndex(null);
  };

  // Dropdown açma/kapama
  const toggleDropdown = (index: number) => {
    setActiveDropdownIndex(activeDropdownIndex === index ? null : index);
    setBilesenSearchTerm('');
    setFilteredStokItems(stokItems);
  };

  // Bileşen arama
  const handleBilesenSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setBilesenSearchTerm(term);
    
    if (term) {
      const filtered = stokItems.filter(
        item => item['Hammadde Adı'].toLowerCase().includes(term)
      );
      setFilteredStokItems(filtered);
    } else {
      setFilteredStokItems(stokItems);
    }
  };

  // Marka arama
  const handleMarkaSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setMarkaSearchTerm(term);
    
    if (term) {
      const filtered = markalar.filter(
        item => item['Marka'].toLowerCase().includes(term) || 
                item['Müşteri Firma'].toLowerCase().includes(term)
      );
      setFilteredMarkalar(filtered);
    } else {
      setFilteredMarkalar(markalar);
    }
  };

  // Marka dropdown'ını aç/kapa
  const toggleMarkaDropdown = () => {
    setShowMarkaDropdown(!showMarkaDropdown);
    setMarkaSearchTerm('');
    setFilteredMarkalar(markalar);
  };

  // Marka seçimi
  const selectMarka = (musteriItem: Musteri) => {
    setMarka(musteriItem['Marka']);
    setShowMarkaDropdown(false);
  };

  // Dropdown dışı tıklama işleme
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bilesen-dropdown-container')) {
        setActiveDropdownIndex(null);
      }
      if (!target.closest('.marka-dropdown-container')) {
        setShowMarkaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!receteAdi.trim()) {
      alert('Lütfen reçete adını giriniz.');
      return;
    }
    
    if (!marka) {
      alert('Lütfen bir marka seçiniz.');
      return;
    }
    
    if (bilesenler.length === 0) {
      alert('Lütfen en az bir bileşen ekleyiniz.');
      return;
    }
    
    const hasEmptyFields = bilesenler.some(
      b => !b.adi || !b.oran
    );
    
    if (hasEmptyFields) {
      alert('Lütfen tüm bileşenlerin adlarını ve oranlarını giriniz.');
      return;
    }
    
    // Toplam yüzdeyi kontrol et
    const totalPercentage = calculateTotalPercentage();
    
    if (Math.abs(totalPercentage - 100) > 0.1) {
      if (!confirm(`Bileşenlerin toplam oranı (Ambalaj kategorisi hariç) ${totalPercentage.toFixed(2)}% olarak hesaplandı. İdeal olarak %100 olmalıdır. Devam etmek istiyor musunuz?`)) {
        return;
      }
    }
    
    // Form verilerini topla
    const formData = {
      receteAdi,
      marka,
      bilesenler: bilesenler.map(b => ({
        adi: b.adi,
        kategori: b.kategori,
        oran: b.oran,
        hammaddeId: b.hammaddeId
      })),
      kayitTarihi: new Date().toISOString()
    };
    
    try {
      console.log("N8N'e gönderilecek veri:", formData);
      setIsLoading(true); // İstek sırasında yükleme göster
      
      try {
        // İlk yöntem: Doğrudan webhook'a istek
        let response;
        
        try {
          // Önce doğrudan webhook'a istekte bulunmayı deneyelim
          response = await fetch('https://alpleo.app.n8n.cloud/webhook/4f15a278-a5c9-49f3-8324-18038dccb076', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(formData),
          });
        } catch (directError) {
          console.error('Doğrudan webhook isteği başarısız oldu, proxy kullanılıyor:', directError);
          
          // Doğrudan istek başarısız olursa, proxy API üzerinden deneyelim
          response = await fetch('/api/webhook-forwarder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: 'https://alpleo.app.n8n.cloud/webhook/4f15a278-a5c9-49f3-8324-18038dccb076',
              data: formData
            }),
          });
        }
        
        console.log("Webhook yanıtı:", response.status, response.statusText);
        
        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorData = await response.json();
            errorDetail = JSON.stringify(errorData);
          } catch (e) {
            errorDetail = await response.text();
          }
          console.error('Webhook yanıt detayı:', errorDetail);
          throw new Error(`Webhook yanıtı başarısız: ${response.status} ${response.statusText} - ${errorDetail}`);
        }
        
        // Yanıtı al
        let responseData;
        try {
          responseData = await response.json();
          console.log("Webhook başarılı yanıt:", responseData);
        } catch (e) {
          const textResponse = await response.text();
          console.log("Webhook yanıtı JSON olarak ayrıştırılamadı, ham yanıt:", textResponse);
          responseData = { message: "Yanıt alındı, ancak JSON formatında değil" };
        }
        
        // Başarılı işlem
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        
        // Formu sıfırla
        setReceteAdi('');
        setMarka('');
        setBilesenler([]);
      } finally {
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Form gönderilirken detaylı hata:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Ağ bağlantı hatası: Sunucuya erişilemiyor. İnternet bağlantınızı kontrol edin.');
      } else {
        alert(`Form gönderilirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }
    }
  };

  const totalPercentage = calculateTotalPercentage();
  
  // Yükleme durumunda gösterilecek içerik
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Veriler yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Hata durumunda gösterilecek içerik
  if (errorMessage) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full py-12">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bir hata oluştu</h3>
            <p className="text-gray-600">{errorMessage}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => loadData()}
            >
              Yeniden Dene
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Başlık */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-2" size={24} />
            Reçete ve Formülasyon Kaydı
          </h1>
          <p className="text-gray-600">
            Yeni reçete ve formülasyonlarınızı kaydetmek için bu formu kullanabilirsiniz.
          </p>
        </div>
        
        {/* Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            {/* Reçete Adı */}
            <div className="mb-4">
              <label htmlFor="receteAdi" className="block text-sm font-medium text-gray-700 mb-1">
                Reçete Adı
              </label>
              <input
                type="text"
                id="receteAdi"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Reçete adını giriniz"
                value={receteAdi}
                onChange={(e) => setReceteAdi(e.target.value)}
              />
            </div>
            
            {/* Marka Seçimi */}
            <div className="mb-6">
              <label htmlFor="marka" className="block text-sm font-medium text-gray-700 mb-1">
                Marka
              </label>
              <div className="marka-dropdown-container relative">
                <button
                  type="button"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 flex justify-between items-center"
                  onClick={toggleMarkaDropdown}
                >
                  <span>{marka || "Marka seçiniz"}</span>
                  <Search size={16} className="text-gray-400" />
                </button>
                
                {showMarkaDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm overflow-auto border border-gray-300">
                    <div className="sticky top-0 p-2 bg-white border-b">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Marka veya müşteri adı ile ara..."
                        value={markaSearchTerm}
                        onChange={handleMarkaSearch}
                      />
                    </div>
                    
                    {filteredMarkalar.length > 0 ? (
                      filteredMarkalar.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectMarka(item)}
                        >
                          <div className="font-medium">{item['Marka']}</div>
                          <div className="text-xs text-gray-500">{item['Müşteri Firma']}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 italic text-center">
                        Sonuç bulunamadı
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bileşenler Başlık */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bileşenler</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                Math.abs(totalPercentage - 100) < 0.01 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                Toplam: {totalPercentage.toFixed(2)}%
              </div>
            </div>
            
            {/* Bileşenler Listesi */}
            <div className="space-y-3 mb-6">
              {bilesenler.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                  Henüz bileşen eklenmedi. Aşağıdaki buton ile bileşen ekleyebilirsiniz.
                </div>
              ) : (
                bilesenler.map((bilesen, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 p-3 bg-gray-50 rounded-md">
                    {/* Ürün Seçimi */}
                    <div className="flex-grow">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Bileşen
                      </label>
                      <div className="bilesen-dropdown-container relative">
                        <button
                          type="button"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          onClick={() => toggleDropdown(index)}
                        >
                          {bilesen.adi || "Bileşen seçiniz"}
                        </button>
                        
                        {activeDropdownIndex === index && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm overflow-auto border border-gray-300">
                            <div className="sticky top-0 p-2 bg-white border-b">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                placeholder="Ara..."
                                value={bilesenSearchTerm}
                                onChange={handleBilesenSearch}
                              />
                            </div>
                            
                            {filteredStokItems.length > 0 ? (
                              filteredStokItems.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => selectBilesen(index, item)}
                                >
                                  <div className="font-medium">{item['Hammadde Adı']}</div>
                                  <div className="text-xs text-gray-500">{item['Stok Kategori']}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 italic text-center">
                                Sonuç bulunamadı
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Kategori Gösterimi */}
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Kategori
                      </label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm">
                        {bilesen.kategori || "Kategori"}
                      </div>
                    </div>
                    
                    {/* Oran Girişi */}
                    <div className="w-full md:w-1/5">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Oran (%)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Oran"
                        min="0"
                        max="100"
                        step="0.01"
                        value={bilesen.oran}
                        onChange={(e) => updateComponent(index, 'oran', e.target.value)}
                      />
                    </div>
                    
                    {/* Silme Butonu */}
                    <div className="flex items-end md:w-auto">
                      <button
                        type="button"
                        className="w-full md:w-auto px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        onClick={() => removeComponent(index)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Bileşen Ekle Butonu */}
            <div className="mb-6">
              <button
                type="button"
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={addComponent}
              >
                <Plus size={18} className="mr-2" />
                Bileşen Ekle
              </button>
            </div>
            
            {/* Gönder Butonu */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium"
              >
                Formu Gönder
              </button>
            </div>
          </form>
        </div>
        
        {/* Bildirim */}
        <div className={`fixed top-4 right-4 max-w-sm bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity duration-300 ${
          showNotification ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p>Yeni reçete ve formülasyonunuz kaydedilmiştir.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 