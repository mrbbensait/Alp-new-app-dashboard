import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rol bazlı sayfa erişim kontrolü
const ROLE_BASED_PATHS = {
  personel: [
    '/anasayfa-p', 
    '/uretim-kuyrugu-personel', 
    '/bitmis-urun-stogu-personel', 
    '/personel-rapor',
    '/login',
    '/api'
  ],
  yonetici: [
    '/', 
    '/stok-uretim-muduru-beyni', 
    '/raporlar', 
    '/raporlar/personel-performans',
    '/tablo',
    '/formlar',
    '/ayarlar',
    '/login',
    '/api'
  ],
  patron: [
    '/', 
    '/stok-uretim-muduru-beyni', 
    '/raporlar', 
    '/raporlar/personel-performans',
    '/tablo',
    '/formlar',
    '/ayarlar',
    '/login',
    '/api'
  ]
};

// Bu middleware, bazı sayfalara erişmeden önce tarayıcı tarafında kontrol yapar
export function middleware(request: NextRequest) {
  // API isteklerini her zaman izin ver
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Giriş sayfasına gidiyorsa izin ver
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }
  
  // Statik dosyalara her zaman izin ver
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('favicon.ico') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|gif|png|svg|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Local storage'dan kullanıcı bilgisini kontrol et
  const userDataCookie = request.cookies.get('userData');
  
  if (!userDataCookie || !userDataCookie.value) {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Cookie'den kullanıcı rolünü al
    const userData = JSON.parse(decodeURIComponent(userDataCookie.value));
    const userRole = userData.rol || 'personel';
    
    // Kullanıcının mevcut istek yapabileceği sayfaların listesi
    const allowedPaths = ROLE_BASED_PATHS[userRole as keyof typeof ROLE_BASED_PATHS] || [];
    
    // İstenen sayfa yolu
    const pathname = request.nextUrl.pathname;
    
    // Sayfanın başlangıcı izin verilen yollarla eşleşiyor mu kontrol et
    const isAllowed = allowedPaths.some(path => {
      // Tam eşleşme kontrolü
      if (pathname === path) return true;
      
      // Alt dizinler kontrolü, örn: /tablo/Stok, /formlar/recete-kaydi
      if (path.endsWith('/')) return false; // Sonunda slash varsa alt dizin kabul etmez
      return pathname.startsWith(path + '/');
    });
    
    if (!isAllowed) {
      // İzin verilmeyen bir sayfaya erişmeye çalışırsa, rolüne göre anasayfaya yönlendir
      if (userRole === 'personel') {
        return NextResponse.redirect(new URL('/anasayfa-p', request.url));
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch (error) {
    // JSON parse hatası veya başka bir sorun varsa login sayfasına yönlendir
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Matcher, middleware'in hangi sayfalarda çalışacağını belirtir
export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar hariç tüm yolları eşleştirir:
     * - Statik dosyalar (/_next/, /favicon.ico, vs.)
     * - Diğer belirli sayfalar veya API rotaları buraya eklenebilir
     */
    '/((?!_next|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)).*)',
  ],
}; 