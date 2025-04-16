'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

// Kullanıcı tipi
interface User {
  id: number;
  kullanici_adi: string;
  ad_soyad: string;
  rol?: string;
}

// Auth context için tip tanımı
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider bileşeni
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sayfa yüklendiğinde kullanıcı durumunu kontrol et
  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const checkAuth = () => {
      setIsLoading(true);
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userDataString = localStorage.getItem('user');

      if (isLoggedIn === 'true' && userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          setUser(userData);
        } catch (error) {
          console.error('Kullanıcı verisi ayrıştırılamadı:', error);
          setUser(null);
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Storage olaylarını dinleme
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn' || e.key === 'user') {
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
        // Kullanıcı bilgilerini localStorage'a kaydet
        const userData: User = {
          id: data.id,
          kullanici_adi: data.kullanici_adi,
          ad_soyad: data.ad_soyad,
          rol: data.rol || 'kullanici'
        };
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  // Context değeri
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
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