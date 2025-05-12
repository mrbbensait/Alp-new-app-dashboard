'use client';

import React, { useState, useEffect } from 'react';
import { 
  getFormulasyonByReceteAdi, 
  generateUretimNo, 
  formatTarih
} from '../../lib/formulasyonService';
import UretimEmriPDF from '../UretimEmriPDF';
import KaliteKontrolPDF from '../KaliteKontrolPDF';

// UretimEmriPDF komponentinden Hammadde tipini kullanıyoruz
interface Hammadde {
  'Hammadde Adı': string;
  'Oran(100Kg)': number;
  'Miktar': number;
  'Stok Kategori'?: string;
}

interface UretimEmriModalProps {
  isOpen: boolean;
  onClose: () => void;
  receteAdi: string;
  uretimMiktari: number;
  uretimTarihi?: string;
  ambalajEmri?: number; // Ambalaj emri (ml) değeri, opsiyonel
  uretimId?: number; // Üretim Kuyruğu tablosundaki ID, opsiyonel
  musteri?: string; // Müşteri bilgisi, opsiyonel
}

const UretimEmriModal: React.FC<UretimEmriModalProps> = ({
  isOpen,
  onClose,
  receteAdi,
  uretimMiktari,
  uretimTarihi: gelenUretimTarihi,
  ambalajEmri,
  uretimId,
  musteri
}) => {
  console.log('UretimEmriModal render:', { isOpen, receteAdi, uretimMiktari, gelenUretimTarihi, ambalajEmri, uretimId, musteri });

  const [hammaddeler, setHammaddeler] = useState<Hammadde[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uretimNo, setUretimNo] = useState<string>('');
  const [uretimTarihi, setUretimTarihi] = useState<string>('');
  const [showPDF, setShowPDF] = useState(false);
  
  useEffect(() => {
    if (isOpen && receteAdi) {
      console.log('UretimEmriModal açıldı, veri yükleniyor');
      loadFormulasyon();
      setUretimNo(generateUretimNo(uretimId));
      setUretimTarihi(gelenUretimTarihi || formatTarih());
    }
  }, [isOpen, receteAdi, uretimMiktari, gelenUretimTarihi, uretimId]);

  const loadFormulasyon = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Formülasyon verileri yükleniyor:', receteAdi, uretimMiktari, 'Ambalaj Emri:', ambalajEmri);
      const formulasyonVerileri = await getFormulasyonByReceteAdi(receteAdi, uretimMiktari, true, ambalajEmri);
      console.log('Formülasyon verileri yüklendi:', formulasyonVerileri);
      
      // Miktar undefined olabileceği için varsayılan değer ekleyelim
      const formatlanmisVeriler: Hammadde[] = formulasyonVerileri.map(item => ({
        'Hammadde Adı': item['Hammadde Adı'],
        'Oran(100Kg)': item['Oran(100Kg)'],
        'Miktar': item['Miktar'] || 0,
        'Stok Kategori': item['Stok Kategori'] || ''
      }));
      setHammaddeler(formatlanmisVeriler);
    } catch (error) {
      console.error('Formülasyon yüklenirken hata oluştu:', error);
      setError('Formülasyon verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // handlePrint fonksiyonu güncellendi
  const handlePrint = () => {
    const contentToPrint = document.getElementById('uretim-emri-pdf-content');
    const kaliteKontrolContent = document.getElementById('kalite-kontrol-pdf-content');
    
    if (!contentToPrint || !kaliteKontrolContent) {
      console.error('Yazdırılacak içerik bulunamadı.');
      alert('Yazdırma işlemi başlatılamadı. Lütfen tekrar deneyin.');
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
      console.error('Iframe dokümanı oluşturulamadı.');
      document.body.removeChild(iframe);
      alert('Yazdırma için geçici alan oluşturulamadı.');
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
        <title>Üretim Emri - ${receteAdi}</title> 
        <meta charset="UTF-8">
        ${headStyles}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
           /* iframe için ek veya override stiller */
           body { margin: 0; }
           @page {
             size: A4;
             margin: 10mm;
           }
           /* Sayfayı tek sayfada tutmak için */
           .print-container {
             page-break-inside: avoid !important;
             min-height: auto !important;
           }
           /* İkinci sayfa için sayfa kırılımı */
           .page-break {
             page-break-before: always !important;
           }
           /* Her sayfanın kendi içinde tek sayfa olmasını sağla */
           #uretim-emri-pdf-content, #kalite-kontrol-pdf-content {
             width: 210mm !important;
             max-height: 297mm !important;
             overflow: hidden !important;
           }
           /* Yazdırma sırasında gizlenecek öğeler */
           .no-print {
             display: none !important;
           }
           /* Kalite Kontrol PDF'i için özel stiller */
           #kalite-kontrol-pdf-content * {
             font-size: 9pt !important;
           }
           #kalite-kontrol-pdf-content .text-xs {
             font-size: 8pt !important;
           }
           ${document.getElementById('print-styles')?.innerHTML || ''}
           ${document.getElementById('print-styles-kalite')?.innerHTML || ''} 
        </style>
      </head>
      <body>
        <div class="print-container">
          ${contentToPrint.outerHTML}
        </div>
        <div class="page-break"></div>
        <div class="print-container">
          ${kaliteKontrolContent.outerHTML}
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
        alert('Yazdırma sırasında bir hata oluştu.');
      } finally {
        setTimeout(() => {
             if (document.body.contains(iframe)) {
                 document.body.removeChild(iframe);
             }
        }, 500); 
      }
    }, 500);
  };

  if (!isOpen) {
    console.log('UretimEmriModal kapalı, null döndürülüyor');
    return null;
  }

  if (showPDF) {
    return (
      <div 
        id="uretım-emri-modal-wrapper" 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full h-[95vh] flex flex-col">
          <div className="flex justify-between items-center p-3 border-b no-print bg-gray-50 rounded-t-lg sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-700">Üretim Emri - {receteAdi}</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Yazdır / PDF Olarak Kaydet
              </button>
              <button 
                onClick={() => setShowPDF(false)}
                className="text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md p-1 inline-flex items-center"
                aria-label="Kapat"
              >
                <span className="text-sm mr-1">Geri</span> 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
            <div className="flex flex-col items-center gap-8">
              {/* Üretim Emri Sayfası */}
              <div className="border-b border-gray-300 pb-8 w-full flex justify-center">
                <UretimEmriPDF 
                  receteAdi={receteAdi}
                  uretimNo={uretimNo}
                  uretimTarihi={uretimTarihi}
                  uretimMiktari={uretimMiktari}
                  hammaddeler={hammaddeler}
                />
              </div>
              
              {/* Sayfa Ayrıcı */}
              <div className="w-full flex items-center justify-center py-2">
                <div className="flex items-center justify-center bg-gray-200 rounded-lg px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Kalite Kontrol Formu</span>
                </div>
              </div>
              
              {/* Kalite Kontrol Formu Sayfası */}
              <div className="pt-4 w-full flex justify-center">
                <KaliteKontrolPDF 
                  urunAdi={receteAdi}
                  uretimNo={uretimNo}
                  uretimTarihi={uretimTarihi}
                  urunSahibi={musteri}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b sticky top-0 z-10 bg-white rounded-t-lg">
          <h2 className="text-lg font-semibold">Üretim Emri Hazırla - {receteAdi}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-xs">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Üretim No</label>
                  <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-xs">
                    {uretimNo}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Üretim Tarihi</label>
                  <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-xs">
                    {uretimTarihi}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700">Üretim Miktarı (kg)</label>
                <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-xs">
                  {uretimMiktari}
                </div>
              </div>
              
              <h3 className="font-medium text-sm mt-4 mb-2">Hammadde Listesi:</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Hammadde Adı</th>
                      <th className="px-2 py-1 text-center text-xs font-medium text-gray-700">Stok Kategori</th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-700">Oran (100Kg)</th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-700">Miktar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hammaddeler.map((hammadde, index) => (
                      <tr key={index} className="border-t border-gray-300">
                        <td className="px-2 py-1 text-xs">{hammadde['Hammadde Adı']}</td>
                        <td className="px-2 py-1 text-xs text-center">{hammadde['Stok Kategori'] || '-'}</td>
                        <td className="px-2 py-1 text-xs text-right">{hammadde['Oran(100Kg)'].toFixed(2)}</td>
                        <td className="px-2 py-1 text-xs text-right">{hammadde['Miktar'].toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-2 flex justify-end gap-3 border-t sticky bottom-0 z-10 rounded-b-lg">
          <button
            onClick={onClose}
            className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Kapat
          </button>
          <button
            onClick={() => setShowPDF(true)}
            disabled={loading || !!error}
            className="py-1 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Üretim Emri Göster
          </button>
        </div>
      </div>
    </div>
  );
};

export default UretimEmriModal; 