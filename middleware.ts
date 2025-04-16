import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rol bazlı sayfa erişim kontrolü
const ROLE_BASED_PATHS = {
  personel: [
    '/anasayfa-p', 
    '/uretim-kuyrugu-personel', 
    '/bitmis-urun-stogu-personel', 
    '/personel-rapor'
  ],
  yonetici: [
    '/', 
    '/stok-uretim-muduru-beyni', 
    '/raporlar', 
    '/raporlar/personel-performans',
    '/tablo',
    '/formlar'
  ],
  patron: [
    '/', 
    '/stok-uretim-muduru-beyni', 
    '/raporlar', 
    '/raporlar/personel-performans',
    '/tablo',
    '/formlar'
  ]
};

// Bu middleware, bazı sayfalara erişmeden önce tarayıcı tarafında kontrol yapar
export function middleware(request: NextRequest) {
  // Giriş sayfasına gidiyorsa veya API isteği ise herhangi bir işlem yapma
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Kullanıcı kimlik doğrulaması client-side üzerinde gerçekleştiğinden
  // URL ile direkt erişim kontrolü yapmıyoruz.
  // Bunu client tarafında AuthContext ve DashboardLayout bileşenleri yapıyor
  
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