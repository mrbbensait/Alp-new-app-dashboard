import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'auto' | 'collapsed'>('auto');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

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
            <div className="flex items-center">
              <span className="text-sm text-gray-600">Kullanıcı</span>
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