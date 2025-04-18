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
} | {
  type: 'divider';
  name?: never;
  originalName?: never;
  icon?: never;
};

interface SidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (value: boolean) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileSidebarOpen, setIsMobileSidebarOpen, onVisibilityChange }) => {
  const pathname = usePathname();
  const { user, sayfaYetkileri, fetchSayfaYetkileri } = useAuth();
  
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Erişilebilir sayfalar durumu
  const [yetkiliSayfalar, setYetkiliSayfalar] = useState<string[]>([]);
  const [yetkiYukleniyor, setYetkiYukleniyor] = useState(true);
  const [patronRolId, setPatronRolId] = useState<string | null>(null);

  // Kullanıcının erişebileceği sayfaları getir
  useEffect(() => {
    const fetchErisimliSayfalar = async () => {
      if (user && user.rol_id) {
        try {
          setYetkiYukleniyor(true);
          
          // Patron rol ID'yi kontrol et sadece bir kez
          if (!patronRolId) {
            try {
              const patronResponse = await fetch('/api/roller?rol_ad=Patron');
              const patronData = await patronResponse.json();
              
              if (patronData.success && patronData.data.length > 0) {
                setPatronRolId(patronData.data[0].id);
              }
            } catch (patronError) {
              console.error('Patron rol ID alımında hata:', patronError);
            }
          }
          
          // Context'te saklanan sayfa yetkilerini kullan
          if (sayfaYetkileri && sayfaYetkileri.length > 0) {
            setYetkiliSayfalar(sayfaYetkileri);
          } else {
            // Eğer sayfaYetkileri boşsa, yetkilerini yeniden çek
            await fetchSayfaYetkileri();
            // fetchSayfaYetkileri fonksiyonu çağrıldığında sayfaYetkileri state'i güncellenecek
            // ve bu useEffect yeniden çalışacak, böylece yukarıdaki if bloğu çalışacak
          }
        } catch (error) {
          console.error('Erişim sayfaları yüklenirken genel hata:', error);
          // Genel hata durumunda da ana sayfayı göster
          setYetkiliSayfalar(['/']);
        } finally {
          setYetkiYukleniyor(false);
        }
      }
    };
    
    fetchErisimliSayfalar();
  }, [user, sayfaYetkileri, fetchSayfaYetkileri, patronRolId]);

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

  // Sayfa erişim kontrolü fonksiyonu
  const sayfayaErisimVarMi = (sayfaYolu: string) => {
    // Eğer sayfalar henüz yüklenmiyorsa veya kullanıcı patron rolündeyse
    if (yetkiYukleniyor || (patronRolId && user?.rol_id === patronRolId)) {
      return true; // Varsayılan olarak göster
    }
    
    // Sayfa yolu listede var mı kontrol et
    return yetkiliSayfalar.includes(sayfaYolu);
  };

  // Tüm kullanıcıların erişebileceği sayfalar
  const adminMenuItems = [
    { 
      name: 'ANA PANEL', 
      path: '/', 
      icon: <Home size={18} />
    },
    { 
      name: 'Stok ve Üretim Müdürü', 
      path: '/stok-uretim-muduru-beyni', 
      icon: <Brain size={18} />
    },
  ];

  // Yönetim raporları - tüm kullanıcıların erişebileceği
  const reportItems = [
    { 
      name: 'Genel Raporlar', 
      path: '/raporlar', 
      icon: <BarChart2 size={18} />
    },
    { 
      name: 'Personel Performans', 
      path: '/raporlar/personel-performans', 
      icon: <Activity size={18} />
    },
  ];

  // Personel sayfaları - tüm kullanıcıların erişebileceği
  const personalItems = [
    { 
      name: 'ANA PANEL-P', 
      path: '/anasayfa-p', 
      icon: <Home size={18} />
    },
    { 
      name: 'Üretim Kuyruğu Personel', 
      path: '/uretim-kuyrugu-personel', 
      icon: <Clock size={18} />
    },
    { 
      name: 'Bitmiş Ürün Stoğu Personel', 
      path: '/bitmis-urun-stogu-personel', 
      icon: <Archive size={18} />
    },
    { 
      name: 'Personel Rapor', 
      path: '/personel-rapor', 
      icon: <Clipboard size={18} />
    },
  ];

  // Form sayfaları
  const formItems = [
    {
      name: 'Reçete Kaydı',
      path: '/formlar/recete-kaydi',
      icon: <FileText size={18} />
    },
    {
      name: 'Kullanıcı Kaydı',
      path: '/formlar/kullanici-kaydi',
      icon: <Users size={18} />
    },
    {
      name: 'Kullanıcı Listesi',
      path: '/formlar/kullanici-listesi',
      icon: <ClipboardList size={18} />
    },
    {
      name: 'Rol Listesi',
      path: '/formlar/rol-listesi',
      icon: <ClipboardList size={18} />
    }
  ];

  // Özel tablo sıralaması
  const tableOrder: TableItem[] = [
    { name: 'Müşteriler', icon: <Users size={18} /> },
    { name: 'Tedarikçiler', originalName: 'suppliers', icon: <Truck size={18} /> },
    { type: 'divider' },
    { name: 'Reçeteler', icon: <FileText size={18} /> },
    { type: 'divider' },
    { name: 'SatınAlma siparişleri', icon: <ShoppingCart size={18} /> },
    { type: 'divider' },
    { name: 'STOK', originalName: 'Stok', icon: <Package size={18} /> },
    { type: 'divider' },
    { name: 'Üretim Kuyruğu', icon: <Clock size={18} /> },
    { name: 'Bitmiş Ürün Stoğu', icon: <Archive size={18} /> },
  ];

  // Erişim yetkisi olan sayfaları filtrele
  const filteredAdminMenuItems = yetkiYukleniyor 
    ? adminMenuItems 
    : adminMenuItems.filter(item => sayfayaErisimVarMi(item.path));
    
  const filteredReportItems = yetkiYukleniyor
    ? reportItems
    : reportItems.filter(item => sayfayaErisimVarMi(item.path));
    
  const filteredPersonalItems = yetkiYukleniyor
    ? personalItems
    : personalItems.filter(item => sayfayaErisimVarMi(item.path));
    
  const filteredFormItems = yetkiYukleniyor
    ? formItems
    : formItems.filter(item => sayfayaErisimVarMi(item.path));
    
  // Tablolar için erişim kontrolü
  const tableWithAccess = (tableName: string) => {
    const path = `/tablo/${tableName}`;
    return sayfayaErisimVarMi(path);
  };
  
  // Erişim yetkisi olan tabloları filtrele
  const filteredTableItems = yetkiYukleniyor
    ? tableOrder
    : tableOrder.filter(item => {
        if (item.type === 'divider') return true; // Divider'lar direk kalıyor
        // Tablonun originalName veya name'ini kullanarak erişim kontrolü
        return tableWithAccess(item.originalName ?? item.name);
      });

  // Divider'ları temizle (ardışık divider'lar veya başta/sonda divider varsa)
  const cleanedTableOrder = filteredTableItems.filter((item, index, arr) => {
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

      {sidebarMode === 'collapsed' && !isDesktopSidebarVisible && (
        <div className="hidden md:block fixed top-0 left-0 w-2 h-full z-30" />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out h-screen ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${(sidebarMode === 'auto' && isDesktopSidebarVisible) || sidebarMode === 'collapsed' && isDesktopSidebarVisible ? 'md:translate-x-0' : 'md:-translate-x-full'} md:static md:z-0 flex flex-col overflow-y-auto`}
        style={{ minHeight: '100vh', width: '16rem', minWidth: '16rem', flexShrink: 0 }}
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
        
        <div className="text-xs text-gray-400 border-t border-gray-700">
          <div className="px-4 py-2">
            <div className="mt-auto">
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
            <p className="mb-2 mt-4">Kenar çubuğu kontrolü</p>
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
                onClick={() => {
                  console.log('Sidebar mode changed to collapsed');
                  changeSidebarMode('collapsed');
                }}
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
        
        <div className="mt-auto px-4 py-3 text-xs text-gray-400 border-t border-gray-700 text-center">
          Versiyon 3.4.1
        </div>
      </aside>
      
      {sidebarMode === 'collapsed' && !isDesktopSidebarVisible && (
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

      {/* Menü açma kapama butonu */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden bg-white p-2 rounded-md shadow-md border border-gray-200 hover:bg-gray-100 transition-colors"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        aria-label={isMobileSidebarOpen ? "Menüyü kapat" : "Menüyü aç"}
      >
        {/* ... existing code ... */}
      </button>
    </>
  );
};

export default Sidebar;