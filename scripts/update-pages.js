const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Güvenli bir service key kullanın
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Proje içerisindeki tüm sayfaları bulur
 * @param {string} dir - Taranacak dizin
 * @param {Array} pages - Bulunan sayfaların listesi
 * @param {string} basePath - Temel yol
 * @returns {Array} - Bulunan sayfaların listesi
 */
async function findPages(dir = 'app', pages = [], basePath = '') {
  const files = fs.readdirSync(path.join(process.cwd(), dir));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(path.join(process.cwd(), filePath));
    
    if (stat.isDirectory()) {
      // Bazı dizinleri hariç tut
      if (file !== 'node_modules' && file !== '.next' && file !== 'api' && !file.startsWith('_')) {
        await findPages(filePath, pages, path.join(basePath, file));
      }
    } else if (file === 'page.tsx' || file === 'page.jsx') {
      // Sayfa yolunu oluştur
      let pagePath = basePath.replace(/\\/g, '/');
      if (!pagePath.startsWith('/')) {
        pagePath = '/' + pagePath;
      }
      
      // 'app' dizinini kaldır
      pagePath = pagePath.replace(/^\/app/, '');
      if (pagePath === '') pagePath = '/';
      
      pages.push(pagePath);
    }
  }
  
  return pages;
}

/**
 * Bulunan sayfaları veritabanına ekler
 * @param {Array} pages - Sayfa yollarının listesi
 */
async function updatePagesInDatabase(pages) {
  console.log('Bulunan sayfalar:', pages);
  
  // Veritabanındaki mevcut sayfaları al
  const { data: existingPages, error: fetchError } = await supabase
    .from('sayfalar')
    .select('id, sayfa_yolu');
  
  if (fetchError) {
    console.error('Mevcut sayfalar alınırken hata:', fetchError);
    return;
  }
  
  const existingPagePaths = existingPages.map(p => p.sayfa_yolu);
  
  // Patron rolünü bul
  const { data: patronRole, error: roleError } = await supabase
    .from('roller')
    .select('id')
    .eq('rol_ad', 'Patron')
    .single();
  
  if (roleError) {
    console.error('Patron rolü alınırken hata:', roleError);
    return;
  }
  
  // Yeni sayfaları ekle
  for (const pagePath of pages) {
    if (!existingPagePaths.includes(pagePath)) {
      console.log(`Yeni sayfa ekleniyor: ${pagePath}`);
      
      // Sayfayı ekle
      const { data: newPage, error: insertError } = await supabase
        .from('sayfalar')
        .insert({
          sayfa_yolu: pagePath,
          sayfa_adi: pagePath === '/' ? 'Ana Sayfa' : pagePath.split('/').pop()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`Sayfa eklenirken hata (${pagePath}):`, insertError);
        continue;
      }
      
      // Patron rolüne erişim ver
      const { error: permError } = await supabase
        .from('rol_sayfa_yetkileri')
        .insert({
          rol_id: patronRole.id,
          sayfa_id: newPage.id,
          erisim_var: true
        });
      
      if (permError) {
        console.error(`Patron rolüne yetki verilirken hata (${pagePath}):`, permError);
      }
    }
  }
  
  console.log('Sayfa güncellemesi tamamlandı.');
}

/**
 * Ana işlev - Sayfaları bulur ve veritabanına ekler
 */
async function updatePages() {
  try {
    const pages = await findPages();
    await updatePagesInDatabase(pages);
  } catch (error) {
    console.error('Sayfa güncellemesi sırasında hata:', error);
  }
}

// Script çalıştığında işlemi başlat
updatePages(); 