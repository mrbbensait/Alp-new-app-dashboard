'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { PerformansRaporu, MaliyetFiyat } from '@/app/lib/types/index';
import TarihAralikSecici, { TarihAraligi } from '@/app/components/personel-performans/TarihAralikSecici';
import GrafikTurSecici, { GrafikTuru } from '@/app/components/personel-performans/GrafikTurSecici';
import PerformansGrafikleri from '@/app/components/personel-performans/PerformansGrafikleri';
import KarZararGrafikleri from '@/app/components/personel-performans/KarZararGrafikleri';
import { 
  getBugununTarihi, 
  getSonHaftaTarihAraligi, 
  getSonAyTarihAraligi, 
  formatDateTR 
} from '@/app/utils/date-utils';
import { 
  hesaplaRaporToplamMaliyet, 
  hesaplaRaporToplamGelir, 
  hesaplaRaporToplamKar,
  enKarliIslemTuru
} from '@/app/utils/hesaplamalar';

export default function PersonelPerformansPage() {
  // Durum değişkenleri
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>('');
  const [bitisTarihi, setBitisTarihi] = useState<string>('');
  const [tarihAraligi, setTarihAraligi] = useState<TarihAraligi>('haftalik');
  const [performansGrafikTuru, setPerformansGrafikTuru] = useState<GrafikTuru>('cizgi');
  const [karZararGrafikTuru, setKarZararGrafikTuru] = useState<GrafikTuru>('cizgi');
  
  const [raporlar, setRaporlar] = useState<PerformansRaporu[]>([]);
  const [maliyetFiyatlar, setMaliyetFiyatlar] = useState<MaliyetFiyat[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hata, setHata] = useState<string>('');
  const [duzenlemeModu, setDuzenlemeModu] = useState<boolean>(false);
  const [guncelMaliyetFiyatlar, setGuncelMaliyetFiyatlar] = useState<MaliyetFiyat[]>([]);
  
  // Gösterilen veri seçenekleri - AYRILDI
  // const [gosterilecekVeriler, setGosterilecekVeriler] = useState({
  //   dolum: false,
  //   etiketleme: false,
  //   kutulama: false,
  //   selefon: false,
  //   toplam: true,
  //   kar: false // Bu alanın ne işe yaradığı belirsiz, şimdilik kaldırıldı/yorum satırına alındı.
  // });

  const [gosterilecekPerformansVerileri, setGosterilecekPerformansVerileri] = useState({
    dolum: false,
    etiketleme: false,
    kutulama: false,
    selefon: false,
    toplam: true,
  });

  const [gosterilecekKarZararVerileri, setGosterilecekKarZararVerileri] = useState({
    dolum: false,
    etiketleme: false,
    kutulama: false,
    selefon: false,
    toplam: true,
  });
  
  // Renk eşleştirmesi için yardımcı nesne
  const veriRenkleri: Record<string, { bg: string; text: string; hoverBg: string }> = {
    dolum: { bg: 'bg-blue-500', text: 'text-white', hoverBg: 'hover:bg-blue-600' },
    etiketleme: { bg: 'bg-teal-500', text: 'text-white', hoverBg: 'hover:bg-teal-600' }, // Yeşil yerine Teal kullandım (Chart.js ile daha uyumlu)
    kutulama: { bg: 'bg-red-500', text: 'text-white', hoverBg: 'hover:bg-red-600' },
    selefon: { bg: 'bg-orange-500', text: 'text-white', hoverBg: 'hover:bg-orange-600' },
    toplam: { bg: 'bg-purple-600', text: 'text-white', hoverBg: 'hover:bg-purple-700' },
    varsayilan_secili: { bg: 'bg-gray-700', text: 'text-white', hoverBg: 'hover:bg-gray-800' }, // Genel seçili stil
    varsayilan_secili_degil: { bg: 'bg-gray-200', text: 'text-gray-700', hoverBg: 'hover:bg-gray-300' },
  };
  
  // Performans özeti verileri
  const [performansOzeti, setPerformansOzeti] = useState({
    toplamDolum: 0,
    toplamEtiketleme: 0,
    toplamKutulama: 0,
    toplamSelefon: 0,
    toplamIslem: 0,
    toplamMaliyet: 0,
    toplamGelir: 0,
    toplamKar: 0
  });
  
  // Sayfa yüklendiğinde varsayılan tarih aralığı (son 7 gün) için verileri getir
  useEffect(() => {
    const [baslangic, bitis] = getSonHaftaTarihAraligi();
    setBaslangicTarihi(baslangic);
    setBitisTarihi(bitis);
    
    // Verileri getir
    verileriGetir(baslangic, bitis);
  }, []);
  
  // Performans verilerini API'den getir
  const verileriGetir = async (baslangic: string, bitis: string) => {
    setIsLoading(true);
    setHata('');
    
    try {
      // Performans raporlarını getir
      const raporResponse = await fetch(`/api/performans?baslangic_tarihi=${baslangic}&bitis_tarihi=${bitis}`);
      
      if (!raporResponse.ok) {
        throw new Error('Performans verileri alınamadı');
      }
      
      const raporData = await raporResponse.json();
      
      // Maliyet ve fiyat verilerini getir
      const maliyetResponse = await fetch('/api/maliyet-fiyat?aktif=true');
      
      if (!maliyetResponse.ok) {
        throw new Error('Maliyet ve fiyat bilgileri alınamadı');
      }
      
      const maliyetData = await maliyetResponse.json();
      
      if (raporData.success && maliyetData.success) {
        const raporlar = raporData.data as PerformansRaporu[];
        const maliyetFiyatlar = maliyetData.data as MaliyetFiyat[];
        
        setRaporlar(raporlar);
        setMaliyetFiyatlar(maliyetFiyatlar);
        
        // Performans özetini hesapla
        hesaplaPerformansOzeti(raporlar, maliyetFiyatlar);
      } else {
        throw new Error('Veri alınırken bir hata oluştu');
      }
    } catch (error) {
      console.error('Veri alınırken hata:', error);
      setHata('Veriler alınırken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Performans özeti hesaplama fonksiyonu
  const hesaplaPerformansOzeti = (
    raporlar: PerformansRaporu[],
    maliyetFiyatlar: MaliyetFiyat[]
  ) => {
    const ozet = {
      toplamDolum: 0,
      toplamEtiketleme: 0,
      toplamKutulama: 0,
      toplamSelefon: 0,
      toplamIslem: 0,
      toplamMaliyet: 0,
      toplamGelir: 0,
      toplamKar: 0
    };
    
    // Toplam değerleri hesapla
    raporlar.forEach(rapor => {
      ozet.toplamDolum += rapor.dolum;
      ozet.toplamEtiketleme += rapor.etiketleme;
      ozet.toplamKutulama += rapor.kutulama;
      ozet.toplamSelefon += rapor.selefon;
      
      ozet.toplamMaliyet += hesaplaRaporToplamMaliyet(rapor, maliyetFiyatlar);
      ozet.toplamGelir += hesaplaRaporToplamGelir(rapor, maliyetFiyatlar);
      ozet.toplamKar += hesaplaRaporToplamKar(rapor, maliyetFiyatlar);
    });
    
    // Toplam işlem sayısını hesapla
    ozet.toplamIslem = ozet.toplamDolum + ozet.toplamEtiketleme + ozet.toplamKutulama + ozet.toplamSelefon;
    
    setPerformansOzeti(ozet);
  };
  
  // Tarih aralığı değiştiğinde verileri güncelle
  const handleTarihAralikDegistir = (baslangic: string, bitis: string, aralikTur: TarihAraligi) => {
    setBaslangicTarihi(baslangic);
    setBitisTarihi(bitis);
    setTarihAraligi(aralikTur);
    
    // Yeni verileri getir
    verileriGetir(baslangic, bitis);
  };
  
  // Grafik türü değiştiğinde durumu güncelle
  const handlePerformansGrafikTuruDegistir = (yeniGrafikTuru: GrafikTuru) => {
    setPerformansGrafikTuru(yeniGrafikTuru);
  };

  const handleKarZararGrafikTuruDegistir = (yeniGrafikTuru: GrafikTuru) => {
    setKarZararGrafikTuru(yeniGrafikTuru);
  };
  
  // Gösterilecek verileri değiştir - AYRILDI
  // const handleGosterilecekVerileriDegistir = (alan: keyof typeof gosterilecekVeriler) => {
  //   setGosterilecekVeriler(onceki => ({
  //     ...onceki,
  //     [alan]: !onceki[alan]
  //   }));
  // };

  const handleGosterilecekPerformansVerileriDegistir = (alan: keyof typeof gosterilecekPerformansVerileri) => {
    setGosterilecekPerformansVerileri(onceki => ({
      ...onceki,
      [alan]: !onceki[alan]
    }));
  };

  const handleGosterilecekKarZararVerileriDegistir = (alan: keyof typeof gosterilecekKarZararVerileri) => {
    setGosterilecekKarZararVerileri(onceki => ({
      ...onceki,
      [alan]: !onceki[alan]
    }));
  };
  
  // En karlı işlem türünü bul
  const enKarliIslem = enKarliIslemTuru(raporlar, maliyetFiyatlar);
  
  // Birim maliyet ve fiyatları güncelle
  const handleMaliyetFiyatGuncelle = async () => {
    setIsLoading(true);
    setHata(''); // Hata mesajını sıfırla
    let basariliGuncelleme = true;

    try {
      // Değişen maliyet/fiyatları bul ve güncelleme isteklerini gönder
      const guncellemeIstekleri = guncelMaliyetFiyatlar
        .filter((guncel, index) => {
          // Orijinal maliyet/fiyat verisini bul
          const orijinal = maliyetFiyatlar.find(item => item.id === guncel.id);
          // Değişiklik olup olmadığını kontrol et
          return orijinal && (orijinal.birim_maliyet !== guncel.birim_maliyet || orijinal.birim_fiyat !== guncel.birim_fiyat);
        })
        .map(item => {
          return fetch('/api/maliyet-fiyat', { // Endpoint güncellendi
            method: 'PUT', // Metod güncellendi
            headers: {
              'Content-Type': 'application/json',
            },
            // Sadece id ve değişen alanları gönder
            body: JSON.stringify({
              id: item.id,
              birim_maliyet: item.birim_maliyet,
              birim_fiyat: item.birim_fiyat,
              // aktif: true, // Aktiflik durumu burada değiştirilmemeli
              // gecerlilik_tarih: new Date().toISOString() // Backend halledecek
            }),
          });
        });

      // Tüm güncelleme isteklerini paralel olarak çalıştır
      const sonuclar = await Promise.all(guncellemeIstekleri);

      // İsteklerin başarılı olup olmadığını kontrol et
      for (const response of sonuclar) {
        if (!response.ok) {
          basariliGuncelleme = false;
          const errorData = await response.json().catch(() => ({})); // Hata mesajını yakala
          console.error('Güncelleme hatası:', response.status, errorData);
          // Tek tek hataları göstermek yerine genel bir hata mesajı verilebilir
          // throw new Error(errorData.error || `Kayıt güncellenemedi (ID: ${response.url})`);
        }
      }

      if (basariliGuncelleme) {
        // Başarılı olursa state'i güncelle ve düzenleme modunu kapat
        setMaliyetFiyatlar(guncelMaliyetFiyatlar);
        setDuzenlemeModu(false);
        // Performans özetini tekrar hesapla
        hesaplaPerformansOzeti(raporlar, guncelMaliyetFiyatlar);
      } else {
        // Hata durumunda genel mesaj
        throw new Error('Bazı maliyet ve fiyat bilgileri güncellenirken hata oluştu.');
      }

    } catch (error: any) { // Hata tipini any olarak belirttik
      console.error('Veri güncellenirken hata:', error);
      setHata(error.message || 'Maliyet ve fiyat bilgileri güncellenirken bir hata oluştu.');
      // Hata durumunda, kullanıcının girdiği değerlerin kaybolmaması için
      // guncelMaliyetFiyatlar state'ini koru ve düzenleme modunu açık bırak.
      // setDuzenlemeModu(false); // Bu satır kaldırıldı
    } finally {
      setIsLoading(false);
    }
  };

  // Maliyet/fiyat değerlerini değiştir
  const handleMaliyetFiyatDegistir = (id: string, alan: 'birim_maliyet' | 'birim_fiyat', deger: number) => {
    const yeniMaliyetFiyatlar = guncelMaliyetFiyatlar.map(item => {
      if (item.id === id) {
        return { ...item, [alan]: deger };
      }
      return item;
    });
    
    setGuncelMaliyetFiyatlar(yeniMaliyetFiyatlar);
  };

  // Düzenleme modunu aç/kapat
  const toggleDuzenlemeModu = () => {
    if (!duzenlemeModu) {
      // Düzenleme modunu açarken güncel verileri kopyala
      setGuncelMaliyetFiyatlar([...maliyetFiyatlar]);
    }
    setDuzenlemeModu(!duzenlemeModu);
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Personel Performans Analizi</h1>
        
        {hata && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {hata}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <TarihAralikSecici 
              onTarihAralikiDegistir={handleTarihAralikDegistir}
              defaultAralik="haftalik"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sol Kolon - Performans Grafiği ve Özeti */}
              <div className="space-y-6">
                {/* Performans Grafiği */}
                <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Performans Grafiği</h2>
                    <GrafikTurSecici 
                      seciliGrafikTuru={performansGrafikTuru}
                      onGrafikTuruDegistir={handlePerformansGrafikTuruDegistir}
                    />
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <PerformansGrafikleri
                      raporlar={raporlar}
                      maliyetFiyatlar={maliyetFiyatlar}
                      grafikTuru={performansGrafikTuru}
                      baslangicTarihi={baslangicTarihi}
                      bitisTarihi={bitisTarihi}
                      gosterilecekVeriler={gosterilecekPerformansVerileri}
                    />
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {(Object.keys(gosterilecekPerformansVerileri) as Array<keyof typeof gosterilecekPerformansVerileri>).map((alan) => {
                      const renkStili = gosterilecekPerformansVerileri[alan]
                        ? veriRenkleri[alan] || veriRenkleri.varsayilan_secili
                        : veriRenkleri.varsayilan_secili_degil;
                      return (
                        <button
                          key={alan}
                          onClick={() => handleGosterilecekPerformansVerileriDegistir(alan)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${renkStili.bg} ${renkStili.text} ${renkStili.hoverBg}`}
                        >
                          {alan.charAt(0).toUpperCase() + alan.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Performans Özeti */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[260px] flex flex-col">
                  <h2 className="text-base font-medium text-gray-800 mb-3">Performans Özeti</h2>
                  
                  <div className="grid grid-cols-2 gap-5 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Toplam Dolum</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {performansOzeti.toplamDolum.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Toplam Etiketleme</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {performansOzeti.toplamEtiketleme.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Toplam Kutulama</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {performansOzeti.toplamKutulama.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Toplam Selefon</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {performansOzeti.toplamSelefon.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 mt-auto">
                    <p className="text-xs text-gray-600 mb-1">Toplam Yapılan İş</p>
                    <p className="text-xl font-bold text-blue-600">
                      {performansOzeti.toplamIslem.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Sağ Kolon - Kar/Zarar Grafiği ve Finansal Özet */}
              <div className="space-y-6">
                {/* Kar/Zarar Grafiği */}
                <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Kar/Zarar Grafiği (₺)</h2>
                    <GrafikTurSecici 
                      seciliGrafikTuru={karZararGrafikTuru}
                      onGrafikTuruDegistir={handleKarZararGrafikTuruDegistir}
                    />
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <KarZararGrafikleri
                      raporlar={raporlar}
                      maliyetFiyatlar={maliyetFiyatlar}
                      grafikTuru={karZararGrafikTuru}
                      baslangicTarihi={baslangicTarihi}
                      bitisTarihi={bitisTarihi}
                      gosterilecekVeriler={gosterilecekKarZararVerileri}
                    />
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {(Object.keys(gosterilecekKarZararVerileri) as Array<keyof typeof gosterilecekKarZararVerileri>).map((alan) => {
                      const renkStili = gosterilecekKarZararVerileri[alan]
                        ? veriRenkleri[alan] || veriRenkleri.varsayilan_secili
                        : veriRenkleri.varsayilan_secili_degil;
                      // Etiketleri belirle
                      const etiket = 
                        alan === 'dolum' ? 'Dolum Karı' :
                        alan === 'etiketleme' ? 'Etiketleme Karı' :
                        alan === 'kutulama' ? 'Kutulama Karı' :
                        alan === 'selefon' ? 'Selefon Karı' :
                        alan === 'toplam' ? 'Toplam Kar' : alan;
                      return (
                        <button
                          key={alan}
                          onClick={() => handleGosterilecekKarZararVerileriDegistir(alan)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${renkStili.bg} ${renkStili.text} ${renkStili.hoverBg}`}
                        >
                          {etiket}
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Finansal Özet */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[260px] flex flex-col">
                  <h2 className="text-base font-medium text-gray-800 mb-3">Finansal Özet</h2>
                  
                  <div className="grid grid-cols-2 gap-5 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Toplam Maliyet</p>
                      <p className="text-lg font-semibold text-red-600">
                        {performansOzeti.toplamMaliyet.toLocaleString()} €
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Toplam Gelir</p>
                      <p className="text-lg font-semibold text-green-600">
                        {performansOzeti.toplamGelir.toLocaleString()} €
                      </p>
                    </div>
                  </div>
                  
                  {enKarliIslem && (
                    <div className="border-t border-gray-200 pt-3 mb-4">
                      <p className="text-xs text-gray-600 mb-1">En Karlı İşçilik</p>
                      <p className="text-lg font-semibold text-green-700">
                        {enKarliIslem.islemTuru}: {enKarliIslem.toplamKar.toLocaleString()} €
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3 mt-auto">
                    <p className="text-xs text-gray-600 mb-1">Toplam Kar</p>
                    <p className="text-xl font-bold text-blue-600">
                      {performansOzeti.toplamKar.toLocaleString()} €
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md mb-8">
              <p className="font-medium mb-1">Rapor Bilgisi</p>
              <p className="text-sm">
                {formatDateTR(baslangicTarihi)} - {formatDateTR(bitisTarihi)} tarihleri arasındaki performans verilerini görüntülüyorsunuz.
              </p>
            </div>
            
            {/* Performans Raporları Tablosu */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Performans Raporları</h2>
              
              {raporlar.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>Seçilen tarih aralığında rapor bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dolum
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Etiketleme
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kutulama
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selefon
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Toplam İş
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Maliyet (€)
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gelir (€)
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kar (€)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {raporlar.map((rapor, index) => {
                        const maliyet = hesaplaRaporToplamMaliyet(rapor, maliyetFiyatlar);
                        const gelir = hesaplaRaporToplamGelir(rapor, maliyetFiyatlar);
                        const kar = hesaplaRaporToplamKar(rapor, maliyetFiyatlar);
                        const toplamIs = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatDateTR(rapor.tarih)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                              {rapor.dolum.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                              {rapor.etiketleme.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                              {rapor.kutulama.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                              {rapor.selefon.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium">
                              {toplamIs.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                              {maliyet.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                              {gelir.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                              <span className={kar >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                {kar.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Maliyet ve Fiyat Ayarları */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-800">İşlem Türü Maliyet ve Fiyat Bilgileri (EUR)</h2>
                <button
                  type="button"
                  onClick={toggleDuzenlemeModu}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {duzenlemeModu ? 'İptal Et' : 'Düzenle'}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlem Türü
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birim Maliyet (€)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birim Fiyat (€)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birim Kar (€)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Son Güncelleme
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(duzenlemeModu ? guncelMaliyetFiyatlar : maliyetFiyatlar).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.islem_turu.charAt(0).toUpperCase() + item.islem_turu.slice(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {duzenlemeModu ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.birim_maliyet}
                              onChange={(e) => handleMaliyetFiyatDegistir(item.id, 'birim_maliyet', parseFloat(e.target.value))}
                              className="border border-gray-300 rounded-md px-2 py-1 w-24 text-right"
                            />
                          ) : (
                            item.birim_maliyet.toFixed(2)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {duzenlemeModu ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.birim_fiyat}
                              onChange={(e) => handleMaliyetFiyatDegistir(item.id, 'birim_fiyat', parseFloat(e.target.value))}
                              className="border border-gray-300 rounded-md px-2 py-1 w-24 text-right"
                            />
                          ) : (
                            item.birim_fiyat.toFixed(2)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={item.birim_fiyat - item.birim_maliyet > 0 ? 'text-green-600' : 'text-red-600'}>
                            {(item.birim_fiyat - item.birim_maliyet).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.gecerlilik_tarih).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {duzenlemeModu && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleMaliyetFiyatGuncelle}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 