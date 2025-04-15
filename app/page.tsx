'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from './components/DashboardLayout';
import { tables } from './data/schema';
import { fetchAllFromTable, subscribeToTable, unsubscribeFromChannel } from './lib/supabase';
import { Brain } from 'lucide-react';

export default function Home() {
  
  return (
    <DashboardLayout>
      {/* Hoşgeldiniz Başlık */}
      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white">Hoş Geldiniz</h1>
          <p className="text-lg text-white opacity-90 mt-2">
            AlpLeo Ai Tam Entegre Yapay Zeka Stok ve Üretim Yönetimi sistemine hoş geldiniz.
          </p>
        </div>
      </div>

      {/* Yapay Zeka Öne Çıkan Bölüm */}
      <div className="bg-blue-50 overflow-hidden shadow-lg rounded-xl mb-6 border-2 border-blue-300 max-w-3xl mx-auto">
        <div className="px-6 py-6 flex flex-col items-center text-center">
          <div className="rounded-full bg-blue-100 p-6 mb-4 border-4 border-blue-200">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-blue-800 mb-3">Yapay Zeka Asistanı</h2>
          <p className="text-blue-700 mb-4">
            Şirketinize tam entegre olmuş ve sizin şirketinize özel olarak eğitilmiş YAPAY ZEKA asistanınıza hemen bağlanın ve şirketinizi yönetin!
          </p>
          <Link 
            href="https://t.me/Meta_Patron_bot"
            target="_blank"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            BAĞLAN
          </Link>
        </div>
      </div>

      {/* Hızlı Erişim Linkleri */}
      <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
        <div className="px-4 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Hızlı Erişim</h2>
        </div>
        <div className="px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link 
              href="/tablo/Üretim Kuyruğu"
              className="flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-indigo-200 p-3 mb-3">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Üretim Kuyruğu</span>
            </Link>
            
            <Link 
              href="/tablo/Stok"
              className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-green-200 p-3 mb-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">STOK</span>
            </Link>
            
            <Link 
              href="/tablo/Reçeteler"
              className="flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-red-200 p-3 mb-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Reçeteler</span>
            </Link>
            
            <Link 
              href="/raporlar/personel-performans"
              className="flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-yellow-200 p-3 mb-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Personel Performans</span>
            </Link>
          </div>
          
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link 
              href="/tablo/SatınAlma siparişleri"
              className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-purple-200 p-3 mb-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">SatınAlma Siparişleri</span>
            </Link>

            <Link 
              href="/tablo/Bitmiş Ürün Stoğu"
              className="flex flex-col items-center justify-center bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-teal-200 p-3 mb-3">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Bitmiş Ürün Stoğu</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 