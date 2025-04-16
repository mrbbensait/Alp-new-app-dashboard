'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { tableNames } from '../data/schema';
import { useAuth } from '../lib/AuthContext';
import { 
  Home, 
  BarChart2, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  Users, 
  Truck, 
  FileText, 
  Beaker, 
  ShoppingCart, 
  Package, 
  Clock, 
  Archive, 
  Briefcase,
  Brain,
  ClipboardList,
  Activity,
  Clipboard
} from 'lucide-react';

// Tabloları ve sayfaları türü
type TableItem = {
  name: string;
  originalName?: string;
  icon: React.ReactNode;
  type?: never;
  roles?: string[];
} | {
  type: 'divider';
  name?: never;
  originalName?: never;
  icon?: never;
  roles?: never;
};

interface SidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (value: boolean) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileSidebarOpen, setIsMobileSidebarOpen, onVisibilityChange }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.rol || 'personel';
  
  // Aktif sayfa durumuna göre menülerin açık/kapalı durumunu belirleme
  const isFormsPage = pathname.startsWith('/formlar');
  const isTablesPage = pathname.startsWith('/tablo');
  const isReportsPage = pathname.startsWith('/raporlar');
  
  const [tablesOpen, setTablesOpen] = useState(isTablesPage);
  const [formsOpen, setFormsOpen] = useState(isFormsPage);
  const [reportsOpen, setReportsOpen] = useState(isReportsPage);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarMode, setSidebarMode] = useState<'auto' | 'collapsed'>('auto');
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // URL değiştiğinde açılır menü durumlarını güncelle
  useEffect(() => {
    setFormsOpen(isFormsPage);
    setTablesOpen(isTablesPage);
    setReportsOpen(isReportsPage);
  }, [pathname, isFormsPage, isTablesPage, isReportsPage]);

  const toggleTablesMenu = () => {
    setTablesOpen(!tablesOpen);
    // Tablolar açılırken formlar ve raporlar kapansın
    if (!tablesOpen) {
      setFormsOpen(false);
      setReportsOpen(false);
    }
  };

  const toggleFormsMenu = () => {
    setFormsOpen(!formsOpen);
    // Formlar açılırken tablolar ve raporlar kapansın
    if (!formsOpen) {
      setTablesOpen(false);
      setReportsOpen(false);
    }
  };

  const toggleReportsMenu = () => {
    setReportsOpen(!reportsOpen);
    // Raporlar açılırken tablolar ve formlar kapansın
    if (!reportsOpen) {
      setTablesOpen(false);
      setFormsOpen(false);
    }
  };

  // Patron ve yöneticilerin erişebileceği sayfalar
  const adminMenuItems = [
    { 
      name: 'Ana Sayfa', 
      path: '/', 
      icon: <Home size={18} />,
      roles: ['patron', 'yonetici']
    },
    { 
      name: 'Stok ve Üretim Müdürü', 
      path: '/stok-uretim-muduru-beyni', 
      icon: <Brain size={18} />,
      roles: ['patron', 'yonetici'] 
    },
  ];

  // Yönetim raporları - patron ve yöneticilerin erişebileceği
  const reportItems = [
    { 
      name: 'Genel Raporlar', 
      path: '/raporlar', 
      icon: <BarChart2 size={18} />,
      roles: ['patron', 'yonetici']
    },
    { 
      name: 'Personel Performans', 
      path: '/raporlar/personel-performans', 
      icon: <Activity size={18} />,
      roles: ['patron', 'yonetici']
    },
  ];

  // Sadece personelin erişebileceği sayfalar
  const personalItems = [
    { 
      name: 'ANA SAYFA-P', 
      path: '/anasayfa-p', 
      icon: <Home size={18} />,
      roles: ['personel'] 
    },
    { 
      name: 'Üretim Kuyruğu Personel', 
      path: '/uretim-kuyrugu-personel', 
      icon: <Clock size={18} />,
      roles: ['personel']
    },
    { 
      name: 'Bitmiş Ürün Stoğu Personel', 
      path: '/bitmis-urun-stogu-personel', 
      icon: <Archive size={18} />,
      roles: ['personel']
    },
    { 
      name: 'Personel Rapor', 
      path: '/personel-rapor', 
      icon: <Clipboard size={18} />,
      roles: ['personel']
    },
  ];

  // Form sayfaları
  const formItems = [
    {
      name: 'Reçete Kaydı',
      path: '/formlar/recete-kaydi',
      icon: <FileText size={18} />,
      roles: ['patron', 'yonetici']
    }
  ];

  // Özel tablo sıralaması
  const tableOrder: TableItem[] = [
    { name: 'Müşteriler', icon: <Users size={18} />, roles: ['patron', 'yonetici'] },
    { name: 'Tedarikçiler', originalName: 'suppliers', icon: <Truck size={18} />, roles: ['patron', 'yonetici'] },
    { type: 'divider' },
    { name: 'Reçeteler', icon: <FileText size={18} />, roles: ['patron', 'yonetici'] },
    { name: 'Formülasyonlar', icon: <Beaker size={18} />, roles: ['patron', 'yonetici'] },
    { type: 'divider' },
    { name: 'SatınAlma siparişleri', icon: <ShoppingCart size={18} />, roles: ['patron', 'yonetici'] },
    { type: 'divider' },
    { name: 'STOK', originalName: 'Stok', icon: <Package size={18} />, roles: ['patron', 'yonetici'] },
    { type: 'divider' },
    { name: 'Üretim Kuyruğu', icon: <Clock size={18} />, roles: ['patron', 'yonetici'] },
    { name: 'Bitmiş Ürün Stoğu', icon: <Archive size={18} />, roles: ['patron', 'yonetici'] },
  ];

  // Kullanıcının rolüne göre erişebileceği menü öğelerini filtrele
  const filteredAdminMenuItems = adminMenuItems.filter(item => item.roles?.includes(userRole));
  const filteredReportItems = reportItems.filter(item => item.roles?.includes(userRole));
  const filteredPersonalItems = personalItems.filter(item => item.roles?.includes(userRole));
  const filteredFormItems = formItems.filter(item => item.roles?.includes(userRole));
  const filteredTableOrder = tableOrder.filter(item => 
    item.type === 'divider' || item.roles?.includes(userRole)
  );

  // Divider'ları temizle (ardışık divider'lar veya başta/sonda divider varsa)
  const cleanedTableOrder = filteredTableOrder.filter((item, index, arr) => {
    // Eğer divider ise, önceki öğe de divider değilse ve son öğe değilse göster
    if (item.type === 'divider') {
      // İlk öğe divider ise gösterme
      if (index === 0) return false;
      // Son öğe divider ise gösterme
      if (index === arr.length - 1) return false;
      // Önceki öğe de divider ise gösterme
      if (arr[index - 1].type === 'divider') return false;
      // Sonraki öğe de divider ise veya yoksa gösterme
      if (index + 1 >= arr.length || arr[index + 1].type === 'divider') return false;
      
      return true;
    }
    // Divider değilse göster
    return true;
  });

  const changeSidebarMode = (mode: 'auto' | 'collapsed') => {
    setSidebarMode(mode);
    localStorage.setItem('sidebarMode', mode);
    
    const newVisibility = mode !== 'collapsed';
    setIsDesktopSidebarVisible(newVisibility);
    
    if (onVisibilityChange) {
      onVisibilityChange(newVisibility);
    }
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('sidebarMode');
    if (savedMode === 'auto' || savedMode === 'collapsed') {
      setSidebarMode(savedMode as 'auto' | 'collapsed');
      const newVisibility = savedMode !== 'collapsed';
      setIsDesktopSidebarVisible(newVisibility);
      
      if (onVisibilityChange) {
        onVisibilityChange(newVisibility);
      }
    } else if (savedMode === 'pinned') {
      setSidebarMode('auto');
      localStorage.setItem('sidebarMode', 'auto');
      setIsDesktopSidebarVisible(true);
      
      if (onVisibilityChange) {
        onVisibilityChange(true);
      }
    }
  }, [onVisibilityChange]);
  
  const handleOpenSidebar = () => {
    setIsDesktopSidebarVisible(true);
    setSidebarMode('auto');
    localStorage.setItem('sidebarMode', 'auto');
    
    if (onVisibilityChange) {
      onVisibilityChange(true);
    }
  };

  const handleMouseEnter = () => {
    if (sidebarMode === 'collapsed') {
      setIsHovered(true);
      setIsDesktopSidebarVisible(true);
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      if (onVisibilityChange) {
        onVisibilityChange(false);
      }
    }
  };
  
  const handleMouseLeave = () => {
    if (sidebarMode === 'collapsed' && isHovered) {
      timerRef.current = setTimeout(() => {
        setIsHovered(false);
        setIsDesktopSidebarVisible(false);
        
        if (onVisibilityChange) {
          onVisibilityChange(false);
        }
      }, 3000);
    }
  };
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {sidebarMode === 'collapsed' && !isDesktopSidebarVisible && !isHovered && (
        <div 
          className="hidden md:block fixed top-0 left-0 w-2 h-full z-30"
          onMouseEnter={handleMouseEnter}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${(sidebarMode === 'auto' && isDesktopSidebarVisible) || (sidebarMode === 'collapsed' && isHovered) ? 'md:translate-x-0' : 'md:-translate-x-full'} md:static md:z-0 flex flex-col overflow-y-auto`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center justify-center px-4 py-4 border-b border-gray-700">
          <div className="text-xl font-bold leading-tight text-center tracking-wide">
            ALPLEO Dashboard
          </div>
          <button
            type="button"
            className="md:hidden text-white hover:text-gray-300 absolute right-3 p-1 rounded-full bg-gray-700 hover:bg-gray-600"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 text-center font-medium text-gray-300 border-b border-gray-700">
          <div className="text-sm text-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            Tam Entegre Yapay Zeka
          </div>
          <div className="text-xs mt-1">
            Stok ve Üretim Yönetimi
          </div>
        </div>

        <nav className="mt-5 px-2 flex-grow">
          <div className="space-y-1">
            {/* Yönetici menü öğeleri */}
            {filteredAdminMenuItems.length > 0 && (
              <>
                {filteredAdminMenuItems.map((item, index) => (
                  <React.Fragment key={item.path}>
                    <Link
                      href={item.path}
                      className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md
                        ${pathname === item.path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                      `}
                    >
                      <span className="mr-3 text-gray-400">{item.icon}</span>
                      {item.name}
                    </Link>
                    {index === filteredAdminMenuItems.length - 1 && <div className="border-b border-gray-700 my-2 mx-3 opacity-50"></div>}
                  </React.Fragment>
                ))}
              </>
            )}

            {/* Personel özel menü öğeleri */}
            {filteredPersonalItems.length > 0 && (
              <>
                {filteredPersonalItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md
                      ${pathname === item.path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    <span className="mr-3 text-gray-400">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
                <div className="border-b border-gray-700 my-2 mx-3 opacity-50"></div>
              </>
            )}

            {/* Raporlar menüsü - Sadece yöneticiler için */}
            {filteredReportItems.length > 0 && (
              <div>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
                  onClick={toggleReportsMenu}
                >
                  <span className="flex items-center">
                    <BarChart2 size={18} className="mr-3 text-gray-400" />
                    Yönetim
                  </span>
                  {reportsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {reportsOpen && (
                  <div className="mt-1 pl-4 space-y-1">
                    {filteredReportItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md
                          ${pathname === item.path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                        `}
                      >
                        <span className="mr-3 text-gray-400">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {filteredReportItems.length > 0 && <div className="border-b border-gray-700 my-2 mx-3 opacity-50"></div>}

            {/* Tablolar menüsü - Sadece yöneticiler için */}
            {cleanedTableOrder.some(item => item.type !== 'divider') && (
              <div>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
                  onClick={toggleTablesMenu}
                >
                  <span className="flex items-center">
                    <Database size={18} className="mr-3 text-gray-400" />
                    Şirket Veritabanı
                  </span>
                  {tablesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {tablesOpen && (
                  <div className="mt-1 pl-4 space-y-1">
                    {cleanedTableOrder.map((tableItem, index) => {
                      if (tableItem.type === 'divider') {
                        return <div key={`divider-${index}`} className="border-b border-gray-700 my-2 mx-2 opacity-50"></div>;
                      }
                      
                      // Link URL'ini güvenli bir şekilde oluşturuyoruz
                      const linkHref = `/tablo/${encodeURIComponent(tableItem.originalName ?? tableItem.name)}`;
                      
                      // Aktif link kontrolü için path
                      const isActive = pathname === linkHref;
                      
                      return (
                        <Link
                          key={tableItem.name}
                          href={linkHref}
                          className={`
                            flex items-center px-3 py-2 text-sm font-medium rounded-md
                            ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                          `}
                        >
                          <span className="mr-3 text-gray-400">{tableItem.icon}</span>
                          {tableItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {cleanedTableOrder.some(item => item.type !== 'divider') && <div className="border-b border-gray-700 my-2 mx-3 opacity-50"></div>}

            {/* Formlar menüsü - Sadece yöneticiler için */}
            {filteredFormItems.length > 0 && (
              <div>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
                  onClick={toggleFormsMenu}
                >
                  <span className="flex items-center">
                    <ClipboardList size={18} className="mr-3 text-gray-400" />
                    Formlar
                  </span>
                  {formsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {formsOpen && (
                  <div className="mt-1 pl-4 space-y-1">
                    {filteredFormItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md
                          ${pathname === item.path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                        `}
                      >
                        <span className="mr-3 text-gray-400">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
        
        {(userRole === 'patron' || userRole === 'yonetici') && (
          <div className="border-t border-gray-700 mt-auto">
            <Link
              href="/ayarlar"
              className={`
                flex items-center px-3 py-2 mt-2 text-sm font-medium rounded-md mx-2
                ${pathname === "/ayarlar" ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <span className="mr-3 text-gray-400"><Settings size={18} /></span>
              Ayarlar
            </Link>
          </div>
        )}

        <div className="text-xs text-gray-400 border-t border-gray-700">
          <div className="px-4 py-2">
            <p className="mb-2">Kenar çubuğu kontrolü</p>
            <div className="space-y-1">
              <div 
                className="flex items-center cursor-pointer hover:bg-gray-700 px-2 py-1 rounded"
                onClick={() => changeSidebarMode('auto')}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  {sidebarMode === 'auto' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={sidebarMode === 'auto' ? 'text-white' : ''}>Sabit</span>
              </div>
              
              <div 
                className="flex items-center cursor-pointer hover:bg-gray-700 px-2 py-1 rounded"
                onClick={() => changeSidebarMode('collapsed')}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  {sidebarMode === 'collapsed' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={sidebarMode === 'collapsed' ? 'text-white' : ''}>Kenara Küçült</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Versiyon Bilgisi */}
        <div className="mt-auto px-4 py-3 text-xs text-gray-400 border-t border-gray-700 text-center">
          Versiyon 3.4.1
        </div>
      </aside>
      
      {sidebarMode === 'collapsed' && !isDesktopSidebarVisible && !isHovered && (
        <button 
          className="hidden md:flex fixed top-4 left-4 z-30 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-all"
          onClick={handleOpenSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      )}
    </>
  );
};

export default Sidebar;