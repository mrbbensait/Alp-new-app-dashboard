'use client';

import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PageGuard from '@/app/components/PageGuard';

export default function ReportsPage() {
  const reportCategories = [
    {
      id: 'uretim',
      title: 'Üretim Raporları',
      reports: [
        { id: 1, name: 'Günlük Üretim Raporu' },
        { id: 2, name: 'Haftalık Üretim Özeti' },
        { id: 3, name: 'Aylık Üretim Analizi' },
      ],
    },
    {
      id: 'stok',
      title: 'Stok Raporları',
      reports: [
        { id: 4, name: 'Kritik Stok Raporu' },
        { id: 5, name: 'Hammadde Kullanım Raporu' },
        { id: 6, name: 'Stok Hareket Raporu' },
      ],
    },
    {
      id: 'musteri',
      title: 'Müşteri Raporları',
      reports: [
        { id: 7, name: 'Müşteri Sipariş Raporu' },
        { id: 8, name: 'Müşteri Bazlı Üretim Raporu' },
      ],
    },
  ];

  return (
    <PageGuard sayfaYolu="/raporlar/genel-raporlar">
      <DashboardLayout>
        {/* Geliştirilmiş Bilgilendirme/Uyarı Kartı */}
        <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-xl border border-blue-500/30">
          <div className="px-6 py-6 relative z-10">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white/90 p-3 rounded-full shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-white tracking-wide">Geliştirme Aşamasında</h3>
                <div className="mt-2 text-white/90">
                  <p className="text-md">
                    Bu modül şu anda aktif geliştirme sürecindedir. Butonlar ve raporlar yakında kullanıma sunulacaktır.
                  </p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-medium bg-white text-blue-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Yakında Kullanıma Açılacak
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dekoratif Daire - Sağ Üst */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/20 -mt-20 -mr-20"></div>
          
          {/* Dekoratif Daire - Sol Alt */}
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-indigo-500/30 -mb-10 -ml-10"></div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Raporlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sistem raporlarını görüntüleyin ve indirin.
          </p>
        </div>

        <div className="space-y-6">
          {reportCategories.map((category) => (
            <div key={category.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {category.title}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {category.reports.map((report) => (
                  <li key={report.id}>
                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                      <div className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {report.name}
                      </div>
                      <div className="flex">
                        <button
                          type="button"
                          className="mr-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Görüntüle
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          İndir
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </PageGuard>
  );
} 