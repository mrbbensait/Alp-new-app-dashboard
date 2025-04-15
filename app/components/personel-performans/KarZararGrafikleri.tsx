'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { PerformansRaporu, MaliyetFiyat } from '@/app/lib/types';
import { GrafikTuru } from './GrafikTurSecici';
import { formatDateTR } from '@/app/utils/date-utils';
import { hesaplaRaporToplamKar } from '@/app/utils/hesaplamalar';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface KarZararGrafikleriProps {
  raporlar: PerformansRaporu[];
  maliyetFiyatlar: MaliyetFiyat[];
  grafikTuru: GrafikTuru;
  baslangicTarihi: string;
  bitisTarihi: string;
  gosterilecekVeriler?: {
    dolum?: boolean;
    etiketleme?: boolean;
    kutulama?: boolean;
    selefon?: boolean;
    toplam?: boolean;
  };
}

const KarZararGrafikleri: React.FC<KarZararGrafikleriProps> = ({
  raporlar,
  maliyetFiyatlar,
  grafikTuru,
  baslangicTarihi,
  bitisTarihi,
  gosterilecekVeriler = {
    dolum: true,
    etiketleme: true,
    kutulama: true,
    selefon: true,
    toplam: false
  }
}) => {
  // Rapor verilerini tarih bazında gruplayarak kar/zarar değerlerini hesapla
  const gunlukKarVerileri = raporlar.reduce((acc, rapor) => {
    const tarih = rapor.tarih;
    
    if (!acc[tarih]) {
      acc[tarih] = {
        dolum: 0,
        etiketleme: 0,
        kutulama: 0,
        selefon: 0,
        toplam: 0
      };
    }
    
    // Her bir işlem türünün kar değerlerini hesapla
    const dolumKar = rapor.dolum * getKarOrani('dolum', maliyetFiyatlar);
    const etiketlemeKar = rapor.etiketleme * getKarOrani('etiketleme', maliyetFiyatlar);
    const kutulamaKar = rapor.kutulama * getKarOrani('kutulama', maliyetFiyatlar);
    const selefonKar = rapor.selefon * getKarOrani('selefon', maliyetFiyatlar);
    
    acc[tarih].dolum += dolumKar;
    acc[tarih].etiketleme += etiketlemeKar;
    acc[tarih].kutulama += kutulamaKar;
    acc[tarih].selefon += selefonKar;
    acc[tarih].toplam = acc[tarih].dolum + acc[tarih].etiketleme + acc[tarih].kutulama + acc[tarih].selefon;
    
    return acc;
  }, {} as Record<string, { dolum: number, etiketleme: number, kutulama: number, selefon: number, toplam: number }>);
  
  // Birim başına kar oranını hesapla
  function getKarOrani(islemTuru: string, maliyetFiyatlar: MaliyetFiyat[]): number {
    const maliyetFiyat = maliyetFiyatlar.find(mf => mf.islem_turu === islemTuru);
    if (!maliyetFiyat) return 0;
    return maliyetFiyat.birim_fiyat - maliyetFiyat.birim_maliyet;
  }
  
  // Tarihleri sırala
  const tarihler = Object.keys(gunlukKarVerileri).sort();
  
  // Grafik verilerini hazırla
  const labels = tarihler.map(tarih => formatDateTR(tarih));
  
  // Çizgi ve çubuk grafiği için veriler
  const lineBarData = {
    labels,
    datasets: [
      gosterilecekVeriler.dolum && {
        label: 'Dolum Karı',
        data: tarihler.map(tarih => gunlukKarVerileri[tarih].dolum),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.etiketleme && {
        label: 'Etiketleme Karı',
        data: tarihler.map(tarih => gunlukKarVerileri[tarih].etiketleme),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.kutulama && {
        label: 'Kutulama Karı',
        data: tarihler.map(tarih => gunlukKarVerileri[tarih].kutulama),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.selefon && {
        label: 'Selefon Karı',
        data: tarihler.map(tarih => gunlukKarVerileri[tarih].selefon),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.toplam && {
        label: 'Toplam Kar',
        data: tarihler.map(tarih => gunlukKarVerileri[tarih].toplam),
        borderColor: 'rgb(109, 40, 217)',
        backgroundColor: 'rgba(109, 40, 217, 0.5)',
        tension: 0.3,
        borderWidth: 3,
        borderDash: [5, 5]
      }
    ].filter(Boolean) as any[]
  };
  
  // Çizgi ve bar grafiği için seçenekler
  const lineBarOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Kar/Zarar (₺)',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };
  
  // Alan grafiği için seçenekler
  const areaOptions = {
    ...lineBarOptions,
    elements: {
      line: {
        fill: true
      }
    }
  };
  
  if (raporlar.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-gray-500 text-center">
          <p className="mb-1 text-lg">Görüntülenecek veri bulunmuyor</p>
          <p className="text-sm">Seçilen tarih aralığında kayıtlı kar/zarar verisi yok.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {grafikTuru === 'cizgi' && (
        <Line options={lineBarOptions} data={lineBarData} />
      )}
      
      {grafikTuru === 'bar' && (
        <Bar options={lineBarOptions} data={lineBarData} />
      )}
      
      {grafikTuru === 'alan' && (
        <Line options={areaOptions} data={lineBarData} />
      )}
    </div>
  );
};

export default KarZararGrafikleri; 