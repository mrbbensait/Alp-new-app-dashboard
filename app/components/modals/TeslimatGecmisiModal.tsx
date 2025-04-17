'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getTeslimatGecmisi } from '../../lib/supabase';
import { PrinterIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TeslimatGecmisiModalProps {
  isOpen: boolean;
  urunId: number;
  urunAdi: string;
  onClose: () => void;
  musteri?: string;
  ambalaj?: string;
  stok?: number;
  kalanAdet?: number;
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
  onClose,
  musteri = 'Belirtilmemiş',
  ambalaj = 'Belirtilmemiş',
  stok = 0,
  kalanAdet = 0
}) => {
  const [gecmisData, setGecmisData] = useState<TeslimatGecmisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPDFView, setShowPDFView] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

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

  // Yazdır butonuna basınca çağrılan fonksiyon
  const handlePrint = () => {
    const contentToPrint = pdfContentRef.current;
    if (!contentToPrint) {
      toast.error('Yazdırılacak içerik bulunamadı');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.overflow = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.error('Iframe dokümanı oluşturulamadı');
      document.body.removeChild(iframe);
      toast.error('Yazdırma için geçici alan oluşturulamadı');
      return;
    }

    // Ana dokümandaki tüm stilleri ve linkleri al
    const headStyles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
                           .map(el => el.outerHTML)
                           .join('\n');
                           
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teslimat Geçmişi - ${urunAdi}</title> 
        <meta charset="UTF-8">
        ${headStyles}
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
          body { 
            margin: 0; 
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .urun-bilgileri {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #f9f9f9;
          }
          .urun-bilgileri table {
            width: 100%;
            margin-bottom: 0;
          }
          .urun-bilgileri th {
            text-align: left;
            width: 150px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-align: left;
          }
          .print-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Teslimat Geçmişi Raporu</h1>
          <p>Reçete Adı: ${urunAdi}</p>
          <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        <div class="urun-bilgileri">
          <table>
            <tr>
              <th>Reçete Adı:</th>
              <td>${urunAdi}</td>
              <th>Müşteri:</th>
              <td>${musteri}</td>
            </tr>
            <tr>
              <th>Ambalaj:</th>
              <td>${ambalaj}</td>
              <th>Stok / Adet:</th>
              <td>${stok}</td>
            </tr>
            <tr>
              <th>Kalan Adet:</th>
              <td>${kalanAdet}</td>
              <th></th>
              <td></td>
            </tr>
          </table>
        </div>
        ${contentToPrint.outerHTML}
        <div class="print-footer">
          <p>© ${new Date().getFullYear()} - META PHARMA</p>
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Yazdırma hatası:', e);
        toast.error('Yazdırma sırasında bir hata oluştu');
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 500); 
      }
    }, 500);
  };

  if (!isOpen) return null;

  // PDF görünümü
  if (showPDFView) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full h-[95vh] flex flex-col">
          <div className="flex justify-between items-center p-3 border-b no-print bg-gray-50 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-700">Yazdırma Önizleme: {urunAdi}</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PrinterIcon className="h-4 w-4 mr-1 inline" />
                Yazdır / PDF Olarak Kaydet
              </button>
              <button 
                onClick={() => setShowPDFView(false)}
                className="text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md p-1 inline-flex items-center"
                aria-label="Kapat"
              >
                <span className="text-sm mr-1">Geri</span> 
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
            <div className="flex justify-center">
              <div className="bg-white p-8 shadow-md max-w-4xl w-full">
                <div className="print-header text-center mb-6">
                  <h2 className="text-xl font-bold">Teslimat Geçmişi Raporu</h2>
                  <p className="text-gray-600">Reçete Adı: {urunAdi}</p>
                  <p className="text-gray-600">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                  <hr className="my-4" />
                </div>
                
                {/* Ürün Bilgileri */}
                <div className="mb-6 border border-gray-200 p-4 bg-gray-50 rounded">
                  <h3 className="text-lg font-semibold mb-2">Reçete Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><span className="font-semibold">Reçete Adı:</span> {urunAdi}</p>
                      <p><span className="font-semibold">Ambalaj:</span> {ambalaj}</p>
                      <p><span className="font-semibold">Kalan Adet:</span> {kalanAdet}</p>
                    </div>
                    <div>
                      <p><span className="font-semibold">Müşteri:</span> {musteri}</p>
                      <p><span className="font-semibold">Stok / Adet:</span> {stok}</p>
                    </div>
                  </div>
                </div>
                
                <div ref={pdfContentRef}>
                  <table className="min-w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Tarih</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Miktar</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Personel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gecmisData.map((teslimat) => (
                        <tr key={teslimat.id}>
                          <td className="border border-gray-300 px-4 py-2">
                            {formatDate(teslimat.teslim_tarihi || teslimat.created_at)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {(teslimat.miktar || teslimat.teslimat_miktari || 0).toLocaleString('tr-TR')}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {teslimat.kullanici || 'Bilinmiyor'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td className="border border-gray-300 px-4 py-2 font-bold">TOPLAM</td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                          {gecmisData.reduce((sum, item) => sum + (item.miktar || item.teslimat_miktari || 0), 0).toLocaleString('tr-TR')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="print-footer text-center mt-6 text-sm text-gray-500">
                  <p>© {new Date().getFullYear()} - META PHARMA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ana teslimat geçmişi görünümü
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Ana Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Teslimat Geçmişi: {urunAdi}
            </h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (gecmisData.length === 0) {
                    toast.error('Yazdırılacak veri bulunamadı');
                    return;
                  }
                  setShowPDFView(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading || gecmisData.length === 0}
              >
                <PrinterIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Yazdır
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Reçete Bilgileri */}
          <div className="bg-white px-4 pt-5 pb-0">
            <div className="mb-4 border border-gray-200 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Reçete Bilgileri:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><span className="font-medium">Reçete Adı:</span> {urunAdi}</div>
                <div><span className="font-medium">Müşteri:</span> {musteri}</div>
                <div><span className="font-medium">Ambalaj:</span> {ambalaj}</div>
                <div><span className="font-medium">Stok / Adet:</span> {stok}</div>
                <div><span className="font-medium">Kalan Adet:</span> {kalanAdet}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-0 pb-4 sm:p-6 sm:pb-4">
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
                <p className="text-gray-500">Bu reçete için teslimat kaydı bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Tarih
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Miktar
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Personel
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gecmisData.map((teslimat) => (
                      <tr key={teslimat.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                          {formatDate(teslimat.teslim_tarihi || teslimat.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right border border-gray-200">
                          {(teslimat.miktar || teslimat.teslimat_miktari || 0).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                          {teslimat.kullanici || 'Bilinmiyor'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        TOPLAM
                      </td>
                      <td className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider border border-gray-200">
                        {gecmisData.reduce((sum, item) => sum + (item.miktar || item.teslimat_miktari || 0), 0).toLocaleString('tr-TR')}
                      </td>
                      <td className="border border-gray-200"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
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
