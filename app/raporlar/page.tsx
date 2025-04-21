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
    <PageGuard sayfaYolu="/raporlar">
      <DashboardLayout>
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