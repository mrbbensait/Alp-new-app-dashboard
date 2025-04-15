export enum IslemTuru {
  Dolum = 'dolum',
  Etiketleme = 'etiketleme',
  Kutulama = 'kutulama',
  Selefon = 'selefon'
}

export enum Vardiya {
  Gunduz = 'gunduz',
  Aksam = 'aksam',
  Gece = 'gece'
}

export interface MaliyetFiyat {
  id: string;
  islem_turu: IslemTuru | string;
  birim_maliyet: number;
  birim_fiyat: number;
  aktif: boolean;
  guncelleme_tarihi: string;
} 