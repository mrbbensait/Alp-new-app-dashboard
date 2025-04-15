// Personel tipi
export interface Personel {
  id: string;
  ad_soyad: string;
  kullanici_adi: string;
  rol: 'patron' | 'personel';
  vardiya: 'gündüz' | 'gece';
  created_at: string;
  updated_at: string;
}

// Performans raporu tipi
export interface PerformansRaporu {
  id: string;
  tarih: string;
  personel_id: string;
  vardiya: 'gündüz' | 'gece';
  dolum: number;
  etiketleme: number;
  kutulama: number;
  selefon: number;
  created_at: string;
  updated_at: string;
}

// Maliyet ve fiyat tipi
export interface MaliyetFiyat {
  id: string;
  islem_turu: 'dolum' | 'etiketleme' | 'kutulama' | 'selefon';
  birim_maliyet: number;
  birim_fiyat: number;
  aktif: boolean;
  gecerlilik_tarih: string;
  created_at: string;
  updated_at: string;
}

// Bildirim tipi
export interface Bildirim {
  id: string;
  baslik: string;
  icerik: string;
  tur: 'günlük' | 'haftalık' | 'özel';
  okundu: boolean;
  tarih: string;
  created_at: string;
}

// Performans analizi sonucu tipi
export interface PerformansAnalizi {
  toplamDolum: number;
  toplamEtiketleme: number;
  toplamKutulama: number;
  toplamSelefon: number;
  ortalamaDolum: number;
  ortalamaEtiketleme: number;
  ortalamaKutulama: number;
  ortalamaSelefon: number;
  toplamMaliyet: number;
  toplamGelir: number;
  toplamKar: number;
  gunlukKarZararTrend: Array<{tarih: string, kar: number}>;
}

// Vardiya enum
export enum Vardiya {
  Gunduz = 'gündüz',
  Gece = 'gece'
}

// İşlem türü enum
export enum IslemTuru {
  Dolum = 'dolum',
  Etiketleme = 'etiketleme',
  Kutulama = 'kutulama',
  Selefon = 'selefon'
}

// Rol enum
export enum Rol {
  Patron = 'patron',
  Personel = 'personel'
} 