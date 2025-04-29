'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Trash2, Search, ShieldAlert } from 'lucide-react';
import { deleteData } from '@/app/lib/supabase';
import { useAuth } from '@/app/lib/AuthContext';

interface SatinAlmaSiparisiSilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SatinAlmaSiparisiSilModal: React.FC<SatinAlmaSiparisiSilModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [siparisListesi, setSiparisListesi] = useState<any[]>([]);
  const [seciliSiparisler, setSeciliSiparisler] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSiparisler, setFilteredSiparisler] = useState<any[]>([]);
  const [userRolBilgileri, setUserRolBilgileri] = useState<any>(null);
  const { user } = useAuth();

  // Kullanıcının rol bilgilerini ve yetkilerini kontrol et
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (user?.rol_id) {
        try {
          const { data, error } = await supabase
            .from("roller")
            .select("*")
            .eq("id", user.rol_id)
            .single();

          if (!error && data) {
            setUserRolBilgileri(data);
            
            // Eğer kullanıcının gerekli yetkisi yoksa, error mesajı göster
            if (!data.satinalma_siparisi_sil) {
              setError('Bu işlemi gerçekleştirmek için gerekli yetkiniz bulunmamaktadır.');
            }
          }
        } catch (err) {
          console.error("Rol bilgileri alınırken hata:", err);
          setError('Rol bilgileriniz yüklenirken bir hata oluştu.');
        }
      } else {
        setError('Kullanıcı bilgileriniz bulunamadı.');
      }
    };

    if (isOpen) {
      checkUserPermissions();
    }
  }, [user, isOpen]);

  // Modal açıldığında bekleyen siparişleri yükle
  useEffect(() => {
    if (isOpen && (!userRolBilgileri || userRolBilgileri?.satinalma_siparisi_sil)) {
      fetchBekleyenSiparisler();
    }
  }, [isOpen, userRolBilgileri]);

  // Arama terimine göre siparişleri filtrele
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSiparisler(siparisListesi);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = siparisListesi.filter(siparis => 
        siparis['Alınan Ürün']?.toLowerCase().includes(lowercasedSearch) || 
        siparis['Tedarikçi']?.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredSiparisler(filtered);
    }
  }, [searchTerm, siparisListesi]);

  const fetchBekleyenSiparisler = async () => {
    try {
      const { data, error } = await supabase
        .from('SatınAlma siparişleri')
        .select('*')
        .eq('TeslimDurumu', false)
        .order('id', { ascending: false });

      if (error) throw error;
      setSiparisListesi(data || []);
      setFilteredSiparisler(data || []);
    } catch (error) {
      console.error('Bekleyen siparişler yüklenirken hata oluştu:', error);
      setError('Siparişler yüklenemedi. Lütfen sayfayı yenileyin.');
    }
  };

  const handleCheckboxChange = (siparisId: number) => {
    setSeciliSiparisler(prevSelected => {
      if (prevSelected.includes(siparisId)) {
        return prevSelected.filter(id => id !== siparisId);
      } else {
        return [...prevSelected, siparisId];
      }
    });
  };

  const handleSil = async () => {
    if (!userRolBilgileri?.satinalma_siparisi_sil) {
      setError('Bu işlemi gerçekleştirmek için gerekli yetkiniz bulunmamaktadır.');
      return;
    }
    
    if (seciliSiparisler.length === 0) {
      setError('Lütfen silinecek en az bir sipariş seçin');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Seçili siparişleri sırayla sil
      for (const siparisId of seciliSiparisler) {
        await deleteData('SatınAlma siparişleri', siparisId);
      }

      setSuccess(true);
      setTimeout(() => {
        setSeciliSiparisler([]);
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('Siparişler silinirken hata oluştu:', error);
      setError(error.message || 'Siparişler silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSeciliSiparisler([]);
    setError(null);
    setSuccess(false);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-medium">Satın Alma Siparişlerini Sil</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-auto">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  {!userRolBilgileri?.satinalma_siparisi_sil ? (
                    <ShieldAlert className="h-5 w-5 text-red-400" />
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Yetki kontrolü */}
          {userRolBilgileri && !userRolBilgileri.satinalma_siparisi_sil ? (
            <div className="text-center py-8">
              <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Yetersiz Yetki</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Satın alma siparişlerini silmek için gerekli yetkiniz bulunmamaktadır. 
                Lütfen sistem yöneticinizle iletişime geçin.
              </p>
            </div>
          ) : (
            <>
              {success && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">Seçili siparişler başarıyla silindi!</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">Sadece teslim durumu "bekleyen" olan siparişler listelenmektedir. Silmek istediğiniz siparişleri seçin.</p>
                
                <div className="relative w-full mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Sipariş veya tedarikçi adı ile ara..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {filteredSiparisler.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {siparisListesi.length === 0 
                      ? "Bekleyen sipariş bulunmuyor" 
                      : "Arama kriterine uygun sipariş bulunamadı"}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <span className="sr-only">Seç</span>
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ürün
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tedarikçi
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Miktar
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notlar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSiparisler.map((siparis) => (
                          <tr 
                            key={siparis.id}
                            className={`hover:bg-gray-50 ${seciliSiparisler.includes(siparis.id) ? 'bg-indigo-50' : ''}`}
                            onClick={() => handleCheckboxChange(siparis.id)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <input
                                type="checkbox"
                                checked={seciliSiparisler.includes(siparis.id)}
                                onChange={() => {}} // Event handled by row click
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {siparis['Alınan Ürün']}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {siparis['Tedarikçi']}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {siparis['Sipariş Miktarı']} {siparis['Birim']}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-[240px] truncate">
                              {siparis['Notlar'] || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <div className="flex-grow">
            {seciliSiparisler.length > 0 && (
              <span className="text-sm text-gray-700">
                {seciliSiparisler.length} sipariş seçildi
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSil}
            disabled={isSubmitting || seciliSiparisler.length === 0 || success || !userRolBilgileri?.satinalma_siparisi_sil}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center"
          >
            <Trash2 size={16} className="mr-2" />
            {isSubmitting ? 'Siliniyor...' : 'Seçilenleri Sil'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SatinAlmaSiparisiSilModal; 