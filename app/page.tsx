'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from './components/DashboardLayout';
import { tables } from './data/schema';
import { fetchAllFromTable, subscribeToTable, unsubscribeFromChannel } from './lib/supabase';

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
              <span className="text-sm font-medium text-gray-700">Stok Yönetimi</span>
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
              href="/tablo/Müşteriler"
              className="flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-yellow-200 p-3 mb-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Müşteriler</span>
            </Link>
          </div>
          
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link 
              href="/uretim-kuyrugu-personel"
              className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition duration-300"
            >
              <div className="rounded-full bg-purple-200 p-3 mb-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Üretim Kuyruğu Personel</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 