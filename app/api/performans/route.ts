import { NextRequest, NextResponse } from 'next/server';
import { supabase, insertData, fetchFilteredData, updateData } from '@/app/lib/supabase';
import { getBugununTarihi } from '@/app/utils/date-utils';

// NOT: Veritabanı değişikliği:
// ALTER TABLE personel DROP COLUMN vardiya;
// ALTER TABLE performans_raporlari DROP COLUMN vardiya;

// Raporları getir (Tarih filtrelemesiyle)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tarih = searchParams.get('tarih');
    const personelId = searchParams.get('personel_id');
    const baslangicTarihi = searchParams.get('baslangic_tarihi');
    const bitisTarihi = searchParams.get('bitis_tarihi');
    
    let query = supabase.from('performans_raporlari').select('*');
    
    // Filtreleme
    if (tarih) {
      query = query.eq('tarih', tarih);
    }
    
    if (personelId) {
      query = query.eq('personel_id', personelId);
    }
    
    if (baslangicTarihi && bitisTarihi) {
      query = query.gte('tarih', baslangicTarihi).lte('tarih', bitisTarihi);
    }
    
    const { data, error } = await query.order('tarih', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Performans verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni rapor oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.personel_id) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }
    
    // Bugünün tarihini kullan
    const bugun = getBugununTarihi();
    body.tarih = body.tarih || bugun;
    
    // Negatif değer kontrolü
    if (body.dolum < 0 || body.etiketleme < 0 || body.kutulama < 0 || body.selefon < 0) {
      return NextResponse.json(
        { success: false, error: 'Negatif değerler kabul edilmez' },
        { status: 400 }
      );
    }
    
    // Bugün için zaten rapor var mı kontrol et
    const { data: mevcutRapor } = await supabase
      .from('performans_raporlari')
      .select('*')
      .eq('tarih', body.tarih)
      .eq('personel_id', body.personel_id)
      .maybeSingle();
    
    let result;
    
    if (mevcutRapor) {
      // Mevcut raporu güncelle
      const { data, error } = await supabase
        .from('performans_raporlari')
        .update({
          dolum: body.dolum,
          etiketleme: body.etiketleme,
          kutulama: body.kutulama,
          selefon: body.selefon,
          updated_at: new Date().toISOString()
        })
        .eq('id', mevcutRapor.id)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Yeni rapor oluştur
      const { data, error } = await supabase
        .from('performans_raporlari')
        .insert({
          tarih: body.tarih,
          personel_id: body.personel_id,
          dolum: body.dolum || 0,
          etiketleme: body.etiketleme || 0,
          kutulama: body.kutulama || 0,
          selefon: body.selefon || 0
        })
        .select();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Performans raporu kaydedilirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Raporu güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Rapor ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Negatif değer kontrolü
    if (body.dolum < 0 || body.etiketleme < 0 || body.kutulama < 0 || body.selefon < 0) {
      return NextResponse.json(
        { success: false, error: 'Negatif değerler kabul edilmez' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('performans_raporlari')
      .update({
        dolum: body.dolum,
        etiketleme: body.etiketleme,
        kutulama: body.kutulama,
        selefon: body.selefon,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Performans raporu güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 