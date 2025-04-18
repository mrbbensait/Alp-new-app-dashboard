'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Search, Calendar, Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Rol {
  id: string;
  rol_ad: string;
  created_at: string;
}

const RolListesiPage = () => {
  // Durum değişkenleri
  const [roller, setRoller] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hata, setHata] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [silinecekRol, setSilinecekRol] = useState<Rol | null>(null);
  const [silmeOnayModalAcik, setSilmeOnayModalAcik] = useState(false);
  const [silmeIslemYapiliyor, setSilmeIslemYapiliyor] = useState(false);
  
  // Rolleri getir
  const rolleriGetir = async () => {
    setIsLoading(true);
    setHata('');
    
    try {
      // Rolleri created_at'e göre ARTAN sırayla getir (en son kaydedilenler en altta)
      const { data, error } = await supabase
        .from('roller')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setRoller(data || []);
    } catch (error: any) {
      console.error('Roller alınırken hata:', error);
      setHata(error.message || 'Roller alınırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde rolleri getir
  useEffect(() => {
    rolleriGetir();
  }, []);
  
  // Arama filtrelemesi
  const filtreliRoller = roller.filter(rol => 
    rol.rol_ad.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Tarih formatını düzenle
  const formatTarih = (tarih: string) => {
    try {
      return format(new Date(tarih), 'dd MMMM yyyy, HH:mm', { locale: tr });
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  // Rol rengi belirle (rol adına göre)
  const getRolRengi = (rolAd: string) => {
    // "Patron" rolü her zaman kırmızı olsun
    if (rolAd.toLowerCase() === 'patron') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    // Diğer roller için pastel renkler
    // Rol adının hashini alarak renk belirle (her rol için sabit bir renk olması için)
    const hash = rolAd.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const renk = hash % 8;
    
    // Pastel renkler koleksiyonu
    switch (renk) {
      case 0: return 'bg-purple-50 text-purple-600 border-purple-100';
      case 1: return 'bg-blue-50 text-blue-600 border-blue-100';
      case 2: return 'bg-green-50 text-green-600 border-green-100';
      case 3: return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 4: return 'bg-pink-50 text-pink-600 border-pink-100';
      case 5: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 6: return 'bg-teal-50 text-teal-600 border-teal-100';
      case 7: return 'bg-lime-50 text-lime-600 border-lime-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  // Silme onay modalını aç
  const silmeOnayiGoster = (rol: Rol) => {
    setSilinecekRol(rol);
    setSilmeOnayModalAcik(true);
  };

  // Rol silme işlemi
  const rolSil = async () => {
    if (!silinecekRol) return;
    
    setSilmeIslemYapiliyor(true);
    
    try {
      // Rolün kullanımda olup olmadığını kontrol et (personel tablosunda)
      const { data: kullanicilar, error: kullanicilarError } = await supabase
        .from('personel')
        .select('id')
        .eq('rol_id', silinecekRol.id);

      if (kullanicilarError) throw kullanicilarError;

      // Rol kullanılıyorsa silme
      if (kullanicilar && kullanicilar.length > 0) {
        throw new Error(`Bu rol ${kullanicilar.length} kullanıcı tarafından kullanıldığı için silinemez.`);
      }

      // Rolü sil
      const { error: silmeError } = await supabase
        .from('roller')
        .delete()
        .eq('id', silinecekRol.id);

      if (silmeError) {
        if (silmeError.message.includes('violates foreign key constraint')) {
          throw new Error('Bu rol başka tablolar tarafından kullanıldığı için silinemez.');
        }
        throw silmeError;
      }

      // Rol listesini güncelle
      setRoller(roller.filter(r => r.id !== silinecekRol.id));
      toast.success(`"${silinecekRol.rol_ad}" rolü başarıyla silindi.`);
      setSilmeOnayModalAcik(false);
      setSilinecekRol(null);
    } catch (error: any) {
      console.error('Rol silinirken hata:', error);
      toast.error(error.message || 'Rol silinirken bir hata oluştu');
      setHata(error.message || 'Rol silinirken bir hata oluştu');
    } finally {
      setSilmeIslemYapiliyor(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Kullanıcı Rolleri</h1>
        </div>
        
        {hata && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium">Hata:</p>
              <p>{hata}</p>
            </div>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rol adı ile ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filtreliRoller.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'Arama kriterlerine uygun rol bulunamadı.' : 'Henüz kayıtlı rol bulunmuyor.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      İşlem
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol Adı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturulma Tarihi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtreliRoller.map((rol) => (
                    <tr key={rol.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => silmeOnayiGoster(rol)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                          title="Rolü Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-base font-medium px-4 py-2 rounded-md inline-block border ${getRolRengi(rol.rol_ad)}`}>
                          {rol.rol_ad}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="inline mr-1" />
                          {formatTarih(rol.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Silme Onay Modalı */}
      {silmeOnayModalAcik && silinecekRol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="mr-4 bg-red-100 rounded-full p-2">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Rol Silme</h3>
              <button 
                onClick={() => setSilmeOnayModalAcik(false)}
                className="ml-auto text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 mb-1">Silinecek rol:</p>
              <p className={`text-md font-medium px-3 py-1.5 rounded inline-block border ${getRolRengi(silinecekRol.rol_ad)}`}>
                {silinecekRol.rol_ad}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ID: <span className="font-mono text-xs">{silinecekRol.id}</span>
              </p>
            </div>
            
            <p className="text-gray-600 mb-5">
              Bu rolü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve eğer bu rol kullanıcılara atanmışsa silme işlemi başarısız olacaktır.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSilmeOnayModalAcik(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                disabled={silmeIslemYapiliyor}
              >
                İptal
              </button>
              <button
                onClick={rolSil}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
                disabled={silmeIslemYapiliyor}
              >
                {silmeIslemYapiliyor ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-1" />
                    <span>Evet, Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RolListesiPage; 