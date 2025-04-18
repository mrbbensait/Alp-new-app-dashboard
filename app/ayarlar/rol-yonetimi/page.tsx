'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Plus, Edit, Trash2, Check, X, ChevronDown, ChevronUp, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import PageGuard from '../../components/PageGuard';

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
  sayfaYetkileri?: SayfaYetki[];
}

export default function RolYonetimiPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [sayfalar, setSayfalar] = useState<Sayfa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yetkiYukleniyor, setYetkiYukleniyor] = useState(false);
  const [sayfaYukleniyor, setSayfaYukleniyor] = useState(false);
  const [otomatikTaramaYapiliyor, setOtomatikTaramaYapiliyor] = useState(false);

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
          setRoles(data.data);
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

  const handleSaveNewRole = () => {
    // API'ye yeni rol eklemek için POST isteği gönderilecek
    // Şu an için sadece arayüzü göstermek için kullanılıyor
    const newRoleCopy = { ...newRole };
    setRoles([...roles, { 
      id: `temp_${Date.now()}`, 
      rol_ad: newRoleCopy.rol_ad, 
      created_at: new Date().toISOString(),
      permissions: newRoleCopy.permissions,
      description: newRoleCopy.description
    }]);
    setIsAddingRole(false);
    setNewRole({ rol_ad: '', description: '', permissions: [] });
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

  return (
    <PageGuard sayfaYolu="/ayarlar/rol-yonetimi">
      <DashboardLayout>
        <div className="container mx-auto p-4 max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Rol Yönetimi</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleSayfalarTara}
                disabled={otomatikTaramaYapiliyor}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {otomatikTaramaYapiliyor ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Sayfaları Tara
              </button>
              <button
                onClick={handleAddNewRole}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-medium text-gray-900">{role.rol_ad}</h3>
                          <p className="mt-1 text-sm text-gray-500">{role.description || 'Açıklama bulunmuyor'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => openDeleteModal(role)}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                          <button 
                            onClick={() => handleToggleRole(role.id)}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            {expandedRole === role.id ? (
                              <ChevronUp size={18} className="text-gray-600" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Sayfa yetkilerini düzenleme bölümü */}
                      {expandedRole === role.id && (
                        <div className="mt-3 bg-white rounded-lg shadow p-4 animate-fadeIn">
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