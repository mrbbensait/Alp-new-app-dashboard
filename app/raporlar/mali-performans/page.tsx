'use client';

import React, { useState, useEffect } from 'react';
import { createPage } from '@/app/lib/createPage';
import { supabase } from '@/app/lib/supabase';
import { format, subDays, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
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
type TarihAraligi = 'bugun' | 'dun' | 'haftalik' | 'aylik' | 'ozel';

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
  ml_bilgisi: number;
  satis_fiyati_kg_bulk: number;
  satis_fiyati_kg_ambalajli: number;
  kg_bulk_maliyet: number;
  adet_bulk_maliyet: number;
  ambalaj_maliyeti: number;
  kg_ambalajli_maliyet: number;
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
  satis_fiyati_kg_bulk: number;
  satis_fiyati_kg_ambalajli: number;
  kg_bulk_maliyet: number;
  adet_bulk_maliyet: number;
  ambalaj_maliyeti: number;
  kg_ambalajli_maliyet: number;
  adet_ambalajli_maliyet: number;
  toplam_satis_degeri: number;
  toplam_maliyet: number;
  kar: number;
  kullanici: string;
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
  // const [filtrelenmisUrunStogu, setFiltrelenmisUrunStogu] = useState<BitmisUrunStogu[]>([]);
  
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
  
  // Günlük kar-zarar verileri
  const [gunlukKarZararVerileri, setGunlukKarZararVerileri] = useState<{[key: string]: number}>({});
  
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
          
          // Reçete verisini ayarla
          if (performansData.receteler) {
            setReceteler(performansData.receteler);
          }
          
          // Bitmiş Ürün Stoğu verilerini getir
          getBitmisUrunStogu();
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
        yeniBaslangic = format(startOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd');
        yeniBitis = format(endOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd');
        break;
      
      case 'aylik':
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
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
  
  // Excel'e verileri aktar
  const handleExcelExport = () => {
    // Excel export işlemi burada yapılacak
    alert('Excel export özelliği henüz eklenmedi');
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
      
      // Ambalajlama kayıtlarını çek
      const { data, error } = await supabase
        .from('AmbalajlamaKayitlari')
        .select('*')
        .gte('ambalajlama_tarihi', ambalajlamaBaslangicTarihi)
        .lte('ambalajlama_tarihi', ambalajlamaBitisTarihi)
        .order('ambalajlama_tarihi', { ascending: false });
      
      if (error) throw error;
      
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
        yeniBaslangic = format(startOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd');
        yeniBitis = format(endOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd');
        break;
      
      case 'aylik':
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
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
        yeniBaslangic = format(startOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd');
        yeniBitis = format(endOfWeek(bugun, { locale: tr }), 'yyyy-MM-dd');
        break;
      
      case 'aylik':
        yeniBaslangic = format(startOfMonth(bugun), 'yyyy-MM-dd');
        yeniBitis = format(endOfMonth(bugun), 'yyyy-MM-dd');
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
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mali Performans Analizi</h1>
          
          <div className="flex space-x-3">
            {/* Tarih aralığı seçici */}
            <div className="bg-white border border-gray-200 rounded-md inline-flex">
              <button
                type="button"
                onClick={() => handleTarihAralikDegistir('bugun')}
                className={`px-3 py-2 text-sm ${
                  tarihAraligi === 'bugun' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                } rounded-l-md`}
              >
                Bugün
              </button>
              
              <button
                type="button"
                onClick={() => handleTarihAralikDegistir('haftalik')}
                className={`px-3 py-2 text-sm ${
                  tarihAraligi === 'haftalik' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                } border-l border-gray-200`}
              >
                Bu Hafta
              </button>
              
              <button
                type="button"
                onClick={() => handleTarihAralikDegistir('aylik')}
                className={`px-3 py-2 text-sm ${
                  tarihAraligi === 'aylik' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                } border-l border-gray-200 rounded-r-md`}
              >
                Bu Ay
              </button>
            </div>
            
            {/* Özel tarih girişi */}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={baslangicTarihi}
                onChange={(e) => handleOzelTarihDegisim(e.target.value, bitisTarihi)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={bitisTarihi}
                onChange={(e) => handleOzelTarihDegisim(baslangicTarihi, e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </div>
            
            {/* Grafik türü seçici */}
            <div className="bg-white border border-gray-200 rounded-md inline-flex">
              <button
                type="button"
                onClick={() => handleGrafikTuruDegistir('cizgi')}
                className={`relative p-2 flex items-center justify-center ${
                  grafikTuru === 'cizgi' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                } rounded-l-md`}
                title="Çizgi Grafik"
              >
                <LineChart size={20} />
              </button>
              
              <button
                type="button"
                onClick={() => handleGrafikTuruDegistir('bar')}
                className={`relative p-2 flex items-center justify-center ${
                  grafikTuru === 'bar' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                } border-l border-gray-200`}
                title="Bar Grafik"
              >
                <BarChart size={20} />
              </button>
              
              <button
                type="button"
                onClick={() => handleGrafikTuruDegistir('pasta')}
                className={`relative p-2 flex items-center justify-center ${
                  grafikTuru === 'pasta' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                } border-l border-gray-200 rounded-r-md`}
                title="Pasta Grafik"
              >
                <PieChart size={20} />
              </button>
            </div>
            
            {/* Excel'e aktar butonu */}
            <button
              onClick={handleExcelExport}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-1"
            >
              <Download size={16} />
              <span>Excel'e Aktar</span>
            </button>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Toplam Gelir */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowGelirDetay(true)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Toplam Gelir</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(toplamGelir)}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Teslimat faturalarının toplamı
                </div>
              </div>
              
              {/* Toplam Gider */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowGiderDetay(true)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Toplam Gider</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(toplamGider)}
                    </h3>
                  </div>
                  <div className="bg-red-100 p-2 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  İşletme giderleri toplamı
                </div>
              </div>
              
              {/* Net Kar/Zarar */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowKarZararDetay(true)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Net Kar/Zarar</p>
                    <h3 className={`text-2xl font-bold mt-1 ${netKarZarar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(netKarZarar)}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-lg ${netKarZarar >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {netKarZarar >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Gelir - Gider
                </div>
              </div>
              
              {/* Toplam Satış Adedi */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowSatisDetay(true)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Toplam Satış Adedi</p>
                    <h3 className="text-2xl font-bold text-blue-600 mt-1">
                      {new Intl.NumberFormat('tr-TR').format(satisAdetleri)}
                    </h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Toplam teslimat adedi
                </div>
              </div>
            </div>
            
            {/* Grafikler ve Tablolar */}
            <div className="grid grid-cols-1 gap-6 mb-8">
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
                      onClick={handleExcelExport}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Download size={14} />
                      <span>Excel'e Aktar</span>
                    </button>
                </div>
              </div>
              
                {/* Filtreler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                              Satış Fiyatı (Bulk)
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Satış Fiyatı (Amb.)
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
                              Maliyet (Amb., kg)
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Maliyet (Amb., adet)
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
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.satis_fiyati_kg_bulk)}
                            </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.satis_fiyati_kg_ambalajli)}
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
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(recete.kg_ambalajli_maliyet)}
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
              
              {/* İşletme Giderleri Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">İşletme Giderleri Detayı</h3>
                  <button
                    onClick={() => handleIsletmeGideriDuzenle(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
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
                        const gunlukTutar = gider.aylik_gider_tl / 22; // 22 iş günü
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {gider.gider_adi}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(gider.aylik_gider_tl)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(gunlukTutar)}
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
              
              {/* Bitmiş Ürün Stoğu Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Bitmiş Ürün Stoğu</h3>
                  <div className="flex items-center space-x-2">
                <button 
                      onClick={handleBitmisUrunFiltreleriTemizle}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"
                    >
                      Filtreleri Temizle
                    </button>
                    <button
                      onClick={handleExcelExport}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Download size={14} />
                      <span>Excel'e Aktar</span>
                </button>
              </div>
                </div>
                
                {/* Tarih Aralığı Filtreleri */}
                <div className="mb-4">
                  <div className="bg-white border border-gray-200 rounded-md inline-flex mb-3">
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('bugun')}
                      className={`px-3 py-2 text-sm ${
                        ambalajlamaTarihAraligi === 'bugun' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Bugün
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('haftalik')}
                      className={`px-3 py-2 text-sm ${
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
                      className={`px-3 py-2 text-sm ${
                        ambalajlamaTarihAraligi === 'aylik' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200`}
                    >
                      Bu Ay
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={ambalajlamaBaslangicTarihi}
                      onChange={(e) => handleAmbalajlamaOzelTarihDegisim(e.target.value, ambalajlamaBitisTarihi)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="date"
                      value={ambalajlamaBitisTarihi}
                      onChange={(e) => handleAmbalajlamaOzelTarihDegisim(ambalajlamaBaslangicTarihi, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                
                {/* Filtreler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="filtreBitmisUrunRecete" className="block text-sm font-medium text-gray-700 mb-1">
                      Reçete Adı
                    </label>
                    <input
                      id="filtreBitmisUrunRecete"
                      type="text"
                      value={filtreBitmisUrunRecete}
                      onChange={(e) => setFiltreBitmisUrunRecete(e.target.value)}
                      placeholder="Reçete adı ara..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
              </div>
                  <div>
                    <label htmlFor="filtreBitmisUrunMusteri" className="block text-sm font-medium text-gray-700 mb-1">
                      Müşteri
                    </label>
                    <input
                      id="filtreBitmisUrunMusteri"
                      type="text"
                      value={filtreBitmisUrunMusteri}
                      onChange={(e) => setFiltreBitmisUrunMusteri(e.target.value)}
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
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reçete Adı
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reçete ID
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Müşteri
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalaj (ml)
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Paketlendiği Tarih
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              STOK / ADET
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Teslim Edilen
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Teslimat Tarihi
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kalan Adet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Üretim Kuyruğu Ref.
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filtrelenmisUrunStogu.map((urun, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {urun['Reçete Adı']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {urun['Reçete ID']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {urun['Müşteri']}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {urun['Ambalaj (ml)']} ml
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700">
                                {urun['Paketlendiği Tarih'] ? format(new Date(urun['Paketlendiği Tarih']), 'dd.MM.yyyy') : '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {urun["STOK / ADET"] || 0} adet
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {urun["Teslim Edilen"] || 0} adet
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700">
                                {urun['Teslimat Tarihi'] ? format(new Date(urun['Teslimat Tarihi']), 'dd.MM.yyyy') : '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {urun["Kalan Adet"] || 0} adet
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {urun["Üretim Kuyruğu Referans"] || '-'}
                              </td>
                            </tr>
                          ))}
                          {filtrelenmisUrunStogu.length === 0 && (
                            <tr>
                              <td colSpan={10} className="px-4 py-4 text-center text-sm text-gray-500">
                                Bu kriterlere uygun bitmiş ürün stoğu bulunamadı. {bitmisUrunStogu.length > 0 ? `Filtreleme öncesi ${bitmisUrunStogu.length} kayıt mevcut.` : 'Hiç kayıt bulunamadı.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  Toplam {filtrelenmisUrunStogu.length} ürün stokta ({bitmisUrunStogu.length} toplam)
                </div>
              </div>
              
              {/* Ambalajlama Kayıtları Tablosu */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Ambalajlama Kayıtları</h3>
                  <div className="flex items-center space-x-2">
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
                      onClick={handleExcelExport}
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
                      Son 7 Gün
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
                      onClick={() => handleAmbalajlamaTarihAralikDegistir('ozel')}
                      className={`relative px-3 py-1.5 text-sm ${
                        ambalajlamaTarihAraligi === 'ozel' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'text-gray-600 hover:bg-gray-50'
                      } border-l border-gray-200 rounded-r-md`}
                    >
                      Özel Aralık
                    </button>
                  </div>
                  
                  {ambalajlamaTarihAraligi === 'ozel' && (
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
                  )}
                </div>
                
                {/* Filtreler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kimlik Numarası
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Üretim Kuyruğu Kimlik Numarası
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reçete Adı
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Marka
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Müşteri
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mililitre Bilgisi
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalajlanan Adet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalajlama Tarihi
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Satış Fiyatı Kilogram Bulk
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Satış Fiyatı Kilogram Ambalajlı
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kilogram Bulk Maliyet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Adet Bulk Maliyet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ambalaj Maliyeti
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kilogram Ambalajlı Maliyet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Adet Ambalajlı Maliyet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Toplam Satış Değeri
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Toplam Maliyet
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kâr
                            </th>
                            <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {filtrelenmisAmbalajlamaKayitlari.map((kayit, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {kayit.id}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {kayit.uretim_kuyrugu_id}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {kayit.recete_adi}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {kayit.marka}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {kayit.musteri}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {kayit.ml_bilgisi} ml
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {kayit.ambalajlanan_adet} adet
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {format(new Date(kayit.ambalajlama_tarihi), 'dd.MM.yyyy')}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.satis_fiyati_kg_bulk)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.satis_fiyati_kg_ambalajli)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.kg_bulk_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.adet_bulk_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.ambalaj_maliyeti)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.kg_ambalajli_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.adet_ambalajli_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_satis_degeri)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.toplam_maliyet)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(kayit.kar)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700">
                                {kayit.kullanici}
                              </td>
                            </tr>
                          ))}
                          {filtrelenmisAmbalajlamaKayitlari.length === 0 && (
                            <tr>
                              <td colSpan={20} className="px-4 py-4 text-center text-sm text-gray-500">
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
            </div>
          </>
        )}
        
        {/* Gelir Detay Modalı */}
        {showGelirDetay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Gelir Detayları</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowGelirDetay(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Seçilen tarih aralığı: <span className="font-medium">{baslangicTarihi} - {bitisTarihi}</span></p>
                  <p className="text-sm text-gray-600 mb-4">Toplam gelir, seçilen tarih aralığında teslimat geçmişindeki faturalandırılmış ürünlerin satış fiyatları toplamıdır.</p>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
                    <h3 className="text-lg font-semibold text-green-700">Toplam Gelir</h3>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(toplamGelir)}
                      </p>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-3">Gelir Hesaplama Formülü:</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700">
                    <p>Reçetenin satış fiyatı (EUR/kg) × Ambalaj miktarı (ml) × 0.001 (kg dönüşümü) × Teslimat adedi</p>
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
                <h2 className="text-xl font-semibold text-gray-800">Gider Detayları</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowGiderDetay(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Seçilen tarih aralığı: <span className="font-medium">{baslangicTarihi} - {bitisTarihi}</span></p>
                  <p className="text-sm text-gray-600 mb-4">Toplam gider, işletme giderleri tablosundaki aylık giderlerin toplamıdır. Bu değer seçilen tarih aralığına göre orantılı olarak hesaplanır.</p>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                    <h3 className="text-lg font-semibold text-red-700">Toplam Gider</h3>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(toplamGider)}
                    </p>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-3">Satış Verilerinin Kaynağı:</h3>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700">
                    <p>Teslimat Geçmişi tablosundaki teslimat_miktari değerlerinin toplamı</p>
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
      </div>
    </DashboardLayout>
  );
}

export default createPage(MaliPerformansPage, '/raporlar/mali-performans'); 