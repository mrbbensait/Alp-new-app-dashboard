import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import fs from 'fs';
import path from 'path';

// Sayfaları depolamak için dizi
const sayfaYollari: { yol: string, ad: string }[] = [];

// app klasörünü tarama fonksiyonu
function taraAppDosyalari(dizin: string, baseDir: string) {
  const dosyalar = fs.readdirSync(dizin);
  
  for (const dosya of dosyalar) {
    const tamYol = path.join(dizin, dosya);
    const stat = fs.statSync(tamYol);
    
    if (stat.isDirectory()) {
      // api, components, lib gibi özel klasörleri atla
      if (!['api', 'components', 'lib', 'utils', 'data', 'styles', 'node_modules', '.next', '.git'].includes(dosya)) {
        // Alt dizini tara
        taraAppDosyalari(tamYol, baseDir);
      }
    } else if (dosya === 'page.tsx' || dosya === 'page.jsx') {
      // page.tsx bulundu, sayfa yolunu oluştur
      const relativePath = path.relative(baseDir, dizin);
      let sayfaYolu = '/' + relativePath.replace(/\\/g, '/');
      
      // Kök dizinde ise sadece / olarak ayarla
      if (sayfaYolu === '/app') {
        sayfaYolu = '/';
      } else {
        // /app/ kısmını çıkar
        sayfaYolu = sayfaYolu.replace('/app', '');
      }
      
      // Sayfa adını oluştur
      const pathParts = sayfaYolu.split('/').filter(Boolean);
      let sayfaAdi = pathParts.length > 0 ? 
        pathParts[pathParts.length - 1].replace(/-/g, ' ') : 
        'Ana Sayfa';
      
      // İlk harfi büyüt
      sayfaAdi = sayfaAdi.charAt(0).toUpperCase() + sayfaAdi.slice(1);
      
      // Diziye ekle
      sayfaYollari.push({
        yol: sayfaYolu,
        ad: sayfaAdi
      });
    }
  }
}

export async function POST() {
  try {
    // Sayfa yollarını temizle
    sayfaYollari.length = 0;
    
    // Proje kök dizini
    const projectRoot = process.cwd();
    const appDir = path.join(projectRoot, 'app');
    
    // App klasörünü tara
    taraAppDosyalari(appDir, projectRoot);
    
    // Sabit sayfaları ekle (manuel olarak tanımlanan sayfalar)
    const sabitSayfalar = [
      { yol: '/tablo', ad: 'Şirket Veritabanı' },
      { yol: '/formlar', ad: 'Formlar' },
      { yol: '/raporlar', ad: 'Yönetim' },
      { yol: '/tablo/Müşteriler', ad: 'Müşteriler' },
      { yol: '/tablo/suppliers', ad: 'Tedarikçiler' },
      { yol: '/tablo/Reçeteler', ad: 'Reçeteler' },
      { yol: '/tablo/SatınAlma siparişleri', ad: 'Satın Alma Siparişleri' },
      { yol: '/tablo/Stok', ad: 'Stok' },
      { yol: '/tablo/Üretim Kuyruğu', ad: 'Üretim Kuyruğu' },
      { yol: '/tablo/Bitmiş Ürün Stoğu', ad: 'Bitmiş Ürün Stoğu' },
    ];
    
    // Sabit sayfaları ekle
    sayfaYollari.push(...sabitSayfalar);
    
    // Duplicate kontrolü için yol listesi
    const yolListesi = sayfaYollari.map(s => s.yol);
    // Duplicate'leri çıkar
    const uniqueSayfalar = sayfaYollari.filter((sayfa, index) => 
      yolListesi.indexOf(sayfa.yol) === index
    );
    
    // Eklenecek sayfa sayısı
    let eklenecekSayfaSayisi = 0;
    
    // Her sayfa için veritabanına ekle veya güncelle
    for (const sayfa of uniqueSayfalar) {
      // Önce sayfanın veritabanında olup olmadığını kontrol et
      const { data: mevcutSayfa, error: kontrolError } = await supabase
        .from('sayfalar')
        .select('id')
        .eq('sayfa_yolu', sayfa.yol)
        .maybeSingle();
      
      if (kontrolError) {
        console.error(`Sayfa kontrolü sırasında hata: ${sayfa.yol}`, kontrolError);
        continue;
      }
      
      if (!mevcutSayfa) {
        // Veritabanında yoksa ekle
        const { error: eklemeError } = await supabase
          .from('sayfalar')
          .insert({
            sayfa_adi: sayfa.ad,
            sayfa_yolu: sayfa.yol
          });
          
        if (eklemeError) {
          console.error(`Sayfa eklenirken hata: ${sayfa.yol}`, eklemeError);
        } else {
          eklenecekSayfaSayisi++;
        }
      }
    }
    
    // Patron rolü için varsayılan olarak tüm sayfalara erişim izni ver
    // Önce patron rolünü bul
    const { data: patronRol, error: patronError } = await supabase
      .from('roller')
      .select('id')
      .eq('rol_ad', 'Patron')
      .maybeSingle();
      
    if (!patronError && patronRol) {
      // Yeni eklenen tüm sayfalar için patron rolüne yetki ekle
      const { data: tumSayfalar, error: sayfalarError } = await supabase
        .from('sayfalar')
        .select('id');
        
      if (!sayfalarError && tumSayfalar) {
        for (const sayfa of tumSayfalar) {
          // Rol-sayfa yetkisi var mı kontrol et
          const { data: mevcutYetki, error: yetkiKontrolError } = await supabase
            .from('rol_sayfa_yetkileri')
            .select('id')
            .eq('rol_id', patronRol.id)
            .eq('sayfa_id', sayfa.id)
            .maybeSingle();
            
          if (!yetkiKontrolError) {
            if (!mevcutYetki) {
              // Yetki yoksa ekle
              await supabase
                .from('rol_sayfa_yetkileri')
                .insert({
                  rol_id: patronRol.id,
                  sayfa_id: sayfa.id,
                  erisim_var: true
                });
            }
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${eklenecekSayfaSayisi} yeni sayfa başarıyla eklendi.`,
      total: uniqueSayfalar.length,
      added: eklenecekSayfaSayisi
    });
  } catch (error) {
    console.error('Sayfalar taranırken bir hata oluştu:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Sayfalar taranırken bir hata oluştu' 
    }, { status: 500 });
  }
} 