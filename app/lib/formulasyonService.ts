import { fetchAllFromTable, fetchFilteredData } from './supabase';

export interface Hammadde {
  'Hammadde Adı': string;
  'Oran(100Kg)': number;
  'Miktar'?: number;
  'Stok Kategori'?: string;
}

/**
 * Belirli bir reçete adına göre formülasyon verilerini getirir
 * @param receteAdi Reçete adı
 * @param uretimMiktari Üretim miktarı (kg) - Miktar hesabı için
 * @param bypassCache Önbelleği bypass etmek için
 * @param manuelAmbalajEmri Manuel olarak belirtilen ambalaj emri değeri (ml)
 */
export async function getFormulasyonByReceteAdi(receteAdi: string, uretimMiktari: number = 0, bypassCache: boolean = false, manuelAmbalajEmri?: number): Promise<Hammadde[]> {
  try {
    console.log('getFormulasyonByReceteAdi çağrıldı:', { receteAdi, uretimMiktari, bypassCache, manuelAmbalajEmri });
    
    // Formülasyonlar tablosundan reçete adına göre verileri çek
    const formulasyonlar = await fetchFilteredData('Formülasyonlar', 'Reçete Adı', receteAdi, bypassCache);
    console.log('Formülasyon verileri alındı:', formulasyonlar);

    // Recete bilgilerini çek - Ambalaj Emri (ml) bilgisi için
    // Manuel ambalaj emri değeri verilmişse, onu kullan
    let ambalajEmri: number;
    
    if (manuelAmbalajEmri !== undefined) {
      // Kullanıcı tarafından sağlanan ambalaj emri değerini kullan
      ambalajEmri = manuelAmbalajEmri;
      console.log('Manuel ambalaj emri kullanılıyor:', ambalajEmri);
    } else {
      // Veritabanından ambalaj emri değerini çek
      const receteVerileri = await fetchFilteredData('Üretim Kuyruğu', 'Reçete Adı', receteAdi, bypassCache);
      // En son eklenen reçete verisini al (id'ye göre sıralı olduğunu varsayıyoruz)
      const recete = receteVerileri.length > 0 ? receteVerileri.sort((a: any, b: any) => b.id - a.id)[0] : null;
      ambalajEmri = recete && recete['Ambalaj Emri (ml)'] ? parseFloat(recete['Ambalaj Emri (ml)']) : 0;
      console.log('Veritabanından alınan ambalaj emri:', ambalajEmri);
    }
    
    console.log('Reçete ve Ambalaj Emri bilgisi:', { ambalajEmri });

    // Hammadde listesini oluştur ve üretim miktarına göre gerçek miktar hesabını yap
    const hammaddeler = formulasyonlar.map((item: any) => {
      const stokKategori = item['Stok Kategori'] || '';
      
      // Stok kategorisi "Ambalaj" ise özel hesaplama yap
      let miktar = 0;
      if (stokKategori.toLowerCase() === 'ambalaj' && ambalajEmri > 0) {
        // Ambalaj için özel formül: (üretim miktarı * 1000) / ambalaj emri
        miktar = (uretimMiktari * 1000) / ambalajEmri;
        console.log('Ambalaj miktarı hesaplandı:', { hammadde: item['Hammadde Adı'], miktar, formül: `(${uretimMiktari} * 1000) / ${ambalajEmri}` });
      } else {
        // Normal hammadde hesaplama formülü
        miktar = calculateMiktar(item['Oran(100Kg)'], uretimMiktari);
      }
      
      return {
        'Hammadde Adı': item['Hammadde Adı'],
        'Oran(100Kg)': item['Oran(100Kg)'],
        'Miktar': miktar,
        'Stok Kategori': stokKategori
      };
    });
    
    console.log('Formülasyon hazırlandı:', hammaddeler);
    return hammaddeler;
  } catch (error) {
    console.error('Formülasyon verisi çekilirken hata oluştu:', error);
    return [];
  }
}

/**
 * Reçetenin adını ve üretim numarasını alır
 * @param receteId Reçete ID
 * @param bypassCache Önbelleği bypass etmek için
 */
export async function getReceteById(receteId: string, bypassCache: boolean = false): Promise<any | null> {
  try {
    const receteler = await fetchFilteredData('Reçeteler', 'Reçete ID', receteId, bypassCache);
    return receteler.length > 0 ? receteler[0] : null;
  } catch (error) {
    console.error('Reçete verisi çekilirken hata oluştu:', error);
    return null;
  }
}

/**
 * Oran ve üretim miktarına göre gerçek miktar hesabı yapar
 * @param oran 100 kg üretim için oran
 * @param uretimMiktari Toplam üretim miktarı (kg)
 */
function calculateMiktar(oran: number, uretimMiktari: number): number {
  if (!oran || !uretimMiktari) return 0;
  return (oran * uretimMiktari) / 100;
}

// Günlük üretim numarası sayacı
let lastGeneratedDate: string = '';
let dailyCounter: number = 0;

/**
 * Üretim emri numarası oluşturur
 * Format: MP + yıl + ay + id
 * @param id Üretim Kuyruğu tablosundaki kaydın ID'si
 */
export function generateUretimNo(id?: number): string {
  const now = new Date();
  const year = now.getFullYear().toString().substring(2); // Son 2 basamak (örn: 24)
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Eğer ID verilmişse onu kullan, verilmemişse "XX" 
  const idStr = id ? id.toString().padStart(2, '0') : "XX";
  
  return `MP${year}${month}${idStr}`;
}

/**
 * Bugünün tarihini formatlar
 * Format: DD/MM/YYYY
 */
export function formatTarih(date: Date = new Date()): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
} 