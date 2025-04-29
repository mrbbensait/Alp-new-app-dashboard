import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { logUserActivity, getBrowserInfo } from "./logService";
// import { Database } from '@supabase/auth-helpers-nextjs';

// Supabase URL ve anonim API anahtarı çevresel değişkenlerden alınır
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabase istemcisini oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Basit önbellek mekanizması
interface CacheItem {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_DURATION = 300000; // 5 dakika önbellek süresi (300,000 ms)

// Önbelleğin etkin olup olmadığını kontrol eden değişken
let isCacheEnabled = true;

// Önbelleği etkinleştir/devre dışı bırak
export function setCacheEnabled(enabled: boolean) {
  isCacheEnabled = enabled;
}

// Önbellek durumunu getir
export function isCacheActive(): boolean {
  return isCacheEnabled;
}

// Tüm önbelleği temizle
export function clearAllCache() {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
  console.log("[Cache] Tüm önbellek temizlendi");
}

// Belirli bir tablodan tüm verileri çeker
export async function fetchAllFromTable(
  tableName: string,
  bypassCache = false,
) {
  const cacheKey = `table:${tableName}`;

  // Eğer önbellek devre dışıysa veya bypass aktifse veya önbellekte geçerli veri yoksa API'den çek
  if (
    !isCacheEnabled ||
    bypassCache ||
    !cache[cacheKey] ||
    Date.now() - cache[cacheKey].timestamp > CACHE_DURATION
  ) {
    try {
      console.log(`[API] ${tableName} tablosu API'den çekiliyor`);
      // Stok tablosu için özel işlem - her zaman taze veri çek
      if (tableName === "Stok") {
        bypassCache = true;
      }

      const { data, error } = await supabase.from(tableName).select("*");

      if (error) throw error;

      // Veriyi önbelleğe kaydet (önbellek aktifse ve bypass yapılmıyorsa)
      if (data && isCacheEnabled && !bypassCache) {
        cache[cacheKey] = {
          data,
          timestamp: Date.now(),
        };
      }

      return data || [];
    } catch (error) {
      console.error(
        `Tablo verisi çekilirken hata oluştu (${tableName}):`,
        error,
      );
      return [];
    }
  } else {
    console.log(`[Cache] ${tableName} tablosu önbellekten okunuyor`);
    return cache[cacheKey].data;
  }
}

// Belirli bir tablodan filtrelenmiş verileri çeker
export async function fetchFilteredData(
  tableName: string,
  column: string,
  value: any,
  bypassCache = false,
) {
  const cacheKey = `table:${tableName}:${column}:${value}`;

  // Eğer önbellek devre dışıysa veya bypass aktifse veya önbellekte geçerli veri yoksa API'den çek
  if (
    !isCacheEnabled ||
    bypassCache ||
    !cache[cacheKey] ||
    Date.now() - cache[cacheKey].timestamp > CACHE_DURATION
  ) {
    try {
      console.log(`[API] ${tableName} filtrelenmiş veri API'den çekiliyor`);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq(column, value);

      if (error) throw error;

      // Veriyi önbelleğe kaydet (önbellek aktifse)
      if (data && isCacheEnabled) {
        cache[cacheKey] = {
          data,
          timestamp: Date.now(),
        };
      }

      return data || [];
    } catch (error) {
      console.error(
        `Filtrelenmiş veri çekilirken hata oluştu (${tableName}):`,
        error,
      );
      return [];
    }
  } else {
    console.log(`[Cache] ${tableName} filtrelenmiş veri önbellekten okunuyor`);
    return cache[cacheKey].data;
  }
}

// Bir tabloya yeni veri ekler
export async function insertData(tableName: string, data: any, userData: any = null) {
  try {
    // Kullanıcı bilgilerini al
    const user = userData || (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || '{}') : {});
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();

    if (error) throw error;

    // Veri değiştiğinde önbelleği temizle
    invalidateTableCache(tableName);
    
    // Kullanıcı aktivitesini logla
    if (user.id) {
      logUserActivity({
        kullanici_id: user.id,
        kullanici_adi: user.kullanici_adi || 'Bilinmeyen',
        islem_turu: 'INSERT',
        tablo_adi: tableName,
        kayit_id: result?.[0]?.id?.toString(),
        yeni_degerler: data,
        tarayici_bilgisi: getBrowserInfo()
      });
    }

    return result;
  } catch (error) {
    console.error(`Veri eklenirken hata oluştu (${tableName}):`, error);
    throw error;
  }
}

// Bir tablodaki veriyi günceller
export async function updateData(tableName: string, id: number, data: any, userData: any = null) {
  try {
    // Kullanıcı bilgilerini al
    const user = userData || (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || '{}') : {});
    
    // İlk olarak, güncellenmeden önceki veriyi al (eski_degerler için)
    const idColumn = tableName === "Stok" ? "ID" : "id";
    const { data: oldData } = await supabase
      .from(tableName)
      .select('*')
      .eq(idColumn, id)
      .single();
    
    console.log(
      `Güncelleniyor: Tablo=${tableName}, ID Sütunu=${idColumn}, ID=${id}, Veri=`,
      data,
    );

    // Veriyi güncelle
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq(idColumn, id) // Dinamik ID sütunu kullan
      .select();

    if (error) {
      console.error("Supabase güncelleme hatası:", error);
      throw error;
    }

    // Veri değiştiğinde önbelleği temizle
    invalidateTableCache(tableName);
    
    // Kullanıcı aktivitesini logla
    if (user.id) {
      logUserActivity({
        kullanici_id: user.id,
        kullanici_adi: user.kullanici_adi || 'Bilinmeyen',
        islem_turu: 'UPDATE',
        tablo_adi: tableName,
        kayit_id: id.toString(),
        eski_degerler: oldData,
        yeni_degerler: data,
        tarayici_bilgisi: getBrowserInfo()
      });
    }

    console.log("Güncelleme başarılı:", result);
    return result;
  } catch (error) {
    // Hatayı tekrar konsola yazdır, belki daha fazla detay verir
    console.error(
      `Veri güncellenirken hata oluştu (${tableName}, ID: ${id}):`,
      error,
    );
    throw error;
  }
}

// Bir tablodaki veriyi siler
export async function deleteData(tableName: string, id: number, userData: any = null) {
  try {
    // Kullanıcı bilgilerini al
    const user = userData || (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || '{}') : {});
    
    // İlk olarak, silinmeden önceki veriyi al (eski_degerler için)
    const { data: oldData } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    // Veriyi sil
    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) throw error;

    // Veri değiştiğinde önbelleği temizle
    invalidateTableCache(tableName);
    
    // Kullanıcı aktivitesini logla
    if (user.id) {
      logUserActivity({
        kullanici_id: user.id,
        kullanici_adi: user.kullanici_adi || 'Bilinmeyen',
        islem_turu: 'DELETE',
        tablo_adi: tableName,
        kayit_id: id.toString(),
        eski_degerler: oldData,
        tarayici_bilgisi: getBrowserInfo()
      });
    }

    return true;
  } catch (error) {
    console.error(`Veri silinirken hata oluştu (${tableName}):`, error);
    throw error;
  }
}

// Belirtilen tablonun önbelleğini geçersiz kıl
export function invalidateTableCache(tableName: string) {
  if (!isCacheEnabled) return;

  Object.keys(cache).forEach((key) => {
    if (key.startsWith(`table:${tableName}`)) {
      delete cache[key];
    }
  });
  console.log(`[Cache] ${tableName} tablosu önbelleği temizlendi`);
}

// Realtime aboneliği oluşturur - anlık veri güncellemeleri için
export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void,
) {
  // Supabase channel oluştur ve belirtilen tabloya abone ol
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on(
      "postgres_changes",
      {
        event: "*", // 'INSERT', 'UPDATE', 'DELETE' olaylarını dinle
        schema: "public",
        table: tableName,
      },
      (payload) => {
        // Değişiklik olduğunda önbelleği temizle
        invalidateTableCache(tableName);

        // Değişiklik olduğunda callback fonksiyonunu çağır
        callback(payload);
      },
    )
    .subscribe();

  // Subscription nesnesini döndür (daha sonra aboneliği iptal etmek için kullanılabilir)
  return subscription;
}

// Realtime aboneliğini iptal eder
export function unsubscribeFromChannel(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}

/**
 * TeslimatGecmisi tablosuna yeni bir teslimat kaydı ekler
 * @param urunId Teslimat yapılan ürünün id'si
 * @param teslimatMiktari Teslim edilen miktar
 * @param kullanici Teslimatı yapan kullanıcı
 * @param teslimatSekli Teslimat şekli (Elden, Kargo, Ambar)
 * @returns Eklenen kayıt
 */
export const createTeslimatGecmisi = async (
  urunId: number,
  teslimatMiktari: number,
  kullanici: string,
  teslimatSekli: string = "Elden",
) => {
  try {
    const { data, error } = await supabase
      .from("TeslimatGecmisi")
      .insert([
        {
          urun_id: urunId,
          teslimat_miktari: teslimatMiktari,
          kullanici: kullanici,
          teslimat_sekli: teslimatSekli,
        },
      ])
      .select();

    if (error) {
      console.error("Teslimat geçmişi eklenirken hata oluştu:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Teslimat geçmişi eklenirken beklenmeyen hata:", error);
    throw error;
  }
};

/**
 * Belirli bir ürüne ait teslimat geçmişini getirir
 * @param urunId Teslimat geçmişi sorgulanacak ürünün id'si
 * @returns Teslimat geçmişi kayıtları
 */
export const getTeslimatGecmisi = async (urunId: number) => {
  try {
    const { data, error } = await supabase
      .from("TeslimatGecmisi")
      .select("*")
      .eq("urun_id", urunId)
      .order("teslimat_tarihi", { ascending: false });

    if (error) {
      console.error("Teslimat geçmişi getirilirken hata oluştu:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Teslimat geçmişi getirilirken beklenmeyen hata:", error);
    throw error;
  }
};

// Üretim Kuyruğu yeni kayıt güncellemesi için özel broadcast kanalı
export function broadcastUretimKuyruguUpdate(isNewProduction = false) {
  try {
    // Tüm istemcilere bildirim göndermek için broadcast yap
    supabase.channel("broadcast").send({
      type: "broadcast",
      event: "uretim-kuyrugu-update",
      payload: { 
        timestamp: Date.now(),
        isNewProduction: isNewProduction // Yeni üretim emri girilip girilmediği bilgisi
      },
    });
    
    console.log('[Broadcast] Üretim Kuyruğu güncellemesi broadcast edildi' + (isNewProduction ? ' (Yeni Üretim)' : ''));
    return true;
  } catch (error) {
    console.error("Broadcast gönderilirken hata oluştu:", error);
    return false;
  }
}

// Üretim Kuyruğu güncellemelerini dinlemek için abonelik
export function subscribeToUretimKuyruguUpdates(callback: (isNewProduction: boolean) => void) {
  const channel = supabase
    .channel("broadcast")
    .on("broadcast", { event: "uretim-kuyrugu-update" }, (payload) => {
      console.log("[Broadcast] Üretim Kuyruğu güncellemesi alındı:", payload);
      // isNewProduction değerini callback'e gönder (yoksa false)
      const isNewProduction = payload.payload?.isNewProduction || false;
      callback(isNewProduction);
    })
    .subscribe();
  
  return channel;
}
