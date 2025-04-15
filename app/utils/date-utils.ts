/**
 * Bugünün tarihini YYYY-MM-DD formatında döndürür
 */
export function getBugununTarihi(): string {
  const bugun = new Date();
  return formatDate(bugun);
}

/**
 * Verilen tarihi YYYY-MM-DD formatında döndürür
 */
export function formatDate(date: Date): string {
  const yil = date.getFullYear();
  const ay = String(date.getMonth() + 1).padStart(2, '0');
  const gun = String(date.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

/**
 * Verilen tarihi DD.MM.YYYY formatında döndürür (gösterim için)
 */
export function formatDateTR(dateStr: string): string {
  const [yil, ay, gun] = dateStr.split('-');
  return `${gun}.${ay}.${yil}`;
}

/**
 * Son 7 günün tarih aralığını döndürür [başlangıç, bitiş]
 */
export function getSonHaftaTarihAraligi(): [string, string] {
  const bugun = new Date();
  const birHaftaOnce = new Date();
  birHaftaOnce.setDate(bugun.getDate() - 7);
  
  return [formatDate(birHaftaOnce), formatDate(bugun)];
}

/**
 * Son 30 günün tarih aralığını döndürür [başlangıç, bitiş]
 */
export function getSonAyTarihAraligi(): [string, string] {
  const bugun = new Date();
  const birAyOnce = new Date();
  birAyOnce.setDate(bugun.getDate() - 30);
  
  return [formatDate(birAyOnce), formatDate(bugun)];
}

/**
 * Verilen başlangıç ve bitiş tarihleri arasındaki tüm günleri döndürür
 */
export function getTarihAraligi(baslangic: string, bitis: string): string[] {
  const tarihler: string[] = [];
  
  const baslangicDate = new Date(baslangic);
  const bitisDate = new Date(bitis);
  
  const currentDate = new Date(baslangicDate);
  
  while (currentDate <= bitisDate) {
    tarihler.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return tarihler;
}

/**
 * Verilen tarihin hangi gün olduğunu Türkçe olarak döndürür (Pazartesi, Salı, vb.)
 */
export function getGunAdi(dateStr: string): string {
  const date = new Date(dateStr);
  const gunIndex = date.getDay();
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return gunler[gunIndex];
}

/**
 * Verilen tarihin hangi ay olduğunu Türkçe olarak döndürür (Ocak, Şubat, vb.)
 */
export function getAyAdi(dateStr: string): string {
  const date = new Date(dateStr);
  const ayIndex = date.getMonth();
  const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return aylar[ayIndex];
}

/**
 * İki tarih arasındaki gün sayısını döndürür
 */
export function getTarihlerArasiGunSayisi(baslangic: string, bitis: string): number {
  const baslangicDate = new Date(baslangic);
  const bitisDate = new Date(bitis);
  
  // Zaman bilgilerini sıfırla
  baslangicDate.setHours(0, 0, 0, 0);
  bitisDate.setHours(0, 0, 0, 0);
  
  // Millisaniye cinsinden fark
  const fark = bitisDate.getTime() - baslangicDate.getTime();
  
  // Gün sayısını hesapla (1000ms * 60sn * 60dk * 24saat)
  return Math.round(fark / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Verilen tarih bugün mü kontrolü yapar
 */
export function isBugun(dateStr: string): boolean {
  const today = getBugununTarihi();
  return dateStr === today;
}

/**
 * Belirli bir tarih için bugün, dün, yarın gibi gösterim döndürür
 */
export function getTarihGosterimi(dateStr: string): string {
  const bugun = getBugununTarihi();
  
  if (dateStr === bugun) {
    return 'Bugün';
  }
  
  const yarin = new Date();
  yarin.setDate(yarin.getDate() + 1);
  if (dateStr === formatDate(yarin)) {
    return 'Yarın';
  }
  
  const dun = new Date();
  dun.setDate(dun.getDate() - 1);
  if (dateStr === formatDate(dun)) {
    return 'Dün';
  }
  
  return formatDateTR(dateStr) + ' ' + getGunAdi(dateStr);
} 