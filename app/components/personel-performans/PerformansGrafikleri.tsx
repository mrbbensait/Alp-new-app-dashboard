'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import { PerformansRaporu, MaliyetFiyat } from '@/app/lib/types/index';
import { GrafikTuru } from './GrafikTurSecici';
import { formatDateTR, getGunAdi } from '@/app/utils/date-utils';
import { hesaplaRaporToplamKar } from '@/app/utils/hesaplamalar';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformansGrafikleriProps {
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

const PerformansGrafikleri: React.FC<PerformansGrafikleriProps> = ({
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
  // Rapor verilerini tarih bazında grupla
  const gunlukRaporlar = raporlar.reduce((acc, rapor) => {
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
    
    acc[tarih].dolum += rapor.dolum;
    acc[tarih].etiketleme += rapor.etiketleme;
    acc[tarih].kutulama += rapor.kutulama;
    acc[tarih].selefon += rapor.selefon;
    acc[tarih].toplam = acc[tarih].dolum + acc[tarih].etiketleme + acc[tarih].kutulama + acc[tarih].selefon;
    
    return acc;
  }, {} as Record<string, { dolum: number, etiketleme: number, kutulama: number, selefon: number, toplam: number }>);
  
  // Tarihleri sırala
  const tarihler = Object.keys(gunlukRaporlar).sort();
  
  // Grafik verilerini hazırla
  const labels = tarihler.map(tarih => formatDateTR(tarih));
  
  // Çizgi ve çubuk grafiği için veriler
  const lineBarData = {
    labels,
    datasets: [
      gosterilecekVeriler.dolum && {
        label: 'Dolum',
        data: tarihler.map(tarih => gunlukRaporlar[tarih].dolum),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.etiketleme && {
        label: 'Etiketleme',
        data: tarihler.map(tarih => gunlukRaporlar[tarih].etiketleme),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.kutulama && {
        label: 'Kutulama',
        data: tarihler.map(tarih => gunlukRaporlar[tarih].kutulama),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.selefon && {
        label: 'Selefon',
        data: tarihler.map(tarih => gunlukRaporlar[tarih].selefon),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3
      },
      gosterilecekVeriler.toplam && {
        label: 'Toplam İş',
        data: tarihler.map(tarih => gunlukRaporlar[tarih].toplam),
        borderColor: 'rgb(109, 40, 217)',
        backgroundColor: 'rgba(109, 40, 217, 0.5)',
        tension: 0.3,
        borderWidth: 3,
        borderDash: [5, 5]
      }
    ].filter(Boolean) as any[]
  };
  
  // Pasta grafiği için veriler
  const pieData = {
    labels: ['Dolum', 'Etiketleme', 'Kutulama', 'Selefon'],
    datasets: [
      {
        data: [
          tarihler.reduce((sum, tarih) => sum + gunlukRaporlar[tarih].dolum, 0),
          tarihler.reduce((sum, tarih) => sum + gunlukRaporlar[tarih].etiketleme, 0),
          tarihler.reduce((sum, tarih) => sum + gunlukRaporlar[tarih].kutulama, 0),
          tarihler.reduce((sum, tarih) => sum + gunlukRaporlar[tarih].selefon, 0)
        ],
        backgroundColor: [
          'rgba(53, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgb(53, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1,
      },
    ],
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
          text: 'İşlem Sayısı',
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
  
  // Alan grafiği için seçenekler (çizgi grafiğinin aynısı ama fill: true)
  const areaOptions = {
    ...lineBarOptions,
    elements: {
      line: {
        fill: true
      }
    }
  };
  
  // Pasta grafiği için seçenekler
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'İşlem Dağılımı',
      },
    },
  };
  
  if (raporlar.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-gray-500 text-center">
          <p className="mb-1 text-lg">Görüntülenecek veri bulunmuyor</p>
          <p className="text-sm">Seçilen tarih aralığında kayıtlı performans verisi yok.</p>
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
      
      {grafikTuru === 'pasta' && (
        <div className="max-w-md mx-auto">
          <Pie options={pieOptions} data={pieData} />
        </div>
      )}
      
      {grafikTuru === 'alan' && (
        <Line options={areaOptions} data={lineBarData} />
      )}
    </div>
  );
};

export default PerformansGrafikleri; 