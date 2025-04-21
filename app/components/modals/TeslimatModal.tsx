'use client';

import React, { useState } from 'react';

interface TeslimatModalProps {
  isOpen: boolean;
  urunAdi: string;
  onConfirm: (teslimatMiktari: number, teslimEden: string, teslimatSekli: string) => void;
  onCancel: () => void;
  isUpdating: boolean;
  kullaniciAdSoyad?: string; // Mevcut kullanıcının adı
}

const TeslimatModal: React.FC<TeslimatModalProps> = ({ 
  isOpen, 
  urunAdi, 
  onConfirm, 
  onCancel, 
  isUpdating,
  kullaniciAdSoyad = ''
}) => {
  const [teslimatMiktari, setTeslimatMiktari] = useState<string>('');
  const [teslimEden, setTeslimEden] = useState<string>(kullaniciAdSoyad);
  const [teslimatSekli, setTeslimatSekli] = useState<string>('Elden');
  const [hataVar, setHataVar] = useState<boolean>(false);
  
  if (!isOpen) return null;
  
  const handleMiktarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Sadece sayılara izin ver
      setTeslimatMiktari(value);
      setHataVar(false);
    }
  };

  const handleTeslimEdenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeslimEden(e.target.value);
  };

  const handleTeslimatSekliChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeslimatSekli(e.target.value);
  };
  
  const handleSubmit = () => {
    const miktar = Number(teslimatMiktari);
    
    if (!teslimatMiktari || miktar <= 0) {
      setHataVar(true);
      return;
    }
    
    onConfirm(miktar, teslimEden, teslimatSekli);
    setTeslimatMiktari('');
  };
  
  const handleCancel = () => {
    setTeslimatMiktari('');
    setTeslimEden(kullaniciAdSoyad);
    setTeslimatSekli('Elden');
    setHataVar(false);
    onCancel();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Teslimat Girişi</h3>
          
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-3">
              Aşağıdaki ürün için teslimat miktarı giriniz:
            </p>
            <div className="bg-indigo-50 py-3 px-4 rounded-md border border-indigo-200">
              <span className="font-bold text-lg text-indigo-700">{urunAdi}</span>
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="teslimatMiktari" className="sr-only">Teslimat Miktarı</label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                name="teslimatMiktari"
                id="teslimatMiktari"
                autoFocus
                className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full px-4 py-3 sm:text-sm border ${hataVar ? 'border-red-500' : 'border-gray-300'} rounded-md text-center text-lg`}
                placeholder="Teslimat miktarı girin"
                value={teslimatMiktari}
                onChange={handleMiktarChange}
                disabled={isUpdating}
              />
            </div>
            {hataVar && (
              <p className="mt-2 text-sm text-red-600">
                Lütfen geçerli bir teslimat miktarı girin
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="teslimEden" className="block text-left text-sm font-medium text-gray-700 mb-1">Teslim Eden</label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                name="teslimEden"
                id="teslimEden"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full px-4 py-2 sm:text-sm border border-gray-300 rounded-md"
                placeholder="Teslim eden kişi"
                value={teslimEden}
                onChange={handleTeslimEdenChange}
                disabled={isUpdating}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">Teslimat Şekli</label>
            <div className="flex justify-between space-x-2">
              <div className="flex-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="teslimatSekli"
                    value="Elden"
                    checked={teslimatSekli === 'Elden'}
                    onChange={handleTeslimatSekliChange}
                    disabled={isUpdating}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Elden</span>
                </label>
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="teslimatSekli"
                    value="Kargo"
                    checked={teslimatSekli === 'Kargo'}
                    onChange={handleTeslimatSekliChange}
                    disabled={isUpdating}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Kargo</span>
                </label>
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="teslimatSekli"
                    value="Ambar"
                    checked={teslimatSekli === 'Ambar'}
                    onChange={handleTeslimatSekliChange}
                    disabled={isUpdating}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ambar</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              className="w-full sm:col-start-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </span>
              ) : (
                'Teslimatı Kaydet'
              )}
            </button>
            <button
              type="button"
              className="mt-3 sm:mt-0 sm:col-start-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeslimatModal;
