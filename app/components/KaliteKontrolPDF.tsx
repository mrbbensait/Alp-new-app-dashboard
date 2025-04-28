'use client';

import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

interface KaliteKontrolPDFProps {
  urunAdi: string;
  uretimNo: string;
  uretimTarihi: string;
}

const KaliteKontrolPDF: React.FC<KaliteKontrolPDFProps> = ({
  urunAdi,
  uretimNo,
  uretimTarihi
}) => {
  // Bugünün tarihini formatlayarak kullan
  const bugun = format(new Date(), 'dd/MM/yy');
  
  return (
    <div id="kalite-kontrol-pdf-content" className="w-[210mm] bg-white p-4 shadow-lg print:shadow-none">
      <div className="border border-black w-full">
        {/* Başlık Satırı */}
        <div className="flex border-b border-black">
          <div className="w-1/4 border-r border-black p-2">
            <div className="flex items-center justify-center h-full py-2">
              {/* Meta Pharma Logo - Gerçek logo kullanımı */}
              <div className="relative h-16 w-24">
                <Image 
                  src="/images/meta-logo.png" 
                  alt="Meta Pharma Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
          </div>
          <div className="w-1/2 border-r border-black p-2">
            <div className="text-center font-bold text-xl flex items-center justify-center h-full">
              KALİTE KONTROL FORMU
            </div>
          </div>
          <div className="w-1/4 p-2">
            <div className="space-y-1 text-xs">
              <div className="border-b border-black p-1">Doküman Kodu : F45/KYB/00</div>
              <div className="border-b border-black p-1">Yürürlük Tarihi : 01.01.2018</div>
              <div className="border-b border-black p-1">Revizyon Tarihi / No : 29.01.2024-1</div>
              <div className="p-1">Sayfa 1/1</div>
            </div>
          </div>
        </div>
        
        {/* Birim/Bölüm Satırı */}
        <div className="flex border-b border-black">
          <div className="w-1/4 border-r border-black p-2">
            <div className="font-bold">BİRİM/BÖLÜM</div>
          </div>
          <div className="w-3/4 p-2">
            <div className="text-sm">META PHARMA KOZMETİK GIDA VET. KİM. ÜR. İMAL. VE DAN. HİZ. SAN. GRANİT İÇ VE DIŞ TİC. LTD. ŞTİ.</div>
          </div>
        </div>
        
        {/* Ürün Bilgileri */}
        <div className="flex border-b border-black">
          <div className="w-1/4 border-r border-black">
            <div className="p-2 border-b border-black">
              <div className="font-bold">ÜRÜN ADI</div>
            </div>
            <div className="p-2 border-b border-black">
              <div className="font-bold">ÜRÜN SAHİBİ</div>
            </div>
            <div className="p-2 border-b border-black">
              <div className="font-bold">ÜRETİM NO</div>
            </div>
            <div className="p-2 border-b border-black">
              <div className="font-bold">ÜRETİM TARİHİ</div>
            </div>
            <div className="p-2">
              <div className="font-bold">ANALİZ TARİHİ</div>
            </div>
          </div>
          <div className="w-1/2 border-r border-black">
            <div className="p-2 border-b border-black">
              <div>{urunAdi}</div>
            </div>
            <div className="p-2 border-b border-black">
              <div>Purexpert Kozmetik</div>
            </div>
            <div className="p-2 border-b border-black">
              <div>{uretimNo}</div>
            </div>
            <div className="p-2 border-b border-black">
              <div>{uretimTarihi}</div>
            </div>
            <div className="p-2">
              <div>{bugun}</div>
            </div>
          </div>
          <div className="w-1/4">
            <div className="p-2 border-b border-black h-12">
              <div className="font-bold">Notlar</div>
            </div>
            <div className="h-32"></div>
          </div>
        </div>
        
        {/* Ürün Kontrolü Tablosu */}
        <div className="border-b border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 border-r border-black p-2">
              <div className="font-bold">ÜRÜN KONTROLÜ</div>
            </div>
            <div className="w-1/2 border-r border-black p-2 text-center">
              <div className="font-bold">Onaylanan Numune Değerleri</div>
            </div>
            <div className="w-1/4 flex">
              <div className="w-2/3 border-r border-black p-2 text-center">
                <div className="font-bold">Bitmiş Ürün Değerleri</div>
              </div>
              <div className="w-1/3 p-2 text-center">
                <div className="font-bold">Kontrol Eden</div>
              </div>
            </div>
          </div>
          
          {/* Kontrol Parametreleri */}
          {['Görünüm', 'Koku', 'Renk', 'Suda Çözünürlük', 'Akışkanlık', 'Ayrışma', 'Yoğunluk', 'Viskozite*', 'pH*'].map((param, index) => (
            <div key={index} className="flex border-b border-black">
              <div className="w-1/4 border-r border-black p-1">
                <div>{param}</div>
              </div>
              <div className="w-1/2 border-r border-black p-1"></div>
              <div className="w-1/4 flex">
                <div className="w-2/3 border-r border-black p-1"></div>
                <div className="w-1/3 p-1"></div>
              </div>
            </div>
          ))}
          
          {/* Kontrol Edildiği Sıcaklık */}
          <div className="flex">
            <div className="w-full p-1 text-sm">
              <div>* Kontrol Edildiği Sıcaklık :</div>
            </div>
          </div>
        </div>
        
        {/* Ambalaj ve Etiket Kontrolü */}
        <div className="border-b border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 border-r border-black p-2">
              <div className="font-bold">AMBALAJ VE ETİKET KONTROLÜ</div>
            </div>
            <div className="w-1/2 border-r border-black p-2 text-center">
              <div className="font-bold">Uygun</div>
            </div>
            <div className="w-1/4 flex">
              <div className="w-2/3 border-r border-black p-2 text-center">
                <div className="font-bold">Uygun Değil</div>
              </div>
              <div className="w-1/3 p-2 pr-4 text-center">
                <div className="font-bold">Kontrol Eden</div>
              </div>
            </div>
          </div>
          
          {/* Ambalaj Kontrol Parametreleri */}
          {['Ambalaj Uygunluğu', 'Etiket Uygunluğu', 'Kutu Uygunluğu', 'Yardımcı Materyal Uygunluğu', 'Stand Uygunluğu'].map((param, index) => (
            <div key={index} className="flex border-b border-black">
              <div className="w-1/4 border-r border-black p-1">
                <div>{param}</div>
              </div>
              <div className="w-1/2 border-r border-black p-1"></div>
              <div className="w-1/4 flex">
                <div className="w-2/3 border-r border-black p-1"></div>
                <div className="w-1/3 p-1 pr-4"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Sarf Edilen Ürün Miktarları - Çizgi hizalama düzeltildi */}
        <div className="border-b border-black">
          <div className="flex border-b border-black">
            <div className="w-1/4 border-r border-black p-2">
              <div className="font-bold">SARF EDİLEN ÜRÜN MİKTARLARI</div>
            </div>
            <div className="flex w-3/4">
              <div className="w-1/5 border-r border-black p-2 text-center">
                <div className="font-bold">Şişe/Kavanoz</div>
              </div>
              <div className="w-1/5 border-r border-black p-2 text-center">
                <div className="font-bold">Valf/Kapak</div>
              </div>
              <div className="w-1/5 border-r border-black p-2 text-center">
                <div className="font-bold">Etiket</div>
              </div>
              <div className="w-1/5 border-r border-black p-2 text-center">
                <div className="font-bold">Kutu / Stand</div>
              </div>
              <div className="w-1/5 p-2 pr-4 text-center">
                <div className="font-bold">Kontrol Eden</div>
              </div>
            </div>
          </div>
          
          {/* Adet satırı */}
          <div className="flex">
            <div className="w-1/4 border-r border-black p-2 text-center">
              <div className="font-bold">Adet</div>
            </div>
            <div className="flex w-3/4">
              <div className="w-1/5 border-r border-black p-2"></div>
              <div className="w-1/5 border-r border-black p-2"></div>
              <div className="w-1/5 border-r border-black p-2"></div>
              <div className="w-1/5 border-r border-black p-2"></div>
              <div className="w-1/5 p-2 pr-4"></div>
            </div>
          </div>
        </div>
        
        {/* Notlar */}
        <div className="border-b border-black">
          <div className="p-2">
            <div className="font-bold">NOTLAR</div>
          </div>
          <div className="h-24"></div>
        </div>
        
        {/* İmza Alanı */}
        <div className="flex">
          <div className="w-1/2 border-r border-black">
            <div className="p-2 border-b border-black text-center">
              <div className="font-bold">Kontrol Eden</div>
            </div>
            <div className="h-16"></div>
          </div>
          <div className="w-1/2">
            <div className="p-2 border-b border-black text-center">
              <div className="font-bold">Onaylayan</div>
            </div>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KaliteKontrolPDF; 