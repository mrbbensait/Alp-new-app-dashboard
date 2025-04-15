'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getTeslimatGecmisi } from '../../lib/supabase';
import { XIcon, PrinterIcon } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../../lib/supabase';

interface TeslimatGecmisiModalProps {
  isOpen: boolean;
  urunId: number;
  urunAdi: string;
  onClose: () => void;
}

interface TeslimatGecmisi {
  id: number;
  urun_id: number;
  miktar?: number;
  teslimat_miktari?: number;  // Veritabanında bu alan olabilir
  teslim_tarihi?: string;
  kullanici?: string;
  created_at: string;
}

const TeslimatGecmisiModal: React.FC<TeslimatGecmisiModalProps> = ({
  isOpen,
  urunId,
  urunAdi,
  onClose
}) => {
  const [gecmisData, setGecmisData] = useState<TeslimatGecmisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && urunId) {
      loadGecmisData();
    }
  }, [isOpen, urunId]);

  const loadGecmisData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getTeslimatGecmisi(urunId);
      setGecmisData(data || []);
    } catch (err) {
      console.error('Teslimat geçmişi yüklenirken hata:', err);
      setError('Teslimat geçmişi yüklenirken bir hata oluştu');
      setGecmisData([]);
    } finally {
      setLoading(false);
    }
  };

  // Yazdırma işlevi
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Teslimat Geçmişi - ${urunAdi}`,
    onBeforePrint: () => {
      console.log('Yazdırma başlıyor', printRef.current);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Yazdırma tamamlandı');
      return Promise.resolve();
    },
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  } as any);

  // Yazdırma butonuna tıklama işleyicisi
  const onPrintButtonClick = () => {
    console.log('Yazdırma butonu tıklandı', printRef.current);
    if (printRef.current) {
      // requestAnimationFrame kullanarak tarayıcının bir sonraki çizimini bekle
      requestAnimationFrame(() => {
        try {
          handlePrint();
        } catch (err) {
          console.error('Yazdırma işlemi sırasında hata:', err);
        }
      });
    } else {
      console.error('Yazdırılacak içerik bulunamadı (printRef.current null)');
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Teslimat Geçmişi: {urunAdi}
            </h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onPrintButtonClick}
                className="inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PrinterIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                Yazdır
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-white rounded-md p-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div ref={printRef} className="print-content">
              {/* Yazdırma için başlık (sadece yazdırmada görünür) */}
              <div className="hidden print:block print:mb-4">
                <h2 className="text-xl font-bold text-center">Teslimat Geçmişi Raporu</h2>
                <p className="text-center text-gray-600">Ürün: {urunAdi}</p>
                <p className="text-center text-gray-600">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                <hr className="my-4" />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : gecmisData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Bu ürün için teslimat kaydı bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Miktar
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Personel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gecmisData.map((teslimat) => (
                        <tr key={teslimat.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(teslimat.teslim_tarihi || teslimat.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {(teslimat.miktar || teslimat.teslimat_miktari || 0).toLocaleString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teslimat.kullanici || 'Bilinmiyor'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TOPLAM
                        </td>
                        <td className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                          {gecmisData.reduce((sum, item) => sum + (item.miktar || item.teslimat_miktari || 0), 0).toLocaleString('tr-TR')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeslimatGecmisiModal;
