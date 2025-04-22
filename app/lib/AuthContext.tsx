'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { isPageRefresh } from './utils';

// Kullanıcı tipi
interface User {
  id: string;
  kullanici_adi: string;
  ad_soyad: string;
  rol_id: string;
}

// Auth context için tip tanımı
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  sayfaYetkileri: string[]; // Erişilebilir sayfa yollarını sakla
  fetchSayfaYetkileri: () => Promise<string[]>; // Sayfa yetkilerini çekme fonksiyonu
}

// Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider bileşeni
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sayfaYetkileri, setSayfaYetkileri] = useState<string[]>([]);
  const router = useRouter();

  // Sayfa yetkilerini çekme fonksiyonu
  const fetchSayfaYetkileri = async (): Promise<string[]> => {
    // Eğer sayfaYetkileri zaten dolu ise API çağrısı yapmadan mevcut değeri döndür
    if (sayfaYetkileri.length > 0) {
      return sayfaYetkileri;
    }

    if (!user || !user.rol_id) return [];
    
    try {
      const response = await fetch(`/api/rol-erisim-sayfalari?rol_id=${user.rol_id}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const yetkiliSayfalar = data.data.map((sayfa: any) => sayfa.sayfa_yolu);
        // Context state'ini güncelle
        setSayfaYetkileri(yetkiliSayfalar);
        // sessionStorage'a kaydet
        sessionStorage.setItem('sayfaYetkileri', JSON.stringify(yetkiliSayfalar));
        return yetkiliSayfalar;
      }
      return [];
    } catch (error) {
      console.error('Sayfa yetkileri alınırken hata:', error);
      return [];
    }
  };

  // Sayfa yüklendiğinde kullanıcı durumunu kontrol et
  useEffect(() => {
    // sessionStorage'dan kullanıcı bilgilerini al (localStorage yerine)
    const checkAuth = () => {
      setIsLoading(true);
      const isLoggedIn = sessionStorage.getItem('isLoggedIn');
      const userDataString = sessionStorage.getItem('user');
      const sayfaYetkileriString = sessionStorage.getItem('sayfaYetkileri');

      if (isLoggedIn === 'true' && userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          setUser(userData);
          
          // Sayfa yetkilerini sessionStorage'dan al (varsa)
          if (sayfaYetkileriString) {
            try {
              const yetkiliSayfalar = JSON.parse(sayfaYetkileriString);
              setSayfaYetkileri(yetkiliSayfalar);
            } catch (e) {
              console.error('Sayfa yetkileri ayrıştırılamadı:', e);
            }
          }
        } catch (error) {
          console.error('Kullanıcı verisi ayrıştırılamadı:', error);
          setUser(null);
          sessionStorage.removeItem('isLoggedIn');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('sayfaYetkileri');
          
          // Sayfa yenileme durumunda Login sayfasına yönlendirmeyi engelle
          if (!isPageRefresh()) {
            router.push('/login');
          }
        }
      } else {
        setUser(null);
        setSayfaYetkileri([]);
        
        // Sayfa yenileme durumunda Login sayfasına yönlendirmeyi engelle
        if (!isPageRefresh()) {
          router.push('/login');
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    // Storage olaylarını dinleme
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn' || e.key === 'user' || e.key === 'sayfaYetkileri') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Giriş işlemi
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Supabase'den personel tablosundan kullanıcı adı ve şifreyi kontrol et
      const { data, error } = await supabase
        .from('personel')
        .select('*')
        .eq('kullanici_adi', username)
        .eq('sifre', password)
        .single();

      if (error) {
        console.error('Giriş hatası:', error);
        setIsLoading(false);
        return false;
      }

      if (data) {
        // Kullanıcı bilgilerini sessionStorage'a kaydet (localStorage yerine)
        const userData: User = {
          id: data.id,
          kullanici_adi: data.kullanici_adi,
          ad_soyad: data.ad_soyad,
          rol_id: data.rol_id
        };
        
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Middleware için kullanıcı verilerini cookie olarak kaydet
        // Session cookie olarak ayarla (max-age kaldırıldı - tarayıcı kapandığında sona erecek)
        document.cookie = `userData=${encodeURIComponent(JSON.stringify(userData))}; path=/; SameSite=Lax`;
        
        // Önce kullanıcı state'ini güncelle
        setUser(userData);
        
        // Kullanıcının erişebileceği sayfaları çek ve sakla
        // Burada await kullanarak yetki kontrolünün tamamlanmasını garantiliyoruz
        const yetkiliSayfalar = await fetch(`/api/rol-erisim-sayfalari?rol_id=${userData.rol_id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data.length > 0) {
              const sayfaYollari = data.data.map((sayfa: any) => sayfa.sayfa_yolu);
              setSayfaYetkileri(sayfaYollari);
              sessionStorage.setItem('sayfaYetkileri', JSON.stringify(sayfaYollari));
              return sayfaYollari;
            }
            return [];
          })
          .catch(err => {
            console.error('Sayfa yetkileri alınırken hata:', err);
            return [];
          });
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Giriş hatası:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Çıkış işlemi
  const logout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sayfaYetkileri');
    
    // Cookie'yi de temizle
    document.cookie = 'userData=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    
    setUser(null);
    setSayfaYetkileri([]);
    router.push('/login');
  };

  // Context değeri
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    sayfaYetkileri,
    fetchSayfaYetkileri
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook olarak kullanım
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 