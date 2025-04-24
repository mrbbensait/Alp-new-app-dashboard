'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { PerformansRaporu } from '@/app/lib/types/index';
import TarihAralikSecici, { TarihAraligi } from '@/app/components/personel-performans/TarihAralikSecici';
import GrafikTurSecici, { GrafikTuru } from '@/app/components/personel-performans/GrafikTurSecici';
import PerformansGrafikleri from '@/app/components/personel-performans/PerformansGrafikleri';
import { 
  getSonHaftaTarihAraligi, 
  formatDateTR 
} from '@/app/utils/date-utils';
import PageGuard from '@/app/components/PageGuard';

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
    toplamIslem: 0
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
      toplamIslem: 0
    };
    
    // Toplam değerleri hesapla
    raporlar.forEach(rapor => {
      ozet.toplamDolum += rapor.dolum;
      ozet.toplamEtiketleme += rapor.etiketleme;
      ozet.toplamKutulama += rapor.kutulama;
      ozet.toplamSelefon += rapor.selefon;
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