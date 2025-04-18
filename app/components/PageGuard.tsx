'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface PageGuardProps {
  children: React.ReactNode;
  sayfaYolu: string;
}

const PageGuard: React.FC<PageGuardProps> = ({ children, sayfaYolu }) => {
  const { user, sayfaYetkileri, fetchSayfaYetkileri } = useAuth();
  const router = useRouter();
  const [erisimVar, setErisimVar] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    // Erişim kontrolü fonksiyonu
    const erisimKontrol = async () => {
      // Kullanıcı yoksa login sayfasına yönlendir
      if (!user || !user.rol_id) {
        setErisimVar(false);
        setYukleniyor(false);
        router.push('/login');
        return;
      }

      try {
        // Sayfa yetkilerini kontrol et
        if (sayfaYetkileri.length > 0) {
          // Önbellekteki yetkilerden kontrol et
          const yetkiliMi = sayfaYetkileri.includes(sayfaYolu);
          setErisimVar(yetkiliMi);
        } else {
          // Eğer önbellekte yetki yoksa, bir defaya mahsus getir
          const yetkiliSayfalar = await fetchSayfaYetkileri();
          const yetkiliMi = yetkiliSayfalar.includes(sayfaYolu);
          setErisimVar(yetkiliMi);
        }
      } catch (error) {
        console.error("Erişim kontrolü hatası:", error);
        setErisimVar(false);
      } finally {
        setYukleniyor(false);
      }
    };

    erisimKontrol();
  }, [user, sayfaYolu, sayfaYetkileri, fetchSayfaYetkileri, router]);

  // Eğer erişim yoksa ve yükleme tamamlandıysa, yönlendirme yap
  useEffect(() => {
    if (!yukleniyor && !erisimVar && user) {
      // Yetkisiz erişim - kullanıcının erişebileceği bir ana sayfaya yönlendir
      const yonlendir = () => {
        // Ana sayfa var mı kontrol et
        const anaSayfa = sayfaYetkileri.includes('/');
        const anaSayfaP = sayfaYetkileri.includes('/anasayfa-p');
        
        // Yönlendirme için sayfayı belirle
        if (anaSayfa) {
          router.push('/');
        } else if (anaSayfaP) {
          router.push('/anasayfa-p');
        } else if (sayfaYetkileri.length > 0) {
          router.push(sayfaYetkileri[0]);
        } else {
          router.push('/login');
        }
      };
      
      const timer = setTimeout(yonlendir, 1500);
      return () => clearTimeout(timer);
    }
  }, [erisimVar, yukleniyor, user, sayfaYetkileri, router]);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Sayfa erişimi kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!erisimVar) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-red-600 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntüleme yetkiniz bulunmuyor.</p>
          <p className="text-gray-500 text-sm">Erişiminiz olan bir sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageGuard; 