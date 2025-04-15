import { PerformansRaporu, MaliyetFiyat, IslemTuru } from '../lib/types/index';
import { getTarihAraligi } from './date-utils';

/**
 * Bir işlemin toplam maliyetini hesaplar
 */
export function hesaplaMaliyet(miktar: number, birimMaliyet: number): number {
  return miktar * birimMaliyet;
}

/**
 * Bir işlemin toplam gelirini hesaplar
 */
export function hesaplaGelir(miktar: number, birimFiyat: number): number {
  return miktar * birimFiyat;
}

/**
 * Bir işlemin toplam kârını hesaplar (gelir - maliyet)
 */
export function hesaplaKar(miktar: number, birimMaliyet: number, birimFiyat: number): number {
  const maliyet = hesaplaMaliyet(miktar, birimMaliyet);
  const gelir = hesaplaGelir(miktar, birimFiyat);
  return gelir - maliyet;
}

/**
 * Bir rapora ait toplam maliyeti hesaplar
 */
export function hesaplaRaporToplamMaliyet(
  rapor: PerformansRaporu, 
  maliyetFiyatlar: MaliyetFiyat[]
): number {
  let toplamMaliyet = 0;
  
  // Dolum maliyeti
  const dolumMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Dolum);
  if (dolumMaliyetFiyat) {
    toplamMaliyet += hesaplaMaliyet(rapor.dolum, dolumMaliyetFiyat.birim_maliyet);
  }
  
  // Etiketleme maliyeti
  const etiketlemeMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Etiketleme);
  if (etiketlemeMaliyetFiyat) {
    toplamMaliyet += hesaplaMaliyet(rapor.etiketleme, etiketlemeMaliyetFiyat.birim_maliyet);
  }
  
  // Kutulama maliyeti
  const kutulamaMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Kutulama);
  if (kutulamaMaliyetFiyat) {
    toplamMaliyet += hesaplaMaliyet(rapor.kutulama, kutulamaMaliyetFiyat.birim_maliyet);
  }
  
  // Selefon maliyeti
  const selefonMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Selefon);
  if (selefonMaliyetFiyat) {
    toplamMaliyet += hesaplaMaliyet(rapor.selefon, selefonMaliyetFiyat.birim_maliyet);
  }
  
  return toplamMaliyet;
}

/**
 * Bir rapora ait toplam geliri hesaplar
 */
export function hesaplaRaporToplamGelir(
  rapor: PerformansRaporu, 
  maliyetFiyatlar: MaliyetFiyat[]
): number {
  let toplamGelir = 0;
  
  // Dolum geliri
  const dolumMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Dolum);
  if (dolumMaliyetFiyat) {
    toplamGelir += hesaplaGelir(rapor.dolum, dolumMaliyetFiyat.birim_fiyat);
  }
  
  // Etiketleme geliri
  const etiketlemeMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Etiketleme);
  if (etiketlemeMaliyetFiyat) {
    toplamGelir += hesaplaGelir(rapor.etiketleme, etiketlemeMaliyetFiyat.birim_fiyat);
  }
  
  // Kutulama geliri
  const kutulamaMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Kutulama);
  if (kutulamaMaliyetFiyat) {
    toplamGelir += hesaplaGelir(rapor.kutulama, kutulamaMaliyetFiyat.birim_fiyat);
  }
  
  // Selefon geliri
  const selefonMaliyetFiyat = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Selefon);
  if (selefonMaliyetFiyat) {
    toplamGelir += hesaplaGelir(rapor.selefon, selefonMaliyetFiyat.birim_fiyat);
  }
  
  return toplamGelir;
}

/**
 * Bir rapora ait toplam kârı hesaplar
 */
export function hesaplaRaporToplamKar(
  rapor: PerformansRaporu, 
  maliyetFiyatlar: MaliyetFiyat[]
): number {
  const toplamMaliyet = hesaplaRaporToplamMaliyet(rapor, maliyetFiyatlar);
  const toplamGelir = hesaplaRaporToplamGelir(rapor, maliyetFiyatlar);
  return toplamGelir - toplamMaliyet;
}

/**
 * Verilen tarih aralığındaki raporlara ait günlük kâr-zarar verilerini oluşturur
 */
export function hesaplaGunlukKarZararTrend(
  raporlar: PerformansRaporu[], 
  maliyetFiyatlar: MaliyetFiyat[], 
  baslangicTarihi: string, 
  bitisTarihi: string
): Array<{tarih: string, kar: number}> {
  // Tarih aralığındaki tüm günleri al
  const tarihler = getTarihAraligi(baslangicTarihi, bitisTarihi);
  
  return tarihler.map(tarih => {
    // Bu tarihe ait tüm raporları bul
    const gunlukRaporlar = raporlar.filter(rapor => rapor.tarih === tarih);
    
    // Eğer bu gün için rapor yoksa, kâr 0 kabul et
    if (gunlukRaporlar.length === 0) {
      return { tarih, kar: 0 };
    }
    
    // Bu günün toplam kârını hesapla
    const gunlukKar = gunlukRaporlar.reduce((toplam, rapor) => {
      return toplam + hesaplaRaporToplamKar(rapor, maliyetFiyatlar);
    }, 0);
    
    return { tarih, kar: gunlukKar };
  });
}

/**
 * En kârlı işlem türünü bulur
 */
export function enKarliIslemTuru(
  raporlar: PerformansRaporu[], 
  maliyetFiyatlar: MaliyetFiyat[]
): { islemTuru: IslemTuru, toplamKar: number } | null {
  if (raporlar.length === 0 || maliyetFiyatlar.length === 0) {
    return null;
  }
  
  // Toplam dolum, etiketleme, kutulama ve selefon miktarlarını hesapla
  const toplamDolum = raporlar.reduce((toplam, rapor) => toplam + rapor.dolum, 0);
  const toplamEtiketleme = raporlar.reduce((toplam, rapor) => toplam + rapor.etiketleme, 0);
  const toplamKutulama = raporlar.reduce((toplam, rapor) => toplam + rapor.kutulama, 0);
  const toplamSelefon = raporlar.reduce((toplam, rapor) => toplam + rapor.selefon, 0);
  
  // Her işlem türünün birim maliyet ve fiyatını bul
  const dolumMF = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Dolum);
  const etiketlemeMF = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Etiketleme);
  const kutulamaMF = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Kutulama);
  const selefonMF = maliyetFiyatlar.find(m => m.islem_turu === IslemTuru.Selefon);
  
  // Her işlem türünün kârını hesapla
  const karlar: { islemTuru: IslemTuru, toplamKar: number }[] = [];
  
  if (dolumMF && toplamDolum > 0) {
    karlar.push({
      islemTuru: IslemTuru.Dolum,
      toplamKar: hesaplaKar(toplamDolum, dolumMF.birim_maliyet, dolumMF.birim_fiyat)
    });
  }
  
  if (etiketlemeMF && toplamEtiketleme > 0) {
    karlar.push({
      islemTuru: IslemTuru.Etiketleme,
      toplamKar: hesaplaKar(toplamEtiketleme, etiketlemeMF.birim_maliyet, etiketlemeMF.birim_fiyat)
    });
  }
  
  if (kutulamaMF && toplamKutulama > 0) {
    karlar.push({
      islemTuru: IslemTuru.Kutulama,
      toplamKar: hesaplaKar(toplamKutulama, kutulamaMF.birim_maliyet, kutulamaMF.birim_fiyat)
    });
  }
  
  if (selefonMF && toplamSelefon > 0) {
    karlar.push({
      islemTuru: IslemTuru.Selefon,
      toplamKar: hesaplaKar(toplamSelefon, selefonMF.birim_maliyet, selefonMF.birim_fiyat)
    });
  }
  
  // En kârlı işlem türünü bul
  if (karlar.length === 0) {
    return null;
  }
  
  return karlar.reduce((enKarli, islem) => {
    return islem.toplamKar > enKarli.toplamKar ? islem : enKarli;
  }, karlar[0]);
} 