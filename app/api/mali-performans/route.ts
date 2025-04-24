import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { format } from 'date-fns';

// Mali performans verilerini getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baslangicTarihi = searchParams.get('baslangic_tarihi');
    const bitisTarihi = searchParams.get('bitis_tarihi');
    
    if (!baslangicTarihi || !bitisTarihi) {
      return NextResponse.json(
        { success: false, error: 'Başlangıç ve bitiş tarihi parametreleri gereklidir' },
        { status: 400 }
      );
    }
    
    // İşletme giderleri verilerini getir
    const { data: isletmeGiderleri, error: isletmeGiderleriError } = await supabase
      .from('isletme_giderleri')
      .select('*');
    
    if (isletmeGiderleriError) throw isletmeGiderleriError;
    
    // Reçeteler verilerini getir
    const { data: receteler, error: recetelerError } = await supabase
      .from('Reçeteler')
      .select('*');
    
    if (recetelerError) throw recetelerError;
    
    // Teslimat geçmişi verilerini tarih aralığına göre getir
    // Kategori sütununu select kısmından çıkarıyoruz çünkü bu sütun tabloda yok
    const { data: teslimatGecmisi, error: teslimatGecmisiError } = await supabase
      .from('TeslimatGecmisi')
      .select(`
        *,
        "Bitmiş Ürün Stoğu"(
          id, 
          "Reçete Adı", 
          "Müşteri", 
          "Ambalaj (ml)"
        )
      `)
      .gte('teslimat_tarihi', baslangicTarihi)
      .lte('teslimat_tarihi', bitisTarihi);
    
    if (teslimatGecmisiError) throw teslimatGecmisiError;
    
    // Günlük kar-zarar verilerini hesapla
    const gunlukVeriler: {[key: string]: {gelir: number, gider: number, kar: number}} = {};
    const toplamGelir = 0;
    const toplamGider = isletmeGiderleri.reduce((toplam, gider) => toplam + (gider.aylik_gider_tl || 0), 0);
    
    // Günlük işletme giderini hesapla (toplam aylık gider / 22 iş günü)
    const gunlukIsletmeGideri = toplamGider / 22;
    
    // Her teslimat için gelir hesapla ve günlük verilere ekle
    teslimatGecmisi.forEach((teslimat: any) => {
      const tarih = format(new Date(teslimat.teslimat_tarihi), 'yyyy-MM-dd');
      
      // Teslimat yapılan ürünün bilgilerini al
      const urunBilgisi = teslimat['Bitmiş Ürün Stoğu'];
      
      if (urunBilgisi) {
        const receteAdi = urunBilgisi['Reçete Adı'];
        
        // Reçete bilgilerini bul
        const recete = receteler.find((r: any) => r['Reçete Adı'] === receteAdi);
        
        if (recete) {
          // Gelir hesapla
          const birimFiyat = recete.satis_fiyati_kg_ambalajli;
          const ambalajMl = urunBilgisi['Ambalaj (ml)'];
          const adetFiyat = (ambalajMl / 1000) * birimFiyat;
          const teslimatGeliri = teslimat.teslimat_miktari * adetFiyat;
          
          // Günlük geliri ekle/güncelle
          if (!gunlukVeriler[tarih]) {
            gunlukVeriler[tarih] = { gelir: 0, gider: 0, kar: 0 };
          }
          
          gunlukVeriler[tarih].gelir += teslimatGeliri;
        }
      }
    });
    
    // Her gün için gider ekle
    let geciciTarih = new Date(baslangicTarihi);
    const bitisTarihiObj = new Date(bitisTarihi);
    
    while (geciciTarih <= bitisTarihiObj) {
      const tarih = format(geciciTarih, 'yyyy-MM-dd');
      const haftaninGunu = geciciTarih.getDay();
      
      // Hafta içi günler için gider ekle (1: Pazartesi, 5: Cuma)
      if (haftaninGunu >= 1 && haftaninGunu <= 5) {
        // Eğer gün henüz eklenmemişse, yeni gün kaydı oluştur
        if (!gunlukVeriler[tarih]) {
          gunlukVeriler[tarih] = { gelir: 0, gider: 0, kar: 0 };
        }
        
        // Günlük gideri ekle
        gunlukVeriler[tarih].gider = gunlukIsletmeGideri;
        
        // Kar hesapla
        gunlukVeriler[tarih].kar = gunlukVeriler[tarih].gelir - gunlukVeriler[tarih].gider;
      }
      
      // Bir sonraki güne geç
      geciciTarih.setDate(geciciTarih.getDate() + 1);
    }
    
    // Toplam geliri hesapla
    const hesaplananToplamGelir = Object.values(gunlukVeriler).reduce((toplam, gunluk) => toplam + gunluk.gelir, 0);
    
    // Toplam kâr/zararı hesapla
    const netKarZarar = hesaplananToplamGelir - toplamGider;
    
    // Teslimat adetlerini topla
    const toplamTeslimatAdedi = teslimatGecmisi.reduce((toplam: number, teslimat: any) => toplam + teslimat.teslimat_miktari, 0);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        gunlukVeriler,
        toplamGelir: hesaplananToplamGelir,
        toplamGider,
        netKarZarar,
        toplamTeslimatAdedi,
        isletmeGiderleri,
        receteler
      }
    });
  } catch (error) {
    console.error('Mali performans verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 