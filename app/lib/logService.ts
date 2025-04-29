import { supabase } from "./supabase";

interface LogData {
  kullanici_id: string;
  kullanici_adi: string;
  islem_turu: 'INSERT' | 'UPDATE' | 'DELETE';
  tablo_adi: string;
  kayit_id?: string;
  eski_degerler?: any;
  yeni_degerler?: any;
  ip_adresi?: string;
  tarayici_bilgisi?: string;
}

// Kullanıcı aktivitesini kaydetme fonksiyonu
export async function logUserActivity(logData: LogData) {
  try {
    await supabase.from('user_activity_logs').insert(logData);
    console.log(`[Log] ${logData.islem_turu} işlemi kaydedildi - ${logData.tablo_adi}`);
  } catch (error) {
    console.error('Log kaydedilirken hata:', error);
  }
}

// Tarayıcı bilgilerini alma yardımcı fonksiyonu
export function getBrowserInfo() {
  return typeof window !== 'undefined' ? navigator.userAgent : 'Server';
}

// IP adresi alma (Not: Client-side'da gerçek IP alınamaz, bu sunucu tarafında yapılmalıdır)
export function getClientIP() {
  return null; // Sunucu tarafında middleware ile elde edilebilir
} 