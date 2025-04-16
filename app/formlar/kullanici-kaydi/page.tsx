'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Rol } from '@/app/lib/types/index';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/app/lib/AuthContext';

const KullaniciKaydiPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    // Personel rolündeki kullanıcıları ana sayfaya yönlendir
    if (user?.rol === 'personel') {
      router.push('/anasayfa-p');
    }
  }, [user, router]);

  // Personel rolündeki kullanıcılar için içeriği gösterme
  if (user?.rol === 'personel') {
    return null;
  }
  
  // Form durumu
  const [formData, setFormData] = useState<{
    ad_soyad: string;
    kullanici_adi: string;
    sifre: string;
    sifreTekrar: string;
    rol: "patron" | "yonetici" | "personel";
  }>({
    ad_soyad: "",
    kullanici_adi: "",
    sifre: "",
    sifreTekrar: "",
    rol: "personel",
  });
  
  // Şifre görünürlük durumları
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [sifreTekrarGorunur, setSifreTekrarGorunur] = useState(false);
  
  // Yükleme/hata durumları
  const [isLoading, setIsLoading] = useState(false);
  const [hata, setHata] = useState('');
  const [basarili, setBasarili] = useState(false);
  
  // Form değişikliği
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for required fields
    if (
      !formData.ad_soyad ||
      !formData.kullanici_adi ||
      !formData.sifre ||
      !formData.sifreTekrar
    ) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    // Check if passwords match
    if (formData.sifre !== formData.sifreTekrar) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/personel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_soyad: formData.ad_soyad,
          kullanici_adi: formData.kullanici_adi,
          sifre: formData.sifre,
          rol: formData.rol,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bir hata oluştu');
      }

      const data = await response.json();
      
      toast.success("Kullanıcı başarıyla eklendi.");
      
      // Reset form after successful submission
      setFormData({
        ad_soyad: "",
        kullanici_adi: "",
        sifre: "",
        sifreTekrar: "",
        rol: "personel",
      });
      
    } catch (error: any) {
      console.error('Error adding personnel:', error);
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Yeni Kullanıcı Ekle</h1>
        
        {hata && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {hata}
          </div>
        )}
        
        {basarili && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            Kullanıcı başarıyla eklendi!
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">Kullanıcı Bilgileri</h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="ad_soyad"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ad Soyad <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="ad_soyad"
                  name="ad_soyad"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.ad_soyad}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="kullanici_adi"
                  className="block text-sm font-medium text-gray-700"
                >
                  Kullanıcı Adı <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="kullanici_adi"
                  name="kullanici_adi"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.kullanici_adi}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="sifre"
                  className="block text-sm font-medium text-gray-700"
                >
                  Şifre <span className="text-red-600">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={sifreGorunur ? "text" : "password"}
                    id="sifre"
                    name="sifre"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                    value={formData.sifre}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSifreGorunur(!sifreGorunur)}
                  >
                    {sifreGorunur ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sifreTekrar"
                  className="block text-sm font-medium text-gray-700"
                >
                  Şifre Tekrar <span className="text-red-600">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={sifreTekrarGorunur ? "text" : "password"}
                    id="sifreTekrar"
                    name="sifreTekrar"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                    value={formData.sifreTekrar}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSifreTekrarGorunur(!sifreTekrarGorunur)}
                  >
                    {sifreTekrarGorunur ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="rol"
                  className="block text-sm font-medium text-gray-700"
                >
                  Rol <span className="text-red-600">*</span>
                </label>
                <select
                  id="rol"
                  name="rol"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.rol}
                  onChange={handleChange}
                >
                  <option value="patron">Patron</option>
                  <option value="yonetici">Yönetici</option>
                  <option value="personel">Personel</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
              >
                {isLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KullaniciKaydiPage; 