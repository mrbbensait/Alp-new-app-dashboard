import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // İlk olarak şema kontrolü yapalım
    const { data: columns, error: checkError } = await supabase
      .from('roller')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Tablo şema kontrolü hatası:', checkError);
      return NextResponse.json(
        { success: false, error: checkError.message },
        { status: 500 }
      );
    }

    // Alanların olup olmadığını kontrol edelim
    const sampleRow = columns?.[0] || {};
    const missingColumns = [];
    
    if (!('description' in sampleRow)) {
      missingColumns.push('description');
    }
    
    if (!('permissions' in sampleRow)) {
      missingColumns.push('permissions');
    }
    
    if (!('page_permissions' in sampleRow)) {
      missingColumns.push('page_permissions');
    }
    
    if (missingColumns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tüm gerekli sütunlar zaten mevcut.'
      });
    }
    
    // Gerekli sütunları ekleyelim
    // Supabase'de otomatik şema güncelleme için RPC kullanarak SQL çalıştıracağız
    
    // description sütununu ekleyelim
    if (missingColumns.includes('description')) {
      const { error: descriptionError } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE public.roller ADD COLUMN IF NOT EXISTS description TEXT'
      });
      
      if (descriptionError) {
        console.error('description sütunu ekleme hatası:', descriptionError);
        return NextResponse.json(
          { success: false, error: descriptionError.message },
          { status: 500 }
        );
      }
    }
    
    // permissions sütununu ekleyelim
    if (missingColumns.includes('permissions')) {
      const { error: permissionsError } = await supabase.rpc('execute_sql', {
        sql_query: "ALTER TABLE public.roller ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb"
      });
      
      if (permissionsError) {
        console.error('permissions sütunu ekleme hatası:', permissionsError);
        return NextResponse.json(
          { success: false, error: permissionsError.message },
          { status: 500 }
        );
      }
    }
    
    // page_permissions sütununu ekleyelim
    if (missingColumns.includes('page_permissions')) {
      const { error: pagePermissionsError } = await supabase.rpc('execute_sql', {
        sql_query: "ALTER TABLE public.roller ADD COLUMN IF NOT EXISTS page_permissions JSONB DEFAULT '[]'::jsonb"
      });
      
      if (pagePermissionsError) {
        console.error('page_permissions sütunu ekleme hatası:', pagePermissionsError);
        return NextResponse.json(
          { success: false, error: pagePermissionsError.message },
          { status: 500 }
        );
      }
    }
    
    // Başarılı güncelleme mesajı
    return NextResponse.json({
      success: true,
      message: `${missingColumns.join(', ')} sütunları başarıyla eklendi.`
    });
    
  } catch (error: any) {
    console.error('Şema güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Şema güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 