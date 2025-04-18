import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import fs from 'fs';
import path from 'path';

// Projedeki tüm sayfaları tarayıp veritabanına ekleyen API
export async function POST(request: NextRequest) {
  try {
    const appDir = path.join(process.cwd(), 'app');
    const excludeDirs = ['components', 'api', 'lib', 'utils', 'styles', 'public', 'node_modules'];
    
    // Tüm sayfaları topla
    const pages = await scanPages(appDir, excludeDirs);
    
    // Menü yapısını ekle
    const menuPages = getMenuPages();
    pages.push(...menuPages);
    
    // Mevcut sayfaları veritabanından getir
    const { data: existingPages, error: fetchError } = await supabase
      .from('sayfalar')
      .select('id, sayfa_yolu');
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Veritabanında olmayan sayfaları ekle
    const existingPaths = existingPages?.map(p => p.sayfa_yolu) || [];
    const newPages = pages.filter(page => !existingPaths.includes(page.sayfa_yolu));
    
    let addedCount = 0;
    
    if (newPages.length > 0) {
      // Yeni sayfaları ekle
      const { data: insertedPages, error: insertError } = await supabase
        .from('sayfalar')
        .insert(newPages)
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      addedCount = insertedPages?.length || 0;
      
      // Eklenen her yeni sayfa için tüm roller için yetki kaydı oluştur
      if (insertedPages && insertedPages.length > 0) {
        const { data: roles, error: rolesError } = await supabase
          .from('roller')
          .select('id, rol_ad');
        
        if (rolesError) {
          throw rolesError;
        }
        
        // Her rol için her sayfa için yetki kaydı
        const permissions = [];
        for (const role of roles) {
          for (const page of insertedPages) {
            permissions.push({
              rol_id: role.id,
              sayfa_id: page.id,
              erisim_var: role.rol_ad === 'Patron' // Patron rolüne varsayılan olarak erişim ver
            });
          }
        }
        
        if (permissions.length > 0) {
          const { error: permError } = await supabase
            .from('rol_sayfa_yetkileri')
            .insert(permissions);
          
          if (permError) {
            throw permError;
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${addedCount} yeni sayfa başarıyla eklendi`,
      total_pages: pages.length,
      added_pages: addedCount,
      new_pages: newPages.map(p => p.sayfa_adi)
    });
  } catch (error) {
    console.error('Sayfalar taranırken hata:', error);
    return NextResponse.json(
      { success: false, error: 'Sayfalar taranırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Dizinde page.tsx veya page.js dosyaları arar
async function scanPages(dir: string, excludeDirs: string[] = [], basePath: string = ''): Promise<any[]> {
  const pages: any[] = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);
      
      // Klasör ise ve hariç tutulacak dizinlerden değilse, içini tara
      if (stat.isDirectory() && !excludeDirs.includes(item)) {
        const subPages = await scanPages(fullPath, excludeDirs, relativePath);
        pages.push(...subPages);
        
        // page.tsx veya page.js varsa, bu dizin bir sayfa demektir
        const pageFile = fs.readdirSync(fullPath).find(f => f === 'page.tsx' || f === 'page.js');
        if (pageFile) {
          // Sayfa yolunu URL biçimine çevir
          let routePath = relativePath.replace(/\\/g, '/');
          if (routePath === 'page') {
            routePath = '/'; // Ana sayfa
          }
          
          // Anlamlı sayfa adı oluştur
          let pageName = '';
          if (routePath === '/') {
            pageName = 'Ana Sayfa';
          } else {
            const parts = routePath.split('/').filter(Boolean);
            const lastPart = parts[parts.length - 1];
            // kebab-case veya snake_case'i insan okuyabilir metne çevir
            pageName = lastPart
              .replace(/-/g, ' ')
              .replace(/_/g, ' ')
              .replace(/^./, firstChar => firstChar.toUpperCase())
              .replace(/\b\w/g, char => char.toUpperCase());
          }
          
          pages.push({
            sayfa_adi: pageName,
            sayfa_yolu: routePath === '/' ? routePath : `/${routePath}`
          });
        }
      }
    }
    
    return pages;
  } catch (error) {
    console.error(`Dizin taranırken hata (${dir}):`, error);
    return pages;
  }
}

// Sidebar menüsündeki tüm sayfaları döndürür
function getMenuPages(): any[] {
  // Bu manuel olarak tanımlanan bir liste, idealde Sidebar.tsx'den otomatik çekilmeli
  // Tüm parent ve alt menüleri burada listeliyoruz
  return [
    // Ana Sayfa
    { sayfa_adi: "Ana Sayfa", sayfa_yolu: "/" },
    
    // Menü başlıkları
    { sayfa_adi: "Şirket Veritabanı", sayfa_yolu: "/tablo" },
    { sayfa_adi: "Formlar", sayfa_yolu: "/formlar" },
    { sayfa_adi: "Yönetim", sayfa_yolu: "/raporlar" },
    
    // Şirket Veritabanı altındaki sayfalar
    { sayfa_adi: "Müşteriler", sayfa_yolu: "/tablo/Müşteriler" },
    { sayfa_adi: "Tedarikçiler", sayfa_yolu: "/tablo/suppliers" },
    { sayfa_adi: "Reçeteler", sayfa_yolu: "/tablo/Reçeteler" },
    { sayfa_adi: "SatınAlma Siparişleri", sayfa_yolu: "/tablo/SatınAlma siparişleri" },
    { sayfa_adi: "Stok", sayfa_yolu: "/tablo/Stok" },
    { sayfa_adi: "Üretim Kuyruğu", sayfa_yolu: "/tablo/Üretim Kuyruğu" },
    { sayfa_adi: "Bitmiş Ürün Stoğu", sayfa_yolu: "/tablo/Bitmiş Ürün Stoğu" },
    
    // Formlar altındaki sayfalar
    { sayfa_adi: "Reçete Kaydı", sayfa_yolu: "/formlar/recete-kaydi" },
    
    // Yönetim/Raporlar altındaki sayfalar
    { sayfa_adi: "Genel Raporlar", sayfa_yolu: "/raporlar" },
    { sayfa_adi: "Personel Performans", sayfa_yolu: "/raporlar/personel-performans" },
  ];
} 