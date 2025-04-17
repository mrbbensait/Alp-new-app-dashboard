'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import Notes from '../components/Notes';
import { 
  Clock, 
  Archive, 
  FileText, 
  Package, 
  ShoppingCart,
  ArrowRight,
  Brain
} from 'lucide-react';

export default function PersonelHomePage() {
  const menuCards = [
    {
      title: 'Üretim Kuyruğu',
      description: 'Üretimi ve ambalajlamayı bekleyen üretim planlama tablosu.',
      icon: <Clock size={24} />,
      path: '/uretim-kuyrugu-personel',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hoverBorderColor: 'hover:border-blue-500',
      hoverTextColor: 'group-hover:text-blue-600',
      buttonColor: 'text-blue-600',
    },
    {
      title: 'Teslimat GİR',
      description: 'Müşterilere teslim ettiğiniz ürünleri girmeyi unutmayınız!',
      subtitle: '(Müşterinin Bitmiş Ürün Stoğu)',
      icon: <Archive size={24} />,
      path: '/bitmis-urun-stogu-personel',
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconBgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      hoverBorderColor: 'hover:border-indigo-500',
      hoverTextColor: 'group-hover:text-indigo-600',
      buttonColor: 'text-indigo-600',
    },
    {
      title: 'Günlük Rapor Gir',
      description: 'Günlük aktivite ve üretim raporlarınızı girin.',
      icon: <FileText size={24} />,
      path: '/personel-rapor',
      color: 'green',
      bgColor: 'bg-green-50',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      hoverBorderColor: 'hover:border-green-500',
      hoverTextColor: 'group-hover:text-green-600',
      buttonColor: 'text-green-600',
    },
    {
      title: 'STOK',
      description: 'Hammadde ve malzeme stoklarını kontrol edin.',
      icon: <Package size={24} />,
      path: '/tablo/Stok',
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      hoverBorderColor: 'hover:border-amber-500',
      hoverTextColor: 'group-hover:text-amber-600',
      buttonColor: 'text-amber-600',
    },
    {
      title: 'SatınAlma Siparişleri',
      description: 'Sipariş edilmiş, şirketinize teslim edilmeyi bekleyen ürünler.',
      icon: <ShoppingCart size={24} />,
      path: '/tablo/SatınAlma siparişleri',
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      hoverBorderColor: 'hover:border-purple-500',
      hoverTextColor: 'group-hover:text-purple-600',
      buttonColor: 'text-purple-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Personel Ana Sayfası</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hoş geldiniz, günlük işlemlerinize kolayca erişebilirsiniz.
        </p>
      </div>
      
      {/* Notlar Bölümü */}
      <div className="mb-8 flex justify-start">
        <Notes maxNotes={5} />
      </div>
      
      {/* Yapay Zeka Öne Çıkan Bölüm */}
      <div className="bg-blue-50 overflow-hidden shadow-lg rounded-xl mb-6 border-2 border-blue-300 max-w-3xl mx-auto">
        <div className="px-6 py-6 flex flex-col items-center text-center">
          <div className="rounded-full bg-blue-100 p-6 mb-4 border-4 border-blue-200">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-blue-800 mb-3">Yapay Zeka Asistanı</h2>
          <Link 
            href="https://t.me/Meta_Patron_bot"
            target="_blank"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            BAĞLAN
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCards.map((card, index) => (
          <Link key={index} href={card.path}>
            <div className={`h-full ${card.bgColor} rounded-xl shadow-sm border-2 border-gray-200 ${card.hoverBorderColor} transform hover:-translate-y-1 transition-all duration-300 hover:shadow-lg group p-6 flex flex-col`}>
              <div className="flex items-start mb-4">
                <div className={`p-3 rounded-full ${card.iconBgColor} ${card.iconColor} mr-4 shadow-md`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className={`text-xl font-bold text-gray-900 ${card.hoverTextColor} transition-colors duration-300`}>
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
              </div>
              <p className="text-base text-gray-600 mb-4 flex-grow">
                {card.description}
              </p>
              <div className={`flex items-center ${card.buttonColor} text-base font-medium mt-2`}>
                <span>Görüntüle</span>
                <ArrowRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
} 