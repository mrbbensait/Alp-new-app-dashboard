import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Tüm rolleri getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const rol_ad = searchParams.get('rol_ad');
    
    let query = supabase.from('roller').select('*');
    
    // Eğer id verilmişse, sadece o rolü getir
    if (id) {
      query = query.eq('id', id);
    }
    
    // Eğer rol_ad verilmişse, o isme sahip rolü getir
    if (rol_ad) {
      query = query.eq('rol_ad', rol_ad);
    }
    
    const { data, error } = await query.order('rol_ad', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Rol verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol sil
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Rol ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Önce rolün var olup olmadığını kontrol et
    const { data: rol, error: findError } = await supabase
      .from('roller')
      .select('id, rol_ad')
      .eq('id', id)
      .maybeSingle();
    
    if (findError) {
      console.error('Rol arama hatası:', findError);
      throw new Error(findError.message || 'Rol aranırken hata oluştu');
    }
    
    if (!rol) {
      return NextResponse.json(
        { success: false, error: `${id} ID'li rol bulunamadı` },
        { status: 404 }
      );
    }
    
    // Rolü sil
    const { error } = await supabase
      .from('roller')
      .delete()
      .eq('id', id);
    
    if (error) {
      // Foreign key constraint hatasını daha detaylı bir şekilde ele al
      if (error.message && error.message.includes('violates foreign key constraint')) {
        console.error('Foreign key hatası (tam hata mesajı):', error);
        
        // Hangi tablonun kısıtlama uyguladığını bulmaya çalış
        const constraintMatch = error.message.match(/constraint\s+"([^"]+)"/);
        const constraintName = constraintMatch ? constraintMatch[1] : 'bilinmeyen kısıtlama';
        
        return NextResponse.json(
          { 
            success: false, 
            error: `${rol.rol_ad} rolü kullanıcılara atanmış olduğu için silinemiyor. 
            Önce bu role sahip kullanıcıları başka rollere atayın.`
          },
          { status: 400 }
        );
      }
      
      throw new Error(error.message || 'Veritabanı silme hatası');
    }
    
    return NextResponse.json({ 
      success: true,
      message: `${rol.rol_ad} rolü başarıyla silindi`
    });
  } catch (error: any) {
    console.error('Rol silinirken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Rol silinirken bir hata oluştu'
      },
      { status: 500 }
    );
  }
} 