import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const kullanici_id = searchParams.get('kullanici_id');
  const islem_turu = searchParams.get('islem_turu');
  const tablo_adi = searchParams.get('tablo_adi');
  const baslangic_tarihi = searchParams.get('baslangic_tarihi');
  const bitis_tarihi = searchParams.get('bitis_tarihi');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  let query = supabase
    .from('user_activity_logs')
    .select('*', { count: 'exact' })
    .order('olusturma_tarihi', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (kullanici_id) {
    query = query.eq('kullanici_id', kullanici_id);
  }
  
  if (islem_turu) {
    query = query.eq('islem_turu', islem_turu);
  }
  
  if (tablo_adi) {
    query = query.eq('tablo_adi', tablo_adi);
  }
  
  if (baslangic_tarihi) {
    query = query.gte('olusturma_tarihi', baslangic_tarihi);
  }
  
  if (bitis_tarihi) {
    // Bitiş tarihinin sonuna 23:59:59 ekleyerek tüm günü dahil edelim
    const bitis = new Date(bitis_tarihi);
    bitis.setHours(23, 59, 59, 999);
    query = query.lte('olusturma_tarihi', bitis.toISOString());
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true, 
    data, 
    meta: { 
      count, 
      limit, 
      offset 
    } 
  });
} 