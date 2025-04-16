import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'auto' | 'collapsed'>('auto');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Kullanıcı giriş yapmadıysa login sayfasına yönlendir
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // localStorage'dan sidebar modunu almak için
  useEffect(() => {
    const savedMode = localStorage.getItem('sidebarMode') as 'auto' | 'collapsed' | null;
    if (savedMode) {
      setSidebarMode(savedMode);
      setIsSidebarVisible(savedMode !== 'collapsed');
    } else if (localStorage.getItem('sidebarMode') === 'pinned') {
      // Eski 'pinned' modu artık desteklenmiyor, 'auto'ya dönüştür
      setSidebarMode('auto');
      localStorage.setItem('sidebarMode', 'auto');
      setIsSidebarVisible(true);
    }

    // localStorage'daki değişiklikleri dinlemek için event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarMode') {
        const newMode = e.newValue as 'auto' | 'collapsed' | null;
        if (newMode) {
          setSidebarMode(newMode);
          setIsSidebarVisible(newMode !== 'collapsed');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sidebar görünürlüğünü güncellemek için
  const updateSidebarVisibility = (isVisible: boolean) => {
    setIsSidebarVisible(isVisible);
  };

  // Kullanıcı rolü çevirisi
  const getRoleName = (rol?: string): string => {
    switch (rol?.toLowerCase()) {
      case 'patron':
        return 'Patron';
      case 'yonetici':
        return 'Yönetici';
      case 'personel':
        return 'Personel';
      default:
        return 'Kullanıcı';
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onVisibilityChange={updateSidebarVisibility}
      />

      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isSidebarVisible ? 'md:ml-0 md:w-[calc(100%-16rem)]' : 'md:ml-0 md:w-full'}`}>
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 sm:px-6 md:px-8 flex justify-between items-center">
            <button
              type="button"
              className="md:hidden text-gray-500 hover:text-gray-600 p-1"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 md:hidden truncate ml-2">Üretim Yönetimi</h1>
            <div className="flex-1 md:ml-4"></div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700">{user?.ad_soyad || user?.kullanici_adi || 'Kullanıcı'}</span>
                <span className="text-xs text-gray-500">{getRoleName(user?.rol)}</span>
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

        <main className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 