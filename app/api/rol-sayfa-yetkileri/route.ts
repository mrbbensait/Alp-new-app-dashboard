import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Rol için sayfa yetkilerini getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rol_id = searchParams.get('rol_id');
    
    if (!rol_id) {
      return NextResponse.json(
        { success: false, error: 'Rol ID gereklidir' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('rol_sayfa_yetkileri')
      .select(`
        id,
        rol_id,
        sayfa_id,
        erisim_var,
        sayfalar (
          id,
          sayfa_adi,
          sayfa_yolu
        )
      `)
      .eq('rol_id', rol_id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Rol sayfa yetkileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol için sayfa yetkilerini güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.rol_id || !body.sayfa_id) {
      return NextResponse.json(
        { success: false, error: 'Rol ID ve Sayfa ID gereklidir' },
        { status: 400 }
      );
    }
    
    const rol_id = body.rol_id;
    const sayfa_id = body.sayfa_id;
    const erisim_var = body.erisim_var === true;
    
    // Önce mevcut kaydı kontrol et
    const { data: existingRecord, error: checkError } = await supabase
      .from('rol_sayfa_yetkileri')
      .select('id')
      .eq('rol_id', rol_id)
      .eq('sayfa_id', sayfa_id)
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
    let result;
    
    if (existingRecord) {
      // Mevcut kaydı güncelle
      const { data, error } = await supabase
        .from('rol_sayfa_yetkileri')
        .update({ erisim_var })
        .eq('id', existingRecord.id)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Yeni kayıt oluştur
      const { data, error } = await supabase
        .from('rol_sayfa_yetkileri')
        .insert({
          rol_id,
          sayfa_id,
          erisim_var
        })
        .select();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: result[0],
      message: `Rol sayfa yetkisi başarıyla ${existingRecord ? 'güncellendi' : 'oluşturuldu'}`
    });
  } catch (error) {
    console.error('Rol sayfa yetkisi güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Yetki güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Toplu yetki güncelleme
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.rol_id || !Array.isArray(body.yetkiler)) {
      return NextResponse.json(
        { success: false, error: 'Rol ID ve yetkiler dizisi gereklidir' },
        { status: 400 }
      );
    }
    
    const rol_id = body.rol_id;
    const yetkiler = body.yetkiler;
    
    // Yetkiler objeler dizisi olmali: [{ sayfa_id: '...', erisim_var: true }, ...]
    for (const yetki of yetkiler) {
      if (!yetki.sayfa_id) {
        return NextResponse.json(
          { success: false, error: 'Her yetki için sayfa_id gereklidir' },
          { status: 400 }
        );
      }
      
      // Önce mevcut kaydı kontrol et
      const { data: existingRecord, error: checkError } = await supabase
        .from('rol_sayfa_yetkileri')
        .select('id')
        .eq('rol_id', rol_id)
        .eq('sayfa_id', yetki.sayfa_id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Yetki kontrolü sırasında hata:', checkError);
        continue;
      }
      
      const erisim_var = yetki.erisim_var === true;
      
      if (existingRecord) {
        // Mevcut kaydı güncelle
        const { error } = await supabase
          .from('rol_sayfa_yetkileri')
          .update({ erisim_var })
          .eq('id', existingRecord.id);
        
        if (error) {
          console.error('Yetki güncellenirken hata:', error);
        }
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase
          .from('rol_sayfa_yetkileri')
          .insert({
            rol_id,
            sayfa_id: yetki.sayfa_id,
            erisim_var
          });
        
        if (error) {
          console.error('Yetki eklenirken hata:', error);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${yetkiler.length} sayfa yetkisi başarıyla güncellendi`
    });
  } catch (error) {
    console.error('Toplu yetki güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Yetkiler güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 