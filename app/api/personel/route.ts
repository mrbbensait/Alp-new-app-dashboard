import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Tüm personelleri getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    let query = supabase.from('personel').select('*');
    
    // Eğer id verilmişse, sadece o personeli getir
    if (id) {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query.order('ad_soyad', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Personel verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni personel ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.ad_soyad || !body.kullanici_adi || !body.rol) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }
    
    // Kullanıcı adı benzersiz olmalı
    const { data: existingUser, error: checkError } = await supabase
      .from('personel')
      .select('*')
      .eq('kullanici_adi', body.kullanici_adi)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    // Şifre işleme (gerçek projede hash'leme yapılmalı)
    // NOT: Güvenlik için gerçek uygulamada bcrypt veya argon2 kullanılmalıdır
    
    // Yeni personel oluştur
    const { data, error } = await supabase
      .from('personel')
      .insert({
        ad_soyad: body.ad_soyad,
        kullanici_adi: body.kullanici_adi,
        rol: body.rol,
        // Ek alanlar (varsa)
        email: body.email,
        telefon: body.telefon,
        ise_baslama_tarihi: body.ise_baslama_tarihi,
        erisim_izinleri: body.erisim_izinleri
      })
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Personel eklenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Personel güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Personel ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Kullanıcı adı değişmişse, benzersiz mi kontrol et
    if (body.kullanici_adi) {
      const { data: existingUser, error: checkError } = await supabase
        .from('personel')
        .select('*')
        .eq('kullanici_adi', body.kullanici_adi)
        .neq('id', body.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }
    
    // Güncellenecek alanları belirle
    const updates: any = {};
    
    if (body.ad_soyad) updates.ad_soyad = body.ad_soyad;
    if (body.kullanici_adi) updates.kullanici_adi = body.kullanici_adi;
    if (body.rol) updates.rol = body.rol;
    if (body.email !== undefined) updates.email = body.email;
    if (body.telefon !== undefined) updates.telefon = body.telefon;
    if (body.ise_baslama_tarihi !== undefined) updates.ise_baslama_tarihi = body.ise_baslama_tarihi;
    if (body.erisim_izinleri !== undefined) updates.erisim_izinleri = body.erisim_izinleri;
    
    // Güncelleme yapılacak alan yoksa hata döndür
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      );
    }
    
    // Son güncelleme zamanını ekle
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('personel')
      .update(updates)
      .eq('id', body.id)
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Personel güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Personel sil
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Personel ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Personeli sil
    const { error } = await supabase
      .from('personel')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Personel silinirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Personel silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 