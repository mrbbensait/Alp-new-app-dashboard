import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, pageTitle, pageSubtitle }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'auto' | 'collapsed'>('auto');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  const [showWarning, setShowWarning] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [userRolAd, setUserRolAd] = useState('Kullanıcı');

  // Kullanıcı giriş yapmadıysa login sayfasına yönlendir
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Kullanıcının rolünü çek
  useEffect(() => {
    const fetchUserRol = async () => {
      if (user && user.rol_id) {
        try {
          const { data, error } = await supabase
            .from('roller')
            .select('rol_ad')
            .eq('id', user.rol_id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setUserRolAd(data.rol_ad);
          }
        } catch (error) {
          console.error('Rol bilgisi alınırken hata:', error);
          // Hata durumunda varsayılan değer kullanılacak (state'in başlangıç değeri)
        }
      }
    };
    
    fetchUserRol();
  }, [user]);

  // sessionStorage'dan sidebar modunu almak için
  useEffect(() => {
    const savedMode = sessionStorage.getItem('sidebarMode') as 'auto' | 'collapsed' | null;
    if (savedMode) {
      setSidebarMode(savedMode);
      const isVisible = savedMode !== 'collapsed';
      setIsSidebarVisible(isVisible);
      console.log('Initial sidebar mode:', savedMode, 'isVisible:', isVisible);
    } else if (sessionStorage.getItem('sidebarMode') === 'pinned') {
      // Eski 'pinned' modu artık desteklenmiyor, 'auto'ya dönüştür
      setSidebarMode('auto');
      sessionStorage.setItem('sidebarMode', 'auto');
      setIsSidebarVisible(true);
      console.log('Converting pinned mode to auto, isVisible: true');
    }

    // sessionStorage'daki değişiklikleri dinlemek için event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarMode') {
        const newMode = e.newValue as 'auto' | 'collapsed' | null;
        if (newMode) {
          setSidebarMode(newMode);
          const isVisible = newMode !== 'collapsed';
          setIsSidebarVisible(isVisible);
          console.log('Storage changed - mode:', newMode, 'isVisible:', isVisible);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Ekran genişliği değişimini takip et
  useEffect(() => {
    // İlk yükleme için ekran genişliğini ayarla
    setWindowWidth(window.innerWidth);
    
    // Ekran boyutu değiştiğinde güncelle
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Mobil ekran kontrolü
  const isMobile = windowWidth > 0 && windowWidth < 768;

  // Sidebar görünürlüğünü güncellemek için
  const updateSidebarVisibility = (isVisible: boolean) => {
    console.log('Sidebar visibility changed:', isVisible);
    setIsSidebarVisible(isVisible);
    // Mobil menü açıkken sidebar görünürlüğü değişirse mobil menüyü kapat
    if (isMobileSidebarOpen && !isVisible) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Kullanıcı kimliği doğrulanmadıysa veya yükleme devam ediyorsa içeriği gösterme
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-50 overflow-hidden">
      <style jsx>{`
        @keyframes warningPulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .warning-pulse {
          animation: warningPulse 2s ease-in-out infinite;
          box-shadow: 0 0 15px rgba(220, 38, 38, 0.5);
        }
      `}</style>
      
      <Sidebar 
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onVisibilityChange={updateSidebarVisibility}
      />

      <div 
        className="flex flex-col overflow-hidden transition-all duration-300"
        style={{
          width: isMobileSidebarOpen || isMobile
            ? '100%' // Mobil sidebar açıkken içerik tam genişlikte olacak
            : (isSidebarVisible && !isMobile) // Masaüstünde normal davranış
              ? 'calc(100% - 16rem)' 
              : '100%',
          position: 'absolute',
          left: isMobileSidebarOpen || isMobile
            ? '0' // Mobil sidebar açıkken içerik solda kalacak
            : (isSidebarVisible && !isMobile) // Masaüstünde normal davranış
              ? '16rem' 
              : '0',
          top: 0,
          right: 0,
          bottom: 0,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <header className="bg-white shadow-sm z-10 relative">
          {/* Yanıp sönen uyarı mesajı - showWarning true olduğunda görünür */}
          {showWarning && (
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 w-full max-w-xl text-center z-20">
              <div className="warning-pulse bg-red-50 border-2 border-red-500 rounded-lg px-4 py-2 shadow-lg mx-4 mt-2">
                <p className="text-red-600 font-bold">Mali Performans üzerinde güncellemeler yapılıyor!</p>
                <p className="text-red-500 text-sm">Lütfen bir kayıt girişi yapmayınız, sayfalar arasında dolaşabilirsiniz.</p>
              </div>
            </div>
          )}
          
          <div className="px-4 py-3 sm:px-6 md:px-8 flex justify-between items-center">
            {/* Sayfa başlığı ve alt başlığı */}
            <div className="flex flex-col">
              {pageTitle && <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>}
              {pageSubtitle && <p className="text-sm text-gray-600">{pageSubtitle}</p>}
            </div>
            
            <div className="flex-1 md:ml-4"></div>
            
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700">{user?.ad_soyad || user?.kullanici_adi || 'Kullanıcı'}</span>
                <span className="text-xs text-gray-500">{userRolAd}</span>
              </div>
              <button 
                onClick={logout}
                className="flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-900 bg-red-100 hover:bg-red-200 border border-red-200 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 transition-colors"
              >
                <span className="hidden sm:inline-block">Çıkış</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-auto p-1 sm:p-2 md:p-3">
          {children}
        </main>
        
        <footer className="text-center py-2 text-xs text-gray-400">
          Designed & Coded by Sait Arslan
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout; 