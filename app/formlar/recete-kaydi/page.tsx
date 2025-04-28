'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Plus, Trash2, Search } from 'lucide-react';
import { fetchAllFromTable, insertData } from '../../lib/supabase';
import PageGuard from '../../components/PageGuard';
import { useAuth } from '@/app/lib/AuthContext';
import { supabase } from '@/app/lib/supabase';

interface StokItem {
  'Hammadde Adı': string;
  'Stok Kategori': string;
  'Hammadde ID': string;
  'Birim': string;
  'kg_fiyat': number;
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
  birim?: string;
}

export default function ReceteKaydiPage() {
  const [receteAdi, setReceteAdi] = useState('');
  const [marka, setMarka] = useState('');
  const [satisFiyati, setSatisFiyati] = useState('');
  const [mlBilgisi, setMlBilgisi] = useState('');
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
  
  // Bileşen arama kutusu için ref
  const bilesenSearchInputRef = useRef<HTMLInputElement>(null);
  // Marka arama kutusu için ref
  const markaSearchInputRef = useRef<HTMLInputElement>(null);
  
  // API durumu için state
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kullanıcı rol bilgileri için state
  const [userRolBilgileri, setUserRolBilgileri] = useState<any>(null);
  const { user } = useAuth();

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

  // Kg Bulk Maliyet hesaplama (sadece Hammadde kategorisindekiler)
  const calculateKgBulkCost = () => {
    console.log("Bileşenler:", bilesenler);
    
    const bulkMaliyet = bilesenler
      .filter(b => b.kategori !== 'Ambalaj')
      .reduce((total, bilesen) => {
        // Her bileşenin kg_fiyat değerini stokItems içinde bul
        const stokItem = stokItems.find(item => item['Hammadde ID'] === bilesen.hammaddeId);
        const kgFiyat = stokItem ? stokItem['kg_fiyat'] || 0 : 0;
        const oran = parseFloat(bilesen.oran) || 0;
        
        console.log("Bileşen hesaplanıyor:", {
          adi: bilesen.adi,
          kategori: bilesen.kategori,
          oran: oran,
          kgFiyat: kgFiyat,
          bilesenMaliyeti: (oran / 100) * kgFiyat
        });
        
        // Bileşenin maliyetini hesapla (oran/100 * kg_fiyat)
        const bilesenMaliyeti = (oran / 100) * kgFiyat;
        
        return total + bilesenMaliyeti;
      }, 0);
    
    console.log("Toplam Kg Bulk Maliyet:", bulkMaliyet);
    return bulkMaliyet;
  };

  // 1 Adet Bulk Maliyet hesaplama
  const calculateBirAdetBulkMaliyet = () => {
    const kgBulkMaliyet = calculateKgBulkCost();
    const ml = parseFloat(mlBilgisi) || 0;
    
    console.log("Bulk maliyet hesaplanıyor:", { kgBulkMaliyet, ml });
    
    if (ml <= 0) return 0;
    
    const birAdetBulkMaliyet = (ml * kgBulkMaliyet) / 1000;
    console.log("1 Adet Bulk Maliyet:", birAdetBulkMaliyet);
    
    return birAdetBulkMaliyet;
  };

  // Ambalaj maliyeti (Y değeri) hesaplama
  const calculateAmbalajMaliyeti = () => {
    return bilesenler
      .filter(b => b.kategori === 'Ambalaj')
      .reduce((total, bilesen) => {
        const stokItem = stokItems.find(item => item['Hammadde ID'] === bilesen.hammaddeId);
        const kgFiyat = stokItem ? stokItem['kg_fiyat'] || 0 : 0;
        const oran = parseFloat(bilesen.oran) || 0;
        
        // Yeni hesaplama: Sadece oran x kg_fiyat
        const ambalajBilesenMaliyeti = oran * kgFiyat;
        return total + ambalajBilesenMaliyeti;
      }, 0);
  };

  // Kg Ambalajlı Maliyet hesaplama
  const calculateKgAmbalajliMaliyet = () => {
    const kgBulkMaliyet = calculateKgBulkCost();
    const ambalajMaliyeti = calculateAmbalajMaliyeti();
    return kgBulkMaliyet + ambalajMaliyeti;
  };

  // 1 Adet Ambalajlı Maliyet hesaplama
  const calculateBirAdetAmbalajliMaliyet = () => {
    // Yeni hesaplama: 1 Adet Bulk Maliyet + 1 Adet Ambalaj Maliyeti
    const birAdetBulkMaliyet = calculateBirAdetBulkMaliyet();
    const ambalajMaliyeti = calculateAmbalajMaliyeti();
    return birAdetBulkMaliyet + ambalajMaliyeti;
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
      hammaddeId: stokItem['Hammadde ID'],
      birim: stokItem['Birim']
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

  // Dropdown açıldığında arama kutusuna otomatik odaklanma
  useEffect(() => {
    if (activeDropdownIndex !== null && bilesenSearchInputRef.current) {
      setTimeout(() => {
        bilesenSearchInputRef.current?.focus();
      }, 50);
    }
  }, [activeDropdownIndex]);

  // Bileşen arama
  const handleBilesenSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setBilesenSearchTerm(term);
    
    if (term) {
      const searchTerm = term.toLowerCase();
      const filtered = stokItems.filter(
        item => item['Hammadde Adı'].toLowerCase().includes(searchTerm)
      );
      setFilteredStokItems(filtered);
    } else {
      setFilteredStokItems(stokItems);
    }
  };

  // Marka arama
  const handleMarkaSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setMarkaSearchTerm(term);
    
    if (term) {
      const searchTerm = term.toLowerCase();
      const filtered = markalar.filter(
        item => item['Marka'].toLowerCase().includes(searchTerm) || 
                item['Müşteri Firma'].toLowerCase().includes(searchTerm)
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

  // Marka dropdown'ı açıldığında arama kutusuna otomatik odaklanma
  useEffect(() => {
    if (showMarkaDropdown && markaSearchInputRef.current) {
      setTimeout(() => {
        markaSearchInputRef.current?.focus();
      }, 50);
    }
  }, [showMarkaDropdown]);

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
    
    if (!mlBilgisi.trim() || isNaN(parseFloat(mlBilgisi)) || parseFloat(mlBilgisi) <= 0) {
      alert('Lütfen geçerli bir ML bilgisi giriniz.');
      return;
    }
    
    if (userRolBilgileri?.recete_satis_bilgisi && (!satisFiyati.trim() || isNaN(parseFloat(satisFiyati)) || parseFloat(satisFiyati) <= 0)) {
      alert('Lütfen geçerli bir Birim Satış Fiyatı giriniz.');
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
      alert(`Bileşenlerin toplam oranı (Ambalaj kategorisi hariç) ${totalPercentage.toFixed(2)}% olarak hesaplandı. Lütfen toplamı %100 olacak şekilde düzenleyin.`);
      return;
    }
    
    try {
      console.log("Verileri Supabase'e kaydetmeye başlanıyor...");
      setIsLoading(true);
      
      try {
        // Reçete verileri - Reçeteler tablosuna kaydedilecek
        const receteVerileri = {
          'Reçete Adı': receteAdi,
          'Marka': marka,
          'ml_bilgisi': mlBilgisi,
          'birim_satis_fiyati': satisFiyati.trim() === '' ? 0 : parseFloat(satisFiyati),
          'Notlar': ''
        };
        
        console.log("Kaydedilecek Reçete verileri:", receteVerileri);
        
        // 1. Adım: Reçeteler tablosuna kayıt ekle ve eklenen kaydın bilgilerini al
        try {
          const receteSonuc = await insertData('Reçeteler', receteVerileri);
          console.log("insertData cevabı:", receteSonuc);
          
          if (!receteSonuc || receteSonuc.length === 0) {
            throw new Error('Reçete kaydı eklendi ancak eklenen kayıt bilgisine erişilemedi.');
          }
          
          const eklenenRecete = receteSonuc[0];
          console.log("Reçete kaydı başarıyla eklendi:", eklenenRecete);
          
          // 2. Adım: Eklenen reçetenin ID'si ve diğer bilgileriyle Formülasyonlar tablosuna kayıtlar ekle
          try {
            const receteId = eklenenRecete['Reçete ID'] || eklenenRecete.id.toString();
            console.log("Kullanılacak Reçete ID:", receteId);
            
            const formulasyonKayitlari = bilesenler.map(bilesen => ({
              'Reçete Adı': receteAdi,
              'Reçete ID': receteId,
              'Marka': marka,
              'Hammadde Adı': bilesen.adi,
              'Oran(100Kg)': parseFloat(bilesen.oran) || 0,
              'Birim': bilesen.birim || 'Kg',
              'Stok Kategori': bilesen.kategori || ''
            }));
            
            console.log("Kaydedilecek Formülasyon kayıtları:", formulasyonKayitlari);
            
            // Formülasyonlar tablosuna tüm bileşenleri ekle - sırayla ekleyelim
            for (const kayit of formulasyonKayitlari) {
              console.log("Formülasyon kaydı ekleniyor:", kayit);
              await insertData('Formülasyonlar', kayit);
            }
            
            console.log("Formülasyon kayıtları başarıyla eklendi");
            
            // Başarılı işlem
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            
            // Formu sıfırla
            setReceteAdi('');
            setMarka('');
            setSatisFiyati('');
            setMlBilgisi('');
            setBilesenler([]);
          } catch (formulasyonError: any) {
            console.error('Formülasyon kayıtları eklenirken hata:', formulasyonError);
            throw new Error(`Formülasyonlar tablosuna kayıt eklenirken hata: ${formulasyonError.message}`);
          }
        } catch (receteError: any) {
          console.error('Reçete kaydı eklenirken hata:', receteError);
          throw new Error(`Reçeteler tablosuna kayıt eklenirken hata: ${receteError.message}`);
        }
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
  const kgBulkMaliyet = calculateKgBulkCost();
  const birAdetBulkMaliyet = calculateBirAdetBulkMaliyet();
  const ambalajMaliyeti = calculateAmbalajMaliyeti();
  const kgAmbalajliMaliyet = calculateKgAmbalajliMaliyet();
  const birAdetAmbalajliMaliyet = calculateBirAdetAmbalajliMaliyet();
  
  // Kar yüzdesi hesaplama
  const calculateKarYuzdesi = (satisFiyati: number, maliyet: number) => {
    if (maliyet <= 0) return 0;
    return ((satisFiyati - maliyet) / maliyet) * 100;
  };

  // Kar hesaplamaları - Satış fiyatı 1 adet ambalajlı ürünün fiyatıdır
  const birAdetAmbalajliKarYuzdesi = calculateKarYuzdesi(parseFloat(satisFiyati) || 0, birAdetAmbalajliMaliyet);

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
    <PageGuard sayfaYolu="/formlar/recete-kaydi">
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 max-w-5xl flex">
          {/* Sol Taraf - Form */}
          <div className={`${userRolBilgileri?.recete_satis_bilgisi || userRolBilgileri?.recete_maliyet_bilgisi ? 'w-3/4' : 'w-3/4'} pr-6`}>
            {/* Başlık */}
            <div className="mb-3">
              <h1 className="text-xl font-bold text-gray-800 flex items-center">
                <FileText className="mr-2" size={20} />
                Reçete ve Formülasyon Kaydı
              </h1>
              <p className="text-sm text-gray-600">
                Yeni reçete ve formülasyonlarınızı kaydetmek için bu formu kullanabilirsiniz.
              </p>
            </div>
            
            {/* Form */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <form onSubmit={handleSubmit}>
                {/* Form üst kısmı - Reçete Adı ve Marka yan yana */}
                <div className="flex flex-col md:flex-row gap-3 mb-3">
                  {/* Reçete Adı */}
                  <div className="flex-1">
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
                  <div className="flex-1">
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
                              ref={markaSearchInputRef}
                              type="text"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder="Marka veya müşteri adı ile ara..."
                              value={markaSearchTerm}
                              onChange={handleMarkaSearch}
                            />
                          </div>
                          
                          {filteredMarkalar.length > 0 ? (
                            filteredMarkalar.map((item, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
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
                </div>
                
                {/* Bileşenler Başlık ve Toplam */}
                <div className="flex items-center justify-between mb-2 mt-3">
                  <h3 className="text-base font-medium text-gray-900">Bileşenler</h3>
                </div>
                
                {/* Bileşenler Listesi */}
                <div className="space-y-2 mb-3">
                  {bilesenler.length === 0 ? (
                    <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-md">
                      Henüz bileşen eklenmedi. Aşağıdaki buton ile bileşen ekleyebilirsiniz.
                    </div>
                  ) : (
                    bilesenler.map((bilesen, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-2 p-2 bg-gray-50 rounded-md">
                        {/* Ürün Seçimi */}
                        <div className="flex-grow">
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">
                            Bileşen
                          </label>
                          <div className="bilesen-dropdown-container relative">
                            <button
                              type="button"
                              className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              onClick={() => toggleDropdown(index)}
                            >
                              {bilesen.adi || "Bileşen seçiniz"}
                            </button>
                            
                            {activeDropdownIndex === index && (
                              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm overflow-auto border border-gray-300">
                                <div className="sticky top-0 p-2 bg-white border-b">
                                  <input
                                    ref={bilesenSearchInputRef}
                                    type="text"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Ara..."
                                    value={bilesenSearchTerm}
                                    onChange={handleBilesenSearch}
                                  />
                                </div>
                                
                                {filteredStokItems.length > 0 ? (
                                  filteredStokItems.map((item, itemIndex) => (
                                    <div
                                      key={itemIndex}
                                      className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => selectBilesen(index, item)}
                                    >
                                      <div className="font-medium">{item['Hammadde Adı']}</div>
                                      <div className="text-xs text-gray-500">
                                        {item['Stok Kategori']} • {item['Birim'] || 'Belirtilmemiş'}
                                      </div>
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
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">
                            Kategori
                          </label>
                          <div className="px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-sm">
                            {bilesen.kategori || "Kategori"}
                          </div>
                        </div>
                        
                        {/* Oran Girişi */}
                        <div className="w-full md:w-1/4">
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">
                            Oran (%)
                          </label>
                          <input
                            type="number"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                            className="w-full md:w-auto px-2 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            onClick={() => removeComponent(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Bileşen Ekle Butonu */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                    onClick={addComponent}
                  >
                    <Plus size={16} className="mr-1" />
                    Bileşen Ekle
                  </button>
                </div>
                
                {/* Gönder Butonu */}
                <div className="flex justify-between items-center">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    Math.abs(totalPercentage - 100) < 0.01 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Toplam: {totalPercentage.toFixed(2)}%
                  </div>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium text-sm"
                  >
                    Formu Gönder
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Sağ Taraf */}
          <div className="w-1/4">
            {/* Sağ taraftaki alanları içeren sticky container */}
            <div className="sticky top-4 space-y-4">
              {/* ML Bilgisi Alanı - Her zaman görünür */}
              <div className="bg-white shadow-md rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2">ML Bilgisi</h3>
                
                <div>
                  <label htmlFor="mlBilgisi" className="block text-xs font-medium text-gray-700 mb-0.5">
                    ML Değeri
                  </label>
                  <input
                    type="number"
                    id="mlBilgisi"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ML bilgisi giriniz"
                    min="1"
                    value={mlBilgisi}
                    onChange={(e) => setMlBilgisi(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Satış Bilgileri ve Maliyet Hesaplamaları - Rol yetkilerine göre göster/gizle */}
              {userRolBilgileri?.recete_satis_bilgisi && (
                <div className="bg-white shadow-md rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Satış Bilgileri</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center">
                        <label htmlFor="satisFiyati" className="text-xs font-medium text-gray-700">
                          Satış Fiyatı (Eur) - 1 Birim
                        </label>
                        {satisFiyati && birAdetAmbalajliMaliyet > 0 && (
                          <span className="text-xs text-green-600">
                            Kar: %{birAdetAmbalajliKarYuzdesi.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        id="satisFiyati"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mt-0.5"
                        placeholder="Birim satış fiyatı"
                        min="0"
                        step="0.01"
                        value={satisFiyati}
                        onChange={(e) => setSatisFiyati(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            
              {/* Maliyet Hesaplamaları - Rol yetkisine göre göster/gizle */}
              {userRolBilgileri?.recete_maliyet_bilgisi && (
                <div className="bg-white shadow-md rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Maliyet Hesaplamaları</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs font-medium text-gray-500">1Kg Bulk Maliyet:</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{kgBulkMaliyet.toFixed(2)} €</div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-medium text-gray-500">1 Adet Bulk Maliyet:</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {birAdetBulkMaliyet.toFixed(2)} € ({mlBilgisi}ml)
                      </div>
                    </div>
                    
                    <div className="pt-1 border-t">
                      <div className="text-xs font-medium text-gray-500">1 Adet Ambalaj Maliyeti:</div>
                      <div className="text-sm font-semibold text-gray-900">{ambalajMaliyeti.toFixed(2)} €</div>
                    </div>
                    
                    <div className="p-2 mt-2 bg-blue-50 border border-blue-100 rounded-md">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold text-blue-700">1 Adet Ambalajlı Maliyet:</div>
                        {satisFiyati && birAdetAmbalajliMaliyet > 0 && (
                          <div className="text-xs text-green-600 whitespace-nowrap">
                            Kar: %{birAdetAmbalajliKarYuzdesi.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="text-base font-bold text-blue-900">
                        {birAdetAmbalajliMaliyet.toFixed(2)} € <span className="text-sm font-normal">({mlBilgisi}ml)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bildirim */}
          <div className={`fixed top-16 right-4 max-w-sm bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity duration-300 z-50 ${
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
    </PageGuard>
  );
} 