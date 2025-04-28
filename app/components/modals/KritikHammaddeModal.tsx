'use client';

import React, { useState, useEffect } from 'react';
import { fetchFilteredData, fetchAllFromTable } from '../../lib/supabase';

interface KritikHammaddeModalProps {
  isOpen: boolean;
  onClose: () => void;
  receteAdi: string;
}

interface StokItem {
  id: number;
  'Hammadde Adı': string;
  'Mevcut Stok': number;
  'Rezerve Edildi': number;
  'Net Stok': number;
  'Birim': string;
  'Kritik Stok': number;
  'Stok Kategori': string;
}

interface FormulasyonItem {
  id: number;
  'Hammadde Adı': string;
  'Oran(100Kg)': number;
  'Reçete Adı': string;
  'Stok Kategori'?: string;
}

const KritikHammaddeModal: React.FC<KritikHammaddeModalProps> = ({
  isOpen,
  onClose,
  receteAdi
}) => {
  const [loading, setLoading] = useState(true);
  const [kritikHammaddeler, setKritikHammaddeler] = useState<{
    hammadde: string;
    netStok: number;
    kritikStok: number;
    birim: string;
    kategori: string;
    oran: number;
  }[]>([]);

  useEffect(() => {
    const fetchKritikHammaddeler = async () => {
      if (!isOpen || !receteAdi) return;

      setLoading(true);
      try {
        // Reçeteye ait formülasyon verilerini getir
        const formulasyonlar = await fetchFilteredData('Formülasyonlar', 'Reçete Adı', receteAdi, true);
        
        // Tüm stok verilerini getir
        const stokVerileri = await fetchAllFromTable('Stok', true);
        
        // Kritik seviyenin altında olan hammaddeleri bul
        const kritikOlanlar = formulasyonlar
          .map((formul: FormulasyonItem) => {
            const hammaddeAdi = formul['Hammadde Adı'];
            const stokItem = stokVerileri.find((s: StokItem) => s['Hammadde Adı'] === hammaddeAdi);
            
            if (stokItem) {
              const netStok = stokItem['Net Stok'] || (stokItem['Mevcut Stok'] - (stokItem['Rezerve Edildi'] || 0));
              const kritikStok = stokItem['Kritik Stok'] || 0;
              
              // Net stok, kritik stok değerinin altındaysa listeye ekle
              if (netStok < kritikStok) {
                return {
                  hammadde: hammaddeAdi,
                  netStok: netStok,
                  kritikStok: kritikStok,
                  birim: stokItem['Birim'] || 'Kg',
                  kategori: stokItem['Stok Kategori'] || 'Belirtilmemiş',
                  oran: formul['Oran(100Kg)'] || 0
                };
              }
            }
            return null;
          })
          .filter((item: any) => item !== null);
        
        setKritikHammaddeler(kritikOlanlar as any);
      } catch (err) {
        console.error('Kritik hammadde verileri yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKritikHammaddeler();
  }, [isOpen, receteAdi]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-xl mx-auto p-4 shadow-xl w-full">
        <div className="absolute top-0 right-0 pt-3 pr-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-3">
          <div className="flex items-center justify-center mb-2">
            <svg className="h-10 w-10 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-lg leading-6 font-medium text-red-600 mb-1">KRİTİK STOK UYARISI</h3>
          <h4 className="text-base font-semibold text-gray-900">{receteAdi}</h4>
          <p className="mt-1 text-xs text-gray-500">
            Bu reçete için aşağıdaki hammaddelerin stok seviyesi kritik seviyenin altında!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : kritikHammaddeler.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-gray-500">Kritik seviyede hammadde bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-2 py-1.5 text-left font-medium text-gray-700 border-b">Hammadde</th>
                  <th scope="col" className="px-2 py-1.5 text-left font-medium text-gray-700 border-b">Kategori</th>
                  <th scope="col" className="px-2 py-1.5 text-left font-medium text-gray-700 border-b">Oran</th>
                  <th scope="col" className="px-2 py-1.5 text-left font-medium text-gray-700 border-b">Net Stok</th>
                  <th scope="col" className="px-2 py-1.5 text-left font-medium text-gray-700 border-b">Kritik Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {kritikHammaddeler.map((item, index) => (
                  <tr key={index} className="hover:bg-red-50">
                    <td className="px-2 py-1.5 text-xs text-gray-900 font-medium border-b border-gray-200">{item.hammadde}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-500 border-b border-gray-200">{item.kategori}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-500 border-b border-gray-200">{item.oran.toFixed(2)} {item.birim}</td>
                    <td className="px-2 py-1.5 text-xs text-red-600 font-medium border-b border-gray-200">{item.netStok.toFixed(2)} {item.birim}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-500 border-b border-gray-200">{item.kritikStok.toFixed(2)} {item.birim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default KritikHammaddeModal; 