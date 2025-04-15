'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Personel, Rol } from '@/app/lib/types/index';
import { Trash2, Edit, Plus, Search, UserPlus, AlertTriangle, X, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const KullaniciListesiPage = () => {
  const router = useRouter();
  
  // Durum değişkenleri
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hata, setHata] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Silme işlemi için
  const [silinecekPersonel, setSilinecekPersonel] = useState<string | null>(null);
  const [silmeOnayModalAcik, setSilmeOnayModalAcik] = useState(false);
  
  // Düzenleme işlemi için
  const [duzenlenecekPersonel, setDuzenlenecekPersonel] = useState<Personel | null>(null);
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [duzenleForm, setDuzenleForm] = useState({
    ad_soyad: '',
    kullanici_adi: '',
    rol: 'personel' as 'patron' | 'yonetici' | 'personel',
    sifre: ''
  });
  const [sifreGuncelle, setSifreGuncelle] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [guncellemeHata, setGuncellemeHata] = useState('');
  
  // Personelleri getir
  const personelleriGetir = async () => {
    setIsLoading(true);
    setHata('');
    
    try {
      const response = await fetch('/api/personel');
      
      if (!response.ok) {
        throw new Error('Personel verileri alınamadı');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPersoneller(data.data);
      } else {
        throw new Error(data.error || 'Veriler alınamadı');
      }
    } catch (error: any) {
      console.error('Personel verileri alınırken hata:', error);
      setHata(error.message || 'Personel verileri alınırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde personelleri getir
  useEffect(() => {
    personelleriGetir();
  }, []);
  
  // Arama filtrelemesi
  const filtreliPersoneller = personeller.filter(personel => 
    personel.ad_soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    personel.kullanici_adi.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Silme onayı modal'ı
  const silmeOnayiGoster = (personelId: string) => {
    console.log("Silinecek personel ID:", personelId);
    setSilinecekPersonel(personelId);
    setSilmeOnayModalAcik(true);
  };
  
  // Silme işlemi
  const personelSil = async () => {
    if (!silinecekPersonel) return;
    
    try {
      // Silme işlemi başlamadan önce yükleme durumunu ayarla
      setIsLoading(true);
      
      const response = await fetch(`/api/personel?id=${silinecekPersonel}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Eğer ilişkisel veritabanı hatası varsa daha anlaşılır bir mesaj göster
        if (data.error && data.error.includes("violates foreign key constraint")) {
          throw new Error(
            "Bu kullanıcı performans raporlarıyla ilişkili olduğu için silinemiyor. " +
            "Veritabanı yöneticinizle iletişime geçin."
          );
        } else {
          throw new Error(data.error || 'Silme işlemi başarısız oldu');
        }
      }
      
      if (data.success) {
        // Listeyi güncelle
        setPersoneller(prev => prev.filter(p => p.id !== silinecekPersonel));
        setSilmeOnayModalAcik(false);
        setSilinecekPersonel(null);
        
        // Başarı mesajı göster
        setHata('');
        toast.success('Kullanıcı başarıyla silindi');
      } else {
        throw new Error(data.error || 'Silme işlemi başarısız oldu');
      }
    } catch (error: any) {
      console.error('Personel silinirken hata:', error);
      setHata(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Rol adını formatla
  const formatRol = (rol: 'patron' | 'yonetici' | 'personel') => {
    if (rol === Rol.Patron) return 'Patron';
    if (rol === Rol.Yonetici) return 'Yönetici';
    return 'Personel';
  };
  
  // Düzenleme modalını aç
  const duzenleModalAc = (personel: Personel) => {
    setDuzenlenecekPersonel(personel);
    setDuzenleForm({
      ad_soyad: personel.ad_soyad,
      kullanici_adi: personel.kullanici_adi,
      rol: personel.rol,
      sifre: ''
    });
    setSifreGuncelle(false);
    setDuzenleModalAcik(true);
  };

  // Form değişikliklerini izle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDuzenleForm({
      ...duzenleForm,
      [name]: value
    });
  };

  // Personel güncelleme
  const personelGuncelle = async () => {
    if (!duzenlenecekPersonel) return;
    
    try {
      setIsLoading(true);
      setGuncellemeHata('');
      
      // Form doğrulama
      if (!duzenleForm.ad_soyad || !duzenleForm.kullanici_adi) {
        throw new Error('Ad Soyad ve Kullanıcı Adı alanları zorunludur');
      }
      
      if (sifreGuncelle && !duzenleForm.sifre) {
        throw new Error('Şifre güncellemek istiyorsanız, yeni şifre girmelisiniz');
      }
      
      const guncellenecekVeri: any = {
        id: duzenlenecekPersonel.id,
        ad_soyad: duzenleForm.ad_soyad,
        kullanici_adi: duzenleForm.kullanici_adi,
        rol: duzenleForm.rol
      };
      
      // Şifre güncellenmek isteniyorsa ekle
      if (sifreGuncelle && duzenleForm.sifre) {
        guncellenecekVeri.sifre = duzenleForm.sifre;
      }
      
      console.log('Güncellenecek veri:', guncellenecekVeri);
      
      const response = await fetch('/api/personel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guncellenecekVeri),
      });
      
      const data = await response.json();
      console.log('API yanıtı:', data);
      
      if (!response.ok) {
        let errorMessage = 'Güncelleme işlemi başarısız oldu';
        
        // API yanıtında error alanı varsa kullan
        if (data.error) {
          // Rol değeri hatası kontrolü
          if (data.error.includes('check constraint')) {
            errorMessage = 'Geçersiz rol değeri. Lütfen geçerli bir rol seçin.';
          } 
          // Kullanıcı adı çakışması kontrolü
          else if (data.error.includes('kullanıcı adı zaten kullanılıyor')) {
            errorMessage = `"${duzenleForm.kullanici_adi}" kullanıcı adı zaten kullanımda. Lütfen farklı bir kullanıcı adı seçin.`;
          } else {
            errorMessage = data.error;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      if (data.success) {
        // Başarılı ise personel listesini güncelle
        setPersoneller(prev => prev.map(p => 
          p.id === duzenlenecekPersonel.id ? { 
            ...p, 
            ad_soyad: guncellenecekVeri.ad_soyad,
            kullanici_adi: guncellenecekVeri.kullanici_adi,
            rol: guncellenecekVeri.rol
          } : p
        ));
        
        setDuzenleModalAcik(false);
        setDuzenlenecekPersonel(null);
        setDuzenleForm({
          ad_soyad: '',
          kullanici_adi: '',
          rol: 'personel',
          sifre: ''
        });
        
        toast.success('Kullanıcı bilgileri başarıyla güncellendi');
      } else {
        throw new Error(data.error || 'Güncelleme işlemi başarısız oldu');
      }
    } catch (error: any) {
      console.error('Personel güncellenirken hata:', error);
      // Modalda hatayı göster
      setGuncellemeHata(error.message);
      // Toast notification ile hatayı göster
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Şifre göster/gizle
  const sifreGosterGizle = () => {
    setSifreGoster(!sifreGoster);
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Kullanıcı Listesi</h1>
          
          <Link 
            href="/formlar/kullanici-kaydi"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={18} className="mr-2" />
            Yeni Kullanıcı Ekle
          </Link>
        </div>
        
        {hata && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {hata}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ad, soyad veya kullanıcı adı ile ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filtreliPersoneller.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'Arama kriterlerine uygun kullanıcı bulunamadı.' : 'Henüz kayıtlı kullanıcı bulunmuyor.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad Soyad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı Adı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtreliPersoneller.map((personel) => (
                    <tr key={personel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{personel.ad_soyad}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{personel.kullanici_adi}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          personel.rol === Rol.Patron 
                            ? 'bg-red-100 text-red-800'
                            : personel.rol === Rol.Yonetici 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {formatRol(personel.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => duzenleModalAc(personel)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => silmeOnayiGoster(personel.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
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
      {silmeOnayModalAcik && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="mr-4 bg-red-100 rounded-full p-2">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Kullanıcıyı Sil</h3>
            </div>
            
            {silinecekPersonel && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Silinecek kullanıcı:</p>
                <p className="text-sm font-medium">
                  {personeller.find(p => p.id === silinecekPersonel)?.ad_soyad || "Kullanıcı bulunamadı"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ID: <span className="font-mono text-xs">{silinecekPersonel}</span>
                </p>
              </div>
            )}
            
            <p className="text-gray-500 mb-5">
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSilmeOnayModalAcik(false);
                  setSilinecekPersonel(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={personelSil}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Düzenleme Modalı */}
      {duzenleModalAcik && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Kullanıcı Düzenle</h3>
              <button 
                onClick={() => setDuzenleModalAcik(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal içinde daha belirgin hata mesajı */}
            {guncellemeHata && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                <div className="flex items-start">
                  <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium">Hata:</p>
                    <p>{guncellemeHata}</p>
                    <p className="mt-1 text-xs text-red-600">
                      Aynı kullanıcı adı başka bir kullanıcıda olabilir veya veritabanı bir kısıtlama nedeniyle güncellemeyi reddediyor olabilir.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="ad_soyad" className="block text-sm font-medium text-gray-700">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  id="ad_soyad"
                  name="ad_soyad"
                  value={duzenleForm.ad_soyad}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="kullanici_adi" className="block text-sm font-medium text-gray-700">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  id="kullanici_adi"
                  name="kullanici_adi"
                  value={duzenleForm.kullanici_adi}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  value={duzenleForm.rol}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="personel">Personel</option>
                  <option value="yonetici">Yönetici</option>
                  <option value="patron">Patron</option>
                </select>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center mb-2">
                  <input
                    id="sifreGuncelle"
                    name="sifreGuncelle"
                    type="checkbox"
                    checked={sifreGuncelle}
                    onChange={() => setSifreGuncelle(!sifreGuncelle)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sifreGuncelle" className="ml-2 block text-sm text-gray-700">
                    Şifreyi güncelle
                  </label>
                </div>
                
                {sifreGuncelle && (
                  <div>
                    <label htmlFor="sifre" className="block text-sm font-medium text-gray-700">
                      Yeni Şifre
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={sifreGoster ? "text" : "password"}
                        id="sifre"
                        name="sifre"
                        value={duzenleForm.sifre}
                        onChange={handleFormChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required={sifreGuncelle}
                      />
                      <button
                        type="button"
                        onClick={sifreGosterGizle}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      >
                        {sifreGoster ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDuzenleModalAcik(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={personelGuncelle}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Kaydet
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

export default KullaniciListesiPage; 