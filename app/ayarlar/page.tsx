'use client';

import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900 whitespace-normal sm:whitespace-nowrap">Ayarlar</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-md">
            Sistem ayarlarını bu sayfadan yönetebilirsiniz.
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          <li>
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Kullanıcı Ayarları
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Kullanıcı bilgilerinizi ve tercihlerinizi yönetin.
                </p>
              </div>
            </div>
          </li>
          <li>
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Sistem Ayarları
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Sistem yapılandırma seçenekleri.
                </p>
              </div>
            </div>
          </li>
          <li>
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Bildirim Ayarları
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Bildirim tercihlerinizi yönetin.
                </p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </DashboardLayout>
  );
} 