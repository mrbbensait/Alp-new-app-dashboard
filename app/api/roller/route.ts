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

// Yeni rol ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.rol_ad) {
      return NextResponse.json(
        { success: false, error: 'Rol adı gereklidir' },
        { status: 400 }
      );
    }
    
    // Aynı rol adı ile kayıt var mı kontrol et
    const { data: existingRole, error: checkError } = await supabase
      .from('roller')
      .select('id')
      .ilike('rol_ad', body.rol_ad)
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Bu rol adı zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    // Rolü ekle
    const { data, error } = await supabase
      .from('roller')
      .insert({
        rol_ad: body.rol_ad,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    // Yeni rol için tüm sayfalara yetki ataması yap (varsayılan olarak erişim yok)
    const { data: sayfalar, error: sayfalarError } = await supabase
      .from('sayfalar')
      .select('id');
    
    if (sayfalarError) {
      throw sayfalarError;
    }
    
    if (sayfalar && sayfalar.length > 0) {
      const yetkiler = sayfalar.map(sayfa => ({
        rol_id: data[0].id,
        sayfa_id: sayfa.id,
        erisim_var: false // Varsayılan olarak erişim yok
      }));
      
      const { error: yetkiError } = await supabase
        .from('rol_sayfa_yetkileri')
        .insert(yetkiler);
      
      if (yetkiError) {
        console.error('Rol yetkileri eklenirken hata:', yetkiError);
        // Rol eklenmiş olduğu için bu hatayı sadece logla, işlemi iptal etme
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: `${body.rol_ad} rolü başarıyla eklendi`
    });
  } catch (error: any) {
    console.error('Rol eklenirken hata:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Rol eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol güncelleme endpoint'i
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Rol ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Güncellenecek alanları hazırla
    const updateFields: any = {};
    
    // Rol adı değiştirilmişse güncelle
    if (body.rol_ad !== undefined) {
      updateFields.rol_ad = body.rol_ad;
    }
    
    // Reçete görüntüleme yetkisi değiştirilmişse güncelle
    if (body.recete_goruntulebilir !== undefined) {
      updateFields.recete_goruntulebilir = body.recete_goruntulebilir;
    }
    
    // Yeni Üretim Gir yetkisi değiştirilmişse güncelle
    if (body.yeni_uretim_girebilir !== undefined) {
      updateFields.yeni_uretim_girebilir = body.yeni_uretim_girebilir;
    }
    
    // Kalan Bulk Sıfırla yetkisi değiştirilmişse güncelle
    if (body.kalan_bulk_sifirla !== undefined) {
      updateFields.kalan_bulk_sifirla = body.kalan_bulk_sifirla;
    }
    
    // Üretimi Sil yetkisi değiştirilmişse güncelle
    if (body.uretimi_sil !== undefined) {
      updateFields.uretimi_sil = body.uretimi_sil;
    }
    
    // Satınalma Siparişi Silme yetkisi değiştirilmişse güncelle
    if (body.satinalma_siparisi_sil !== undefined) {
      updateFields.satinalma_siparisi_sil = body.satinalma_siparisi_sil;
    }
    
    // Reçete Satış Bilgisi görüntüleme yetkisi değiştirilmişse güncelle
    if (body.recete_satis_bilgisi !== undefined) {
      updateFields.recete_satis_bilgisi = body.recete_satis_bilgisi;
    }
    
    // Reçete Maliyet Bilgisi görüntüleme yetkisi değiştirilmişse güncelle
    if (body.recete_maliyet_bilgisi !== undefined) {
      updateFields.recete_maliyet_bilgisi = body.recete_maliyet_bilgisi;
    }
    
    // Not alanı değiştirilmişse güncelle
    if (body.Not !== undefined) {
      updateFields.Not = body.Not;
    }
    
    // Boş bir güncelleme isteği kontrolü
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek veri bulunamadı' },
        { status: 400 }
      );
    }
    
    // Rolü güncelle
    const { data, error } = await supabase
      .from('roller')
      .update(updateFields)
      .eq('id', body.id)
      .select();
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncelleme yapıldı ancak güncel veri alınamadı' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: `${data[0].rol_ad} rolü başarıyla güncellendi`
    });
  } catch (error: any) {
    console.error('Rol güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Rol güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 