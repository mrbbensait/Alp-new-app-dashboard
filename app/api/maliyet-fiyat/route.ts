import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { IslemTuru } from '@/app/lib/types';

// Tüm maliyet-fiyat verilerini getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAktif = searchParams.get('aktif');
    
    let query = supabase.from('maliyet_fiyat').select('*');
    
    // Sadece aktif kayıtları getir
    if (isAktif === 'true') {
      query = query.eq('aktif', true);
    }
    
    const { data, error } = await query.order('islem_turu', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Maliyet-fiyat verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni maliyet-fiyat oluştur ya da güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.islem_turu || body.birim_maliyet === undefined || body.birim_fiyat === undefined) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }
    
    // İşlem türü geçerli mi?
    if (!Object.values(IslemTuru).includes(body.islem_turu)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz işlem türü' },
        { status: 400 }
      );
    }
    
    // Negatif değer kontrolü
    if (body.birim_maliyet < 0 || body.birim_fiyat < 0) {
      return NextResponse.json(
        { success: false, error: 'Negatif değerler kabul edilmez' },
        { status: 400 }
      );
    }
    
    // Bu işlem türü için mevcut kayıt var mı?
    const { data: mevcutKayit } = await supabase
      .from('maliyet_fiyat')
      .select('*')
      .eq('islem_turu', body.islem_turu)
      .maybeSingle();
    
    let result;
    
    if (mevcutKayit) {
      // Mevcut kaydı güncelle ve aktif yap
      const { data, error } = await supabase
        .from('maliyet_fiyat')
        .update({
          birim_maliyet: body.birim_maliyet,
          birim_fiyat: body.birim_fiyat,
          aktif: true,
          gecerlilik_tarih: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', mevcutKayit.id)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Yeni kayıt oluştur
      const { data, error } = await supabase
        .from('maliyet_fiyat')
        .insert({
          islem_turu: body.islem_turu,
          birim_maliyet: body.birim_maliyet,
          birim_fiyat: body.birim_fiyat,
          aktif: true,
          gecerlilik_tarih: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Maliyet-fiyat verisi kaydedilirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Maliyet-fiyat kaydını güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Kayıt ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Negatif değer kontrolü
    if ((body.birim_maliyet !== undefined && body.birim_maliyet < 0) || 
        (body.birim_fiyat !== undefined && body.birim_fiyat < 0)) {
      return NextResponse.json(
        { success: false, error: 'Negatif değerler kabul edilmez' },
        { status: 400 }
      );
    }
    
    // Güncellenecek alanları hazırla
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (body.birim_maliyet !== undefined) {
      updates.birim_maliyet = body.birim_maliyet;
    }
    
    if (body.birim_fiyat !== undefined) {
      updates.birim_fiyat = body.birim_fiyat;
    }
    
    if (body.aktif !== undefined) {
      updates.aktif = body.aktif;
    }
    
    // Aktif ediliyorsa geçerlilik tarihini güncelle
    if (body.aktif === true) {
      updates.gecerlilik_tarih = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('maliyet_fiyat')
      .update(updates)
      .eq('id', body.id)
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Maliyet-fiyat verisi güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 