'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

interface Sayfa {
  id: string;
  sayfa_adi: string;
  sayfa_yolu: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, login, user, sayfaYetkileri, fetchSayfaYetkileri } = useAuth();

  // Kullanıcı zaten giriş yapmışsa rolüne göre uygun sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated && user) {
      // Sayfa yetkilerini kontrol et ve yönlendir
      const yonlendir = () => {
        // Eğer yetkiler henüz yüklenmemişse, yükle
        if (sayfaYetkileri.length === 0) {
          fetchSayfaYetkileri()
            .then(yetkiler => {
              // Uygun sayfaya yönlendir
              yonlendirUygunSayfaya(yetkiler);
            })
            .catch(error => {
              console.error('Sayfa yetkileri alınamadı:', error);
              router.push('/');
            });
        } else {
          // Yetkiler zaten yüklenmişse, doğrudan yönlendir
          yonlendirUygunSayfaya(sayfaYetkileri);
        }
      };
      
      // Yönlendirme işlemi
      const yonlendirUygunSayfaya = (yetkiler: string[]) => {
        if (yetkiler.includes('/')) {
          router.push('/');
        } else if (yetkiler.includes('/anasayfa-p')) {
          router.push('/anasayfa-p');
        } else if (yetkiler.length > 0) {
          router.push(yetkiler[0]);
        } else {
          // Hiç sayfa yetkisi yoksa ana sayfaya yönlendir
          router.push('/');
        }
      };
      
      yonlendir();
    }
  }, [isAuthenticated, router, user, sayfaYetkileri, fetchSayfaYetkileri]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // AuthContext'in login fonksiyonunu kullanarak giriş yap
      const success = await login(username, password);
      
      if (success) {
        // Giriş başarılı olduktan sonra roller kontrol edilecek ve yönlendirme yapılacak
        // useEffect hook'u bu kontrolleri otomatik olarak yapacak
      } else {
        setError('Kullanıcı adı veya şifre hatalı');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <img src="/images/alpai-logo.png" alt="Alp Ai Logo" className="h-64" />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900 whitespace-nowrap">
            Tam Entegre Yapay ZEKA
          </h2>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Stok ve Üretim<br />
            Yönetim Sistemi
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Kullanıcı Adı</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Şifre</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">Designed & Coded by Sait Arslan</p>
        </div>
      </div>
    </div>
  );
} 