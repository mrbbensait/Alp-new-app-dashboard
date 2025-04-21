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
 */
export async function getFormulasyonByReceteAdi(receteAdi: string, uretimMiktari: number = 0, bypassCache: boolean = false): Promise<Hammadde[]> {
  try {
    console.log('getFormulasyonByReceteAdi çağrıldı:', { receteAdi, uretimMiktari, bypassCache });
    
    // Formülasyonlar tablosundan reçete adına göre verileri çek
    const formulasyonlar = await fetchFilteredData('Formülasyonlar', 'Reçete Adı', receteAdi, bypassCache);
    console.log('Formülasyon verileri alındı:', formulasyonlar);

    // Hammadde listesini oluştur ve üretim miktarına göre gerçek miktar hesabını yap
    const hammaddeler = formulasyonlar.map((item: any) => ({
      'Hammadde Adı': item['Hammadde Adı'],
      'Oran(100Kg)': item['Oran(100Kg)'],
      'Miktar': calculateMiktar(item['Oran(100Kg)'], uretimMiktari),
      'Stok Kategori': item['Stok Kategori'] || ''
    }));
    
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

/**
 * Üretim emri numarası oluşturur
 * Format: MP + yıl + ay + gün + rastgele 2 basamaklı sayı
 */
export function generateUretimNo(): string {
  const now = new Date();
  const year = now.getFullYear().toString().substring(2); // Son 2 basamak (örn: 24)
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `MP${year}${month}${day}${random}`;
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