'use client';

import React, { useState, useEffect } from 'react';
import { createPage } from '../lib/createPage';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { format, subDays, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Check, FileText, Calendar, Filter, RefreshCw, Trash2, Search, ChevronDown, CheckCircle, AlertCircle,
  Edit, Save, Download, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import * as XLSX from 'xlsx';

// TeslimatGecmisi türü
interface TeslimatGecmisi {
  id: number;
  urun_id: number;
  teslimat_tarihi: string;
  teslimat_miktari: number;
  kullanici: string;
  created_at: string;
  teslimat_sekli: string;
  fatura_id: number | null;
  fatura_kesildi_mi: boolean;
  fatura_tarihi: string | null;
  notlar: string | null;
  urunBilgisi?: any; // Birleştirilmiş veri için
}

// BitmiUrunStok türü
interface BitmiUrunStok {
  id: number;
  "Reçete Adı": string;
  "Müşteri": string;
  "Ambalaj (ml)": number;
  "STOK / ADET": number;
  "Kalan Adet": number;
}

function TeslimatGecmisiIcerik() {
  // Durum değişkenleri
  const [teslimatlar, setTeslimatlar] = useState<TeslimatGecmisi[]>([]);
  const [filtrelenmisListeler, setFiltrelenmisListeler] = useState<TeslimatGecmisi[]>([]);
  const [musteriListesi, setMusteriListesi] = useState<string[]>([]);
  const [urunListesi, setUrunListesi] = useState<string[]>([]);
  const [personelListesi, setPersonelListesi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [seciliIDs, setSeciliIDs] = useState<number[]>([]);
  const [tumunuSec, setTumunuSec] = useState(false);
  const [bitmisUrunler, setBitmisUrunler] = useState<BitmiUrunStok[]>([]);
  
  // Filtreleme durumları
  const [baslangicTarihi, setBaslangicTarihi] = useState(() => {
    // Varsayılan olarak çok önceki bir tarih (tüm verileri göstermek için)
    return '1970-01-01';
  });
  
  const [bitisTarihi, setBitisTarihi] = useState(() => {
    // Varsayılan olarak bugün
    return format(new Date(), 'yyyy-MM-dd');
  });
  
  const [seciliMusteri, setSeciliMusteri] = useState<string>('');
  const [seciliUrun, setSeciliUrun] = useState<string>('');
  const [seciliPersonel, setSeciliPersonel] = useState<string>('');
  const [seciliTeslimatSekli, setSeciliTeslimatSekli] = useState<string>('');
  const [sadeceFaturaKesilmeyenler, setSadeceFaturaKesilmeyenler] = useState(false);
  const [yerlesimAcik, setYerlesimAcik] = useState(false);
  
  // Düzenleme için state değişkenleri ekleyelim
  const [duzenlemeModu, setDuzenlemeModu] = useState<number | null>(null);
  const [duzenlemeDegeri, setDuzenlemeDegeri] = useState<string>('');
  
  const { user } = useAuth();

  // Hızlı tarih ayarları
  const handleHizliTarihSecimi = (secenek: string) => {
    const bugun = new Date();
    
    switch (secenek) {
      case 'tum-veriler':
        setBaslangicTarihi('1970-01-01');
        setBitisTarihi(format(bugun, 'yyyy-MM-dd'));
        break;
      case 'bugun':
        setBaslangicTarihi(format(bugun, 'yyyy-MM-dd'));
        setBitisTarihi(format(bugun, 'yyyy-MM-dd'));
        break;
      case 'dun':
        const dun = subDays(bugun, 1);
        setBaslangicTarihi(format(dun, 'yyyy-MM-dd'));
        setBitisTarihi(format(dun, 'yyyy-MM-dd'));
        break;
      case 'bu-hafta':
        setBaslangicTarihi(format(startOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd'));
        setBitisTarihi(format(endOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd'));
        break;
      case 'gecen-hafta':
        const gecenHaftaBaslangic = subDays(startOfWeek(bugun, { locale: tr }), 7);
        const gecenHaftaBitis = subDays(endOfWeek(bugun, { locale: tr }), 7);
        setBaslangicTarihi(format(gecenHaftaBaslangic, 'yyyy-MM-dd'));
        setBitisTarihi(format(gecenHaftaBitis, 'yyyy-MM-dd'));
        break;
      case 'bu-ay':
        setBaslangicTarihi(format(startOfMonth(bugun), 'yyyy-MM-dd'));
        setBitisTarihi(format(endOfMonth(bugun), 'yyyy-MM-dd'));
        break;
      case 'gecen-ay':
        const gecenAyBaslangic = startOfMonth(new Date(bugun.getFullYear(), bugun.getMonth() - 1));
        const gecenAyBitis = endOfMonth(new Date(bugun.getFullYear(), bugun.getMonth() - 1));
        setBaslangicTarihi(format(gecenAyBaslangic, 'yyyy-MM-dd'));
        setBitisTarihi(format(gecenAyBitis, 'yyyy-MM-dd'));
        break;
      case 'son-7-gun':
        setBaslangicTarihi(format(subDays(bugun, 7), 'yyyy-MM-dd'));
        setBitisTarihi(format(bugun, 'yyyy-MM-dd'));
        break;
      case 'son-30-gun':
        setBaslangicTarihi(format(subDays(bugun, 30), 'yyyy-MM-dd'));
        setBitisTarihi(format(bugun, 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
  };

  // Tüm teslimat geçmişini getir ve bitmiş ürünlerle birleştir
  const fetchTeslimatGecmisi = async () => {
    setLoading(true);
    try {
      // Teslimat geçmişi verilerini çek
      const { data: teslimatData, error: teslimatError } = await supabase
        .from('TeslimatGecmisi')
        .select('*')
        .order('teslimat_tarihi', { ascending: false });

      if (teslimatError) throw teslimatError;
      
      // Bitmiş ürün stoğu verilerini çek
      const { data: bitmisUrunData, error: bitmisUrunError } = await supabase
        .from('Bitmiş Ürün Stoğu')
        .select('*');
        
      if (bitmisUrunError) throw bitmisUrunError;
      
      setBitmisUrunler(bitmisUrunData || []);
      
      // Teslimat geçmişi ile bitmiş ürün verilerini birleştir
      const zenginlestirilmisTeslimatlar = teslimatData?.map(teslimat => {
        const urunBilgisi = bitmisUrunData?.find(urun => urun.id === teslimat.urun_id);
        return {
          ...teslimat,
          urunBilgisi
        };
      }) || [];
      
      setTeslimatlar(zenginlestirilmisTeslimatlar);
      setFiltrelenmisListeler(zenginlestirilmisTeslimatlar);
      
      // Filtre listelerini oluştur
      const musteriListesiArray = zenginlestirilmisTeslimatlar.map(t => t.urunBilgisi?.['Müşteri'] || 'Bilinmiyor').filter(Boolean);
      const urunListesiArray = zenginlestirilmisTeslimatlar.map(t => t.urunBilgisi?.['Reçete Adı'] || 'Bilinmiyor').filter(Boolean);
      const personelListesiArray = zenginlestirilmisTeslimatlar.map(t => t.kullanici).filter(Boolean);
      
      // Tekrar eden değerleri filtrele
      const musteriler = Array.from(new Set(musteriListesiArray));
      const urunler = Array.from(new Set(urunListesiArray));
      const personeller = Array.from(new Set(personelListesiArray));
      
      setMusteriListesi(musteriler);
      setUrunListesi(urunler);
      setPersonelListesi(personeller);
      
    } catch (error) {
      console.error('Teslimat geçmişi yüklenirken hata:', error);
      toast.error('Teslimat geçmişi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchTeslimatGecmisi();
  }, []);

  // Filtre değiştiğinde teslimatları filtrele
  useEffect(() => {
    filtreleTeslimatlar();
  }, [
    baslangicTarihi, 
    bitisTarihi, 
    seciliMusteri, 
    seciliUrun, 
    seciliPersonel, 
    seciliTeslimatSekli, 
    sadeceFaturaKesilmeyenler,
    teslimatlar
  ]);

  // Filtreleme fonksiyonu
  const filtreleTeslimatlar = () => {
    if (!teslimatlar.length) return;

    let filtrelenmisSonuclar = [...teslimatlar];
    
    // Tarih aralığına göre filtrele
    if (baslangicTarihi && bitisTarihi) {
      const baslangic = startOfDay(parseISO(baslangicTarihi));
      const bitis = endOfDay(parseISO(bitisTarihi));
      
      filtrelenmisSonuclar = filtrelenmisSonuclar.filter(teslimat => {
        const teslimatTarihi = new Date(teslimat.teslimat_tarihi);
        return teslimatTarihi >= baslangic && teslimatTarihi <= bitis;
      });
    }
    
    // Müşteriye göre filtrele
    if (seciliMusteri) {
      filtrelenmisSonuclar = filtrelenmisSonuclar.filter(teslimat => 
        teslimat.urunBilgisi?.['Müşteri'] === seciliMusteri
      );
    }
    
    // Ürüne göre filtrele
    if (seciliUrun) {
      filtrelenmisSonuclar = filtrelenmisSonuclar.filter(teslimat => 
        teslimat.urunBilgisi?.['Reçete Adı'] === seciliUrun
      );
    }
    
    // Personele göre filtrele
    if (seciliPersonel) {
      filtrelenmisSonuclar = filtrelenmisSonuclar.filter(teslimat => 
        teslimat.kullanici === seciliPersonel
      );
    }
    
    // Teslimat şekline göre filtrele
    if (seciliTeslimatSekli) {
      filtrelenmisSonuclar = filtrelenmisSonuclar.filter(teslimat => 
        teslimat.teslimat_sekli === seciliTeslimatSekli
      );
    }
    
    // Sadece faturası kesilmeyenleri filtrele
    if (sadeceFaturaKesilmeyenler) {
      filtrelenmisSonuclar = filtrelenmisSonuclar.filter(teslimat => 
        !teslimat.fatura_kesildi_mi
      );
    }
    
    setFiltrelenmisListeler(filtrelenmisSonuclar);
    
    // Filtrelemeden sonra seçimi sıfırla
    setSeciliIDs([]);
    setTumunuSec(false);
  };

  // Satır seçme işlemi
  const handleSatirSec = (id: number) => {
    setSeciliIDs(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Tümünü seçme işlemi
  const handleTumunuSec = () => {
    if (tumunuSec) {
      setSeciliIDs([]);
    } else {
      setSeciliIDs(filtrelenmisListeler.map(teslimat => teslimat.id));
    }
    setTumunuSec(!tumunuSec);
  };

  // Fatura durumunu güncelleme
  const handleFaturaDurumuGuncelle = async (idsToUpdate: number[], kesildi: boolean) => {
    try {
      const { error } = await supabase
        .from('TeslimatGecmisi')
        .update({ 
          fatura_kesildi_mi: kesildi,
          fatura_tarihi: kesildi ? new Date().toISOString() : null 
        })
        .in('id', idsToUpdate);
        
      if (error) throw error;
      
      toast.success(kesildi 
        ? 'Seçili teslimatlar faturası kesildi olarak işaretlendi' 
        : 'Seçili teslimatlar faturası kesilmedi olarak işaretlendi'
      );
      
      // Verileri yeniden yükle
      await fetchTeslimatGecmisi();
      
      // Seçimi temizle
      setSeciliIDs([]);
      setTumunuSec(false);
      
    } catch (error) {
      console.error('Fatura durumu güncellenirken hata:', error);
      toast.error('Fatura durumu güncellenirken bir hata oluştu');
    }
  };
  
  // Tarih formatlama
  const formatTarih = (tarih: string) => {
    try {
      return format(new Date(tarih), 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (e) {
      return 'Geçersiz tarih';
    }
  };
  
  // Rakam formatlama
  const formatRakam = (sayi: number) => {
    return new Intl.NumberFormat('tr-TR').format(sayi);
  };
  
  // Filtreleri temizle
  const handleFiltreleriTemizle = () => {
    setSeciliMusteri('');
    setSeciliUrun('');
    setSeciliPersonel('');
    setSeciliTeslimatSekli('');
    setSadeceFaturaKesilmeyenler(false);
    
    // Tüm verileri göster
    setBaslangicTarihi('1970-01-01');
    setBitisTarihi(format(new Date(), 'yyyy-MM-dd'));
  };

  // Not düzenleme işlemi başlat
  const handleNotDuzenlemeBaslat = (id: number, mevcutNot: string | null) => {
    setDuzenlemeModu(id);
    setDuzenlemeDegeri(mevcutNot || '');
    // Event propagation'ı durdurmak için tıklamayı durdur (satır seçme işlemini engelle)
    event?.stopPropagation();
  };

  // Not düzenleme işlemi kaydet
  const handleNotKaydet = async (id: number) => {
    try {
      const { error } = await supabase
        .from('TeslimatGecmisi')
        .update({ notlar: duzenlemeDegeri })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Not başarıyla kaydedildi');
      
      // Verileri yeniden yükle
      await fetchTeslimatGecmisi();
      
    } catch (error) {
      console.error('Not güncellenirken hata:', error);
      toast.error('Not güncellenirken bir hata oluştu');
    } finally {
      // Düzenleme modunu kapat
      setDuzenlemeModu(null);
      setDuzenlemeDegeri('');
    }
    
    // Event propagation'ı durdurmak için tıklamayı durdur (satır seçme işlemini engelle)
    event?.stopPropagation();
  };

  // Düzenleme modundan çık
  const handleDuzenlemeCikis = () => {
    setDuzenlemeModu(null);
    setDuzenlemeDegeri('');
    
    // Event propagation'ı durdurmak için tıklamayı durdur (satır seçme işlemini engelle)
    event?.stopPropagation();
  };
  
  // Excel olarak dışa aktar
  const handleExcelExport = () => {
    try {
      // Excel verisini hazırla
      const excelData = filtrelenmisListeler.map(teslimat => ({
        'Fatura Durumu': teslimat.fatura_kesildi_mi ? 'Kesildi' : 'Kesilmedi',
        'Teslimat Tarihi': formatTarih(teslimat.teslimat_tarihi),
        'Müşteri': teslimat.urunBilgisi?.['Müşteri'] || 'Bilinmiyor',
        'Ürün Adı': teslimat.urunBilgisi?.['Reçete Adı'] || 'Bilinmiyor',
        'Miktar': teslimat.teslimat_miktari,
        'Personel': teslimat.kullanici || 'Bilinmiyor',
        'Teslimat Şekli': teslimat.teslimat_sekli || 'Belirtilmemiş',
        'Notlar': teslimat.notlar || ''
      }));
      
      // Excel çalışma kitabı oluştur
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Sütun genişliklerini ayarla
      const wscols = [
        {wch: 15}, // Fatura Durumu
        {wch: 20}, // Teslimat Tarihi
        {wch: 25}, // Müşteri
        {wch: 30}, // Ürün Adı
        {wch: 10}, // Miktar
        {wch: 15}, // Personel
        {wch: 15}, // Teslimat Şekli
        {wch: 30}  // Notlar
      ];
      worksheet['!cols'] = wscols;
      
      // Excel dosyasını oluştur
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teslimat Geçmişi');
      
      // Excel dosyasını indir
      const excelFileName = `Teslimat_Gecmisi_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(workbook, excelFileName);
      
      toast.success('Excel dosyası başarıyla indirildi');
    } catch (error) {
      console.error('Excel dışa aktarımı sırasında hata:', error);
      toast.error('Excel dışa aktarımı sırasında bir hata oluştu');
    }
  };

  return (
    <DashboardLayout pageTitle="Teslimat Geçmişi" pageSubtitle="Tüm teslimat kayıtlarını görüntüleyin ve fatura durumlarını yönetin">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold">Teslimat Geçmişi</h1>
          <div className="flex space-x-2">
            <button 
              onClick={handleExcelExport}
              className="flex items-center px-3 py-1.5 border border-green-500 text-green-600 rounded-md text-sm font-medium bg-white hover:bg-green-50"
              disabled={filtrelenmisListeler.length === 0}
            >
              <Download size={16} className="mr-1" />
              Excel'e Aktar
            </button>
            <button 
              onClick={() => fetchTeslimatGecmisi()}
              className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-1" />
              Yenile
            </button>
            <button 
              onClick={() => setYerlesimAcik(!yerlesimAcik)}
              className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter size={16} className="mr-1" />
              Filtreler {yerlesimAcik ? '▲' : '▼'}
            </button>
          </div>
        </div>
        
        {/* Filtre Paneli */}
        {yerlesimAcik && (
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input 
                  type="date" 
                  value={baslangicTarihi}
                  onChange={(e) => setBaslangicTarihi(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <input 
                  type="date" 
                  value={bitisTarihi}
                  onChange={(e) => setBitisTarihi(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                <select 
                  value={seciliMusteri}
                  onChange={(e) => setSeciliMusteri(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tüm Müşteriler</option>
                  {musteriListesi.map((musteri, index) => (
                    <option key={index} value={musteri}>{musteri}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün</label>
                <select 
                  value={seciliUrun}
                  onChange={(e) => setSeciliUrun(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tüm Ürünler</option>
                  {urunListesi.map((urun, index) => (
                    <option key={index} value={urun}>{urun}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personel</label>
                <select 
                  value={seciliPersonel}
                  onChange={(e) => setSeciliPersonel(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tüm Personeller</option>
                  {personelListesi.map((personel, index) => (
                    <option key={index} value={personel}>{personel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teslimat Şekli</label>
                <select 
                  value={seciliTeslimatSekli}
                  onChange={(e) => setSeciliTeslimatSekli(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Tüm Teslimat Şekilleri</option>
                  <option value="Elden">Elden</option>
                  <option value="Kargo">Kargo</option>
                  <option value="Ambar">Ambar</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={sadeceFaturaKesilmeyenler}
                    onChange={(e) => setSadeceFaturaKesilmeyenler(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sadece faturası kesilmeyenler</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFiltreleriTemizle}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Trash2 size={16} className="mr-1" />
                  Filtreleri Temizle
                </button>
              </div>
            </div>
            
            {/* Hızlı tarih seçimi */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Hızlı Tarih Seçimi</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleHizliTarihSecimi('tum-veriler')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Tüm Veriler
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('bugun')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Bugün
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('dun')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Dün
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('bu-hafta')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Bu Hafta
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('gecen-hafta')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Geçen Hafta
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('bu-ay')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Bu Ay
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('gecen-ay')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Geçen Ay
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('son-7-gun')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Son 7 Gün
                </button>
                <button
                  onClick={() => handleHizliTarihSecimi('son-30-gun')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50"
                >
                  Son 30 Gün
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* İşlem Butonları */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                disabled={seciliIDs.length === 0}
                onClick={() => handleFaturaDurumuGuncelle(seciliIDs, true)}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                  seciliIDs.length === 0 
                    ? 'cursor-not-allowed bg-gray-200 text-gray-500' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Check size={16} className="mr-1" />
                Faturası Kesildi İşaretle
              </button>
              <button
                disabled={seciliIDs.length === 0}
                onClick={() => handleFaturaDurumuGuncelle(seciliIDs, false)}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                  seciliIDs.length === 0 
                    ? 'cursor-not-allowed bg-gray-200 text-gray-500' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                <AlertCircle size={16} className="mr-1" />
                Faturası Kesilmedi İşaretle
              </button>
            </div>
            <div className="text-sm text-gray-700">
              {seciliIDs.length > 0 ? `${seciliIDs.length} teslimat seçildi` : ''}
            </div>
          </div>
        </div>
        
        {/* Teslimat Listesi */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : filtrelenmisListeler.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileText size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500">Teslimat kaydı bulunamadı</p>
              <p className="text-sm text-gray-400">Filtreleri değiştirerek tekrar deneyin</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={tumunuSec}
                      onChange={handleTumunuSec}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fatura
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teslimat Tarihi
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personel
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teslimat Şekli
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtrelenmisListeler.map((teslimat) => (
                  <tr 
                    key={teslimat.id} 
                    className={`hover:bg-gray-50 ${seciliIDs.includes(teslimat.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSatirSec(teslimat.id)}
                  >
                    <td className="px-2 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={seciliIDs.includes(teslimat.id)}
                        onChange={() => {}} // Satıra tıklama ile kontrol edilecek
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {teslimat.fatura_kesildi_mi ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} className="mr-1" />
                          Kesildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle size={14} className="mr-1" />
                          Kesilmedi
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatTarih(teslimat.teslimat_tarihi)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {teslimat.urunBilgisi?.['Müşteri'] || 'Bilinmiyor'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {teslimat.urunBilgisi?.['Reçete Adı'] || 'Bilinmiyor'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatRakam(teslimat.teslimat_miktari)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {teslimat.kullanici || 'Bilinmiyor'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {teslimat.teslimat_sekli || 'Belirtilmemiş'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {duzenlemeModu === teslimat.id ? (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={duzenlemeDegeri}
                            onChange={(e) => setDuzenlemeDegeri(e.target.value)}
                            className="border border-gray-300 p-1 rounded mr-2 text-sm w-full"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleNotKaydet(teslimat.id)}
                            className="text-green-500 hover:text-green-700 mr-1"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={handleDuzenlemeCikis}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span>{teslimat.notlar || '-'}</span>
                          <button 
                            onClick={() => handleNotDuzenlemeBaslat(teslimat.id, teslimat.notlar)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 ml-2"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Özet Bilgisi */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Toplam {filtrelenmisListeler.length} teslimat kaydı
            </div>
            <div className="flex space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Toplam Teslimat Miktarı:</span> {formatRakam(
                  filtrelenmisListeler.reduce((total, teslimat) => total + teslimat.teslimat_miktari, 0)
                )}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">Faturası Kesilmeyen:</span> {formatRakam(
                  filtrelenmisListeler.filter(t => !t.fatura_kesildi_mi).length
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// createPage kullanarak sayfa oluştur ve PageGuard'ı otomatik entegre et
export default createPage(TeslimatGecmisiIcerik, '/teslimat-gecmisi'); 