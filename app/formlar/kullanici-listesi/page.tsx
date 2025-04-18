'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Trash2, Edit, Search, UserPlus, AlertTriangle, X, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/app/lib/supabase';

interface Personel {
  id: string;
  ad_soyad: string;
  kullanici_adi: string;
  rol_id: string;
  created_at: string;
  updated_at: string;
  sifre?: string;
}

interface Rol {
  id: string;
  rol_ad: string;
  created_at: string;
}

const KullaniciListesiPage = () => {
  const router = useRouter();
  
  // Durum değişkenleri
  const [personeller, setPersoneller] = useState<(Personel & { rol_ad: string })[]>([]);
  const [roller, setRoller] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hata, setHata] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Silme işlemi için
  const [silinecekPersonel, setSilinecekPersonel] = useState<string | null>(null);
  const [silmeOnayModalAcik, setSilmeOnayModalAcik] = useState(false);
  
  // Düzenleme işlemi için
  const [duzenlenecekPersonel, setDuzenlenecekPersonel] = useState<(Personel & { rol_ad: string }) | null>(null);
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [duzenleForm, setDuzenleForm] = useState({
    ad_soyad: '',
    kullanici_adi: '',
    rol_id: '',
    sifre: ''
  });
  const [sifreGuncelle, setSifreGuncelle] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [guncellemeHata, setGuncellemeHata] = useState('');
  
  // Rolleri ve personelleri getir
  const verileriGetir = async () => {
    setIsLoading(true);
    setHata('');
    
    try {
      // Rolleri getir
      const { data: rolData, error: rolError } = await supabase
        .from('roller')
        .select('*')
        .order('rol_ad');
      
      if (rolError) throw rolError;
      setRoller(rolData || []);
      
      // Personelleri rol bilgileriyle birlikte getir
      const { data: personelData, error: personelError } = await supabase
        .from('personel')
        .select(`
          *,
          rollers:rol_id (
            rol_ad
          )
        `)
        .order('ad_soyad');
      
      if (personelError) throw personelError;
      
      // Verileri düzenle
      const duzenliPersoneller = personelData?.map(p => ({
        ...p,
        rol_ad: p.rollers?.rol_ad || ''
      })) || [];
      
      setPersoneller(duzenliPersoneller);
    } catch (error: any) {
      console.error('Veriler alınırken hata:', error);
      setHata(error.message || 'Veriler alınırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    verileriGetir();
  }, []);
  
  // Arama filtrelemesi
  const filtreliPersoneller = personeller.filter(personel => 
    personel.ad_soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    personel.kullanici_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    personel.rol_ad.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Silme onayı modal'ı
  const silmeOnayiGoster = (personelId: string) => {
    setSilinecekPersonel(personelId);
    setSilmeOnayModalAcik(true);
  };
  
  // Silme işlemi
  const personelSil = async () => {
    if (!silinecekPersonel) return;
    
    try {
      // Silme işlemi başlamadan önce yükleme durumunu ayarla
      setIsLoading(true);
      
      const { error } = await supabase
        .from('personel')
        .delete()
        .eq('id', silinecekPersonel);
      
      if (error) {
        // Eğer ilişkisel veritabanı hatası varsa daha anlaşılır bir mesaj göster
        if (error.message && error.message.includes("violates foreign key constraint")) {
          throw new Error(
            "Bu kullanıcı diğer tablolarla ilişkili olduğu için silinemiyor. " +
            "Veritabanı yöneticinizle iletişime geçin."
          );
        } else {
          throw new Error(error.message || 'Silme işlemi başarısız oldu');
        }
      }
      
      // Listeyi güncelle
      setPersoneller(prev => prev.filter(p => p.id !== silinecekPersonel));
      setSilmeOnayModalAcik(false);
      setSilinecekPersonel(null);
      
      // Başarı mesajı göster
      setHata('');
      toast.success('Kullanıcı başarıyla silindi');
    } catch (error: any) {
      console.error('Personel silinirken hata:', error);
      setHata(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Düzenleme modalını aç
  const duzenleModalAc = (personel: (Personel & { rol_ad: string })) => {
    setDuzenlenecekPersonel(personel);
    setDuzenleForm({
      ad_soyad: personel.ad_soyad,
      kullanici_adi: personel.kullanici_adi,
      rol_id: personel.rol_id,
      sifre: ''
    });
    setSifreGuncelle(false);
    setDuzenleModalAcik(true);
    setGuncellemeHata('');
  };
  
  // Form değişikliklerini işle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDuzenleForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Personel güncelleme
  const personelGuncelle = async () => {
    if (!duzenlenecekPersonel) return;
    
    try {
      setIsLoading(true);
      setGuncellemeHata('');
      
      const updates: any = {
        ad_soyad: duzenleForm.ad_soyad,
        kullanici_adi: duzenleForm.kullanici_adi,
        rol_id: duzenleForm.rol_id,
        updated_at: new Date().toISOString()
      };
      
      // Şifre güncellenecekse ekle
      if (sifreGuncelle && duzenleForm.sifre) {
        updates.sifre = duzenleForm.sifre;
      }
      
      // Kullanıcı adı benzersizliğini kontrol et
      const { data: existingUser, error: checkError } = await supabase
        .from('personel')
        .select('id')
        .eq('kullanici_adi', duzenleForm.kullanici_adi)
        .neq('id', duzenlenecekPersonel.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingUser) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      }
      
      // Güncelleme yap
      const { data, error } = await supabase
        .from('personel')
        .update(updates)
        .eq('id', duzenlenecekPersonel.id)
        .select(`
          *,
          rollers:rol_id (
            rol_ad
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Personel listesini güncelle
      const guncellenenPersonel = {
        ...data,
        rol_ad: data.rollers?.rol_ad || ''
      };
      
      setPersoneller(prev => 
        prev.map(p => p.id === duzenlenecekPersonel.id ? guncellenenPersonel : p)
      );
      
      setDuzenleModalAcik(false);
      toast.success('Kullanıcı başarıyla güncellendi');
    } catch (error: any) {
      console.error('Personel güncellenirken hata:', error);
      setGuncellemeHata(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Rol rengini belirle
  const getRolRengi = (rolAd: string) => {
    if (rolAd.toLowerCase() === 'patron') {
      return 'bg-red-100 text-red-800';
    }
    
    // Diğer roller için rastgele renkler (sabit kalması için rol adını hash olarak kullan)
    const hash = rolAd.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const renk = hash % 4;
    
    switch (renk) {
      case 0: return 'bg-blue-100 text-blue-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-purple-100 text-purple-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolRengi(personel.rol_ad)}`}>
                          {personel.rol_ad}
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
                onClick={() => {
                  setSilmeOnayModalAcik(false);
                  setSilinecekPersonel(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                İptal
              </button>
              <button
                onClick={personelSil}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <span>Evet, Sil</span>
                )}
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
            
            {guncellemeHata && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {guncellemeHata}
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
                />
              </div>
              
              <div>
                <label htmlFor="rol_id" className="block text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  id="rol_id"
                  name="rol_id"
                  value={duzenleForm.rol_id}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {roller.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {rol.rol_ad}
                    </option>
                  ))}
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
                  <div className="mt-2">
                    <label htmlFor="sifre" className="block text-sm font-medium text-gray-700">
                      Yeni Şifre
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type={sifreGoster ? "text" : "password"}
                        id="sifre"
                        name="sifre"
                        value={duzenleForm.sifre}
                        onChange={handleFormChange}
                        className="block w-full pr-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setSifreGoster(!sifreGoster)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setDuzenleModalAcik(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                İptal
              </button>
              <button
                onClick={personelGuncelle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    <span>Kaydet</span>
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