'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import Notes from '../components/Notes';
import TalepFormu from '../components/TalepFormu';
import PageGuard from '../components/PageGuard';
import KritikStokWidget from '../components/KritikStokWidget';
import { 
  Archive, 
  FileText, 
  Package, 
  ShoppingCart,
  Brain,
  Send
} from 'lucide-react';

export default function PersonelHomePage() {
  return (
    <PageGuard sayfaYolu="/anasayfa-p">
      <DashboardLayout pageTitle="ANA PANEL-P" pageSubtitle="Hoş geldiniz, günlük işlemlerinize kolayca erişebilirsiniz.">
        {/* Üst bölüm - Hızlı Erişim ve Stok Durumu */}
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          {/* Sol kolon - Hızlı Erişim Bileşeni */}
          <div className="md:w-1/2">
            <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Hızlı Erişim</h2>
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                {/* Butonlar kısmı */}
                <div className="grid grid-cols-2 gap-4">
                  {/* SOL KOLON BUTONLARI */}
                  <div className="flex flex-col space-y-4">
                    <Link 
                      href="/tablo/Stok"
                      className="flex items-center justify-between bg-amber-50 hover:bg-amber-100 rounded-lg p-5 transition duration-300 h-32"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-amber-200 p-2 mr-4 w-12 h-12 flex items-center justify-center">
                          <Package className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <span className="text-base font-medium text-gray-700">STOK</span>
                          <p className="text-xs text-gray-500 mt-1">Hammadde ve malzeme stoklarını kontrol edin</p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link 
                      href="/tablo/SatınAlma siparişleri"
                      className="flex items-center justify-between bg-purple-50 hover:bg-purple-100 rounded-lg p-5 transition duration-300 h-32"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-purple-200 p-2 mr-4 w-12 h-12 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-base font-medium text-gray-700">Satın Alma Siparişleri</span>
                          <p className="text-xs text-gray-500 mt-1">Bekleyen siparişleri kontrol edin</p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* SAĞ KOLON BUTONLARI */}
                  <div className="flex flex-col space-y-4">
                    <Link 
                      href="/tablo/Bitmiş Ürün Stoğu"
                      className="flex items-center justify-between bg-teal-50 hover:bg-teal-100 rounded-lg p-5 transition duration-300 h-32"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-teal-200 p-2 mr-4 w-12 h-12 flex items-center justify-center">
                          <Archive className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                          <span className="text-base font-medium text-gray-700">Bitmiş Ürün Stoğu</span>
                          <p className="text-xs text-gray-500 mt-1">Teslimat kayıtlarını girin</p>
                        </div>
                      </div>
                    </Link>
                  
                    <Link 
                      href="/personel-rapor"
                      className="flex items-center justify-between bg-green-50 hover:bg-green-100 rounded-lg p-5 transition duration-300 h-32"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-200 p-2 mr-4 w-12 h-12 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <span className="text-base font-medium text-gray-700">Personel Rapor</span>
                          <p className="text-xs text-gray-500 mt-1">Günlük raporlarınızı girin</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
                
                {/* Yapay Zeka Asistanı - Hızlı Erişim bileşeninin içinde */}
                <div className="mt-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow overflow-hidden border border-green-200">
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

          {/* Sağ kolon - Stok Durumu Widget */}
          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-md mb-1">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Stok Durumu</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Rezerve edilmiş stoklar ve kritik seviyedeki ürünler
                </p>
              </div>
            </div>
            <div className="h-full">
              <KritikStokWidget />
            </div>
          </div>
        </div>
        
        {/* Alt bölüm - Notlar ve Talepler */}
        <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1 w-full">
            <Notes maxNotes={5} />
          </div>
          <div className="md:col-span-1 w-full">
            <TalepFormu maxTalepler={5} />
          </div>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
} 