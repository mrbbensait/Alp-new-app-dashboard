import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { Database } from '@supabase/auth-helpers-nextjs';

// Supabase URL ve anonim API anahtarı çevresel değişkenlerden alınır
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase istemcisini oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
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
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
  console.log('[Cache] Tüm önbellek temizlendi');
}

// Belirli bir tablodan tüm verileri çeker
export async function fetchAllFromTable(tableName: string, bypassCache = false) {
  const cacheKey = `table:${tableName}`;
  
  // Eğer önbellek devre dışıysa veya bypass aktifse veya önbellekte geçerli veri yoksa API'den çek
  if (!isCacheEnabled || bypassCache || !cache[cacheKey] || (Date.now() - cache[cacheKey].timestamp) > CACHE_DURATION) {
    try {
      console.log(`[API] ${tableName} tablosu API'den çekiliyor`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) throw error;
      
      // Veriyi önbelleğe kaydet (önbellek aktifse)
      if (data && isCacheEnabled) {
        cache[cacheKey] = {
          data,
          timestamp: Date.now()
        };
      }
      
      return data || [];
    } catch (error) {
      console.error(`Tablo verisi çekilirken hata oluştu (${tableName}):`, error);
      return [];
    }
  } else {
    console.log(`[Cache] ${tableName} tablosu önbellekten okunuyor`);
    return cache[cacheKey].data;
  }
}

// Belirli bir tablodan filtrelenmiş verileri çeker
export async function fetchFilteredData(tableName: string, column: string, value: any, bypassCache = false) {
  const cacheKey = `table:${tableName}:${column}:${value}`;
  
  // Eğer önbellek devre dışıysa veya bypass aktifse veya önbellekte geçerli veri yoksa API'den çek
  if (!isCacheEnabled || bypassCache || !cache[cacheKey] || (Date.now() - cache[cacheKey].timestamp) > CACHE_DURATION) {
    try {
      console.log(`[API] ${tableName} filtrelenmiş veri API'den çekiliyor`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(column, value);
      
      if (error) throw error;
      
      // Veriyi önbelleğe kaydet (önbellek aktifse)
      if (data && isCacheEnabled) {
        cache[cacheKey] = {
          data,
          timestamp: Date.now()
        };
      }
      
      return data || [];
    } catch (error) {
      console.error(`Filtrelenmiş veri çekilirken hata oluştu (${tableName}):`, error);
      return [];
    }
  } else {
    console.log(`[Cache] ${tableName} filtrelenmiş veri önbellekten okunuyor`);
    return cache[cacheKey].data;
  }
}

// Bir tabloya yeni veri ekler
export async function insertData(tableName: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    
    // Veri değiştiğinde önbelleği temizle
    invalidateTableCache(tableName);
    
    return result;
  } catch (error) {
    console.error(`Veri eklenirken hata oluştu (${tableName}):`, error);
    throw error;
  }
}

// Bir tablodaki veriyi günceller
export async function updateData(tableName: string, id: number, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // Veri değiştiğinde önbelleği temizle
    invalidateTableCache(tableName);
    
    return result;
  } catch (error) {
    console.error(`Veri güncellenirken hata oluştu (${tableName}):`, error);
    throw error;
  }
}

// Bir tablodaki veriyi siler
export async function deleteData(tableName: string, id: number) {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Veri değiştiğinde önbelleği temizle
    invalidateTableCache(tableName);
    
    return true;
  } catch (error) {
    console.error(`Veri silinirken hata oluştu (${tableName}):`, error);
    throw error;
  }
}

// Belirtilen tablonun önbelleğini geçersiz kıl
export function invalidateTableCache(tableName: string) {
  if (!isCacheEnabled) return;
  
  Object.keys(cache).forEach(key => {
    if (key.startsWith(`table:${tableName}`)) {
      delete cache[key];
    }
  });
  console.log(`[Cache] ${tableName} tablosu önbelleği temizlendi`);
}

// Realtime aboneliği oluşturur - anlık veri güncellemeleri için
export function subscribeToTable(tableName: string, callback: (payload: any) => void) {
  // Supabase channel oluştur ve belirtilen tabloya abone ol
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', 
      { 
        event: '*',  // 'INSERT', 'UPDATE', 'DELETE' olaylarını dinle
        schema: 'public', 
        table: tableName 
      }, 
      (payload) => {
        // Değişiklik olduğunda önbelleği temizle
        invalidateTableCache(tableName);
        
        // Değişiklik olduğunda callback fonksiyonunu çağır
        callback(payload);
      }
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
 * @returns Eklenen kayıt
 */
export const createTeslimatGecmisi = async (
  urunId: number,
  teslimatMiktari: number,
  kullanici: string
) => {
  try {
    const { data, error } = await supabase
      .from('TeslimatGecmisi')
      .insert([
        {
          urun_id: urunId,
          teslimat_miktari: teslimatMiktari,
          kullanici: kullanici
        }
      ])
      .select();

    if (error) {
      console.error('Teslimat geçmişi eklenirken hata oluştu:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Teslimat geçmişi eklenirken beklenmeyen hata:', error);
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
      .from('TeslimatGecmisi')
      .select('*')
      .eq('urun_id', urunId)
      .order('teslimat_tarihi', { ascending: false });

    if (error) {
      console.error('Teslimat geçmişi getirilirken hata oluştu:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Teslimat geçmişi getirilirken beklenmeyen hata:', error);
    throw error;
  }
}; 