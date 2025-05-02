'use client';

import React, { useState, useEffect } from 'react';
import { createPage } from '@/app/lib/createPage';
import { supabase, fetchAllFromTable } from '@/app/lib/supabase';
import { format, subDays, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BarChart, LineChart, PieChart, Calendar, Filter, RefreshCw, DollarSign, TrendingUp, TrendingDown, Download, Package, X
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Tarih aralığı türleri
type TarihAraligi = 'bugun' | 'dun' | 'haftalik' | 'aylik' | 'gecenay' | 'ozel';

// Grafik türü
type GrafikTuru = 'cizgi' | 'bar' | 'pasta' | 'alan';

// İşletme Giderleri Türü
interface IsletmeGideri {
  id: number;
  gider_adi: string;
  aylik_gider_tl: number;
  updated_at: string;
}

// Reçete türü
interface Recete {
  id: number;
  "Reçete Adı": string;
  "Marka": string;
  "Reçete ID": string;
  "Notlar": string | null;
  ml_bilgisi: number;
  birim_satis_fiyati: number;
  kg_bulk_maliyet: number;
  adet_bulk_maliyet: number;
  ambalaj_maliyeti: number;
  adet_ambalajli_maliyet: number;
}

// Üretim Kuyruğu türü
interface UretimKuyrugu {
  id: number;
  "Reçete Adı": string;
  "Reçete ID": string;
  "Üretim Emir Tarihi": string;
  "Müşteri": string;
  "Bulk Üretim Emri(Kg)": number;
  "Ambalaj Emri (ml)": number;
  "Beklenen Adet": number;
  "Gerçekleşen Adet": number;
  "Üretildiği Tarih": string;
}

// Teslimat Geçmişi türü
interface TeslimatGecmisi {
  id: number;
  urun_id: number;
  teslimat_tarihi: string;
  teslimat_miktari: number;
  kullanici: string;
  fatura_kesildi_mi: boolean;
  fatura_tarihi: string | null;
}

// Bitmiş Ürün Stoğu türü
interface BitmisUrunStogu {
  id: number;
  "Reçete Adı": string;
  "Reçete ID": string;
  "Müşteri": string;
  "Ambalaj (ml)": number;
  "Paketlendiği Tarih": string | null;
  "STOK / ADET": number;
  "Teslim Edilen": number;
  "Teslimat Tarihi": string | null;
  "Üretim Kuyruğu Referans": number | null;
  "Kalan Adet": number;
  uretim_tarihi?: string;
  son_guncelleme?: string;
}

// Ambalajlama Kayıtları türü
interface AmbalajlamaKaydi {
  id: number;
  uretim_kuyrugu_id: number;
  recete_adi: string;
  marka: string;
  musteri: string;
  ambalajlanan_adet: number;
  ambalajlama_tarihi: string;
  ml_bilgisi: number;
  birim_satis_fiyati: number;
  kg_bulk_maliyet: number;
  adet_bulk_maliyet: number;
  ambalaj_maliyeti: number;
  adet_ambalajli_maliyet: number;
  toplam_satis_degeri: number;
  toplam_maliyet: number;
  kar: number;
  kullanici: string;
}

// Stok Item türü
interface StokItem {
  ID: number;
  "Hammadde Adı": string;
  "Mevcut Stok": number;
  "Rezerve Edildi": number;
  "Net Stok": number;
  "Birim": string;
  "Stok Kategori": string;
  "Kritik Stok": number;
  "Hammadde ID": string;
  "Notlar": string;
  "CreatedTime": string;
  "kategori_detay": string;
  "kg_fiyat": number;
  [key: string]: any; // Dizin erişimi için
}

function MaliPerformansPage() {
  // Durum değişkenleri
  const [isLoading, setIsLoading] = useState(true);
  const [hata, setHata] = useState('');
  
  // Tarih aralığı için durum değişkenleri
  const [tarihAraligi, setTarihAraligi] = useState<TarihAraligi>('aylik');
  const [baslangicTarihi, setBaslangicTarihi] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [bitisTarihi, setBitisTarihi] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  // Grafik türü için durum değişkeni
  const [grafikTuru, setGrafikTuru] = useState<GrafikTuru>('cizgi');
  
  // Reçete filtreleme için durum değişkenleri
  const [filtreliReceteAdi, setFiltreliReceteAdi] = useState('');
  const [filtreliMarka, setFiltreliMarka] = useState('');
  const [filtreliMinMl, setFiltreliMinMl] = useState('');
  const [filtreliMaxMl, setFiltreliMaxMl] = useState('');

  // Bitmiş Ürün Stoğu filtreleme
  const [bitmisurunTarihAraligi, setBitmisurunTarihAraligi] = useState<TarihAraligi>('aylik');
  const [bitmisurunBaslangicTarihi, setBitmisurunBaslangicTarihi] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [bitmisurunBitisTarihi, setBitmisurunBitisTarihi] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtreBitmisUrunRecete, setFiltreBitmisUrunRecete] = useState('');
  const [filtreBitmisUrunMusteri, setFiltreBitmisUrunMusteri] = useState('');

  // Ambalajlama Kayıtları için durum değişkenleri
  const [ambalajlamaTarihAraligi, setAmbalajlamaTarihAraligi] = useState<TarihAraligi>('aylik');
  const [ambalajlamaBaslangicTarihi, setAmbalajlamaBaslangicTarihi] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [ambalajlamaBitisTarihi, setAmbalajlamaBitisTarihi] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtreAmbalajlamaRecete, setFiltreAmbalajlamaRecete] = useState('');
  const [filtreAmbalajlamaMusteri, setFiltreAmbalajlamaMusteri] = useState('');
  const [ambalajlamaKayitlari, setAmbalajlamaKayitlari] = useState<AmbalajlamaKaydi[]>([]);
  const [filtrelenmisAmbalajlamaKayitlari, setFiltrelenmisAmbalajlamaKayitlari] = useState<AmbalajlamaKaydi[]>([]);
  const [ambalajlamaToplamAdet, setAmbalajlamaToplamAdet] = useState(0);
  const [ambalajlamaToplamSatisDegeri, setAmbalajlamaToplamSatisDegeri] = useState(0);
  const [ambalajlamaToplamMaliyet, setAmbalajlamaToplamMaliyet] = useState(0);
  const [ambalajlamaToplamKar, setAmbalajlamaToplamKar] = useState(0);
  
  // Veriler için durum değişkenleri
  const [isletmeGiderleri, setIsletmeGiderleri] = useState<IsletmeGideri[]>([]);
  const [receteler, setReceteler] = useState<Recete[]>([]);
  const [uretimKuyrugu, setUretimKuyrugu] = useState<UretimKuyrugu[]>([]);
  const [teslimatGecmisi, setTeslimatGecmisi] = useState<TeslimatGecmisi[]>([]);
  const [bitmisUrunStogu, setBitmisUrunStogu] = useState<BitmisUrunStogu[]>([]);
  const [stokVerileri, setStokVerileri] = useState<StokItem[]>([]);
  const [filtrelenmisStokVerileri, setFiltrelenmisStokVerileri] = useState<StokItem[]>([]);
  const [filtreStokKategori, setFiltreStokKategori] = useState<string>('');
  const [filtreHammaddeAdi, setFiltreHammaddeAdi] = useState<string>('');
  const [stokArama, setStokArama] = useState<string>('');
  const [stokSiralama, setStokSiralama] = useState<string>('Hammadde Adı');
  const [stokSiralamaYonu, setStokSiralamaYonu] = useState<'asc' | 'desc'>('asc');
  
  // Stok değerleri için state'ler
  const [toplamMevcutStokDegeri, setToplamMevcutStokDegeri] = useState<number>(0);
  const [toplamNetStokDegeri, setToplamNetStokDegeri] = useState<number>(0);
  const [ambalajStokDegeri, setAmbalajStokDegeri] = useState<number>(0);
  const [hammaddeStokDegeri, setHammaddeStokDegeri] = useState<number>(0);
  const [filtrelenmisNetStokDegeri, setFiltrelenmisNetStokDegeri] = useState<number>(0);
  
  // Stok fiyatı güncelleme modal değişkenleri
  const [showStokFiyatModal, setShowStokFiyatModal] = useState<boolean>(false);
  const [stokModalArama, setStokModalArama] = useState<string>('');
  const [filtrelenmisModalStoklar, setFiltrelenmisModalStoklar] = useState<StokItem[]>([]);
  const [secilenStok, setSecilenStok] = useState<StokItem | null>(null);
  const [yeniFiyat, setYeniFiyat] = useState<string>('');
  const [fiyatGuncellemeLoading, setFiyatGuncellemeLoading] = useState<boolean>(false);
  
  // Reçete fiyatı güncelleme modal değişkenleri
  const [showReceteFiyatModal, setShowReceteFiyatModal] = useState<boolean>(false);
  const [receteModalArama, setReceteModalArama] = useState<string>('');
  const [filtrelenmisModalReceteler, setFiltrelenmisModalReceteler] = useState<Recete[]>([]);
  const [secilenRecete, setSecilenRecete] = useState<Recete | null>(null);
  const [yeniReceteFiyati, setYeniReceteFiyati] = useState<string>('');
  const [receteFiyatGuncellemeLoading, setReceteFiyatGuncellemeLoading] = useState<boolean>(false);
  
  // İşletme giderleri modalı için durum değişkenleri
  const [showIsletmeGideriModal, setShowIsletmeGideriModal] = useState(false);
  const [duzenlenecekGider, setDuzenlenecekGider] = useState<IsletmeGideri | null>(null);
  const [yeniGiderAdi, setYeniGiderAdi] = useState('');
  const [yeniGiderTutar, setYeniGiderTutar] = useState('');
  
  // Özet veriler için durum değişkenleri
  const [toplamGelir, setToplamGelir] = useState(0);
  const [toplamGider, setToplamGider] = useState(0);
  const [netKarZarar, setNetKarZarar] = useState(0);
  const [satisAdetleri, setSatisAdetleri] = useState(0);
  
  // İşletme giderleri için hesaplanan toplamlar
  const [toplamAylikIsletmeGideri, setToplamAylikIsletmeGideri] = useState(0);
  const [toplamGunlukIsletmeGideri, setToplamGunlukIsletmeGideri] = useState(0);
  const [dovizKuru, setDovizKuru] = useState(0.029); // 1 TRY = 0.029 EUR (varsayılan değer)
  const [isGunuSayisi, setIsGunuSayisi] = useState(0); // Seçilen tarih aralığındaki iş günü sayısı
  const [gercekNetKarZarar, setGercekNetKarZarar] = useState(0); // İşletme maliyeti düşülmüş net kar/zarar
  
  // Sabit iş günü sayısı - aylık 22 iş günü
  const SABIT_IS_GUNU_SAYISI = 22;
  
  // Günlük kar-zarar verileri
  const [gunlukKarZararVerileri, setGunlukKarZararVerileri] = useState<{[key: string]: number}>({});
  
  // Döviz kuru alınıyor (EUR/TRY)
  const getDovizKuru = async () => {
    try {
      // Döviz kuru API'si
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const data = await response.json();
      
      if (data && data.rates && data.rates.TRY) {
        // EUR/TRY çapraz kuru (1 EUR = X TRY)
        const eurToTry = data.rates.TRY;
        // TRY/EUR (1 TRY = Y EUR)
        const tryToEur = 1 / eurToTry;
        setDovizKuru(tryToEur);
      }
    } catch (error) {
      console.error('Döviz kuru alınırken hata:', error);
      // Hata durumunda varsayılan değer kullan (1 TRY = 0.029 EUR)
    }
  };
  
  // Sayfa yüklendiğinde döviz kurunu al
  useEffect(() => {
    getDovizKuru();
  }, []);
  
  // İstenilen tarih aralığındaki verileri getir
  useEffect(() => {
    const verileriGetir = async () => {
      setIsLoading(true);
      setHata('');
      
      try {
        // Mali performans API'dan verileri getir
        const response = await fetch(`/api/mali-performans?baslangic_tarihi=${baslangicTarihi}&bitis_tarihi=${bitisTarihi}`);
        
        if (!response.ok) {
          throw new Error('Mali performans verileri alınamadı');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const performansData = data.data;
          
          // Günlük kar-zarar verilerini güncelle
          const karZararVerileri: {[key: string]: number} = {};
          Object.keys(performansData.gunlukVeriler).forEach(tarih => {
            karZararVerileri[tarih] = performansData.gunlukVeriler[tarih].kar;
          });
          
          setGunlukKarZararVerileri(karZararVerileri);
          setToplamGelir(performansData.toplamGelir);
          setToplamGider(performansData.toplamGider);
          setNetKarZarar(performansData.netKarZarar);
          setSatisAdetleri(performansData.toplamTeslimatAdedi);
          setIsletmeGiderleri(performansData.isletmeGiderleri);
          
          // İşletme giderlerinden toplam aylık ve günlük maliyetleri hesapla
          const isletmeGiderleriVerisi = performansData.isletmeGiderleri || [];
          const toplamAylik = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
            toplam + gider.aylik_gider_tl, 0);
          const toplamGunluk = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
            toplam + (gider.aylik_gider_tl / SABIT_IS_GUNU_SAYISI), 0); // 22 iş günü
          
          setToplamAylikIsletmeGideri(toplamAylik);
          setToplamGunlukIsletmeGideri(toplamGunluk);
          
          // Reçete verisini ayarla
          if (performansData.receteler) {
            setReceteler(performansData.receteler);
          }
          
          // Bitmiş Ürün Stoğu verilerini getir
          getBitmisUrunStogu();
          
          // Stok verilerini getir
          getStokVerileri();
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
    
    verileriGetir();
  }, [baslangicTarihi, bitisTarihi]);
  
  // Tarih aralığı değiştiğinde verileri güncelle
  const handleTarihAralikDegistir = (aralikTur: TarihAraligi) => {
    const bugun = new Date();
    
    let yeniBaslangic: string;
    let yeniBitis: string;
    
    switch (aralikTur) {
      case 'bugun':
        yeniBaslangic = format(startOfDay(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfDay(bugun), 'yyyy-MM-dd');
        break;
      
      case 'dun':
        yeniBaslangic = format(startOfDay(subDays(bugun, 1)), 'yyyy-MM-dd');
        yeniBitis = format(endOfDay(subDays(bugun, 1)), 'yyyy-MM-dd');
        break;
      
      case 'haftalik':
        // Bu hafta - iş günleri filtresi (Pazartesi-Cuma veya bugüne kadar)
        const bugunHaftaninGunu = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
        
        // Haftanın başlangıcı (Pazartesi) hesabı
        const pazartesi = new Date(bugun);
        pazartesi.setDate(bugun.getDate() - ((bugunHaftaninGunu === 0 ? 6 : bugunHaftaninGunu - 1)));
        
        // Eğer bugün hafta içi ise (Pazartesi-Cuma)
        if (bugunHaftaninGunu >= 1 && bugunHaftaninGunu <= 5) {
          // Hafta başı (Pazartesi) tarihi
          yeniBaslangic = format(pazartesi, 'yyyy-MM-dd');
          
          // Bugünkü tarih
          yeniBitis = format(bugun, 'yyyy-MM-dd');
        } else {
          // Hafta sonu ise (Cumartesi veya Pazar), tüm geçen haftayı göster (Pazartesi-Cuma)
          yeniBaslangic = format(pazartesi, 'yyyy-MM-dd');
          
          // Haftanın sonu (Cuma) hesabı
          const cuma = new Date(pazartesi);
          cuma.setDate(pazartesi.getDate() + 4); // Pazartesi + 4 gün = Cuma
          
          yeniBitis = format(cuma, 'yyyy-MM-dd');
        }
        break;
      
      case 'aylik':
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
        break;
      
      case 'gecenay':
        // Geçen ayın başlangıcı ve bitiş tarihi
        const gecenAyinBasi = subMonths(startOfMonth(bugun), 1);
        const gecenAyinSonu = endOfMonth(gecenAyinBasi);
        yeniBaslangic = format(gecenAyinBasi, 'yyyy-MM-dd');
        yeniBitis = format(gecenAyinSonu, 'yyyy-MM-dd');
        break;
      
      case 'ozel':
        // Özel tarih aralığı durumunda mevcut değerleri koru
        return;
      
      default:
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
    }
    
    setBaslangicTarihi(yeniBaslangic);
    setBitisTarihi(yeniBitis);
    setTarihAraligi(aralikTur);
  };
  
  // Özel tarih aralığı değiştiğinde verileri güncelle
  const handleOzelTarihDegisim = (baslangic: string, bitis: string) => {
    setBaslangicTarihi(baslangic);
    setBitisTarihi(bitis);
    setTarihAraligi('ozel');
  };
  
  // Grafik türü değiştiğinde durumu güncelle
  const handleGrafikTuruDegistir = (yeniGrafikTuru: GrafikTuru) => {
    setGrafikTuru(yeniGrafikTuru);
  };
  
  // Filtrelenmiş reçeteleri hesapla
  const filtrelenmisReceteler = React.useMemo(() => {
    return receteler.filter(recete => {
      let gecerli = true;
      
      if (filtreliReceteAdi && !recete['Reçete Adı'].toLowerCase().includes(filtreliReceteAdi.toLowerCase())) {
        gecerli = false;
      }
      
      if (filtreliMarka && !recete['Marka'].toLowerCase().includes(filtreliMarka.toLowerCase())) {
        gecerli = false;
      }
      
      return gecerli;
    });
  }, [receteler, filtreliReceteAdi, filtreliMarka]);

  // Filtreleri temizle
  const handleFiltreleriTemizle = () => {
    setFiltreliReceteAdi('');
    setFiltreliMarka('');
  };
  
  // Kar-zarar grafik verileri
  const karZararGrafikVerileri = () => {
    // Tarihleri sırala
    const tarihler = Object.keys(gunlukKarZararVerileri).sort();
    
    // Grafik verilerini hazırla
    return {
      labels: tarihler.map(tarih => format(new Date(tarih), 'dd MMM', { locale: tr })),
      datasets: [
        {
          label: 'Günlük Kar/Zarar',
          data: tarihler.map(tarih => gunlukKarZararVerileri[tarih]),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  };
  
  // Grafik seçenekleri
  const grafikSecenekleri = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Günlük Kar/Zarar Grafiği',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('tr-TR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('tr-TR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };
  
  // Excel'e verileri aktar işlevini düzenliyorum
  const handleExcelExport = (data: any[], dosyaAdi: string) => {
    try {
      // Excel verisini hazırla
      let excelData: Record<string, any>[] = [];
      
      // Ambalajlama_Kayitlari için veri formatı
      if (dosyaAdi === 'Ambalajlama_Kayitlari') {
        excelData = data.map(kayit => ({
          'Ambalajlama Tarihi': format(new Date(kayit.ambalajlama_tarihi), 'dd.MM.yyyy'),
          'Reçete Adı': kayit.recete_adi,
          'Marka': kayit.marka,
          'Müşteri': kayit.musteri,
          'ML Bilgisi': kayit.ml_bilgisi,
          'Ambalajlanan Adet': kayit.ambalajlanan_adet,
          'Toplam Maliyet': kayit.toplam_maliyet,
          'Toplam Satış Değeri': kayit.toplam_satis_degeri,
          'Kâr': kayit.kar,
          'Satış Fiyatı Kg Bulk': kayit.satis_fiyati_kg_bulk,
          'Satış Fiyatı Kg Ambalajlı': kayit.satis_fiyati_kg_ambalajli,
          'Kg Bulk Maliyet': kayit.kg_bulk_maliyet,
          'Adet Bulk Maliyet': kayit.adet_bulk_maliyet,
          'Ambalaj Maliyeti': kayit.ambalaj_maliyeti,
          'Kg Ambalajlı Maliyet': kayit.kg_ambalajli_maliyet,
          'Adet Ambalajlı Maliyet': kayit.adet_ambalajli_maliyet,
          'Üretim Kuyruğu ID': kayit.uretim_kuyrugu_id
        }));
      } 
      // Recete_Detaylari için veri formatı
      else if (dosyaAdi === 'Recete_Detaylari') {
        excelData = data.map(recete => ({
          'Reçete Adı': recete['Reçete Adı'],
          'Marka': recete['Marka'],
          'Reçete ID': recete['Reçete ID'],
          'ML Bilgisi': recete.ml_bilgisi,
          'Satış Fiyatı (Bulk)': recete.satis_fiyati_kg_bulk,
          'Satış Fiyatı (Amb.)': recete.satis_fiyati_kg_ambalajli,
          'Maliyet (Bulk, kg)': recete.kg_bulk_maliyet,
          'Maliyet (Bulk, adet)': recete.adet_bulk_maliyet,
          'Ambalaj Maliyeti': recete.ambalaj_maliyeti,
          'Maliyet (Amb., kg)': recete.kg_ambalajli_maliyet,
          'Maliyet (Amb., adet)': recete.adet_ambalajli_maliyet
        }));
      }
      // Stok_Verileri için veri formatı
      else if (dosyaAdi === 'Stok_Verileri') {
        excelData = data.map(stok => ({
          'Hammadde ID': stok['Hammadde ID'],
          'Hammadde Adı': stok['Hammadde Adı'],
          'Stok Kategori': stok['Stok Kategori'],
          'Kategori Detay': stok['kategori_detay'],
          'Mevcut Stok': stok['Mevcut Stok'],
          'Rezerve Edildi': stok['Rezerve Edildi'],
          'Net Stok': stok['Net Stok'],
          'Birim': stok['Birim'],
          'Kritik Stok': stok['Kritik Stok'],
          'Kg veya Adet Fiyat (EUR)': stok['kg_fiyat']
        }));
      }
      
      // Veri yoksa işlemi durdur
      if (excelData.length === 0) {
        toast.error('Aktarılacak veri bulunamadı!');
        return;
      }
      
      // Excel çalışma kitabı oluştur
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Sütun genişliklerini ayarla
      const wscols = Array(Object.keys(excelData[0] || {}).length).fill({ wch: 18 });
      worksheet['!cols'] = wscols;
      
      // Excel dosyasını oluştur
      XLSX.utils.book_append_sheet(workbook, worksheet, dosyaAdi);
      
      // Excel dosyasını indir
      const excelFileName = `${dosyaAdi}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(workbook, excelFileName);
      
      toast.success('Excel dosyası başarıyla indirildi');
    } catch (error) {
      console.error('Excel dışa aktarımı sırasında hata:', error);
      toast.error('Excel aktarımı sırasında bir hata oluştu');
    }
  };
  
  // İşletme gideri düzenleme modalını aç
  const handleIsletmeGideriDuzenle = (gider: IsletmeGideri | null) => {
    setDuzenlenecekGider(gider);
    if (gider) {
      setYeniGiderAdi(gider.gider_adi);
      setYeniGiderTutar(gider.aylik_gider_tl.toString());
    } else {
      setYeniGiderAdi('');
      setYeniGiderTutar('');
    }
    setShowIsletmeGideriModal(true);
  };
  
  // İşletme gideri kaydet
  const handleIsletmeGideriKaydet = async () => {
    try {
      if (!yeniGiderAdi || !yeniGiderTutar) {
        alert('Gider adı ve tutar alanları boş bırakılamaz!');
        return;
      }
      
      const tutarSayi = parseFloat(yeniGiderTutar);
      if (isNaN(tutarSayi) || tutarSayi <= 0) {
        alert('Geçerli bir tutar giriniz!');
        return;
      }
      
      if (duzenlenecekGider) {
        // Mevcut gideri güncelle
        const { error } = await supabase
          .from('isletme_giderleri')
          .update({
            gider_adi: yeniGiderAdi,
            aylik_gider_tl: tutarSayi,
            updated_at: new Date().toISOString()
          })
          .eq('id', duzenlenecekGider.id);
          
        if (error) throw error;
      } else {
        // Yeni gider ekle
        const { error } = await supabase
          .from('isletme_giderleri')
          .insert({
            gider_adi: yeniGiderAdi,
            aylik_gider_tl: tutarSayi,
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      // Modal'ı kapat ve verileri yenile
      setShowIsletmeGideriModal(false);
      
      // Verileri yeniden getir
      const response = await fetch(`/api/mali-performans?baslangic_tarihi=${baslangicTarihi}&bitis_tarihi=${bitisTarihi}`);
      if (!response.ok) throw new Error('Mali performans verileri alınamadı');
      
      const data = await response.json();
      if (data.success) {
        setIsletmeGiderleri(data.data.isletmeGiderleri);
        setToplamGider(data.data.toplamGider);
        setNetKarZarar(data.data.netKarZarar);
        
        // İşletme giderlerinden toplam aylık ve günlük maliyetleri hesapla
        const isletmeGiderleriVerisi = data.data.isletmeGiderleri || [];
        const toplamAylik = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
          toplam + gider.aylik_gider_tl, 0);
        const toplamGunluk = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
          toplam + (gider.aylik_gider_tl / SABIT_IS_GUNU_SAYISI), 0); // 22 iş günü
          
        setToplamAylikIsletmeGideri(toplamAylik);
        setToplamGunlukIsletmeGideri(toplamGunluk);
      }
    } catch (error) {
      console.error('İşletme gideri kaydedilirken hata:', error);
      alert('İşletme gideri kaydedilirken bir hata oluştu!');
    }
  };
  
  // İşletme gideri sil
  const handleIsletmeGideriSil = async (giderId: number) => {
    if (!confirm('Bu gider kalemini silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('isletme_giderleri')
        .delete()
        .eq('id', giderId);
        
      if (error) throw error;
      
      // Verileri yeniden getir
      const response = await fetch(`/api/mali-performans?baslangic_tarihi=${baslangicTarihi}&bitis_tarihi=${bitisTarihi}`);
      if (!response.ok) throw new Error('Mali performans verileri alınamadı');
      
      const data = await response.json();
      if (data.success) {
        setIsletmeGiderleri(data.data.isletmeGiderleri);
        setToplamGider(data.data.toplamGider);
        setNetKarZarar(data.data.netKarZarar);
        
        // İşletme giderlerinden toplam aylık ve günlük maliyetleri hesapla
        const isletmeGiderleriVerisi = data.data.isletmeGiderleri || [];
        const toplamAylik = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
          toplam + gider.aylik_gider_tl, 0);
        const toplamGunluk = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
          toplam + (gider.aylik_gider_tl / 22), 0); // 22 iş günü
          
        setToplamAylikIsletmeGideri(toplamAylik);
        setToplamGunlukIsletmeGideri(toplamGunluk);
      }
    } catch (error) {
      console.error('İşletme gideri silinirken hata:', error);
      alert('İşletme gideri silinirken bir hata oluştu!');
    }
  };
  
  // Detay modalları için durum değişkenleri
  const [showGelirDetay, setShowGelirDetay] = useState(false);
  const [showGiderDetay, setShowGiderDetay] = useState(false);
  const [showKarZararDetay, setShowKarZararDetay] = useState(false);
  const [showSatisDetay, setShowSatisDetay] = useState(false);
  
  // Bitmiş Ürün Stoğu verilerini getir
  const getBitmisUrunStogu = async () => {
    try {
      if (!bitmisurunBaslangicTarihi || !bitmisurunBitisTarihi) return;
      
      // Bitmiş Ürün Stoğu verilerini çekiyoruz
      // Tarihe göre filtreleme için SQL sorgusu kullanıyoruz
      const { data, error } = await supabase
        .from('Bitmiş Ürün Stoğu')
        .select('*')
        .gte('Paketlendiği Tarih', bitmisurunBaslangicTarihi)
        .lte('Paketlendiği Tarih', bitmisurunBitisTarihi);
      
      if (error) throw error;
      
      setBitmisUrunStogu(data || []);
      
      // Filtreleri uygula
      const filtrelenmisBitUrunStogu = (data || []).filter(item => {
        let gecerli = true;
        
        if (filtreBitmisUrunRecete && !item['Reçete Adı']?.toLowerCase().includes(filtreBitmisUrunRecete.toLowerCase())) {
          gecerli = false;
        }
        
        if (filtreBitmisUrunMusteri && !item['Müşteri']?.toLowerCase().includes(filtreBitmisUrunMusteri.toLowerCase())) {
          gecerli = false;
        }
        
        return gecerli;
      });
      
      // setFiltrelenmisUrunStogu(filtrelenmisBitUrunStogu);
    } catch (error) {
      console.error('Bitmiş Ürün Stoğu verileri alınırken hata:', error);
      // setFiltrelenmisUrunStogu([]);
    }
  };

  // Ambalajlama Kayıtları verilerini getir
  const getAmbalajlamaKayitlari = async () => {
    try {
      if (!ambalajlamaBaslangicTarihi || !ambalajlamaBitisTarihi) return;
      
      console.log('Ambalajlama Kayıtları Sorgulama:', {
        baslangic: ambalajlamaBaslangicTarihi,
        bitis: ambalajlamaBitisTarihi
      });
      
      // Başlangıç ve bitiş tarihlerini ISO formatına çevir
      const baslangicISO = new Date(ambalajlamaBaslangicTarihi);
      baslangicISO.setHours(0, 0, 0, 0);
      
      const bitisISO = new Date(ambalajlamaBitisTarihi);
      bitisISO.setHours(23, 59, 59, 999);
      
      // Ambalajlama kayıtlarını çek
      const { data, error } = await supabase
        .from('AmbalajlamaKayitlari')
        .select('*')
        .gte('ambalajlama_tarihi', baslangicISO.toISOString())
        .lte('ambalajlama_tarihi', bitisISO.toISOString())
        .order('ambalajlama_tarihi', { ascending: false });
      
      if (error) throw error;
      
      console.log('Ambalajlama kayıtları alındı:', data?.length || 0);
      
      setAmbalajlamaKayitlari(data || []);
      
      // Filtreleri uygula
      const filtrelenmisKayitlar = (data || []).filter(item => {
        let gecerli = true;
        
        if (filtreAmbalajlamaRecete && !item.recete_adi?.toLowerCase().includes(filtreAmbalajlamaRecete.toLowerCase())) {
          gecerli = false;
        }
        
        if (filtreAmbalajlamaMusteri && !item.musteri?.toLowerCase().includes(filtreAmbalajlamaMusteri.toLowerCase())) {
          gecerli = false;
        }
        
        return gecerli;
      });
      
      setFiltrelenmisAmbalajlamaKayitlari(filtrelenmisKayitlar);
      
      // Toplamları hesapla
      const toplamlar = filtrelenmisKayitlar.reduce((acc, item) => {
        return {
          adet: acc.adet + (item.ambalajlanan_adet || 0),
          satisDegeri: acc.satisDegeri + (item.toplam_satis_degeri || 0),
          maliyet: acc.maliyet + (item.toplam_maliyet || 0),
          kar: acc.kar + (item.kar || 0)
        };
      }, { adet: 0, satisDegeri: 0, maliyet: 0, kar: 0 });
      
      setAmbalajlamaToplamAdet(toplamlar.adet);
      setAmbalajlamaToplamSatisDegeri(toplamlar.satisDegeri);
      setAmbalajlamaToplamMaliyet(toplamlar.maliyet);
      setAmbalajlamaToplamKar(toplamlar.kar);
    } catch (error) {
      console.error('Ambalajlama Kayıtları alınırken hata:', error);
      setFiltrelenmisAmbalajlamaKayitlari([]);
      setAmbalajlamaToplamAdet(0);
      setAmbalajlamaToplamSatisDegeri(0);
      setAmbalajlamaToplamMaliyet(0);
      setAmbalajlamaToplamKar(0);
    }
  };

  // Ambalajlama Kayıtları için tarih aralığı değiştiğinde
  useEffect(() => {
    getAmbalajlamaKayitlari();
  }, [ambalajlamaBaslangicTarihi, ambalajlamaBitisTarihi, filtreAmbalajlamaRecete, filtreAmbalajlamaMusteri]);

  // Bugün ayın son günü mü kontrol fonksiyonu
  const bugunAyinSonGunuMu = (): boolean => {
    const bugun = new Date();
    const ayinSonGunu = endOfMonth(bugun);
    return (
      bugun.getDate() === ayinSonGunu.getDate() && 
      bugun.getMonth() === ayinSonGunu.getMonth() && 
      bugun.getFullYear() === ayinSonGunu.getFullYear()
    );
  };

  // Ambalajlama verileri veya işletme giderleri değiştiğinde gerçek net kar/zarar hesaplaması
  useEffect(() => {
    // Aylık işletme maliyetini iş gününe bölerek günlük maliyet hesapla
    const gunlukMaliyet = toplamAylikIsletmeGideri / SABIT_IS_GUNU_SAYISI;
    
    let isGunuAdedi = 0;
    let isletmeMaliyeti = 0;
    
    // Eğer "Bu Ay" veya "Geçen Ay" filtresi seçilmişse
    if (ambalajlamaTarihAraligi === 'aylik' || ambalajlamaTarihAraligi === 'gecenay') {
      // Direkt olarak aylık toplam maliyeti göster
      isletmeMaliyeti = toplamAylikIsletmeGideri * dovizKuru;
      // İş günü sayısı olarak SABIT_IS_GUNU_SAYISI göster
      isGunuAdedi = SABIT_IS_GUNU_SAYISI;
    } else {
      // Normal hesaplama - seçilen tarih aralığındaki iş günü sayısını hesapla
      if (ambalajlamaBaslangicTarihi && ambalajlamaBitisTarihi) {
        // Seçili tarih aralığındaki gerçek iş günü sayısını hesapla
        isGunuAdedi = hesaplaIsGunuSayisi(ambalajlamaBaslangicTarihi, ambalajlamaBitisTarihi);
      }
      
      // İşletme maliyeti: günlük maliyet x iş günü sayısı
      isletmeMaliyeti = gunlukMaliyet * dovizKuru * isGunuAdedi;
    }
    
    setIsGunuSayisi(isGunuAdedi);
    
    // Gerçek net kar/zarar: ambalajlama karı - işletme maliyeti
    const gercekKarZarar = ambalajlamaToplamKar - isletmeMaliyeti;
    
    setGercekNetKarZarar(gercekKarZarar);
    
    console.log('İşletme Maliyeti Hesaplama:', {
      baslangic: ambalajlamaBaslangicTarihi,
      bitis: ambalajlamaBitisTarihi,
      isGunuSayisi: isGunuAdedi,
      tarihAraligi: ambalajlamaTarihAraligi,
      gunlukMaliyet,
      isletmeMaliyeti,
      ambalajlamaToplamKar,
      gercekNetKarZarar
    });
  }, [ambalajlamaToplamKar, toplamAylikIsletmeGideri, dovizKuru, ambalajlamaBaslangicTarihi, ambalajlamaBitisTarihi, ambalajlamaTarihAraligi]);

  // Hata ayıklama için useEffect
  useEffect(() => {
    console.log('Hesaplama Değerleri:', {
      toplamAylikIsletmeGideri,
      aylikIsGunu: hesaplaAylikIsGunuSayisi(),
      seciliIsGunu: isGunuSayisi,
      gunlukMaliyet: toplamAylikIsletmeGideri / hesaplaAylikIsGunuSayisi(),
      eurGunlukMaliyet: (toplamAylikIsletmeGideri / hesaplaAylikIsGunuSayisi()) * dovizKuru,
      toplamIsletmeMaliyeti: (toplamAylikIsletmeGideri / hesaplaAylikIsGunuSayisi()) * dovizKuru * isGunuSayisi,
      ambalajlamaToplamKar,
      gercekNetKarZarar
    });
  }, [toplamAylikIsletmeGideri, isGunuSayisi, dovizKuru, ambalajlamaToplamKar, gercekNetKarZarar]);

  // Ambalajlama için tarih aralığı değiştirme işleyicisi
  const handleAmbalajlamaTarihAralikDegistir = (aralikTur: TarihAraligi) => {
    const bugun = new Date();
    
    let yeniBaslangic: string;
    let yeniBitis: string;
    
    switch (aralikTur) {
      case 'bugun':
        yeniBaslangic = format(startOfDay(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfDay(bugun), 'yyyy-MM-dd');
        break;
      
      case 'dun':
        yeniBaslangic = format(startOfDay(subDays(bugun, 1)), 'yyyy-MM-dd');
        yeniBitis = format(endOfDay(subDays(bugun, 1)), 'yyyy-MM-dd');
        break;
      
      case 'haftalik':
        // Bu hafta - iş günleri filtresi (Pazartesi-Cuma veya bugüne kadar)
        const bugunHaftaninGunu = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
        
        // Haftanın başlangıcı (Pazartesi) hesabı
        const pazartesi = new Date(bugun);
        pazartesi.setDate(bugun.getDate() - ((bugunHaftaninGunu === 0 ? 6 : bugunHaftaninGunu - 1)));
        
        // Eğer bugün hafta içi ise (Pazartesi-Cuma)
        if (bugunHaftaninGunu >= 1 && bugunHaftaninGunu <= 5) {
          // Hafta başı (Pazartesi) tarihi
          yeniBaslangic = format(pazartesi, 'yyyy-MM-dd');
          
          // Bugünkü tarih
          yeniBitis = format(bugun, 'yyyy-MM-dd');
        } else {
          // Hafta sonu ise (Cumartesi veya Pazar), tüm geçen haftayı göster (Pazartesi-Cuma)
          yeniBaslangic = format(pazartesi, 'yyyy-MM-dd');
          
          // Haftanın sonu (Cuma) hesabı
          const cuma = new Date(pazartesi);
          cuma.setDate(pazartesi.getDate() + 4); // Pazartesi + 4 gün = Cuma
          
          yeniBitis = format(cuma, 'yyyy-MM-dd');
        }
        break;
      
      case 'aylik':
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
        break;
      
      case 'gecenay':
        // Geçen ayın başlangıcı ve bitiş tarihi
        const gecenAyinBasi = subMonths(startOfMonth(bugun), 1);
        const gecenAyinSonu = endOfMonth(gecenAyinBasi);
        yeniBaslangic = format(gecenAyinBasi, 'yyyy-MM-dd');
        yeniBitis = format(gecenAyinSonu, 'yyyy-MM-dd');
        break;
      
      case 'ozel':
        // Özel tarih aralığı durumunda mevcut değerleri koru
        return;
      
      default:
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
    }
    
    setAmbalajlamaTarihAraligi(aralikTur);
    setAmbalajlamaBaslangicTarihi(yeniBaslangic);
    setAmbalajlamaBitisTarihi(yeniBitis);
    
    console.log('Tarih Aralığı Değişti:', {
      aralikTur,
      yeniBaslangic,
      yeniBitis
    });
  };

  // Ambalajlama için özel tarih değişimi
  const handleAmbalajlamaOzelTarihDegisim = (baslangic: string, bitis: string) => {
    setAmbalajlamaBaslangicTarihi(baslangic);
    setAmbalajlamaBitisTarihi(bitis);
  };
  
  // Bitmiş Ürün Stoğu tarih aralığı değiştiğinde verileri güncelle - tarihe göre filtreleme yapmıyoruz şimdilik
  useEffect(() => {
    // getBitmisUrunStogu();
  }, [bitmisurunBaslangicTarihi, bitmisurunBitisTarihi]);
  
  // Bitmiş Ürün tarih aralığı değiştiğinde verileri güncelle
  const handleBitmisUrunTarihAralikDegistir = (aralikTur: TarihAraligi) => {
    const bugun = new Date();
    
    let yeniBaslangic: string;
    let yeniBitis: string;
    
    switch (aralikTur) {
      case 'bugun':
        yeniBaslangic = format(startOfDay(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfDay(bugun), 'yyyy-MM-dd');
        break;
      
      case 'dun':
        yeniBaslangic = format(startOfDay(subDays(bugun, 1)), 'yyyy-MM-dd');
        yeniBitis = format(endOfDay(subDays(bugun, 1)), 'yyyy-MM-dd');
        break;
      
      case 'haftalik':
        // Bu hafta - iş günleri filtresi (Pazartesi-Cuma veya bugüne kadar)
        const bugunHaftaninGunu = bugun.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
        
        // Haftanın başlangıcı (Pazartesi) hesabı
        const pazartesi = new Date(bugun);
        pazartesi.setDate(bugun.getDate() - ((bugunHaftaninGunu === 0 ? 6 : bugunHaftaninGunu - 1)));
        
        // Eğer bugün hafta içi ise (Pazartesi-Cuma)
        if (bugunHaftaninGunu >= 1 && bugunHaftaninGunu <= 5) {
          // Hafta başı (Pazartesi) tarihi
          yeniBaslangic = format(pazartesi, 'yyyy-MM-dd');
          
          // Bugünkü tarih
          yeniBitis = format(bugun, 'yyyy-MM-dd');
        } else {
          // Hafta sonu ise (Cumartesi veya Pazar), tüm geçen haftayı göster (Pazartesi-Cuma)
          yeniBaslangic = format(pazartesi, 'yyyy-MM-dd');
          
          // Haftanın sonu (Cuma) hesabı
          const cuma = new Date(pazartesi);
          cuma.setDate(pazartesi.getDate() + 4); // Pazartesi + 4 gün = Cuma
          
          yeniBitis = format(cuma, 'yyyy-MM-dd');
        }
        break;
      
      case 'aylik':
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
        break;
      
      case 'gecenay':
        // Geçen ayın başlangıcı ve bitiş tarihi
        const gecenAyinBasi = subMonths(startOfMonth(bugun), 1);
        const gecenAyinSonu = endOfMonth(gecenAyinBasi);
        yeniBaslangic = format(gecenAyinBasi, 'yyyy-MM-dd');
        yeniBitis = format(gecenAyinSonu, 'yyyy-MM-dd');
        break;
      
      case 'ozel':
        // Özel tarih aralığı durumunda mevcut değerleri koru
        return;
      
      default:
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
    }
    
    setBitmisurunBaslangicTarihi(yeniBaslangic);
    setBitmisurunBitisTarihi(yeniBitis);
    setBitmisurunTarihAraligi(aralikTur);
    
    // Tarih değiştiğinde verileri yeniden getir
    getBitmisUrunStogu();
  };
  
  // Bitmiş Ürün Stoğu için özel tarih aralığı değiştiğinde verileri güncelle
  const handleBitmisUrunOzelTarihDegisim = (baslangic: string, bitis: string) => {
    setBitmisurunBaslangicTarihi(baslangic);
    setBitmisurunBitisTarihi(bitis);
    setBitmisurunTarihAraligi('ozel');
    
    // Tarih değiştiğinde verileri yeniden getir
    getBitmisUrunStogu();
  };
  
  // Filtrelenmiş Bitmiş Ürün Stoğu verilerini hesapla
  const filtrelenmisUrunStogu = React.useMemo(() => {
    return bitmisUrunStogu.filter(urun => {
      let gecerli = true;
      
      if (filtreBitmisUrunRecete && !String(urun['Reçete Adı'] || '').toLowerCase().includes(filtreBitmisUrunRecete.toLowerCase())) {
        gecerli = false;
      }
      
      if (filtreBitmisUrunMusteri && !String(urun['Müşteri'] || '').toLowerCase().includes(filtreBitmisUrunMusteri.toLowerCase())) {
        gecerli = false;
      }
      
      return gecerli;
    });
  }, [bitmisUrunStogu, filtreBitmisUrunRecete, filtreBitmisUrunMusteri]);

  // Bitmiş Ürün Stoğu filtreleri temizle
  const handleBitmisUrunFiltreleriTemizle = () => {
    setFiltreBitmisUrunRecete('');
    setFiltreBitmisUrunMusteri('');
  };
  
  // Belirli bir tarih aralığındaki iş günü sayısını hesapla (hafta içi günler)
  const hesaplaIsGunuSayisi = (baslangic: string, bitis: string): number => {
    const baslangicTarihi = new Date(baslangic);
    const bitisTarihi = new Date(bitis);
    let isGunuSayisi = 0;
    
    // Türkiye resmi tatilleri (2025 örnek)
    const resmiTatiller = [
      "2025-01-01", // Yılbaşı
      "2025-04-23", // Ulusal Egemenlik ve Çocuk Bayramı
      "2025-05-01", // İşçi Bayramı
      "2025-05-19", // Gençlik ve Spor Bayramı
      "2025-07-15", // Demokrasi Bayramı
      "2025-08-30", // Zafer Bayramı
      "2025-10-29", // Cumhuriyet Bayramı
      // Dini bayramlar (yıla göre değişir, bu tarihler örnek olarak verilmiştir)
      "2025-03-10", // Ramazan Bayramı 1. Gün
      "2025-03-11", // Ramazan Bayramı 2. Gün
      "2025-03-12", // Ramazan Bayramı 3. Gün
      "2025-05-17", // Kurban Bayramı 1. Gün
      "2025-05-18", // Kurban Bayramı 2. Gün
      "2025-05-19", // Kurban Bayramı 3. Gün
      "2025-05-20"  // Kurban Bayramı 4. Gün
    ];
    
    // Tarihleri dolaş
    const suankiTarih = new Date(baslangicTarihi);
    while (suankiTarih <= bitisTarihi) {
      const tarihStr = format(suankiTarih, 'yyyy-MM-dd');
      
      // Hafta içi günleri (1-5: Pazartesi-Cuma, 0: Pazar, 6: Cumartesi)
      const haftaninGunu = suankiTarih.getDay();
      
      // Eğer hafta içi ise ve resmi tatil değilse iş günüdür
      if (haftaninGunu >= 1 && haftaninGunu <= 5 && !resmiTatiller.includes(tarihStr)) {
        isGunuSayisi++;
      }
      
      // Sonraki güne geç
      suankiTarih.setDate(suankiTarih.getDate() + 1);
    }
    
    return isGunuSayisi;
  };
  
  // Bir aydaki toplam iş günü sayısını hesapla
  const hesaplaAylikIsGunuSayisi = (): number => {
    const bugun = new Date();
    const ayBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
    const ayBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
    
    return hesaplaIsGunuSayisi(ayBaslangic, ayBitis);
  };
  
  // Stok verilerini getir
  const getStokVerileri = async () => {
    try {
      const data = await fetchAllFromTable('Stok', true);
      
      console.log('Stok verileri alındı:', data?.length || 0);
      
      setStokVerileri(data || []);
      setFiltrelenmisStokVerileri(data || []);
      
      // Stok değerlerini hesapla
      hesaplaStokDegerleri(data || []);
    } catch (error) {
      console.error('Stok verileri getirilirken hata:', error);
    }
  };
  
  // Stok değerlerini hesaplama fonksiyonu
  const hesaplaStokDegerleri = (stokData: StokItem[]) => {
    // Toplam Mevcut Stok Değeri
    const mevcutStokDegeri = stokData.reduce((toplam, stok) => {
      return toplam + (stok['Mevcut Stok'] * stok['kg_fiyat'] || 0);
    }, 0);
    
    // Toplam Net Stok Değeri
    const netStokDegeri = stokData.reduce((toplam, stok) => {
      return toplam + (stok['Net Stok'] * stok['kg_fiyat'] || 0);
    }, 0);
    
    // Ambalaj Stoğu Net Değeri
    const ambalajDegeri = stokData
      .filter(stok => stok['Stok Kategori']?.toLowerCase() === 'ambalaj')
      .reduce((toplam, stok) => {
        return toplam + (stok['Net Stok'] * stok['kg_fiyat'] || 0);
      }, 0);
    
    // Hammadde Stoğu Net Değeri
    const hammaddeDegeri = stokData
      .filter(stok => stok['Stok Kategori']?.toLowerCase() === 'hammadde')
      .reduce((toplam, stok) => {
        return toplam + (stok['Net Stok'] * stok['kg_fiyat'] || 0);
      }, 0);
    
    setToplamMevcutStokDegeri(mevcutStokDegeri);
    setToplamNetStokDegeri(netStokDegeri);
    setAmbalajStokDegeri(ambalajDegeri);
    setHammaddeStokDegeri(hammaddeDegeri);
  };

  // Stok filtrelerini temizle
  const handleStokFiltreleriTemizle = () => {
    setFiltreStokKategori('');
    setFiltreHammaddeAdi('');
    setStokArama('');
    setFiltrelenmisStokVerileri(stokVerileri);
  };
  
  // Stok tablosu sıralama fonksiyonu
  const handleStokSiralama = (sutun: string) => {
    // Aynı sütun seçildiğinde sıralama yönünü değiştir
    if (stokSiralama === sutun) {
      setStokSiralamaYonu(stokSiralamaYonu === 'asc' ? 'desc' : 'asc');
    } else {
      setStokSiralama(sutun);
      setStokSiralamaYonu('asc');
    }
  };
  
  // Verileri getir
  const verileriGetir = async () => {
    try {
      setIsLoading(true);
      setHata('');
      
      try {
        // Mali performans API'dan verileri getir
        const response = await fetch(`/api/mali-performans?baslangic_tarihi=${baslangicTarihi}&bitis_tarihi=${bitisTarihi}`);
        
        if (!response.ok) {
          throw new Error('Mali performans verileri alınamadı');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const performansData = data.data;
          
          // Günlük kar-zarar verilerini güncelle
          const karZararVerileri: {[key: string]: number} = {};
          Object.keys(performansData.gunlukVeriler).forEach(tarih => {
            karZararVerileri[tarih] = performansData.gunlukVeriler[tarih].kar;
          });
          
          setGunlukKarZararVerileri(karZararVerileri);
          setToplamGelir(performansData.toplamGelir);
          setToplamGider(performansData.toplamGider);
          setNetKarZarar(performansData.netKarZarar);
          setSatisAdetleri(performansData.toplamTeslimatAdedi);
          setIsletmeGiderleri(performansData.isletmeGiderleri);
          
          // İşletme giderlerinden toplam aylık ve günlük maliyetleri hesapla
          const isletmeGiderleriVerisi = performansData.isletmeGiderleri || [];
          const toplamAylik = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
            toplam + gider.aylik_gider_tl, 0);
          const toplamGunluk = isletmeGiderleriVerisi.reduce((toplam: number, gider: IsletmeGideri) => 
            toplam + (gider.aylik_gider_tl / SABIT_IS_GUNU_SAYISI), 0); // 22 iş günü
          
          setToplamAylikIsletmeGideri(toplamAylik);
          setToplamGunlukIsletmeGideri(toplamGunluk);
          
          // Reçete verisini ayarla
          if (performansData.receteler) {
            setReceteler(performansData.receteler);
          }
          
          // Bitmiş Ürün Stoğu verilerini getir
          getBitmisUrunStogu();
          
          // Stok verilerini getir
          getStokVerileri();
        } else {
          throw new Error('Veri alınırken bir hata oluştu');
        }
      } catch (error) {
        console.error('Veri alınırken hata:', error);
        setHata('Veriler alınırken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Veri alınırken hata:', error);
      setHata('Veriler alınırken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
    }
  };
  
  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    verileriGetir();
    getAmbalajlamaKayitlari();
    getDovizKuru();
  }, []);
  
  // Stok filtrelerinin değişimini izle ve filtreleme yap
  useEffect(() => {
    if (stokVerileri.length === 0) return;
    
    // Önce arama filtresi uygula
    let filtrelenmisVeriler = stokVerileri.filter(item => {
      if (!stokArama) return true;
      
      const aramaMetni = stokArama.toLowerCase();
      
      // Metin alanlarında arama
      const metinAramaEslesti =
        item['Hammadde Adı']?.toLowerCase().includes(aramaMetni) ||
        item['Hammadde ID']?.toLowerCase().includes(aramaMetni) ||
        item['Stok Kategori']?.toLowerCase().includes(aramaMetni) ||
        item['kategori_detay']?.toLowerCase().includes(aramaMetni) ||
        item['Birim']?.toLowerCase().includes(aramaMetni);
      
      // Sayısal alanlarda arama
      const sayisalAramaEslesti =
        item['kg_fiyat']?.toString().includes(aramaMetni) ||
        item['Mevcut Stok']?.toString().includes(aramaMetni) ||
        item['Rezerve Edildi']?.toString().includes(aramaMetni) ||
        item['Net Stok']?.toString().includes(aramaMetni) ||
        item['Kritik Stok']?.toString().includes(aramaMetni);
      
      return metinAramaEslesti || sayisalAramaEslesti;
    });
    
    // Sonra sıralama uygula
    filtrelenmisVeriler.sort((a, b) => {
      // Stok Değeri için özel hesaplama
      if (stokSiralama === 'stok_degeri') {
        const valueA = a['Mevcut Stok'] * a['kg_fiyat'] || 0;
        const valueB = b['Mevcut Stok'] * b['kg_fiyat'] || 0;
        return stokSiralamaYonu === 'asc' ? valueA - valueB : valueB - valueA;
      }

      let valueA = a[stokSiralama];
      let valueB = b[stokSiralama];
      
      // Sayısal değerler için sıralama
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return stokSiralamaYonu === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Metin değerleri için sıralama
      valueA = String(valueA || '').toLowerCase();
      valueB = String(valueB || '').toLowerCase();
      
      if (valueA < valueB) return stokSiralamaYonu === 'asc' ? -1 : 1;
      if (valueA > valueB) return stokSiralamaYonu === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFiltrelenmisStokVerileri(filtrelenmisVeriler);
    
    // Filtrelenmiş verilerin Net Stok Değerini hesapla
    const netStokDeger = filtrelenmisVeriler.reduce((toplam, stok) => {
      return toplam + (stok['Net Stok'] * stok['kg_fiyat'] || 0);
    }, 0);
    
    setFiltrelenmisNetStokDegeri(netStokDeger);
  }, [stokArama, stokSiralama, stokSiralamaYonu, stokVerileri]);
  
  // Stok fiyatı güncelleme modalında stoğu değiştirme
  const handleStokSecim = (stok: StokItem) => {
    setSecilenStok(stok);
    setYeniFiyat(stok.kg_fiyat.toString());
  };

  // Stok fiyatını güncelleme
  const handleStokFiyatiGuncelle = async () => {
    if (!secilenStok) {
      toast.error('Lütfen bir stok seçiniz!');
      return;
    }

    const yeniFiyatSayi = parseFloat(yeniFiyat);
    if (isNaN(yeniFiyatSayi) || yeniFiyatSayi <= 0) {
      toast.error('Lütfen geçerli bir fiyat giriniz!');
      return;
    }

    try {
      setFiyatGuncellemeLoading(true);

      // Supabase'te fiyatı güncelle
      const { error } = await supabase
        .from('Stok')
        .update({ kg_fiyat: yeniFiyatSayi })
        .eq('ID', secilenStok.ID);
      
      if (error) throw error;

      // Stok verilerini güncelle
      getStokVerileri();
      
      toast.success('Stok fiyatı başarıyla güncellendi!');
      
      // Modalı kapat ve durumu sıfırla
      setShowStokFiyatModal(false);
      setSecilenStok(null);
      setYeniFiyat('');
      setStokModalArama('');
    } catch (error) {
      console.error('Stok fiyatı güncellenirken hata:', error);
      toast.error('Stok fiyatı güncellenirken bir hata oluştu!');
    } finally {
      setFiyatGuncellemeLoading(false);
    }
  };

  // Reçete seçimi
  const handleReceteSecim = (recete: Recete) => {
    setSecilenRecete(recete);
    setYeniReceteFiyati(recete.birim_satis_fiyati.toString());
  };

  // Reçete fiyatını güncelleme
  const handleReceteFiyatiGuncelle = async () => {
    if (!secilenRecete) {
      toast.error('Lütfen bir reçete seçiniz!');
      return;
    }

    const yeniFiyatSayi = parseFloat(yeniReceteFiyati);
    if (isNaN(yeniFiyatSayi) || yeniFiyatSayi <= 0) {
      toast.error('Lütfen geçerli bir fiyat giriniz!');
      return;
    }

    try {
      setReceteFiyatGuncellemeLoading(true);

      // Supabase'te reçete fiyatını güncelle
      const { error } = await supabase
        .from('Reçeteler')
        .update({ birim_satis_fiyati: yeniFiyatSayi })
        .eq('id', secilenRecete.id);
      
      if (error) throw error;

      // Reçete verilerini güncelle
      verileriGetir();
      
      toast.success('Reçete birim satış fiyatı başarıyla güncellendi!');
      
      // Modalı kapat ve durumu sıfırla
      setShowReceteFiyatModal(false);
      setSecilenRecete(null);
      setYeniReceteFiyati('');
      setReceteModalArama('');
    } catch (error) {
      console.error('Reçete fiyatı güncellenirken hata:', error);
      toast.error('Reçete fiyatı güncellenirken bir hata oluştu!');
    } finally {
      setReceteFiyatGuncellemeLoading(false);
    }
  };

  // Modal için stok araması
  useEffect(() => {
    if (!showStokFiyatModal) return;
    
    // Stok arama
    const filtrelenmisStoklar = stokVerileri.filter(item => {
      if (!stokModalArama) return true;
      
      const aramaMetni = stokModalArama.toLowerCase();
      
      return (
        item['Hammadde Adı']?.toLowerCase().includes(aramaMetni) ||
        item['Hammadde ID']?.toLowerCase().includes(aramaMetni) ||
        item['Stok Kategori']?.toLowerCase().includes(aramaMetni)
      );
    });
    
    setFiltrelenmisModalStoklar(filtrelenmisStoklar);
  }, [stokModalArama, showStokFiyatModal, stokVerileri]);
  
  // Modal için reçete araması
  useEffect(() => {
    if (!showReceteFiyatModal) return;
    
    // Reçete arama
    const filtrelenmisReceteler = receteler.filter(item => {
      if (!receteModalArama) return true;
      
      const aramaMetni = receteModalArama.toLowerCase();
      
      return (
        item['Reçete Adı']?.toLowerCase().includes(aramaMetni) ||
        item['Reçete ID']?.toLowerCase().includes(aramaMetni) ||
        item['Marka']?.toLowerCase().includes(aramaMetni)
      );
    });
    
    setFiltrelenmisModalReceteler(filtrelenmisReceteler);
  }, [receteModalArama, showReceteFiyatModal, receteler]);
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mali Performans Analizi</h1>
            
          {/* Filtreleme butonlarını, grafik seçicisini ve excel butonunu kaldırıyorum */}
        </div>
        
        {hata && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {hata}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Özet bilgiler */}
            <div className="mb-8">
              {/* Üst satır - 5 kutu */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                {/* Toplam Satış Değeri */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowGelirDetay(true)}>
                <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-gray-500">Toplam Satış Değeri</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(ambalajlamaToplamSatisDegeri)}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                    Gerçek zaman Mali Ölçek İzleme tablosunun toplamı
                </div>
              </div>
              
                {/* Toplam Maliyet */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowGiderDetay(true)}>
                <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-gray-500">Toplam Maliyet</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(ambalajlamaToplamMaliyet)}
                    </h3>
                  </div>
                  <div className="bg-red-100 p-2 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                    Ürün + Ambalaj Maliyetleri toplamı
                </div>
              </div>
              
                {/* Toplam Kar (YENİ) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-gray-500">Toplam Kar</p>
                      <h3 className={`text-2xl font-bold mt-1 ${ambalajlamaToplamKar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(ambalajlamaToplamKar)}
                    </h3>
                  </div>
                    <div className={`p-2 rounded-lg ${ambalajlamaToplamKar >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {ambalajlamaToplamKar >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                    Toplam Satış - Toplam Maliyet
                </div>
              </div>
              
                {/* İşletme Maliyeti (YENİ) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-gray-500">İşletme Maliyeti</p>
                      <h3 className="text-2xl font-bold text-orange-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format((toplamAylikIsletmeGideri / SABIT_IS_GUNU_SAYISI) * dovizKuru * isGunuSayisi)}
                    </h3>
                  </div>
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                    {ambalajlamaTarihAraligi === 'aylik' || ambalajlamaTarihAraligi === 'gecenay'
                      ? "Aylık toplam işletme maliyeti (tüm giderler)" 
                      : `Seçili dönemdeki işletme giderleri (${isGunuSayisi} iş günü × ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((toplamAylikIsletmeGideri / SABIT_IS_GUNU_SAYISI) * dovizKuru)} günlük maliyet)`
                    }
              </div>
            </div>
            
                {/* Net Kar/Zarar */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowKarZararDetay(true)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Net Kar/Zarar (İşletme Maliyeti Düşülmüş)</p>
                      <h3 className={`text-2xl font-bold mt-1 ${gercekNetKarZarar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(gercekNetKarZarar)}
                      </h3>
                </div>
                    <div className={`p-2 rounded-lg ${gercekNetKarZarar >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {gercekNetKarZarar >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      )}
              </div>
                </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Kar ({new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(ambalajlamaToplamKar)}) - İşletme Maliyeti = Gerçek Net Kar/Zarar
                  </div>
              </div>
            </div>
            
              {/* Alt satır - 2 kutu */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ambalajlanan Adet */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowSatisDetay(true)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ambalajlanan Adet</p>
                      <h3 className="text-2xl font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat('tr-TR').format(ambalajlamaToplamAdet)}
                      </h3>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Toplam Ambalajlanan Adet sayısı
                </div>
              </div>
              
                {/* İşletme Yürütme Maliyeti */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowGiderDetay(true)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">İşletme Yürütme Maliyeti</p>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Aylık Maliyet:</p>
                          <h3 className="text-xl font-bold text-orange-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(toplamAylikIsletmeGideri * dovizKuru)}
                          </h3>
                </div>
                        <div>
                          <p className="text-xs text-gray-500">Günlük Maliyet:</p>
                          <h3 className="text-xl font-bold text-orange-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(toplamGunlukIsletmeGideri * dovizKuru)}
                          </h3>
                                  </div>
                      </div>
                    </div>
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 flex justify-between">
                    <span>İşletme giderleri tablosundaki değerlerin toplamı</span>
                    <span className="text-xs text-gray-400">1 EUR ≈ {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(1/dovizKuru)} TL</span>
                </div>
              </div>
            </div>
              </div>
              
            {/* Grafikler ve Tablolar */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Ambalajlama Kayıtları Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Mali Ölçek İzleme</h3>
                    <p className="text-sm text-gray-600">Ambalajlama kayıtları</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 lg:mt-0">
                <button 
                      onClick={() => {
                        setFiltreAmbalajlamaRecete('');
                        setFiltreAmbalajlamaMusteri('');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"
                    >
                      Filtreleri Temizle
                    </button>
                    <button
                      onClick={() => handleExcelExport(filtrelenmisAmbalajlamaKayitlari, 'Ambalajlama_Kayitlari')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Download size={14} />
                      <span>Excel'e Aktar</span>
                </button>
              </div>
                </div>
                
                {/* Tarih Seçimi */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="bg-white border border-gray-200 rounded-md inline-flex">
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('bugun')}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'bugun' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } rounded-l-md`}
                    >
                      Bugün
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('dun')}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'dun' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200`}
                    >
                      Dün
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('haftalik')}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'haftalik' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200`}
                    >
                      Bu Hafta
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('aylik')}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'aylik' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200`}
                    >
                      Bu Ay
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('gecenay')}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'gecenay' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200`}
                    >
                      Geçen Ay
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setAmbalajlamaTarihAraligi('ozel');
                        // Varsayılan tarih aralığını ayarlıyoruz, böylece özel aralık seçildiğinde input'larda tarih olacak
                        if (!ambalajlamaBaslangicTarihi) {
                          setAmbalajlamaBaslangicTarihi(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                        }
                        if (!ambalajlamaBitisTarihi) {
                          setAmbalajlamaBitisTarihi(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                        }
                      }}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'ozel' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200 rounded-r-md`}
                    >
                      Özel Aralık
                    </button>
                  </div>
                  
                  {/* Özel tarih seçimi her zaman görünür yapılıyor */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={ambalajlamaBaslangicTarihi}
                      onChange={(e) => handleAmbalajlamaOzelTarihDegisim(e.target.value, ambalajlamaBitisTarihi)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="date"
                      value={ambalajlamaBitisTarihi}
                      onChange={(e) => handleAmbalajlamaOzelTarihDegisim(ambalajlamaBaslangicTarihi, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Filtreler */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="filtreAmbalajlamaRecete" className="block text-sm font-medium text-gray-700 mb-1">
                      Reçete Adı
                    </label>
                    <input
                      id="filtreAmbalajlamaRecete"
                      type="text"
                      value={filtreAmbalajlamaRecete}
                      onChange={(e) => setFiltreAmbalajlamaRecete(e.target.value)}
                      placeholder="Reçete adı ara..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
              </div>
                  <div>
                    <label htmlFor="filtreAmbalajlamaMusteri" className="block text-sm font-medium text-gray-700 mb-1">
                      Müşteri
                    </label>
                    <input
                      id="filtreAmbalajlamaMusteri"
                      type="text"
                      value={filtreAmbalajlamaMusteri}
                      onChange={(e) => setFiltreAmbalajlamaMusteri(e.target.value)}
                      placeholder="Müşteri ara..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
            </div>
          </div>
                
                <div className="overflow-x-auto max-w-full">
                  <div className="inline-block min-w-full shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                          <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalajlama Tarihi
                            </th>
                          <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reçete Adı
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Marka
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Müşteri
                            </th>
                          <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ML Bilgisi
                            </th>
                          <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalajlanan Adet
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                              Toplam Maliyet
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-100">
                              Toplam Satış Değeri
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-200">
                              Kâr
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50">
                              Birim Satış Fiyatı
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Kg Bulk Maliyet
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                              Adet Bulk Maliyet
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                              Ambalaj Maliyeti
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                              Adet Ambalajlı Maliyet
                            </th>
                            <th className="px-3 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Üretim Kuyruğu ID
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filtrelenmisAmbalajlamaKayitlari.map((kayit, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {format(new Date(kayit.ambalajlama_tarihi), 'dd.MM.yyyy')}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {kayit.recete_adi}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                {kayit.marka}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                {kayit.musteri}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {kayit.ml_bilgisi} ml
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {kayit.ambalajlanan_adet} adet
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-green-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_maliyet)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-green-100">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_satis_degeri)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-700 bg-green-200">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.kar)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-red-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.birim_satis_fiyati)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-gray-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.kg_bulk_maliyet)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-gray-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.adet_bulk_maliyet)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-blue-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.ambalaj_maliyeti)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700 bg-purple-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.adet_ambalajli_maliyet)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-700">
                                {kayit.uretim_kuyrugu_id}
                              </td>
                            </tr>
                          ))}
                          {filtrelenmisAmbalajlamaKayitlari.length === 0 && (
                            <tr>
                              <td colSpan={15} className="px-3 py-4 text-center text-sm text-gray-500">
                                Bu kriterlere uygun ambalajlama kaydı bulunamadı. {ambalajlamaKayitlari.length > 0 ? `Filtreleme öncesi ${ambalajlamaKayitlari.length} kayıt mevcut.` : 'Hiç kayıt bulunamadı.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  Toplam {filtrelenmisAmbalajlamaKayitlari.length} ambalajlama kaydı ({ambalajlamaKayitlari.length} toplam)
                </div>
              </div>
              
              {/* Reçeteler Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Reçete Detayları</h3>
                  <div className="flex items-center space-x-2">
                <button 
                      onClick={handleFiltreleriTemizle}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"
                    >
                      Filtreleri Temizle
                    </button>
                    <button
                      onClick={() => setShowReceteFiyatModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <TrendingUp size={14} />
                      <span>Reçete Birim Satış Fiyatı Güncelle</span>
                    </button>
                    <button
                      onClick={() => handleExcelExport(filtrelenmisReceteler, 'Recete_Detaylari')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Download size={14} />
                      <span>Excel'e Aktar</span>
                </button>
              </div>
                </div>
                
                {/* Filtreler */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="filtreReceteAdi" className="block text-sm font-medium text-gray-700 mb-1">
                      Reçete Adı
                    </label>
                    <input
                      id="filtreReceteAdi"
                      type="text"
                      value={filtreliReceteAdi}
                      onChange={(e) => setFiltreliReceteAdi(e.target.value)}
                      placeholder="Reçete adı ara..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="filtreMarka" className="block text-sm font-medium text-gray-700 mb-1">
                      Marka
                    </label>
                    <input
                      id="filtreMarka"
                      type="text"
                      value={filtreliMarka}
                      onChange={(e) => setFiltreliMarka(e.target.value)}
                      placeholder="Marka ara..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto max-w-full">
                  <div className="inline-block min-w-full shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reçete Adı
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Marka
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reçete ID
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ML Bilgisi
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Birim Satış Fiyatı
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Maliyet (Bulk, kg)
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Maliyet (Bulk, adet)
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalaj Maliyeti
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Maliyet (Ambalajlı, adet)
                            </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {filtrelenmisReceteler.map((recete, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {recete['Reçete Adı']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {recete['Marka']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {recete['Reçete ID']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {recete.ml_bilgisi} ml
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.birim_satis_fiyati)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.kg_bulk_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.adet_bulk_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.ambalaj_maliyeti)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.adet_ambalajli_maliyet)}
                              </td>
                          </tr>
                          ))}
                    </tbody>
                  </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  Toplam {filtrelenmisReceteler.length} reçete görüntüleniyor ({receteler.length} toplam)
                </div>
              </div>
              
              {/* Stok Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Stok Tablosu</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative w-48">
                      <input
                        type="text"
                        value={stokArama}
                        onChange={(e) => setStokArama(e.target.value)}
                        placeholder="Arama..."
                        className="w-full px-3 py-1.5 pl-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute left-2 top-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <button 
                      onClick={handleStokFiltreleriTemizle}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                    >
                      Filtreleri Temizle
                    </button>
                    <button
                      onClick={() => setShowStokFiyatModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center space-x-1"
                    >
                      <TrendingUp size={14} />
                      <span>Stok Fiyatı Güncelle</span>
                    </button>
                    <button
                      onClick={() => handleExcelExport(filtrelenmisStokVerileri, 'Stok_Verileri')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Download size={14} />
                      <span>Excel'e Aktar</span>
                    </button>
                  </div>
                </div>
                
                {/* Stok Değerleri Bilgi Kutuları */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Toplam Mevcut Stok Değeri */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-gray-600">Mevcut Stok Değeri</p>
                    <h4 className="text-xl font-bold text-blue-700 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(toplamMevcutStokDegeri)}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Tüm stokların değeri</p>
                  </div>
                  
                  {/* Toplam Net Stok Değeri */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-sm font-medium text-gray-600">Net Stok Değeri</p>
                    <h4 className="text-xl font-bold text-green-700 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(toplamNetStokDegeri)}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Rezerve düşülmüş stok değeri</p>
                  </div>
                  
                  {/* Ambalaj Stoğu Net Değeri */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-sm font-medium text-gray-600">Ambalaj Stoğu Net Değeri</p>
                    <h4 className="text-xl font-bold text-purple-700 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(ambalajStokDegeri)}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Sadece ambalaj kategorisindeki stoklar</p>
                  </div>
                  
                  {/* Hammadde Stoğu Net Değeri */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <p className="text-sm font-medium text-gray-600">Hammadde Stoğu Net Değeri</p>
                    <h4 className="text-xl font-bold text-amber-700 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(hammaddeStokDegeri)}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Sadece hammadde kategorisindeki stoklar</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto max-w-full">
                  <div className="inline-block min-w-full shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Hammadde ID')}
                            >
                              Hammadde ID
                              {stokSiralama === 'Hammadde ID' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Hammadde Adı')}
                            >
                              Hammadde Adı
                              {stokSiralama === 'Hammadde Adı' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Stok Kategori')}
                            >
                              Stok Kategori
                              {stokSiralama === 'Stok Kategori' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('kategori_detay')}
                            >
                              Kategori Detay
                              {stokSiralama === 'kategori_detay' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Mevcut Stok')}
                            >
                              Mevcut Stok
                              {stokSiralama === 'Mevcut Stok' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Rezerve Edildi')}
                            >
                              Rezerve Edildi
                              {stokSiralama === 'Rezerve Edildi' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Net Stok')}
                            >
                              Net Stok
                              {stokSiralama === 'Net Stok' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Birim')}
                            >
                              Birim
                              {stokSiralama === 'Birim' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('Kritik Stok')}
                            >
                              Kritik Stok
                              {stokSiralama === 'Kritik Stok' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleStokSiralama('kg_fiyat')}
                            >
                              Kg veya Adet Fiyat
                              {stokSiralama === 'kg_fiyat' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th 
                              className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 text-green-600 cursor-pointer hover:bg-green-100"
                              onClick={() => handleStokSiralama('stok_degeri')}
                            >
                              Stok Değeri (EUR)
                              {stokSiralama === 'stok_degeri' && (
                                <span className="ml-1">{stokSiralamaYonu === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filtrelenmisStokVerileri.map((stok, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {stok['Hammadde ID']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {stok['Hammadde Adı']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {stok['Stok Kategori']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {stok['kategori_detay']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {stok['Mevcut Stok']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {stok['Rezerve Edildi']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {stok['Net Stok']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700">
                                {stok['Birim']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {stok['Kritik Stok']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(stok['kg_fiyat'])}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-green-600 bg-green-50">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(stok['Mevcut Stok'] * stok['kg_fiyat'])}
                              </td>
                            </tr>
                          ))}
                          {filtrelenmisStokVerileri.length === 0 && (
                            <tr>
                              <td colSpan={11} className="px-4 py-4 text-center text-sm text-gray-500">
                                Bu kriterlere uygun stok kaydı bulunamadı. {stokVerileri.length > 0 ? `Filtreleme öncesi ${stokVerileri.length} kayıt mevcut.` : 'Hiç kayıt bulunamadı.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                  <div>
                    Toplam {filtrelenmisStokVerileri.length} stok kaydı görüntüleniyor ({stokVerileri.length} toplam)
                  </div>
                  <div className="font-medium text-right">
                    <span className="text-blue-600">Filtrelenmiş Net Stok Değeri:</span> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(filtrelenmisNetStokDegeri)}
                  </div>
                </div>
              </div>
              
              {/* İşletme Giderleri Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">İşletme Giderleri Detayı</h3>
                  <button
                    onClick={() => handleIsletmeGideriDuzenle(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm mt-2 lg:mt-0"
                  >
                    + Yeni Gider Ekle
                  </button>
                </div>
                <div className="overflow-x-auto max-w-full">
                  <div className="inline-block min-w-full shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                  <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gider Kalemi
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aylık Tutar (TL)
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Günlük Tutar (TL)
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Toplam İçindeki Pay (%)
                        </th>
                            <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isletmeGiderleri.map((gider, index) => {
                        const oran = toplamGider > 0 ? (gider.aylik_gider_tl / toplamGider) * 100 : 0;
  
  return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {gider.gider_adi}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(gider.aylik_gider_tl)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(gider.aylik_gider_tl / SABIT_IS_GUNU_SAYISI)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                              {new Intl.NumberFormat('tr-TR', { 
                                style: 'percent', 
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1
                              }).format(oran / 100)}
                              </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                  <div className="flex justify-center space-x-2">
                                    <button
                                      onClick={() => handleIsletmeGideriDuzenle(gider)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Düzenle"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleIsletmeGideriSil(gider.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Sil"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                              </td>
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          </div>
            </div>
          </>
        )}
        
        {/* Gelir Detay Modalı */}
        {showGelirDetay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Toplam Satış Değeri Detayları</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowGelirDetay(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Seçilen tarih aralığı: <span className="font-medium">{ambalajlamaBaslangicTarihi} - {ambalajlamaBitisTarihi}</span></p>
                  <p className="text-sm text-gray-600 mb-4">Toplam satış değeri, seçilen tarih aralığında ambalajlanan ürünlerin potansiyel satış değerlerinin toplamıdır.</p>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
                    <h3 className="text-lg font-semibold text-green-700">Toplam Satış Değeri</h3>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(ambalajlamaToplamSatisDegeri)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tüm ambalajlama kayıtlarındaki satış değerlerinin toplamı</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-700">Toplam Ambalajlanan Adet</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat('tr-TR').format(ambalajlamaToplamAdet)} adet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seçili dönemdeki toplam ürün sayısı</p>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="text-lg font-semibold text-indigo-700">Ortalama Birim Satış Fiyatı</h3>
                      <p className="text-2xl font-bold text-indigo-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(ambalajlamaToplamAdet > 0 ? ambalajlamaToplamSatisDegeri / ambalajlamaToplamAdet : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Adet başına düşen ortalama satış değeri</p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-3">Satış Değeri Hesaplama Formülü:</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 space-y-2">
                    <p><strong>Adet Başına Satış Değeri</strong> = Birim Satış Fiyatı (EUR) × Ambalaj Miktarı (ml) × 0.001 (kg dönüşümü)</p>
                    <p><strong>Toplam Satış Değeri</strong> = Adet Başına Satış Değeri × Ambalajlanan Adet</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3">En Yüksek Satış Değerine Sahip Ürünler:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marka</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Birim Satış F.</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Satış D.</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filtrelenmisAmbalajlamaKayitlari
                          .sort((a, b) => b.toplam_satis_degeri - a.toplam_satis_degeri)
                          .slice(0, 5)
                          .map((kayit, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{kayit.recete_adi}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{kayit.marka}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{kayit.musteri}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{new Intl.NumberFormat('tr-TR').format(kayit.ambalajlanan_adet)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-700">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.birim_satis_fiyati)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-green-600">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_satis_degeri)}</td>
                            </tr>
                          ))}
                        {filtrelenmisAmbalajlamaKayitlari.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                              Bu dönemde ambalajlama kaydı bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Gider Detay Modalı */}
        {showGiderDetay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Toplam Maliyet Detayları</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowGiderDetay(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Seçilen tarih aralığı: <span className="font-medium">{ambalajlamaBaslangicTarihi} - {ambalajlamaBitisTarihi}</span></p>
                  <p className="text-sm text-gray-600 mb-4">Toplam maliyet, seçilen tarih aralığında ambalajlanan ürünlerin maliyetlerinin toplamıdır. Maliyet, bulk üretim (hammadde) ve ambalaj maliyetlerinin toplamından oluşur.</p>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                    <h3 className="text-lg font-semibold text-red-700">Toplam Maliyet</h3>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(ambalajlamaToplamMaliyet)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tüm ambalajlama kayıtlarındaki maliyetlerin toplamı</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h3 className="text-lg font-semibold text-amber-700">Ortalama Adet Maliyeti</h3>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(ambalajlamaToplamAdet > 0 ? ambalajlamaToplamMaliyet / ambalajlamaToplamAdet : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Adet başına düşen ortalama maliyet</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-700">Maliyet Oranı</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { 
                          style: 'percent', 
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        }).format(ambalajlamaToplamSatisDegeri > 0 ? ambalajlamaToplamMaliyet / ambalajlamaToplamSatisDegeri : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Toplam Maliyet ÷ Toplam Satış Değeri</p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-3">Maliyet Hesaplama Formülü:</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 space-y-2">
                    <p><strong>Adet Bulk Maliyeti</strong> = (kg_bulk_maliyet × Ambalaj Miktarı (ml) × 0.001)</p>
                    <p><strong>Adet Ambalajlı Maliyeti</strong> = Adet Bulk Maliyeti + Ambalaj Maliyeti</p>
                    <p><strong>Toplam Maliyet</strong> = Adet Ambalajlı Maliyeti × Ambalajlanan Adet</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3">En Yüksek Maliyetli Ürünler:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bulk Maliyet</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ambalaj Maliyet</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Birim Maliyet</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Maliyet</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filtrelenmisAmbalajlamaKayitlari
                          .sort((a, b) => b.toplam_maliyet - a.toplam_maliyet)
                          .slice(0, 5)
                          .map((kayit, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{kayit.recete_adi}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{new Intl.NumberFormat('tr-TR').format(kayit.ambalajlanan_adet)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">{kayit.ml_bilgisi}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_satis_degeri)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-red-600">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_maliyet)}</td>
                            </tr>
                          ))}
                        {filtrelenmisAmbalajlamaKayitlari.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                              Bu dönemde ambalajlama kaydı bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* İşletme Gideri Düzenleme Modalı */}
        {showIsletmeGideriModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                  {duzenlenecekGider ? 'Gider Kalemini Düzenle' : 'Yeni Gider Kalemi Ekle'}
                </h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowIsletmeGideriModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="giderAdi" className="block text-sm font-medium text-gray-700 mb-1">
                      Gider Adı
                    </label>
                    <input
                      id="giderAdi"
                      type="text"
                      value={yeniGiderAdi}
                      onChange={(e) => setYeniGiderAdi(e.target.value)}
                      placeholder="Gider adını giriniz..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="giderTutar" className="block text-sm font-medium text-gray-700 mb-1">
                      Aylık Tutar (TL)
                    </label>
                    <input
                      id="giderTutar"
                      type="number"
                      value={yeniGiderTutar}
                      onChange={(e) => setYeniGiderTutar(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowIsletmeGideriModal(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleIsletmeGideriKaydet}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Kar/Zarar Detay Modalı */}
        {showKarZararDetay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Kar/Zarar Detayları</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowKarZararDetay(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Seçilen tarih aralığı: <span className="font-medium">{baslangicTarihi} - {bitisTarihi}</span></p>
                  <p className="text-sm text-gray-600 mb-4">Toplam kar, ambalajlama kayıtlarındaki satış değerlerinden maliyetleri çıkararak hesaplanır. Net kar ise bu değerden işletme giderleri düşülerek elde edilir.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-lg border ${ambalajlamaToplamKar >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <h3 className="text-lg font-semibold text-gray-800">Toplam Kar (Brüt)</h3>
                      <p className={`text-2xl font-bold mt-1 ${ambalajlamaToplamKar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(ambalajlamaToplamKar)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">İşletme giderleri düşülmeden önceki kar</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${gercekNetKarZarar >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <h3 className="text-lg font-semibold text-gray-800">Net Kar/Zarar</h3>
                      <p className={`text-2xl font-bold mt-1 ${gercekNetKarZarar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(gercekNetKarZarar)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">İşletme giderleri düşüldükten sonraki kar</p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">İşletme Giderleri {ambalajlamaTarihAraligi === 'aylik' && bugunAyinSonGunuMu() ? '(Aylık Toplam)' : '(Bu Dönem)'}</h3>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format((toplamAylikIsletmeGideri / SABIT_IS_GUNU_SAYISI) * dovizKuru * isGunuSayisi)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ambalajlamaTarihAraligi === 'aylik' && bugunAyinSonGunuMu()
                        ? 'Bu ay için toplam işletme giderleri'
                        : `Seçili dönem için hesaplanan işletme giderleri (${isGunuSayisi} iş günü - sadece hafta içi günler)`}
                    </p>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-3">Kar Hesaplama Formülü:</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 space-y-2">
                    <p><strong>Toplam Kar</strong> = Toplam Satış Değeri - Toplam Maliyet</p>
                    <p><strong>Net Kar/Zarar</strong> = Toplam Kar - İşletme Giderleri</p>
                    <p><strong>İşletme Giderleri (Bu Dönem)</strong> = (Aylık İşletme Gideri / Standart İş Günü) × Döviz Kuru × Seçili Dönemdeki İş Günü Sayısı</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Kar Marjı Analizi:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Brüt Kar Marjı</p>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { 
                          style: 'percent', 
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        }).format(ambalajlamaToplamSatisDegeri > 0 ? ambalajlamaToplamKar / ambalajlamaToplamSatisDegeri : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Toplam Kar ÷ Toplam Satış Değeri</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Net Kar Marjı</p>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { 
                          style: 'percent', 
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        }).format(ambalajlamaToplamSatisDegeri > 0 ? gercekNetKarZarar / ambalajlamaToplamSatisDegeri : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Net Kar ÷ Toplam Satış Değeri</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Satış Detay Modalı */}
        {showSatisDetay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Ambalajlama Detayları</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowSatisDetay(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Seçilen tarih aralığı: <span className="font-medium">{ambalajlamaBaslangicTarihi} - {ambalajlamaBitisTarihi}</span></p>
                  <p className="text-sm text-gray-600 mb-4">Ambalajlama verileri, seçili dönemde üretilen ve paketlenen ürünlerin adetlerini ve mali değerlerini göstermektedir.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-700">Toplam Ambalajlanan</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat('tr-TR').format(ambalajlamaToplamAdet)} adet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seçili dönemde ambalajlanan toplam ürün adedi</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h3 className="text-lg font-semibold text-green-700">Ortalama Satış Fiyatı</h3>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(ambalajlamaToplamAdet > 0 ? ambalajlamaToplamSatisDegeri / ambalajlamaToplamAdet : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Adet başına ortalama satış değeri</p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h3 className="text-lg font-semibold text-amber-700">Ortalama Maliyet</h3>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(ambalajlamaToplamAdet > 0 ? ambalajlamaToplamMaliyet / ambalajlamaToplamAdet : 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Adet başına ortalama maliyet</p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-3">En Çok Ambalajlanan Ürünler:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marka</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ML</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Satış Değeri</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Maliyet</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filtrelenmisAmbalajlamaKayitlari
                          .sort((a, b) => b.ambalajlanan_adet - a.ambalajlanan_adet)
                          .slice(0, 5)
                          .map((kayit, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{kayit.recete_adi}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{kayit.marka}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{new Intl.NumberFormat('tr-TR').format(kayit.ambalajlanan_adet)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">{kayit.ml_bilgisi}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_satis_degeri)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-red-600">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_maliyet)}</td>
                            </tr>
                          ))}
                        {filtrelenmisAmbalajlamaKayitlari.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                              Bu dönemde ambalajlama kaydı bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stok Fiyatı Güncelleme Modalı */}
      {showStokFiyatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Stok Fiyatı Güncelle</h3>
              <button
                onClick={() => {
                  setShowStokFiyatModal(false);
                  setSecilenStok(null);
                  setYeniFiyat('');
                  setStokModalArama('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Stok Arama */}
            <div className="mb-4">
              <label htmlFor="stokModalArama" className="block text-sm font-medium text-gray-700 mb-1">
                Stok Ara
              </label>
              <div className="relative">
                <input
                  id="stokModalArama"
                  type="text"
                  value={stokModalArama}
                  onChange={(e) => setStokModalArama(e.target.value)}
                  placeholder="Hammadde adı, ID veya kategori ara..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Stok Listesi */}
            <div className="mb-6 overflow-auto max-h-48 border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hammadde ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hammadde Adı
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mevcut Fiyat (EUR)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrelenmisModalStoklar.map((stok) => (
                    <tr 
                      key={stok.ID}
                      onClick={() => handleStokSecim(stok)} 
                      className={`hover:bg-gray-100 cursor-pointer ${secilenStok?.ID === stok.ID ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {stok['Hammadde ID']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stok['Hammadde Adı']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {stok['Stok Kategori']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(stok['kg_fiyat'])}
                      </td>
                    </tr>
                  ))}
                  {filtrelenmisModalStoklar.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-center text-sm text-gray-500">
                        {stokModalArama ? 'Arama kriterlerine uygun stok bulunamadı.' : 'Stok bulunamadı.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Seçilen Stok ve Fiyat Güncelleme */}
            {secilenStok ? (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Seçilen Stok: {secilenStok['Hammadde Adı']}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mevcut Fiyat
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md border border-gray-300 text-gray-700">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(secilenStok['kg_fiyat'])}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="yeniFiyat" className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Fiyat (EUR)
                    </label>
                    <input
                      id="yeniFiyat"
                      type="number"
                      min="0"
                      step="0.01"
                      value={yeniFiyat}
                      onChange={(e) => setYeniFiyat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Yeni fiyatı giriniz..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowStokFiyatModal(false);
                      setSecilenStok(null);
                      setYeniFiyat('');
                      setStokModalArama('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={fiyatGuncellemeLoading}
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleStokFiyatiGuncelle}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={fiyatGuncellemeLoading}
                  >
                    {fiyatGuncellemeLoading ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                        Güncelleniyor...
                      </>
                    ) : (
                      'Fiyatı Güncelle'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Fiyatını güncellemek istediğiniz stoğu listeden seçiniz.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reçete Birim Satış Fiyatı Güncelleme Modalı */}
      {showReceteFiyatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Reçete Birim Satış Fiyatı Güncelle</h3>
              <button
                onClick={() => {
                  setShowReceteFiyatModal(false);
                  setSecilenRecete(null);
                  setYeniReceteFiyati('');
                  setReceteModalArama('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Reçete Arama */}
            <div className="mb-4">
              <label htmlFor="receteModalArama" className="block text-sm font-medium text-gray-700 mb-1">
                Reçete Ara
              </label>
              <div className="relative">
                <input
                  id="receteModalArama"
                  type="text"
                  value={receteModalArama}
                  onChange={(e) => setReceteModalArama(e.target.value)}
                  placeholder="Reçete adı, ID veya marka ara..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Reçete Listesi */}
            <div className="mb-6 overflow-auto max-h-48 border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reçete ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reçete Adı
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marka
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ML Bilgisi
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mevcut Birim Satış Fiyatı (EUR)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrelenmisModalReceteler.map((recete) => (
                    <tr 
                      key={recete.id}
                      onClick={() => handleReceteSecim(recete)} 
                      className={`hover:bg-gray-100 cursor-pointer ${secilenRecete?.id === recete.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {recete['Reçete ID']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {recete['Reçete Adı']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {recete['Marka']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                        {recete.ml_bilgisi} ml
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.birim_satis_fiyati)}
                      </td>
                    </tr>
                  ))}
                  {filtrelenmisModalReceteler.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center text-sm text-gray-500">
                        {receteModalArama ? 'Arama kriterlerine uygun reçete bulunamadı.' : 'Reçete bulunamadı.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Seçilen Reçete ve Fiyat Güncelleme */}
            {secilenRecete ? (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Seçilen Reçete: {secilenRecete['Reçete Adı']}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mevcut Birim Satış Fiyatı
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md border border-gray-300 text-gray-700">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(secilenRecete.birim_satis_fiyati)}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="yeniReceteFiyati" className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Birim Satış Fiyatı (EUR)
                    </label>
                    <input
                      id="yeniReceteFiyati"
                      type="number"
                      min="0"
                      step="0.01"
                      value={yeniReceteFiyati}
                      onChange={(e) => setYeniReceteFiyati(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Yeni fiyatı giriniz..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowReceteFiyatModal(false);
                      setSecilenRecete(null);
                      setYeniReceteFiyati('');
                      setReceteModalArama('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={receteFiyatGuncellemeLoading}
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleReceteFiyatiGuncelle}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={receteFiyatGuncellemeLoading}
                  >
                    {receteFiyatGuncellemeLoading ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                        Güncelleniyor...
                      </>
                    ) : (
                      'Fiyatı Güncelle'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Birim satış fiyatını güncellemek istediğiniz reçeteyi listeden seçiniz.
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default createPage(MaliPerformansPage, '/raporlar/mali-performans'); 