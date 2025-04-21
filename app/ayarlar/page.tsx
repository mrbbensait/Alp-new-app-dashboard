'use client';

import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { Users, UserPlus, Settings, ArrowRight, Layers, ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import PageGuard from '../components/PageGuard';

export default function AyarlarPage() {
  const { user } = useAuth();

  return (
    <PageGuard sayfaYolu="/ayarlar">
      <DashboardLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Sistem Ayarları</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/ayarlar/rol-yonetimi" 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start"
            >
              <div className="mr-4 bg-indigo-100 rounded-lg p-3">
                <ShieldAlert size={30} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Rol Yönetimi</h2>
                <p className="text-gray-600">Kullanıcı rollerini ve yetkilerini düzenleyin</p>
              </div>
            </Link>
            
            <Link 
              href="/formlar/kullanici-listesi" 
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start"
            >
              <div className="mr-4 bg-blue-100 rounded-lg p-3">
                <Users size={30} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Kullanıcı Yönetimi</h2>
                <p className="text-gray-600">Sistem kullanıcılarını yönetin</p>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
} 