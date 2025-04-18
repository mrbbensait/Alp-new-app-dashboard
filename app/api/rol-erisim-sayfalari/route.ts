import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rolId = searchParams.get('rol_id');
  
  if (!rolId) {
    return NextResponse.json({ success: false, error: 'Rol ID gereklidir' }, { status: 400 });
  }

  try {
    // Önce patron rolünü kontrol et
    const { data: patronRol, error: patronRolError } = await supabase
      .from('roller')
      .select('id')
      .eq('rol_ad', 'Patron')
      .single();
      
    if (patronRolError) {
      console.error('Patron rolü kontrol edilirken hata:', patronRolError);
    }
      
    // Eğer patron rolü ise tüm sayfaları getir
    if (!patronRolError && patronRol && patronRol.id === rolId) {
      const { data: tumSayfalar, error: sayfalarError } = await supabase
        .from('sayfalar')
        .select('*')
        .order('sayfa_adi');
        
      if (sayfalarError) {
        console.error('Patron için sayfalar alınırken hata:', sayfalarError);
        throw sayfalarError;
      }
      
      return NextResponse.json({ success: true, data: tumSayfalar });
    }
    
    // Patron rolü değilse, sadece erişim izni olan sayfaları getir
    const { data, error } = await supabase
      .from('rol_sayfa_yetkileri')
      .select(`
        id,
        erisim_var,
        sayfalar (
          id, 
          sayfa_adi,
          sayfa_yolu
        )
      `)
      .eq('rol_id', rolId)
      .eq('erisim_var', true);
      
    if (error) {
      console.error('Rol erişim sayfaları alınırken veritabanı hatası:', error);
      throw error;
    }
    
    // Sadece sayfa bilgilerini ayıkla
    const sayfalar = data.map(yetki => yetki.sayfalar);
    
    return NextResponse.json({ success: true, data: sayfalar });
  } catch (error) {
    console.error('Rol erişim sayfaları alınırken hata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ 
      success: false, 
      error: 'Rol erişim sayfaları alınamadı',
      errorDetail: errorMessage 
    }, { status: 500 });
  }
} 