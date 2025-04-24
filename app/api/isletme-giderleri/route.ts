import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Tüm işletme giderleri verilerini getir
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('isletme_giderleri')
      .select('*')
      .order('gider_adi', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('İşletme giderleri verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni işletme gideri oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.gider_adi || body.aylik_gider_tl === undefined) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }
    
    // Yeni kayıt oluştur
    const { data, error } = await supabase
      .from('isletme_giderleri')
      .insert({
        gider_adi: body.gider_adi,
        aylik_gider_tl: body.aylik_gider_tl,
      })
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('İşletme gideri kaydedilirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// İşletme gideri güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Kayıt ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Güncellenecek alanları hazırla
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (body.gider_adi !== undefined) {
      updates.gider_adi = body.gider_adi;
    }
    
    if (body.aylik_gider_tl !== undefined) {
      updates.aylik_gider_tl = body.aylik_gider_tl;
    }
    
    const { data, error } = await supabase
      .from('isletme_giderleri')
      .update(updates)
      .eq('id', body.id)
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('İşletme gideri güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// İşletme gideri sil
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Silmek için ID parametresi gereklidir' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('isletme_giderleri')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('İşletme gideri silinirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 