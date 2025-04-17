'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from './components/DashboardLayout';
import { tables } from './data/schema';
import { fetchAllFromTable, subscribeToTable, unsubscribeFromChannel } from './lib/supabase';
import { Brain, MessageSquareText, BarChart3, Clock, ChevronRight, Send } from 'lucide-react';
import KritikStokWidget from './components/KritikStokWidget';

function TarihSaat() {
  const [tarihSaat, setTarihSaat] = useState('');
  
  useEffect(() => {
    // Tarih ve saati güncelleyen fonksiyon
    const tarihiGuncelle = () => {
      const simdi = new Date();
      
      // Gün isimlerini Türkçe olarak tanımla
      const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      
      // Ay isimlerini Türkçe olarak tanımla
      const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      
      // Tarih ve saati formatlama
      const gun = simdi.getDate();
      const ay = aylar[simdi.getMonth()];
      const yil = simdi.getFullYear();
      const haftaninGunu = gunler[simdi.getDay()];
      
      const saat = simdi.getHours().toString().padStart(2, '0');
      const dakika = simdi.getMinutes().toString().padStart(2, '0');
      
      // Tarih ve saat bilgisini ayarla
      setTarihSaat(`${gun} ${ay} ${yil} ${haftaninGunu} ${saat}:${dakika}`);
    };
    
    // İlk yüklendiğinde tarih ve saati ayarla
    tarihiGuncelle();
    
    // Her dakika güncellenecek bir zamanlayıcı ayarla
    const interval = setInterval(tarihiGuncelle, 60000);
    
    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-white text-sm md:text-base whitespace-nowrap">
      {tarihSaat}
    </div>
  );
}

export default function Home() {
  
  return (
    <DashboardLayout>
      {/* Yeni küçültülmüş ve sola yaslanmış başlık + saat */}
      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg py-2 px-4 mb-4 overflow-hidden flex justify-between items-center">
        <div className="flex flex-col md:flex-row md:items-center">
          <h1 className="text-lg font-medium text-white mr-2">HOŞGELDİNİZ</h1>
          <p className="text-xs text-white opacity-90 md:ml-2">
            Yapay Zeka ile STOK ve ÜRETİM YÖNETİM SİSTEMİ
          </p>
        </div>
        <TarihSaat />
      </div>

      {/* Ana içerik ve stok widget yan yana */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Sol kolon - Hızlı Erişim Bileşeni */}
        <div className="md:w-1/2">
          <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Hızlı Erişim</h2>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between">
              {/* Butonlar kısmı */}
              <div className="grid grid-cols-2 gap-3">
                {/* SOL KOLON BUTONLARI */}
                <div className="flex flex-col space-y-3">
                  <Link 
                    href="/tablo/Üretim Kuyruğu"
                    className="flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition duration-300"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-indigo-200 p-2 mr-4 w-9 h-9 flex items-center justify-center">
                        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Üretim Kuyruğu</span>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/tablo/Reçeteler"
                    className="flex items-center justify-between bg-red-50 hover:bg-red-100 rounded-lg p-4 transition duration-300"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-red-200 p-2 mr-4 w-9 h-9 flex items-center justify-center">
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Reçeteler</span>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/tablo/SatınAlma siparişleri"
                    className="flex items-center justify-between bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition duration-300"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-purple-200 p-2 mr-4 w-9 h-9 flex items-center justify-center">
                        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">SatınAlma Siparişleri</span>
                    </div>
                  </Link>
                </div>

                {/* SAĞ KOLON BUTONLARI */}
                <div className="flex flex-col space-y-3">
                  <Link 
                    href="/tablo/Stok"
                    className="flex items-center justify-between bg-green-50 hover:bg-green-100 rounded-lg p-4 transition duration-300"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-green-200 p-2 mr-4 w-9 h-9 flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">STOK</span>
                    </div>
                  </Link>
                
                  <Link 
                    href="/raporlar/personel-performans"
                    className="flex items-center justify-between bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition duration-300"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-yellow-200 p-2 mr-4 w-9 h-9 flex items-center justify-center">
                        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Personel Performans</span>
                    </div>
                  </Link>

                  <Link 
                    href="/tablo/Bitmiş Ürün Stoğu"
                    className="flex items-center justify-between bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition duration-300"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-teal-200 p-2 mr-4 w-9 h-9 flex items-center justify-center">
                        <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Bitmiş Ürün Stoğu</span>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Yapay Zeka Asistanı - Hızlı Erişim bileşeninin içinde */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow overflow-hidden border border-green-200">
                <div className="px-4 py-3 border-b border-green-200 flex items-center bg-white bg-opacity-70">
                  <Brain className="h-5 w-5 text-green-600 mr-2" />
                  <h2 className="text-base font-semibold text-gray-900">Yapay Zeka Asistanı</h2>
                </div>
                <div className="p-4 flex items-center">
                  <div className="flex-1">
                    <p className="text-base text-gray-700">
                      Şirketinize özel olarak eğitilmiş YAPAY ZEKA asistanınıza hemen bağlanın!
                    </p>
                  </div>
                  <div className="ml-4">
                    <Link 
                      href="https://t.me/Meta_Patron_bot"
                      target="_blank"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow"
                    >
                      <Send size={16} className="mr-2" />
                      <span>BAĞLAN</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ kolon - Rezerve Stok Widget */}
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg shadow-md mb-1">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Stok Durumu</h2>
              <p className="mt-1 text-sm text-gray-600">
                Rezerve edilmiş stoklar ve kritik seviyedeki ürünler
              </p>
            </div>
          </div>
          <KritikStokWidget />
        </div>
      </div>
    </DashboardLayout>
  );
} 