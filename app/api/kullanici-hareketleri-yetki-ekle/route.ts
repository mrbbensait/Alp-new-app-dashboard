import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Sayfayı ekle
    const { data: sayfaData, error: sayfaError } = await supabase
      .from('sayfalar')
      .upsert({
        sayfa_adi: 'Kullanıcı Hareketleri',
        sayfa_yolu: '/ayarlar/kullanici-hareketleri'
      }, { onConflict: 'sayfa_yolu' })
      .select('id')
      .single();

    if (sayfaError) {
      console.error('Sayfa eklenirken hata:', sayfaError);
      return NextResponse.json({ success: false, error: 'Sayfa eklenirken hata oluştu' }, { status: 500 });
    }

    // 2. Patron rolünü bul
    const { data: patronRol, error: patronError } = await supabase
      .from('roller')
      .select('id')
      .eq('rol_ad', 'Patron')
      .single();

    if (patronError) {
      console.error('Patron rolü bulunamadı:', patronError);
      return NextResponse.json({ success: false, error: 'Patron rolü bulunamadı' }, { status: 500 });
    }

    // 3. Yönetici rolünü bul
    const { data: yoneticiRol, error: yoneticiError } = await supabase
      .from('roller')
      .select('id')
      .eq('rol_ad', 'Yönetici')
      .single();

    // 4. Patron rolüne sayfa yetkisi ekle
    const { error: patronYetkiError } = await supabase
      .from('rol_sayfa_yetkileri')
      .upsert({
        rol_id: patronRol.id,
        sayfa_id: sayfaData.id,
        erisim_var: true
      }, { onConflict: 'rol_id,sayfa_id' });

    if (patronYetkiError) {
      console.error('Patron rolü yetki eklenirken hata:', patronYetkiError);
    }

    // 5. Yönetici rolü varsa yetki ekle
    if (!yoneticiError && yoneticiRol) {
      const { error: yoneticiYetkiError } = await supabase
        .from('rol_sayfa_yetkileri')
        .upsert({
          rol_id: yoneticiRol.id,
          sayfa_id: sayfaData.id,
          erisim_var: true
        }, { onConflict: 'rol_id,sayfa_id' });

      if (yoneticiYetkiError) {
        console.error('Yönetici rolü yetki eklenirken hata:', yoneticiYetkiError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Kullanıcı Hareketleri sayfası ve yetkileri başarıyla eklendi',
      data: {
        sayfa_id: sayfaData.id,
        patron_rol_id: patronRol.id,
        yonetici_rol_id: yoneticiRol?.id
      }
    });
  } catch (error) {
    console.error('Kullanıcı Hareketleri sayfası yetkileri eklenirken hata:', error);
    return NextResponse.json({ success: false, error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
  }
} 