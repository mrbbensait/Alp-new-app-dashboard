import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Bu middleware, sayfalara erişmeden önce tarayıcı tarafında giriş kontrolü yapar
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

  // Kullanıcı bilgisi kontrolü
  const userDataCookie = request.cookies.get('userData');
  
  if (!userDataCookie || !userDataCookie.value) {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Cookie'den kullanıcı bilgisini al
    JSON.parse(decodeURIComponent(userDataCookie.value));
    
    // Kullanıcı giriş yapmış, MEVCUT SAYFADA KALIYOR
    // Sayfa yetkisi kontrolü client-side'da PageGuard tarafından yapılacak
    return NextResponse.next();
  } catch (error) {
    // JSON parse hatası veya başka bir sorun varsa login sayfasına yönlendir
    return NextResponse.redirect(new URL('/login', request.url));
  }
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