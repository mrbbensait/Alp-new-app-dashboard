'use client';

import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';

interface KaliteKontrolPDFProps {
  urunAdi: string;
  uretimNo: string;
  uretimTarihi: string;
  urunSahibi?: string;
}

const KaliteKontrolPDF: React.FC<KaliteKontrolPDFProps> = ({
  urunAdi,
  uretimNo,
  uretimTarihi,
  urunSahibi = 'Purexpert Kozmetik'
}) => {
  // Bugünün tarihini formatlayarak kullan
  const bugun = format(new Date(), 'dd/MM/yy');
  
  // İçerik referansı
  const contentRef = useRef<HTMLDivElement>(null);

  // Yazdırma stilleri için useEffect
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'print-styles-kalite';
    style.innerHTML = `
      @media print {
        #kalite-kontrol-pdf-content {
          padding: 0 !important;
          margin: 0 !important;
          width: 210mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
        }
        #kalite-kontrol-pdf-content * {
          font-size: 9pt !important;
        }
        #kalite-kontrol-pdf-content .font-bold {
          font-weight: bold !important;
        }
        #kalite-kontrol-pdf-content h1, 
        #kalite-kontrol-pdf-content h2,
        #kalite-kontrol-pdf-content .text-xl {
          font-size: 11pt !important;
        }
        #kalite-kontrol-pdf-content .text-xs {
          font-size: 8pt !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const printStyles = document.getElementById('print-styles-kalite');
      if (printStyles) {
        printStyles.remove();
      }
    };
  }, []);
  
  return (
    <div 
      id="kalite-kontrol-pdf-content" 
      ref={contentRef}
      className="w-[210mm] bg-white p-0 border border-black shadow-lg print:shadow-none print-container"
    >
      <div className="border-collapse w-full">
        {/* Başlık Satırı */}
        <div className="flex border-b border-black">
          <div className="w-1/4 border-r border-black p-1">
            <div className="flex items-center justify-center h-14">
              {/* Meta Pharma Logo - img tag kullanımı */}
              <img 
                src="/images/meta-logo.png" 
                alt="Meta Pharma Logo" 
                className="h-12 object-contain"
              />
            </div>
          </div>
          <div className="w-1/2 border-r border-black p-1">
            <div className="text-center font-bold text-xl flex items-center justify-center h-14">
              KALİTE KONTROL FORMU
            </div>
          </div>
          <div className="w-1/4 p-1">
            <div className="text-xs">
              <div className="border-b border-black p-1">Doküman Kodu : F45/KYB/00</div>
              <div className="border-b border-black p-1">Yürürlük Tarihi : 01.01.2018</div>
              <div className="border-b border-black p-1">Revizyon Tarihi / No : 29.01.2024-1</div>
              <div className="p-1">Sayfa 1/1</div>
            </div>
          </div>
        </div>
        
        {/* Birim/Bölüm Satırı */}
        <div className="flex border-b border-black">
          <div className="w-1/4 border-r border-black p-1">
            <div className="font-bold">BİRİM/BÖLÜM</div>
          </div>
          <div className="w-3/4 p-1">
            <div className="text-xs">META PHARMA KOZMETİK GIDA VET. KİM. ÜR. İMAL. VE DAN. HİZ. SAN. GRANİT İÇ VE DIŞ TİC. LTD. ŞTİ.</div>
          </div>
        </div>
        
        {/* Ürün Bilgileri */}
        <div className="flex border-b border-black">
          <div className="w-1/4 border-r border-black">
            <div className="p-1 border-b border-black h-7">
              <div className="font-bold">ÜRÜN ADI</div>
            </div>
            <div className="p-1 border-b border-black h-7">
              <div className="font-bold">ÜRÜN SAHİBİ</div>
            </div>
            <div className="p-1 border-b border-black h-7">
              <div className="font-bold">ÜRETİM NO</div>
            </div>
            <div className="p-1 border-b border-black h-7">
              <div className="font-bold">ÜRETİM TARİHİ</div>
            </div>
            <div className="p-1 h-7">
              <div className="font-bold">ANALİZ TARİHİ</div>
            </div>
          </div>
          <div className="w-1/2 border-r border-black">
            <div className="p-1 border-b border-black h-7">
              <div>{urunAdi}</div>
            </div>
            <div className="p-1 border-b border-black h-7">
              <div>{urunSahibi}</div>
            </div>
            <div className="p-1 border-b border-black h-7">
              <div>{uretimNo}</div>
            </div>
            <div className="p-1 border-b border-black h-7">
              <div>{uretimTarihi}</div>
            </div>
            <div className="p-1 h-7">
              <div>{bugun}</div>
            </div>
          </div>
          <div className="w-1/4">
            <div className="p-1 border-b border-black h-7">
              <div className="font-bold">Notlar</div>
            </div>
            <div className="h-28"></div>
          </div>
        </div>
        
        {/* Ürün Kontrolü Tablosu */}
        <div className="border-b border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 border-r border-black p-1">
              <div className="font-bold">ÜRÜN KONTROLÜ</div>
            </div>
            <div className="w-1/2 border-r border-black p-1 text-center">
              <div className="font-bold">Onaylanan Numune Değerleri</div>
            </div>
            <div className="w-1/4 flex">
              <div className="w-2/3 border-r border-black p-1 text-center">
                <div className="font-bold">Bitmiş Ürün Değerleri</div>
              </div>
              <div className="w-1/3 p-1 text-center">
                <div className="font-bold">Kontrol Eden</div>
              </div>
            </div>
          </div>
          
          {/* Kontrol Parametreleri */}
          {['Görünüm', 'Koku', 'Renk', 'Suda Çözünürlük', 'Akışkanlık', 'Ayrışma', 'Yoğunluk', 'Viskozite*', 'pH*'].map((param, index) => (
            <div key={index} className="flex border-b border-black">
              <div className="w-1/4 border-r border-black p-1 h-6">
                <div className="text-xs">{param}</div>
              </div>
              <div className="w-1/2 border-r border-black p-1 h-6"></div>
              <div className="w-1/4 flex h-6">
                <div className="w-2/3 border-r border-black p-1"></div>
                <div className="w-1/3 p-1"></div>
              </div>
            </div>
          ))}
          
          {/* Kontrol Edildiği Sıcaklık */}
          <div className="flex h-6">
            <div className="w-full p-1 text-xs">
              <div>* Kontrol Edildiği Sıcaklık :</div>
            </div>
          </div>
        </div>
        
        {/* Ambalaj ve Etiket Kontrolü */}
        <div className="border-b border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 border-r border-black p-1">
              <div className="font-bold">AMBALAJ VE ETİKET KONTROLÜ</div>
            </div>
            <div className="w-1/2 border-r border-black p-1 text-center">
              <div className="font-bold">Uygun</div>
            </div>
            <div className="w-1/4 flex">
              <div className="w-2/3 border-r border-black p-1 text-center">
                <div className="font-bold">Uygun Değil</div>
              </div>
              <div className="w-1/3 p-1 text-center">
                <div className="font-bold">Kontrol Eden</div>
              </div>
            </div>
          </div>
          
          {/* Ambalaj Kontrol Parametreleri */}
          {['Ambalaj Uygunluğu', 'Etiket Uygunluğu', 'Kutu Uygunluğu', 'Yardımcı Materyal Uygunluğu', 'Stand Uygunluğu'].map((param, index) => (
            <div key={index} className="flex border-b border-black">
              <div className="w-1/4 border-r border-black p-1 h-6">
                <div className="text-xs">{param}</div>
              </div>
              <div className="w-1/2 border-r border-black p-1 h-6"></div>
              <div className="w-1/4 flex h-6">
                <div className="w-2/3 border-r border-black p-1"></div>
                <div className="w-1/3 p-1"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Sarf Edilen Ürün Miktarları - Çizgi hizalama düzeltildi */}
        <div className="border-b border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 border-r border-black p-1">
              <div className="font-bold text-xs">SARF EDİLEN ÜRÜN MİKTARLARI</div>
            </div>
            <div className="flex w-3/4">
              <div className="w-1/5 border-r border-black p-1 text-center">
                <div className="font-bold text-xs">Şişe/Kavanoz</div>
              </div>
              <div className="w-1/5 border-r border-black p-1 text-center">
                <div className="font-bold text-xs">Valf/Kapak</div>
              </div>
              <div className="w-1/5 border-r border-black p-1 text-center">
                <div className="font-bold text-xs">Etiket</div>
              </div>
              <div className="w-1/5 border-r border-black p-1 text-center">
                <div className="font-bold text-xs">Kutu / Stand</div>
              </div>
              <div className="w-1/5 p-1 text-center">
                <div className="font-bold text-xs">Kontrol Eden</div>
              </div>
            </div>
          </div>
          
          {/* Adet satırı */}
          <div className="flex">
            <div className="w-1/4 border-r border-black p-1 text-center h-6">
              <div className="font-bold text-xs">Adet</div>
            </div>
            <div className="flex w-3/4 h-6">
              <div className="w-1/5 border-r border-black p-1"></div>
              <div className="w-1/5 border-r border-black p-1"></div>
              <div className="w-1/5 border-r border-black p-1"></div>
              <div className="w-1/5 border-r border-black p-1"></div>
              <div className="w-1/5 p-1"></div>
            </div>
          </div>
        </div>
        
        {/* Notlar */}
        <div className="border-b border-black">
          <div className="p-1">
            <div className="font-bold text-xs">NOTLAR</div>
          </div>
          <div className="h-16"></div>
        </div>
        
        {/* İmza Alanı */}
        <div className="flex">
          <div className="w-1/2 border-r border-black">
            <div className="p-1 border-b border-black text-center">
              <div className="font-bold text-xs">Kontrol Eden</div>
            </div>
            <div className="h-12"></div>
          </div>
          <div className="w-1/2">
            <div className="p-1 border-b border-black text-center">
              <div className="font-bold text-xs">Onaylayan</div>
            </div>
            <div className="h-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KaliteKontrolPDF; 