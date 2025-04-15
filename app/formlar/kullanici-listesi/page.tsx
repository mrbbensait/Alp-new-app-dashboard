'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Personel, Rol } from '@/app/lib/types/index';
import { Trash2, Edit, Plus, Search, UserPlus } from 'lucide-react';

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
    setSilinecekPersonel(personelId);
    setSilmeOnayModalAcik(true);
  };
  
  // Silme işlemi
  const personelSil = async () => {
    if (!silinecekPersonel) return;
    
    try {
      const response = await fetch(`/api/personel?id=${silinecekPersonel}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Silme işlemi başarısız oldu');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Listeyi güncelle
        setPersoneller(prev => prev.filter(p => p.id !== silinecekPersonel));
        setSilmeOnayModalAcik(false);
        setSilinecekPersonel(null);
      } else {
        throw new Error(data.error || 'Silme işlemi başarısız oldu');
      }
    } catch (error: any) {
      console.error('Personel silinirken hata:', error);
      setHata(error.message || 'Personel silinirken bir hata oluştu');
    }
  };
  
  // Rol adını formatla
  const formatRol = (rol: 'patron' | 'personel') => {
    return rol === Rol.Patron ? 'Patron' : 'Personel';
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-posta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
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
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {formatRol(personel.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {personel.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {personel.telefon || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/formlar/kullanici-duzenle/${personel.id}`)}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kullanıcıyı Sil</h3>
            <p className="text-gray-500 mb-5">
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setSilmeOnayModalAcik(false);
                  setSilinecekPersonel(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={personelSil}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default KullaniciListesiPage; 