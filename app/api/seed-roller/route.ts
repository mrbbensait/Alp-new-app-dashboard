import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Roller tablosunda veri var mı kontrol et
    const { data: mevcutRoller, error: kontrolError } = await supabase
      .from('roller')
      .select('id')
      .limit(1);
    
    if (kontrolError) {
      throw kontrolError;
    }
    
    // Eğer roller tablosunda veri yoksa, başlangıç verilerini ekle
    if (mevcutRoller && mevcutRoller.length === 0) {
      const { data, error } = await supabase
        .from('roller')
        .insert([
          { rol_ad: 'Patron' },
          { rol_ad: 'Yönetici' },
          { rol_ad: 'Personel' }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Roller başarıyla eklendi', 
        data 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Roller zaten mevcut, yeni veri eklenmedi'
      });
    }
    
  } catch (error) {
    console.error('Rol seed işlemi sırasında hata:', error);
    return NextResponse.json(
      { success: false, error: 'Veri eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 