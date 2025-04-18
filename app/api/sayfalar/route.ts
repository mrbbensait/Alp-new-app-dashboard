import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Tüm sayfaları getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    let query = supabase.from('sayfalar').select('*');
    
    // Eğer id verilmişse, sadece o sayfayı getir
    if (id) {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query.order('sayfa_adi', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Sayfa verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni sayfa ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.sayfa_adi || !body.sayfa_yolu) {
      return NextResponse.json(
        { success: false, error: 'Sayfa adı ve yolu gereklidir' },
        { status: 400 }
      );
    }
    
    // Sayfanın daha önce eklenip eklenmediğini kontrol et
    const { data: existingPage, error: checkError } = await supabase
      .from('sayfalar')
      .select('id')
      .eq('sayfa_yolu', body.sayfa_yolu)
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingPage) {
      return NextResponse.json(
        { success: false, error: 'Bu sayfa yolu zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    // Yeni sayfayı ekle
    const { data, error } = await supabase
      .from('sayfalar')
      .insert({
        sayfa_adi: body.sayfa_adi,
        sayfa_yolu: body.sayfa_yolu
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    // Yeni sayfa eklendikten sonra, tüm roller için yetki kaydı oluştur
    const { data: roles, error: rolesError } = await supabase
      .from('roller')
      .select('id, rol_ad');
    
    if (rolesError) {
      throw rolesError;
    }
    
    // Patron rolüne varsayılan olarak izin ver, diğerlerine izin verme
    const permissions = roles.map(role => ({
      rol_id: role.id,
      sayfa_id: data[0].id,
      erisim_var: role.rol_ad === 'Patron' // Patron rolüne varsayılan olarak erişim ver
    }));
    
    const { error: permError } = await supabase
      .from('rol_sayfa_yetkileri')
      .insert(permissions);
    
    if (permError) {
      throw permError;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: `${body.sayfa_adi} sayfası başarıyla eklendi`
    });
  } catch (error) {
    console.error('Sayfa eklenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Sayfa eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Sayfa güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id || (!body.sayfa_adi && !body.sayfa_yolu)) {
      return NextResponse.json(
        { success: false, error: 'Sayfa ID ve güncellenecek alanlar gereklidir' },
        { status: 400 }
      );
    }
    
    // Güncellenecek veriyi hazırla
    const updateData: any = {};
    if (body.sayfa_adi) updateData.sayfa_adi = body.sayfa_adi;
    if (body.sayfa_yolu) updateData.sayfa_yolu = body.sayfa_yolu;
    
    // Sayfayı güncelle
    const { data, error } = await supabase
      .from('sayfalar')
      .update(updateData)
      .eq('id', body.id)
      .select();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: `Sayfa başarıyla güncellendi`
    });
  } catch (error) {
    console.error('Sayfa güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Sayfa güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Sayfa sil
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Sayfa ID gereklidir' },
        { status: 400 }
      );
    }
    
    // Önce sayfanın var olup olmadığını kontrol et
    const { data: sayfa, error: findError } = await supabase
      .from('sayfalar')
      .select('id, sayfa_adi')
      .eq('id', id)
      .maybeSingle();
    
    if (findError) {
      throw findError;
    }
    
    if (!sayfa) {
      return NextResponse.json(
        { success: false, error: `${id} ID'li sayfa bulunamadı` },
        { status: 404 }
      );
    }
    
    // Sayfayı sil
    const { error } = await supabase
      .from('sayfalar')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true,
      message: `${sayfa.sayfa_adi} sayfası başarıyla silindi`
    });
  } catch (error) {
    console.error('Sayfa silinirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Sayfa silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 