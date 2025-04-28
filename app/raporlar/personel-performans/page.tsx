'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { PerformansRaporu } from '@/app/lib/types/index';
import TarihAralikSecici, { TarihAraligi } from '@/app/components/personel-performans/TarihAralikSecici';
import GrafikTurSecici, { GrafikTuru } from '@/app/components/personel-performans/GrafikTurSecici';
import PerformansGrafikleri from '@/app/components/personel-performans/PerformansGrafikleri';
import { 
  getSonHaftaTarihAraligi, 
  formatDateTR,
  getBugununTarihi,
  getTarihAraligi
} from '@/app/utils/date-utils';
import PageGuard from '@/app/components/PageGuard';
import { usePerformans } from '@/app/lib/PerformansContext';

export default function PersonelPerformansPage() {
  // Durum değişkenleri
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>('');
  const [bitisTarihi, setBitisTarihi] = useState<string>('');
  const [tarihAraligi, setTarihAraligi] = useState<TarihAraligi>('haftalik');
  const [performansGrafikTuru, setPerformansGrafikTuru] = useState<GrafikTuru>('cizgi');
  
  const [raporlar, setRaporlar] = useState<PerformansRaporu[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hata, setHata] = useState<string>('');

  const [gosterilecekPerformansVerileri, setGosterilecekPerformansVerileri] = useState({
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
    dunkuPerformans: 0,
    bugunPerformans: 0,
    haftaPerformans: 0,
    gecenHaftaPerformans: 0,
    gecenAyPerformans: 0
  });
  
  const { updatePerformansVerileri } = usePerformans();
  
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
      
      if (raporData.success) {
        const raporlar = raporData.data as PerformansRaporu[];
        setRaporlar(raporlar);
        
        // Performans özetini hesapla
        hesaplaPerformansOzeti(raporlar);
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
  const hesaplaPerformansOzeti = (raporlar: PerformansRaporu[]) => {
    const ozet = {
      toplamDolum: 0,
      toplamEtiketleme: 0,
      toplamKutulama: 0,
      toplamSelefon: 0,
      toplamIslem: 0,
      dunkuPerformans: 0,
      bugunPerformans: 0,
      haftaPerformans: 0,
      gecenHaftaPerformans: 0,
      gecenAyPerformans: 0
    };
    
    if (raporlar.length === 0) {
      setPerformansOzeti(ozet);
      return;
    }
    
    // Toplam değerleri hesapla
    raporlar.forEach(rapor => {
      ozet.toplamDolum += rapor.dolum;
      ozet.toplamEtiketleme += rapor.etiketleme;
      ozet.toplamKutulama += rapor.kutulama;
      ozet.toplamSelefon += rapor.selefon;
    });
    
    // Toplam işlem sayısını hesapla
    ozet.toplamIslem = ozet.toplamDolum + ozet.toplamEtiketleme + ozet.toplamKutulama + ozet.toplamSelefon;
    
    // Bugün ve dün için tarih oluştur
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    
    const dun = new Date(bugun);
    dun.setDate(dun.getDate() - 1);
    
    // Bugünkü performans hesaplama
    const bugunkuRaporlar = raporlar.filter(rapor => {
      const raporTarihi = new Date(rapor.tarih);
      raporTarihi.setHours(0, 0, 0, 0);
      return raporTarihi.getTime() === bugun.getTime();
    });
    
    if (bugunkuRaporlar.length > 0) {
      let bugunkuToplamIs = 0;
      bugunkuRaporlar.forEach(rapor => {
        bugunkuToplamIs += rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
      });
      ozet.bugunPerformans = (bugunkuToplamIs / 12500) * 100; // 12500 = %100 performans
    }
    
    // Dünkü performans hesaplama
    // API'den gelen tarihleri Date nesnesine çevirip karşılaştırma yapmak daha güvenli
    const dunkuRaporlar = raporlar.filter(rapor => {
      const raporTarihi = new Date(rapor.tarih);
      raporTarihi.setHours(0, 0, 0, 0);
      return raporTarihi.getTime() === dun.getTime();
    });
    
    if (dunkuRaporlar.length > 0) {
      let dunkuToplamIs = 0;
      dunkuRaporlar.forEach(rapor => {
        dunkuToplamIs += rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
      });
      ozet.dunkuPerformans = (dunkuToplamIs / 12500) * 100; // 12500 = %100 performans
    }
    
    // Bu haftaki performans hesaplama (Pazartesi-Bugün arası)
    // Pazartesi gününü hesapla
    const bugunGun = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ...
    const pazartesiGunu = new Date(bugun);
    const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1; // Pazar günü için 6 gün geriye git, diğer günler için güncel gün - 1
    pazartesiGunu.setDate(bugun.getDate() - gunFarki);
    pazartesiGunu.setHours(0, 0, 0, 0);
    
    // Haftanın başlangıcından itibaren raporları filtreleme
    const haftaRaporlari = raporlar.filter(rapor => {
      const raporTarihi = new Date(rapor.tarih);
      raporTarihi.setHours(0, 0, 0, 0);
      return raporTarihi >= pazartesiGunu && raporTarihi <= bugun;
    });
    
    if (haftaRaporlari.length > 0) {
      // Günlük ortalama iş sayısı
      const gunlukRaporlar = new Map<string, number>();
      
      haftaRaporlari.forEach(rapor => {
        const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
        gunlukRaporlar.set(rapor.tarih, gunlukToplam);
      });
      
      // Her gün için toplam
      let haftaToplamIs = 0;
      gunlukRaporlar.forEach((toplamIs) => {
        haftaToplamIs += toplamIs;
      });
      
      // Haftalık ortalama
      const gunSayisi = gunlukRaporlar.size;
      const haftaOrtalamaIs = gunSayisi > 0 ? haftaToplamIs / gunSayisi : 0;
      ozet.haftaPerformans = (haftaOrtalamaIs / 12500) * 100; // 12500 = %100 performans
    }
    
    // Geçen haftanın performansını hesaplama
    const gecenHaftaPazartesi = new Date(pazartesiGunu);
    gecenHaftaPazartesi.setDate(gecenHaftaPazartesi.getDate() - 7);
    
    const gecenHaftaPazar = new Date(pazartesiGunu);
    gecenHaftaPazar.setDate(gecenHaftaPazar.getDate() - 1);
    
    const gecenHaftaRaporlari = raporlar.filter(rapor => {
      const raporTarihi = new Date(rapor.tarih);
      raporTarihi.setHours(0, 0, 0, 0);
      return raporTarihi >= gecenHaftaPazartesi && raporTarihi <= gecenHaftaPazar;
    });
    
    if (gecenHaftaRaporlari.length > 0) {
      const gunlukRaporlar = new Map<string, number>();
      
      gecenHaftaRaporlari.forEach(rapor => {
        const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
        gunlukRaporlar.set(rapor.tarih, gunlukToplam);
      });
      
      let gecenHaftaToplamIs = 0;
      gunlukRaporlar.forEach((toplamIs) => {
        gecenHaftaToplamIs += toplamIs;
      });
      
      const gunSayisi = gunlukRaporlar.size;
      const gecenHaftaOrtalamaIs = gunSayisi > 0 ? gecenHaftaToplamIs / gunSayisi : 0;
      ozet.gecenHaftaPerformans = (gecenHaftaOrtalamaIs / 12500) * 100;
    }
    
    // Geçen ayın performansını hesaplama
    const birAyOnce = new Date(bugun);
    birAyOnce.setMonth(birAyOnce.getMonth() - 1);
    
    const gecenAyRaporlari = raporlar.filter(rapor => {
      const raporTarihi = new Date(rapor.tarih);
      raporTarihi.setHours(0, 0, 0, 0);
      
      // Aynı ay içindeki ve geçen aydaki raporları al
      return (
        raporTarihi.getMonth() === birAyOnce.getMonth() && 
        raporTarihi.getFullYear() === birAyOnce.getFullYear()
      );
    });
    
    if (gecenAyRaporlari.length > 0) {
      const gunlukRaporlar = new Map<string, number>();
      
      gecenAyRaporlari.forEach(rapor => {
        const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
        gunlukRaporlar.set(rapor.tarih, gunlukToplam);
      });
      
      let gecenAyToplamIs = 0;
      gunlukRaporlar.forEach((toplamIs) => {
        gecenAyToplamIs += toplamIs;
      });
      
      const gunSayisi = gunlukRaporlar.size;
      const gecenAyOrtalamaIs = gunSayisi > 0 ? gecenAyToplamIs / gunSayisi : 0;
      ozet.gecenAyPerformans = (gecenAyOrtalamaIs / 12500) * 100;
    }
    
    // Context'i güncelle
    updatePerformansVerileri({
      dunkuPerformans: ozet.dunkuPerformans,
      haftaPerformans: ozet.haftaPerformans
    });
    
    setPerformansOzeti(ozet);
  };
  
  // Bir tarih ile ilgili fonksiyon
  const formatDate = (date: Date): string => {
    const yil = date.getFullYear();
    const ay = String(date.getMonth() + 1).padStart(2, '0');
    const gun = String(date.getDate()).padStart(2, '0');
    return `${yil}-${ay}-${gun}`;
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

  const handleGosterilecekPerformansVerileriDegistir = (alan: keyof typeof gosterilecekPerformansVerileri) => {
    setGosterilecekPerformansVerileri(onceki => ({
      ...onceki,
      [alan]: !onceki[alan]
    }));
  };
  
  return (
    <PageGuard sayfaYolu="/raporlar/personel-performans">
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
                {/* Performans Grafiği */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col">
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
                  
                  {/* Performans Yüzde Bilgileri */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg mb-4 text-white shadow-md">
                    <h3 className="text-lg font-bold mb-3">Performans Değerlendirmesi</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Bugünkü Performans:</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold">
                            %{performansOzeti.bugunPerformans ? performansOzeti.bugunPerformans.toFixed(1) : '0.0'}
                          </p>
                          {performansOzeti.bugunPerformans > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${performansOzeti.bugunPerformans >= 100 ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                              {performansOzeti.bugunPerformans >= 100 ? 'Hedef Tamamlandı!' : 'Devam Ediyor'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Dünkü Performans:</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold">
                            %{performansOzeti.dunkuPerformans ? performansOzeti.dunkuPerformans.toFixed(1) : '0.0'}
                          </p>
                          {performansOzeti.dunkuPerformans > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${performansOzeti.dunkuPerformans >= 100 ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                              {performansOzeti.dunkuPerformans >= 100 ? 'Tamamlandı' : 'Eksik'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Bu Haftaki Performans:</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold">
                            %{performansOzeti.haftaPerformans ? performansOzeti.haftaPerformans.toFixed(1) : '0.0'}
                          </p>
                          {performansOzeti.haftaPerformans > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${performansOzeti.haftaPerformans >= 100 ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                              {performansOzeti.haftaPerformans >= 100 ? 'Tamamlandı' : 'Devam Ediyor'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Geçen Haftaki Performans:</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold">
                            %{performansOzeti.gecenHaftaPerformans ? performansOzeti.gecenHaftaPerformans.toFixed(1) : '0.0'}
                          </p>
                          {performansOzeti.gecenHaftaPerformans > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${performansOzeti.gecenHaftaPerformans >= 100 ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                              {performansOzeti.gecenHaftaPerformans >= 100 ? 'Tamamlandı' : 'Eksik'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium mb-1">Geçen Ayki Performans:</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold">
                            %{performansOzeti.gecenAyPerformans ? performansOzeti.gecenAyPerformans.toFixed(1) : '0.0'}
                          </p>
                          {performansOzeti.gecenAyPerformans > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${performansOzeti.gecenAyPerformans >= 100 ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'}`}>
                              {performansOzeti.gecenAyPerformans >= 100 ? 'Tamamlandı' : 'Eksik'}
                            </span>
                          )}
                        </div>
                      </div>
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {raporlar.map((rapor, index) => {
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </PageGuard>
  );
} 