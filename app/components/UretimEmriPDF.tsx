'use client';

import React, { useRef, useEffect } from 'react';
// jsPDF ve autoTable importları kaldırıldı
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

interface Hammadde {
  'Hammadde Adı': string;
  'Oran(100Kg)': number;
  'Miktar': number;
}

interface UretimEmriProps {
  receteAdi: string;
  uretimNo: string;
  uretimTarihi: string;
  uretimMiktari: number; // kg cinsinden
  hammaddeler: Hammadde[];
}

const UretimEmriPDF: React.FC<UretimEmriProps> = (props) => {
  const { receteAdi, uretimNo, uretimTarihi, uretimMiktari, hammaddeler } = props;
  
  // İçerik referansı
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Yazdırma stilleri (iframe yöntemi için basitleştirildi)
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.innerHTML = `
      @media print {
        body {
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important;
          margin: 10mm !important; /* Kenar boşlukları */
        }
        /* Yazdırılmayacakları gizle (Genel kural) */
        .no-print {
           display: none !important;
        }
        /* Tablo Stilleri */
        table, th, td {
           border-color: black !important;
           border: 0.5pt solid black !important;
           border-collapse: collapse !important;
           font-size: 8pt !important; 
           padding: 3pt !important;
        }
        th {
           font-weight: bold !important;
           background-color: #f3f4f6 !important; 
           text-align: center !important;
           vertical-align: middle !important;
        }
        td {
           height: 18pt !important; 
           vertical-align: middle !important;
        }
         /* Genel sayfa ayarları */
        @page {
            size: A4;
            margin: 10mm; 
        }
        /* Sayfayı tek sayfada tutmak için */
        .print-container {
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          min-height: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const printStyles = document.getElementById('print-styles');
      if (printStyles) {
        printStyles.remove();
      }
    };
  }, []);

  return (
    <div
      id="uretim-emri-pdf-content"
      ref={contentRef}
      className="bg-white p-0 w-[210mm] border-2 border-black shadow-lg print-container"
    >
      {/* Üretim Emri Belgesi - Ana Çerçeve */}
      <div className="w-full border-collapse">
        {/* Üst Kısım: Logo, Başlık, Doküman Bilgileri */} 
        <div className="flex border-b-2 border-black">
          {/* Sol Bölüm: Logo ve Birim/Bölüm */}
          <div className="w-1/2 border-r-2 border-black">
            {/* Logo Alanı */}
            <div className="h-20 flex items-center justify-start p-2 border-b border-black">
               {/* Logo dosya yolunu kontrol edin */}
               <img src="/images/meta-logo.png" alt="META pharma" className="h-12 object-contain" /> 
            </div>
            {/* Birim/Bölüm Alanı */}
            <div className="p-2 border-b border-black">
              <div className="font-bold text-sm mb-1">BİRİM/BÖLÜM</div>
              <div className="text-xs">
                META PHARMA KOZMETİK GIDA VET. KİM. ÜR. İMAL. VE DAN.<br />
                HİZ. SAN. GRANİT İÇ VE DIŞ TİC. LTD. ŞTİ.
              </div>
            </div>
          </div>
          {/* Sağ Bölüm: Başlık ve Doküman Bilgileri */}
          <div className="w-1/2">
            {/* Başlık Alanı */}
            <div className="h-20 flex items-center justify-center p-2 border-b border-black">
              <h1 className="text-2xl font-bold text-center">ÜRETİM EMRİ</h1>
            </div>
            {/* Doküman Bilgileri Alanı */}
            <div className="text-xs border-b border-black">
              <div className="flex justify-between p-1 border-b border-black">
                <span>Doküman Kodu</span>
                <span>: F23/KYB/00</span>
              </div>
              <div className="flex justify-between p-1 border-b border-black">
                <span>Yürürlük Tarihi</span>
                <span>: 01.01.2018</span>
              </div>
              <div className="flex justify-between p-1 border-b border-black">
                <span>Revizyon Tarihi / No</span>
                <span>:</span> 
              </div>
              <div className="flex justify-between p-1">
                <span>Sayfa</span>
                <span>: 1/1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orta Kısım: Ürün Bilgileri ve Notlar */}
        <div className="flex border-b-2 border-black">
          {/* Sol: Ürün Bilgileri */} 
          <div className="w-2/3 border-r border-black">
            <div className="flex border-b border-black">
              <div className="w-1/3 border-r border-black p-2 font-bold text-sm">ÜRÜN ADI</div>
              <div className="w-2/3 p-2 text-sm">{receteAdi}</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-1/3 border-r border-black p-2 font-bold text-sm">KAZAN NO</div>
              <div className="w-2/3 p-2 text-sm">1</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-1/3 border-r border-black p-2 font-bold text-sm">ÜRETİM NO</div>
              <div className="w-2/3 p-2 text-sm">{uretimNo}</div>
            </div>
            <div className="flex">
              <div className="w-1/3 border-r border-black p-2 font-bold text-sm">ÜRETİM TARİHİ</div>
              <div className="w-2/3 p-2 text-sm">{uretimTarihi}</div>
            </div>
          </div>
           {/* Sağ: Miktar ve Notlar */} 
          <div className="w-1/3">
            <div className="flex border-b border-black">
              <div className="w-1/2 border-r border-black p-2 font-bold text-sm">ÜRETİM MİKTARI (kg)</div>
              <div className="w-1/2 p-2 text-sm text-center">{uretimMiktari}</div>
            </div>
            <div className="p-2">
              <span className="font-bold text-sm">Notlar</span>
              {/* Notlar için içerik buraya eklenebilir */} 
            </div>
          </div>
        </div>
        
        {/* Hammadde Tablosu */}
        <div className="border-b-2 border-black">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 font-semibold text-center">Hammadde Adı</th>
                <th className="border border-black p-1 font-semibold text-center">% Miktar</th>
                <th className="border border-black p-1 font-semibold text-center">Miktar</th>
                <th className="border border-black p-1 font-semibold text-center">Lot No</th>
                <th className="border border-black p-1 font-semibold text-center">Hazırlayan</th>
                <th className="border border-black p-1 font-semibold text-center">Kontrol Eden</th>
              </tr>
            </thead>
            <tbody>
              {hammaddeler.map((hammadde, index) => (
                <tr key={index}>
                  <td className="border border-black p-1 h-7">{hammadde['Hammadde Adı']}</td>
                  <td className="border border-black p-1 h-7 text-right">{hammadde['Oran(100Kg)'].toFixed(2)}</td>
                  <td className="border border-black p-1 h-7 text-right">{hammadde['Miktar'].toFixed(2)}</td>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                </tr>
              ))}
              {/* Boş satırları doldur - 20 yerine en fazla 10 satır göster */}
              {Array.from({ length: Math.max(0, Math.min(10, 10 - hammaddeler.length)) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                  <td className="border border-black p-1 h-7"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Talimatlar */}
        <div className="p-2 text-xs">
          <div className="font-bold mb-1">ÜRETİMLE İLGİLİ TALİMATLAR</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Üretime başlanmadan bir öncekiyle aynı ürün yapılacak dahi olsa kazan sıcak suyla yıkanacaktır.</li>
            <li>Hammaddeler, cins ve miktarları ustabaşının nezaretinde kazanlara konulacaktır.</li>
            <li>Üretimi yapılan üründen bir numune laboratuvara götürülecektir.</li>
            <li>Ürünün kalite kontrolü yapıldıktan sonra dolum ve ambalajlamaya başlanacaktır.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default UretimEmriPDF; 