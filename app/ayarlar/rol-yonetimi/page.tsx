'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Plus, Edit, Trash2, Check, X, ChevronDown, ChevronUp, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import PageGuard from '../../components/PageGuard';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Permission {
  id: string;
  name: string;
  category: string;
}

interface Sayfa {
  id: string;
  sayfa_adi: string;
  sayfa_yolu: string;
}

interface SayfaYetki {
  id: string;
  rol_id: string;
  sayfa_id: string;
  erisim_var: boolean;
  sayfalar: Sayfa;
}

interface Role {
  id: string;
  rol_ad: string;
  created_at: string;
  permissions?: string[];
  description?: string;
  Not?: string;
  sayfaYetkileri?: SayfaYetki[];
  recete_goruntulebilir?: boolean;
  yeni_uretim_girebilir?: boolean;
  kalan_bulk_sifirla?: boolean;
  uretimi_sil?: boolean;
  recete_satis_bilgisi?: boolean;
  recete_maliyet_bilgisi?: boolean;
}

export default function RolYonetimiPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [sayfalar, setSayfalar] = useState<Sayfa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yetkiYukleniyor, setYetkiYukleniyor] = useState(false);
  const [sayfaYukleniyor, setSayfaYukleniyor] = useState(false);
  const [otomatikTaramaYapiliyor, setOtomatikTaramaYapiliyor] = useState(false);
  const [notDuzenleme, setNotDuzenleme] = useState<{[key: string]: string}>({});

  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRole, setNewRole] = useState<{ rol_ad: string; description: string; permissions: string[] }>({
    rol_ad: '',
    description: '',
    permissions: []
  });

  // Silme onay modalı için state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rolleri veritabanından getir
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/roller');
        
        if (!response.ok) {
          throw new Error('Roller alınırken bir hata oluştu');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // "Not" alanını "description" alanına mapleme
          const rolesWithDescription = data.data.map((role: any) => ({
            ...role,
            description: role.Not || role.description || null 
          }));
          
          setRoles(rolesWithDescription);
          setError(null);
        } else {
          throw new Error(data.error || 'Roller alınamadı');
        }
      } catch (error: any) {
        console.error('Roller yüklenirken hata:', error);
        setError(error.message);
        toast.error('Roller yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoles();
  }, []);

  // Sayfaları veritabanından getir
  useEffect(() => {
    const fetchSayfalar = async () => {
      try {
        setSayfaYukleniyor(true);
        const response = await fetch('/api/sayfalar');
        
        if (!response.ok) {
          throw new Error('Sayfalar alınırken bir hata oluştu');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSayfalar(data.data);
        } else {
          throw new Error(data.error || 'Sayfalar alınamadı');
        }
      } catch (error: any) {
        console.error('Sayfalar yüklenirken hata:', error);
        toast.error('Sayfalar yüklenirken bir hata oluştu');
      } finally {
        setSayfaYukleniyor(false);
      }
    };
    
    fetchSayfalar();
  }, []);

  // Rol genişletildiğinde o rolün sayfa yetkilerini getir
  const fetchRolSayfaYetkileri = async (rolId: string) => {
    try {
      setYetkiYukleniyor(true);
      const response = await fetch(`/api/rol-sayfa-yetkileri?rol_id=${rolId}`);
      
      if (!response.ok) {
        throw new Error('Rol sayfa yetkileri alınırken bir hata oluştu');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Rol nesnesini güncelle
        setRoles(prev => 
          prev.map(role => 
            role.id === rolId 
              ? { ...role, sayfaYetkileri: data.data } 
              : role
          )
        );
      } else {
        throw new Error(data.error || 'Rol sayfa yetkileri alınamadı');
      }
    } catch (error: any) {
      console.error('Rol sayfa yetkileri yüklenirken hata:', error);
      toast.error('Rol sayfa yetkileri yüklenirken bir hata oluştu');
    } finally {
      setYetkiYukleniyor(false);
    }
  };

  // Otomatik sayfa taraması yap
  const handleSayfalarTara = async () => {
    try {
      setOtomatikTaramaYapiliyor(true);
      const response = await fetch('/api/sayfalar-otomatik-tara', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Sayfalar taranırken bir hata oluştu');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${data.added} yeni sayfa başarıyla eklendi`);
        // Sayfaları yenile
        const sayfaResponse = await fetch('/api/sayfalar');
        const sayfaData = await sayfaResponse.json();
        
        if (sayfaData.success) {
          setSayfalar(sayfaData.data);
          
          // Eğer bir rol açıksa, o rolün sayfa yetkilerini yenile
          if (expandedRole) {
            await fetchRolSayfaYetkileri(expandedRole);
          }
        }
      } else {
        throw new Error(data.error || 'Sayfalar taranamadı');
      }
    } catch (error: any) {
      console.error('Sayfalar taranırken hata:', error);
      toast.error('Sayfalar taranırken bir hata oluştu');
    } finally {
      setOtomatikTaramaYapiliyor(false);
    }
  };

  const availablePermissions: Permission[] = [
    { id: 'user.create', name: 'Kullanıcı Oluşturma', category: 'Kullanıcı Yönetimi' },
    { id: 'user.edit', name: 'Kullanıcı Düzenleme', category: 'Kullanıcı Yönetimi' },
    { id: 'user.delete', name: 'Kullanıcı Silme', category: 'Kullanıcı Yönetimi' },
    { id: 'user.view', name: 'Kullanıcıları Görüntüleme', category: 'Kullanıcı Yönetimi' },
    { id: 'role.create', name: 'Rol Oluşturma', category: 'Rol Yönetimi' },
    { id: 'role.edit', name: 'Rol Düzenleme', category: 'Rol Yönetimi' },
    { id: 'role.delete', name: 'Rol Silme', category: 'Rol Yönetimi' },
    { id: 'role.view', name: 'Rolleri Görüntüleme', category: 'Rol Yönetimi' },
    { id: 'report.view', name: 'Raporları Görüntüleme', category: 'Raporlama' },
    { id: 'report.create', name: 'Rapor Oluşturma', category: 'Raporlama' },
  ];

  const handleToggleRole = (roleId: string) => {
    if (expandedRole === roleId) {
      setExpandedRole(null);
    } else {
      setExpandedRole(roleId);
      fetchRolSayfaYetkileri(roleId);
    }
  };

  const handleAddNewRole = () => {
    setIsAddingRole(true);
  };

  const handleCancelAddRole = () => {
    setIsAddingRole(false);
    setNewRole({ rol_ad: '', description: '', permissions: [] });
  };

  const handleSaveNewRole = async () => {
    if (!newRole.rol_ad.trim()) {
      toast.error("Rol adı boş olamaz");
      return;
    }
    
    try {
      setLoading(true);
      
      // API'ye yeni rol eklemek için POST isteği gönder
      const response = await fetch('/api/roller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rol_ad: newRole.rol_ad,
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Rol eklenirken bir hata oluştu');
      }
      
      // Başarılı ise rol listesini güncelle
      setRoles([...roles, data.data]);
      toast.success(data.message || 'Rol başarıyla eklendi');
      
      // Formu temizle ve kapat
      setIsAddingRole(false);
      setNewRole({ rol_ad: '', description: '', permissions: [] });
      
    } catch (error: any) {
      console.error('Rol eklenirken hata:', error);
      toast.error(error.message || 'Rol eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setNewRole(prev => {
      if (prev.permissions.includes(permissionId)) {
        return { ...prev, permissions: prev.permissions.filter(id => id !== permissionId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permissionId] };
      }
    });
  };

  // Silme modalını aç
  const openDeleteModal = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  // Silme modalını kapat
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  // Rolü sil
  const deleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/roller?id=${roleToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        // Başarılı
        setRoles(roles.filter(role => role.id !== roleToDelete.id));
        toast.success(data.message || `${roleToDelete.rol_ad} rolü başarıyla silindi`);
        closeDeleteModal();
      } else {
        // Hata
        toast.error(data.error || 'Rol silinirken bir hata oluştu');
        // Eğer foreign key hatası varsa daha açıklayıcı bir mesaj göster
        if (data.error && data.error.includes('kullanıcılara atanmış')) {
          toast.error('Bu rol kullanıcılara atanmış olduğu için silinemiyor');
        }
      }
    } catch (error: any) {
      console.error('Rol silinirken hata:', error);
      toast.error(error.message || 'Rol silinirken bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  // Izinleri kategorilere göre grupla
  const permissionsByCategory: Record<string, Permission[]> = availablePermissions.reduce((acc: Record<string, Permission[]>, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  // Tek bir sayfa yetkisini güncelle
  const handleToggleSayfaYetki = (rolId: string, sayfaId: string, erisimVar: boolean) => {
    setRoles(prev => 
      prev.map(role => {
        if (role.id === rolId) {
          const updatedYetkiler = role.sayfaYetkileri?.map(yetki => {
            if (yetki.sayfa_id === sayfaId) {
              return { ...yetki, erisim_var: erisimVar };
            }
            return yetki;
          }) || [];
          
          // Eğer bu sayfa id'si rol-sayfa yetkilerinde yoksa, yeni ekle
          const sayfaVarMi = updatedYetkiler.some(yetki => yetki.sayfa_id === sayfaId);
          if (!sayfaVarMi) {
            updatedYetkiler.push({
              id: 'temp_' + Date.now(), // Geçici ID
              rol_id: rolId,
              sayfa_id: sayfaId,
              erisim_var: erisimVar,
              sayfalar: sayfalar.find(sayfa => sayfa.id === sayfaId) || { id: sayfaId, sayfa_adi: '', sayfa_yolu: '' }
            });
          }
          
          return { ...role, sayfaYetkileri: updatedYetkiler };
        }
        return role;
      })
    );
  };
  
  // Tüm sayfa yetkilerini aynı anda güncelle
  const handleToggleAllSayfaYetkileri = (rolId: string, erisimVar: boolean) => {
    setRoles(prev => 
      prev.map(role => {
        if (role.id === rolId) {
          const updatedYetkiler = sayfalar.map(sayfa => {
            // Mevcut yetki varsa güncelle
            const mevcutYetki = role.sayfaYetkileri?.find(yetki => yetki.sayfa_id === sayfa.id);
            if (mevcutYetki) {
              return { ...mevcutYetki, erisim_var: erisimVar };
            }
            
            // Yoksa yeni yetki oluştur
            return {
              id: 'temp_' + sayfa.id, // Geçici ID
              rol_id: rolId,
              sayfa_id: sayfa.id,
              erisim_var: erisimVar,
              sayfalar: sayfa
            };
          });
          
          return { ...role, sayfaYetkileri: updatedYetkiler };
        }
        return role;
      })
    );
  };
  
  // Rol sayfa yetkilerini kaydet
  const handleSaveRolYetkileri = async (rolId: string) => {
    try {
      const role = roles.find(r => r.id === rolId);
      if (!role || !role.sayfaYetkileri) return;
      
      const yetkiler = role.sayfaYetkileri.map(yetki => ({
        sayfa_id: yetki.sayfa_id,
        erisim_var: yetki.erisim_var
      }));
      
      // En az bir ana sayfa erişimi kontrol et - / veya /anasayfa-p
      const anaSayfaYetkisi = role.sayfaYetkileri.find(
        y => (y.sayfalar.sayfa_yolu === '/' || y.sayfalar.sayfa_yolu === '/anasayfa-p') && y.erisim_var
      );
      
      if (!anaSayfaYetkisi) {
        // Ana sayfa erişimi yok, uyarı göster
        toast.error('En az bir ana sayfa erişimi olmalıdır (Ana Sayfa veya Anasayfa-P)');
        return;
      }
      
      const response = await fetch('/api/rol-sayfa-yetkileri', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rol_id: rolId,
          yetkiler
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Rol sayfa yetkileri başarıyla kaydedildi');
        // Güncel verileri yeniden yükle
        await fetchRolSayfaYetkileri(rolId);
      } else {
        throw new Error(data.error || 'Yetkiler kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Yetkiler kaydedilirken hata:', error);
      toast.error('Yetkiler kaydedilirken bir hata oluştu');
    }
  };

  // Rol özelliklerini güncelleme işlevi
  const handleUpdateRolOzellik = async (rolId: string, ozellik: string, deger: any) => {
    try {
      const role = roles.find(r => r.id === rolId);
      if (!role) return;
      
      const response = await fetch('/api/roller', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: rolId,
          [ozellik]: deger
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${role.rol_ad} rol özelliği güncellendi`);
        
        // API'den gelen güncel veriyi kullan
        if (data.data) {
          // Tüm rolleri güncelle, güncellenmiş rol için Not -> description mapleme yap
          setRoles(prev => prev.map(r => 
            r.id === rolId 
              ? { 
                  ...data.data,
                  description: data.data.Not || data.data.description || null
                } 
              : r
          ));
        } else {
          // API güncel veri dönmezse sadece yerel state'i güncelle
          setRoles(prev => prev.map(r => 
            r.id === rolId 
              ? { 
                  ...r, 
                  [ozellik === 'Not' ? 'description' : ozellik]: deger,
                  Not: ozellik === 'Not' ? deger : r.Not
                } 
              : r
          ));
        }
      } else {
        throw new Error(data.error || 'Rol özelliği güncellenemedi');
      }
    } catch (error: any) {
      console.error('Rol özelliği güncellenirken hata:', error);
      toast.error('Rol özelliği güncellenirken bir hata oluştu');
    }
  };

  // Not değişikliklerini yönet
  const handleNotChange = (rolId: string, value: string) => {
    setNotDuzenleme(prev => ({
      ...prev,
      [rolId]: value
    }));
  };
  
  // Kullanıcı input alanından çıktığında notu kaydet
  const handleNotSave = (rolId: string) => {
    const role = roles.find(r => r.id === rolId);
    const notDegeri = notDuzenleme[rolId];
    
    // Eğer değer aynıysa güncelleme yapma
    if (role && notDegeri !== undefined && notDegeri !== role.description) {
      handleUpdateRolOzellik(rolId, 'Not', notDegeri || null);
    }
  };

  return (
    <PageGuard sayfaYolu="/ayarlar/rol-yonetimi">
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Link href="/ayarlar" className="text-indigo-600 hover:text-indigo-800 mr-4">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Rol Yönetimi</h1>
            </div>
            <div className="flex space-x-2">
              <Link href="/ayarlar" className="flex items-center text-indigo-600 hover:text-indigo-800">
                <span>Ayarlar sayfasına Git</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <button 
                onClick={handleSayfalarTara} 
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors ${otomatikTaramaYapiliyor ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={otomatikTaramaYapiliyor}
              >
                <RefreshCw size={16} className={`mr-2 ${otomatikTaramaYapiliyor ? 'animate-spin' : ''}`} />
                Sayfaları Otomatik Tara
              </button>
              <button 
                onClick={handleAddNewRole} 
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Yeni Rol Ekle
              </button>
            </div>
          </div>

          {/* Rol Listesi */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz kayıtlı rol bulunmuyor.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <li key={role.id} className="hover:bg-gray-50">
                    <div 
                      className="px-4 py-4 sm:px-6 cursor-pointer"
                      onClick={() => handleToggleRole(role.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col w-full">
                          <h3 className="text-lg font-medium text-gray-900">{role.rol_ad}</h3>
                          
                          {expandedRole === role.id ? (
                            <div className="mt-1 flex items-center">
                              <input
                                type="text"
                                value={notDuzenleme[role.id] !== undefined ? notDuzenleme[role.id] : role.description || ''}
                                onChange={(e) => handleNotChange(role.id, e.target.value)}
                                onBlur={() => handleNotSave(role.id)}
                                placeholder="Not ekle..."
                                className="text-sm text-gray-700 p-1 border border-gray-300 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">{role.description || 'Açıklama bulunmuyor'}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(role);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                          <div className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                            {expandedRole === role.id ? (
                              <ChevronUp size={18} className="text-gray-600" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Sayfa yetkilerini düzenleme bölümü */}
                      {expandedRole === role.id && (
                        <div className="mt-3 bg-white rounded-lg shadow p-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                          {/* Özel İzinler Bölümü */}
                          <div className="mb-6 border-b pb-4">
                            <h3 className="text-md font-medium text-gray-700 mb-3">Özel İzinler</h3>
                            
                            <div className="space-y-3">
                              {/* Reçete Görüntüleme İzni */}
                              <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-800">Reçete Detayları Görüntüleme</h4>
                                  <p className="text-xs text-gray-500 mt-1">Üretim Kuyruğu sayfasında reçete adına tıklayarak detayları görüntüleyebilir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={role.recete_goruntulebilir || false}
                                    onChange={(e) => handleUpdateRolOzellik(role.id, 'recete_goruntulebilir', e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              
                              {/* Yeni Üretim Girme İzni */}
                              <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-800">Yeni Üretim Girme</h4>
                                  <p className="text-xs text-gray-500 mt-1">Üretim Kuyruğu sayfasında yeni üretim emri girebilir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={role.yeni_uretim_girebilir || false}
                                    onChange={(e) => handleUpdateRolOzellik(role.id, 'yeni_uretim_girebilir', e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              
                              {/* Reçete Satış Bilgisi Görüntüleme İzni */}
                              <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-800">Reçete Satış Bilgisi Görüntüleme</h4>
                                  <p className="text-xs text-gray-500 mt-1">Reçete kaydı sayfasında satış bilgilerini görüntüleyebilir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={role.recete_satis_bilgisi || false}
                                    onChange={(e) => handleUpdateRolOzellik(role.id, 'recete_satis_bilgisi', e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              
                              {/* Reçete Maliyet Bilgisi Görüntüleme İzni */}
                              <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-800">Reçete Maliyet Bilgisi Görüntüleme</h4>
                                  <p className="text-xs text-gray-500 mt-1">Reçete kaydı sayfasında maliyet hesaplamalarını görüntüleyebilir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={role.recete_maliyet_bilgisi || false}
                                    onChange={(e) => handleUpdateRolOzellik(role.id, 'recete_maliyet_bilgisi', e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              
                              {/* Kalan Bulk Sıfırlama İzni */}
                              <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-800">Kalan Bulk Sıfırlama</h4>
                                  <p className="text-xs text-gray-500 mt-1">Üretim Kuyruğu sayfasında kalan bulk değerini sıfırlayabilir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={role.kalan_bulk_sifirla || false}
                                    onChange={(e) => handleUpdateRolOzellik(role.id, 'kalan_bulk_sifirla', e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              
                              {/* Üretimi Silme İzni */}
                              <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-800">Üretimi Silme</h4>
                                  <p className="text-xs text-gray-500 mt-1">Üretim Kuyruğu sayfasında üretim kayıtlarını silebilir</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={role.uretimi_sil || false}
                                    onChange={(e) => handleUpdateRolOzellik(role.id, 'uretimi_sil', e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              
                              {/* İleride eklenecek diğer özel izinler buraya eklenebilir */}
                            </div>
                          </div>
                          
                          {/* Mevcut Sayfa Yetkileri Bölümü */}
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-md font-medium text-gray-700">Sayfa Yetkileri</h3>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleToggleAllSayfaYetkileri(role.id, true)}
                                className="flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded border border-green-200 hover:bg-green-100"
                              >
                                <Check size={14} className="mr-1" />
                                Tümünü Seç
                              </button>
                              <button
                                onClick={() => handleToggleAllSayfaYetkileri(role.id, false)}
                                className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded border border-red-200 hover:bg-red-100"
                              >
                                <X size={14} className="mr-1" />
                                Tümünü Kaldır
                              </button>
                              <button
                                onClick={() => handleSaveRolYetkileri(role.id)}
                                className="flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                              >
                                <Check size={14} className="mr-1" />
                                Kaydet
                              </button>
                            </div>
                          </div>
                          
                          {yetkiYukleniyor ? (
                            <div className="flex justify-center py-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {sayfalar.map(sayfa => {
                                // Bul bu rol için sayfa yetkisi var mı
                                const roleYetki = roles.find(r => r.id === role.id)?.sayfaYetkileri?.find(
                                  y => y.sayfa_id === sayfa.id
                                );
                                
                                return (
                                  <div 
                                    key={sayfa.id}
                                    className="flex items-center p-2 border rounded hover:bg-gray-50"
                                  >
                                    <input
                                      type="checkbox"
                                      id={`sayfa-${sayfa.id}`}
                                      checked={!!roleYetki?.erisim_var}
                                      onChange={() => 
                                        handleToggleSayfaYetki(
                                          role.id, 
                                          sayfa.id, 
                                          !roleYetki?.erisim_var
                                        )
                                      }
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label
                                      htmlFor={`sayfa-${sayfa.id}`}
                                      className="ml-2 text-sm text-gray-700 cursor-pointer truncate"
                                      title={sayfa.sayfa_yolu}
                                    >
                                      {sayfa.sayfa_adi}
                                      <span className="block text-xs text-gray-400">{sayfa.sayfa_yolu}</span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Yeni Rol Ekleme Formu */}
          {isAddingRole && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-lg w-full mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Yeni Rol Ekle</h3>
                  <button 
                    onClick={handleCancelAddRole}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rol_ad" className="block text-sm font-medium text-gray-700">
                      Rol Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="rol_ad"
                      value={newRole.rol_ad}
                      onChange={(e) => setNewRole({...newRole, rol_ad: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Örn: Müdür, Yönetici, Operatör"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      onClick={handleCancelAddRole}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSaveNewRole}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          <span>İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          <span>Rol Ekle</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Silme onay modalı */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm mx-auto">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rolü Sil</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>{roleToDelete?.rol_ad}</strong> rolünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz!
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    onClick={deleteRole}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageGuard>
  );
} 