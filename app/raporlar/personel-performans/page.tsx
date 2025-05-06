'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { PerformansRaporu } from '@/app/lib/types/index';
import TarihAralikSecici, { TarihAraligi } from '@/app/components/personel-performans/TarihAralikSecici';
import GrafikTurSecici, { GrafikTuru } from '@/app/components/personel-performans/GrafikTurSecici';
import PerformansGrafikleri from '@/app/components/personel-performans/PerformansGrafikleri';
import { 
  getSonHaftaTarihAraligi,
  getSon30GunTarihAraligi, 
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
  const [tarihAraligi, setTarihAraligi] = useState<TarihAraligi>('son30gun');
  const [performansGrafikTuru, setPerformansGrafikTuru] = useState<GrafikTuru>('cizgi');
  
  const [raporlar, setRaporlar] = useState<PerformansRaporu[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hata, setHata] = useState<string>('');

  // Gerçek performans değerlendirmesi verileri (tarih filtrelemesinden bağımsız)
  const [performansDegerlendirmesi, setPerformansDegerlendirmesi] = useState({
    bugunPerformans: 0,
    dunkuPerformans: 0,
    haftaPerformans: 0,
    gecenHaftaPerformans: 0,
    gecenAyPerformans: 0
  });
  
  // Performans değerlendirmesinin yüklenme durumu
  const [performansDegerlendirmesiYuklendi, setPerformansDegerlendirmesiYuklendi] = useState<boolean>(false);

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
  
  // Sayfa yüklendiğinde varsayılan tarih aralığı (son 30 gün) için verileri getir
  useEffect(() => {
    const [baslangic, bitis] = getSon30GunTarihAraligi();
    setBaslangicTarihi(baslangic);
    setBitisTarihi(bitis);
    
    // Verileri getir
    verileriGetir(baslangic, bitis);
    
    // Performans değerlendirmesi verilerini getir (bu sadece bir kez çalışacak)
    if (!performansDegerlendirmesiYuklendi) {
      performansDegerlendirmesiVerileriniGetir();
    }
  }, [performansDegerlendirmesiYuklendi]);
  
  // Performans değerlendirmesi verilerini getir (tarih filtrelemesinden bağımsız)
  const performansDegerlendirmesiVerileriniGetir = async () => {
    try {
      // Bugün, dün ve diğer dönemler için tarih hesaplamaları
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);
      
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      
      // Pazartesi gününü hesapla (bu hafta için)
      const bugunGun = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ...
      const pazartesiGunu = new Date(bugun);
      const gunFarki = bugunGun === 0 ? 6 : bugunGun - 1; // Pazar günü için 6 gün geriye git, diğer günler için güncel gün - 1
      pazartesiGunu.setDate(bugun.getDate() - gunFarki);
      pazartesiGunu.setHours(0, 0, 0, 0);
      
      // Geçen haftanın pazartesi ve pazar günlerini hesapla
      const gecenHaftaPazartesi = new Date(pazartesiGunu);
      gecenHaftaPazartesi.setDate(gecenHaftaPazartesi.getDate() - 7);
      
      const gecenHaftaPazar = new Date(pazartesiGunu);
      gecenHaftaPazar.setDate(gecenHaftaPazar.getDate() - 1);
      
      // Geçen ayın başlangıç ve bitiş tarihlerini hesapla
      const gecenAyinIlkGunu = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
      const gecenAyinSonGunu = new Date(bugun.getFullYear(), bugun.getMonth(), 0);
      
      // Tarih formatına çevir
      const bugunStr = formatDate(bugun);
      const dunStr = formatDate(dun);
      const pazartesiStr = formatDate(pazartesiGunu);
      const gecenHaftaPazartesiStr = formatDate(gecenHaftaPazartesi);
      const gecenHaftaPazarStr = formatDate(gecenHaftaPazar);
      const gecenAyinIlkGunuStr = formatDate(gecenAyinIlkGunu);
      const gecenAyinSonGunuStr = formatDate(gecenAyinSonGunu);
      
      // Bu hafta, geçen hafta ve geçen ay için ayrı API istekleri yap
      const [bugunResponse, dunResponse, buHaftaResponse, gecenHaftaResponse, gecenAyResponse] = await Promise.all([
        fetch(`/api/performans?baslangic_tarihi=${bugunStr}&bitis_tarihi=${bugunStr}`),
        fetch(`/api/performans?baslangic_tarihi=${dunStr}&bitis_tarihi=${dunStr}`),
        fetch(`/api/performans?baslangic_tarihi=${pazartesiStr}&bitis_tarihi=${bugunStr}`),
        fetch(`/api/performans?baslangic_tarihi=${gecenHaftaPazartesiStr}&bitis_tarihi=${gecenHaftaPazarStr}`),
        fetch(`/api/performans?baslangic_tarihi=${gecenAyinIlkGunuStr}&bitis_tarihi=${gecenAyinSonGunuStr}`)
      ]);
      
      let bugunVerileri: PerformansRaporu[] = [];
      let dunVerileri: PerformansRaporu[] = [];
      let buHaftaVerileri: PerformansRaporu[] = [];
      let gecenHaftaVerileri: PerformansRaporu[] = [];
      let gecenAyVerileri: PerformansRaporu[] = [];
      
      if (bugunResponse.ok) {
        const bugunData = await bugunResponse.json();
        if (bugunData.success) {
          bugunVerileri = bugunData.data as PerformansRaporu[];
        }
      }
      
      if (dunResponse.ok) {
        const dunData = await dunResponse.json();
        if (dunData.success) {
          dunVerileri = dunData.data as PerformansRaporu[];
        }
      }
      
      if (buHaftaResponse.ok) {
        const buHaftaData = await buHaftaResponse.json();
        if (buHaftaData.success) {
          buHaftaVerileri = buHaftaData.data as PerformansRaporu[];
        }
      }
      
      if (gecenHaftaResponse.ok) {
        const gecenHaftaData = await gecenHaftaResponse.json();
        if (gecenHaftaData.success) {
          gecenHaftaVerileri = gecenHaftaData.data as PerformansRaporu[];
        }
      }
      
      if (gecenAyResponse.ok) {
        const gecenAyData = await gecenAyResponse.json();
        if (gecenAyData.success) {
          gecenAyVerileri = gecenAyData.data as PerformansRaporu[];
        }
      }
      
      // Performans değerlendirmesi hesaplamalarını yap
      const degerlendirme = {
        bugunPerformans: 0,
        dunkuPerformans: 0,
        haftaPerformans: 0,
        gecenHaftaPerformans: 0,
        gecenAyPerformans: 0
      };
      
      // Bugünkü performans hesaplama
      if (bugunVerileri.length > 0) {
        let bugunkuToplamIs = 0;
        bugunVerileri.forEach(rapor => {
          bugunkuToplamIs += rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
        });
        degerlendirme.bugunPerformans = (bugunkuToplamIs / 12500) * 100; // 12500 = %100 performans
      }
      
      // Dünkü performans hesaplama
      if (dunVerileri.length > 0) {
        let dunkuToplamIs = 0;
        dunVerileri.forEach(rapor => {
          dunkuToplamIs += rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
        });
        degerlendirme.dunkuPerformans = (dunkuToplamIs / 12500) * 100; // 12500 = %100 performans
      }
      
      // Bu hafta performans hesaplama
      if (buHaftaVerileri.length > 0) {
        const gunlukRaporlar = new Map<string, number>();
        
        buHaftaVerileri.forEach(rapor => {
          const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
          gunlukRaporlar.set(rapor.tarih, (gunlukRaporlar.get(rapor.tarih) || 0) + gunlukToplam);
        });
        
        let haftaToplamIs = 0;
        gunlukRaporlar.forEach((toplamIs) => {
          haftaToplamIs += toplamIs;
        });
        
        const gunSayisi = gunlukRaporlar.size;
        const haftaOrtalamaIs = gunSayisi > 0 ? haftaToplamIs / gunSayisi : 0;
        degerlendirme.haftaPerformans = (haftaOrtalamaIs / 12500) * 100; // 12500 = %100 performans
      }
      
      // Geçen hafta performans hesaplama
      if (gecenHaftaVerileri.length > 0) {
        const gunlukRaporlar = new Map<string, number>();
        
        gecenHaftaVerileri.forEach(rapor => {
          const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
          gunlukRaporlar.set(rapor.tarih, (gunlukRaporlar.get(rapor.tarih) || 0) + gunlukToplam);
        });
        
        let gecenHaftaToplamIs = 0;
        gunlukRaporlar.forEach((toplamIs) => {
          gecenHaftaToplamIs += toplamIs;
        });
        
        const gunSayisi = gunlukRaporlar.size;
        const gecenHaftaOrtalamaIs = gunSayisi > 0 ? gecenHaftaToplamIs / gunSayisi : 0;
        degerlendirme.gecenHaftaPerformans = (gecenHaftaOrtalamaIs / 12500) * 100;
      }
      
      // Geçen ay performans hesaplama
      if (gecenAyVerileri.length > 0) {
        const gunlukRaporlar = new Map<string, number>();
        
        gecenAyVerileri.forEach(rapor => {
          const gunlukToplam = rapor.dolum + rapor.etiketleme + rapor.kutulama + rapor.selefon;
          gunlukRaporlar.set(rapor.tarih, (gunlukRaporlar.get(rapor.tarih) || 0) + gunlukToplam);
        });
        
        let gecenAyToplamIs = 0;
        gunlukRaporlar.forEach((toplamIs) => {
          gecenAyToplamIs += toplamIs;
        });
        
        const gunSayisi = gunlukRaporlar.size;
        const gecenAyOrtalamaIs = gunSayisi > 0 ? gecenAyToplamIs / gunSayisi : 0;
        degerlendirme.gecenAyPerformans = (gecenAyOrtalamaIs / 12500) * 100;
      }
      
      // Context'i güncelle
      updatePerformansVerileri({
        dunkuPerformans: degerlendirme.dunkuPerformans,
        haftaPerformans: degerlendirme.haftaPerformans
      });
      
      // Performans değerlendirmesi state'ini güncelle
      setPerformansDegerlendirmesi(degerlendirme);
      setPerformansDegerlendirmesiYuklendi(true);
    } catch (error) {
      console.error('Performans değerlendirmesi verileri alınırken hata:', error);
    }
  };
  
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
      setPerformansOzeti({
        ...ozet,
        // Performans değerlendirmesi verilerini koru
        bugunPerformans: performansDegerlendirmesi.bugunPerformans,
        dunkuPerformans: performansDegerlendirmesi.dunkuPerformans,
        haftaPerformans: performansDegerlendirmesi.haftaPerformans,
        gecenHaftaPerformans: performansDegerlendirmesi.gecenHaftaPerformans,
        gecenAyPerformans: performansDegerlendirmesi.gecenAyPerformans
      });
      return;
    }
    
    // Toplam değerleri hesapla (Tarih aralığına göre)
    raporlar.forEach(rapor => {
      ozet.toplamDolum += rapor.dolum;
      ozet.toplamEtiketleme += rapor.etiketleme;
      ozet.toplamKutulama += rapor.kutulama;
      ozet.toplamSelefon += rapor.selefon;
    });
    
    // Toplam işlem sayısını hesapla
    ozet.toplamIslem = ozet.toplamDolum + ozet.toplamEtiketleme + ozet.toplamKutulama + ozet.toplamSelefon;
    
    // Performans değerlendirmesi verilerini özete aktar
    // Bu şekilde filtreleme değişikliklerinde bile Performans Değerlendirmesi verileri korunur
    ozet.bugunPerformans = performansDegerlendirmesi.bugunPerformans;
    ozet.dunkuPerformans = performansDegerlendirmesi.dunkuPerformans;
    ozet.haftaPerformans = performansDegerlendirmesi.haftaPerformans;
    ozet.gecenHaftaPerformans = performansDegerlendirmesi.gecenHaftaPerformans;
    ozet.gecenAyPerformans = performansDegerlendirmesi.gecenAyPerformans;
    
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
                defaultAralik="son30gun"
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
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${
                              performansOzeti.bugunPerformans >= 100 ? 'bg-green-400 text-green-900' : 
                              performansOzeti.bugunPerformans >= 90 ? 'bg-blue-400 text-blue-900' :
                              performansOzeti.bugunPerformans >= 80 ? 'bg-yellow-400 text-yellow-900' :
                              'bg-red-400 text-red-900'
                            }`}>
                              {performansOzeti.bugunPerformans >= 100 ? 'HEDEF BAŞARILDI' : 
                               performansOzeti.bugunPerformans >= 90 ? 'İYİ' : 
                               performansOzeti.bugunPerformans >= 80 ? 'ORTA' : 'DÜŞÜK'}
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
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${
                              performansOzeti.dunkuPerformans >= 100 ? 'bg-green-400 text-green-900' : 
                              performansOzeti.dunkuPerformans >= 90 ? 'bg-blue-400 text-blue-900' :
                              performansOzeti.dunkuPerformans >= 80 ? 'bg-yellow-400 text-yellow-900' :
                              'bg-red-400 text-red-900'
                            }`}>
                              {performansOzeti.dunkuPerformans >= 100 ? 'HEDEF BAŞARILDI' : 
                               performansOzeti.dunkuPerformans >= 90 ? 'İYİ' : 
                               performansOzeti.dunkuPerformans >= 80 ? 'ORTA' : 'DÜŞÜK'}
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
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${
                              performansOzeti.haftaPerformans >= 100 ? 'bg-green-400 text-green-900' : 
                              performansOzeti.haftaPerformans >= 90 ? 'bg-blue-400 text-blue-900' :
                              performansOzeti.haftaPerformans >= 80 ? 'bg-yellow-400 text-yellow-900' :
                              'bg-red-400 text-red-900'
                            }`}>
                              {performansOzeti.haftaPerformans >= 100 ? 'HEDEF BAŞARILDI' : 
                               performansOzeti.haftaPerformans >= 90 ? 'İYİ' : 
                               performansOzeti.haftaPerformans >= 80 ? 'ORTA' : 'DÜŞÜK'}
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
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${
                              performansOzeti.gecenHaftaPerformans >= 100 ? 'bg-green-400 text-green-900' : 
                              performansOzeti.gecenHaftaPerformans >= 90 ? 'bg-blue-400 text-blue-900' :
                              performansOzeti.gecenHaftaPerformans >= 80 ? 'bg-yellow-400 text-yellow-900' :
                              'bg-red-400 text-red-900'
                            }`}>
                              {performansOzeti.gecenHaftaPerformans >= 100 ? 'HEDEF BAŞARILDI' : 
                               performansOzeti.gecenHaftaPerformans >= 90 ? 'İYİ' : 
                               performansOzeti.gecenHaftaPerformans >= 80 ? 'ORTA' : 'DÜŞÜK'}
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
                            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${
                              performansOzeti.gecenAyPerformans >= 100 ? 'bg-green-400 text-green-900' : 
                              performansOzeti.gecenAyPerformans >= 90 ? 'bg-blue-400 text-blue-900' :
                              performansOzeti.gecenAyPerformans >= 80 ? 'bg-yellow-400 text-yellow-900' :
                              'bg-red-400 text-red-900'
                            }`}>
                              {performansOzeti.gecenAyPerformans >= 100 ? 'HEDEF BAŞARILDI' : 
                               performansOzeti.gecenAyPerformans >= 90 ? 'İYİ' : 
                               performansOzeti.gecenAyPerformans >= 80 ? 'ORTA' : 'DÜŞÜK'}
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