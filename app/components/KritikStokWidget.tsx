'use client';

import React, { useState, useEffect } from 'react';
import { fetchAllFromTable } from '../lib/supabase';

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

type SortField = 'Hammadde Adı' | 'Rezerve Edildi';
type SortDirection = 'asc' | 'desc';

export default function KritikStokWidget() {
  const [stokVerileri, setStokVerileri] = useState<StokItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('Rezerve Edildi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const stokVerileriniGetir = async () => {
      setLoading(true);
      try {
        const data = await fetchAllFromTable('Stok', true);
        setStokVerileri(data as StokItem[]);
        setError(null);
      } catch (err) {
        console.error('Stok verileri yüklenirken hata:', err);
        setError('Stok verileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    stokVerileriniGetir();
  }, []);

  // Rezerve edilmiş stokları filtrele
  const rezerveEdilmisUrunler = stokVerileri.filter(
    (item) => item['Rezerve Edildi'] > 0
  );

  // Sıralama fonksiyonu
  const sortItems = (items: StokItem[]) => {
    // Önce kritik olanlar ve olmayanlar olarak ayır
    const kritikItems: StokItem[] = [];
    const normalItems: StokItem[] = [];
    
    items.forEach(item => {
      const netStok = item['Net Stok'] || (item['Mevcut Stok'] - (item['Rezerve Edildi'] || 0));
      if (netStok < (item['Kritik Stok'] || 0)) {
        kritikItems.push(item);
      } else {
        normalItems.push(item);
      }
    });
    
    // Her bir grubu kendi içinde sırala
    const sortFunction = (a: StokItem, b: StokItem) => {
      if (sortField === 'Hammadde Adı') {
        return sortDirection === 'asc' 
          ? a['Hammadde Adı'].localeCompare(b['Hammadde Adı'])
          : b['Hammadde Adı'].localeCompare(a['Hammadde Adı']);
      } else {
        return sortDirection === 'asc' 
          ? a['Rezerve Edildi'] - b['Rezerve Edildi']
          : b['Rezerve Edildi'] - a['Rezerve Edildi'];
      }
    };
    
    kritikItems.sort(sortFunction);
    normalItems.sort(sortFunction);
    
    // Kritik olanlar her zaman üstte
    return [...kritikItems, ...normalItems];
  };
  
  // Sıralama yönünü değiştir
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Aynı alana tekrar tıklandığında sıralama yönünü değiştir
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Farklı bir alana tıklandığında o alanı aktif yap
      setSortField(field);
      setSortDirection('desc'); // Yeni sıralama alanında başlangıç yönü
    }
  };

  // Sıralı ürünleri hazırla
  const sortedItems = sortItems(rezerveEdilmisUrunler);

  // Tablo görünümünü oluşturan fonksiyon
  const renderTablo = (items: StokItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Rezerve edilmiş ürün bulunmuyor.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('Hammadde Adı')}
              >
                Hammadde Adı
                {sortField === 'Hammadde Adı' && (
                  <span key="sort-hammadde" className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Birim
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mevcut Stok
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('Rezerve Edildi')}
              >
                Rezerve Stok
                {sortField === 'Rezerve Edildi' && (
                  <span key="sort-rezerve" className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kritik Stok
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Stok
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => {
              const netStok = item['Net Stok'] || (item['Mevcut Stok'] - (item['Rezerve Edildi'] || 0));
              const isKritik = netStok < (item['Kritik Stok'] || 0);
              
              // Kritik ürünler grubu ile normal ürünler grubu arasına boşluk ekle
              const isLastKritik = isKritik && 
                (index + 1 < items.length && !(items[index + 1]['Mevcut Stok'] - items[index + 1]['Rezerve Edildi'] < items[index + 1]['Kritik Stok']));
              
              return [
                <tr key={`row-${item.id}`} className={isKritik ? 'bg-red-50' : ''}>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${isKritik ? 'text-red-700' : ''}`}>
                    {item['Hammadde Adı']}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm ${isKritik ? 'text-red-700' : ''}`}>
                    {item['Birim']}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm ${isKritik ? 'text-red-700' : ''}`}>
                    {item['Mevcut Stok']?.toFixed(2) || '0.00'}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${isKritik ? 'text-red-700' : 'text-blue-600'}`}>
                    {item['Rezerve Edildi']?.toFixed(2) || '0.00'}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm ${isKritik ? 'text-red-700' : ''}`}>
                    {item['Kritik Stok']?.toFixed(2) || '0.00'}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-bold ${isKritik ? 'text-red-700' : ''}`}>
                    {netStok?.toFixed(2) || '0.00'}
                  </td>
                </tr>,
                isLastKritik && (
                  <tr key={`divider-${item.id}`} className="h-3 bg-gray-50">
                    <td colSpan={6} className="border-b border-gray-300"></td>
                  </tr>
                )
              ].filter(Boolean);
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-64 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-500">Stok bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center text-red-500 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-blue-50 px-4 py-2 border-b">
        <h3 className="text-sm font-medium text-blue-600">
          Rezerve Edilen Stoklar ({rezerveEdilmisUrunler.length})
        </h3>
      </div>

      <div className="p-0 h-80 overflow-y-auto"> {/* Yükseklik 64'ten 80'e artırıldı (%25 artış) */}
        {renderTablo(sortedItems)}
      </div>
    </div>
  );
} 