'use client';

import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { Users, UserPlus, Settings, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

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

      {/* Hızlı Erişim Kartları */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Kullanıcı Yönetimi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Kullanıcı Listesi Kartı */}
          <Link href="/formlar/kullanici-listesi">
            <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg p-5 border border-gray-200 hover:border-blue-500 group cursor-pointer">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3 group-hover:bg-blue-200 transition-colors duration-300">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Kullanıcı Listesi</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Sistemdeki tüm kullanıcıları görüntüleyin, yönetin ve düzenleyin.</p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Kullanıcıları Görüntüle</span>
                <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* Kullanıcı Ekle Kartı */}
          <Link href="/formlar/kullanici-kaydi">
            <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg p-5 border border-gray-200 hover:border-green-500 group cursor-pointer">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3 group-hover:bg-green-200 transition-colors duration-300">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-300">Kullanıcı Ekle</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Sisteme yeni kullanıcı ekleyin ve gerekli yetkileri atayın.</p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <span>Yeni Kullanıcı Ekle</span>
                <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
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