"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import DataTable from "../../components/DataTable";
import { tables } from "../../data/schema";
import {
  fetchAllFromTable,
  fetchFilteredData,
  subscribeToTable,
  unsubscribeFromChannel,
  updateData,
  createTeslimatGecmisi,
  subscribeToUretimKuyruguUpdates,
} from "../../lib/supabase";
import TeslimatGecmisiModal from "../../components/modals/TeslimatGecmisiModal";
import TeslimatModal from "../../components/modals/TeslimatModal";
import PageGuard from "../../components/PageGuard";
import { useAuth } from "../../lib/AuthContext";
import MusteriEkleModal from "../../components/modals/MusteriEkleModal";
import TedarikciEkleModal from "../../components/modals/TedarikciEkleModal";
import SatinAlmaSiparisiEkleModal from "../../components/modals/SatinAlmaSiparisiEkleModal";
import StokKartiEkleModal from "../../components/modals/StokKartiEkleModal";
import StokHareketModal from "../../components/modals/StokHareketModal";
import UretimGirModal from "../../components/modals/UretimGirModal";
import BulkSifirlamaModal from "../../components/modals/BulkSifirlamaModal";
import UretimSilModal from "../../components/modals/UretimSilModal";
import UretimEmriModal from "../../components/modals/UretimEmriModal";
import { supabase } from "@/app/lib/supabase";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { IoMdAdd } from "react-icons/io";

// Özel animasyon stili
const pulseAnimationStyle = `
  @keyframes neon-pulse {
    0% {
      text-shadow: 0 0 4px rgba(255, 0, 0, 0.7), 0 0 8px rgba(255, 0, 0, 0.5);
      box-shadow: 0 0 5px rgba(255, 0, 0, 0.5) inset;
    }
    50% {
      text-shadow: 0 0 8px rgba(255, 0, 0, 0.9), 0 0 12px rgba(255, 0, 0, 0.7);
      box-shadow: 0 0 10px rgba(255, 0, 0, 0.7) inset;
    }
    100% {
      text-shadow: 0 0 4px rgba(255, 0, 0, 0.7), 0 0 8px rgba(255, 0, 0, 0.5);
      box-shadow: 0 0 5px rgba(255, 0, 0, 0.5) inset;
    }
  }
  .animate-neon-pulse {
    animation: neon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

export default function TablePage() {
  const { tableName } = useParams<{ tableName: string }>();
  const decodedTableName = decodeURIComponent(tableName as string);

  // Tablo adları için görüntüleme isimleri
  const tableDisplayNames: Record<string, string> = {
    suppliers: "Tedarikçiler",
    "SatınAlma siparişleri": "Satın Alma Siparişleri",
    // Diğer özel isimler buraya eklenebilir
  };

  // Tablo başlığını belirle - özel isim varsa kullan, yoksa normal tablo adını kullan
  const displayTableName =
    tableDisplayNames[decodedTableName] || decodedTableName;

  const [tableData, setTableData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefreshTimer, setAutoRefreshTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [teslimatModalOpen, setTeslimatModalOpen] = useState(false);
  const [selectedUrun, setSelectedUrun] = useState<{
    id: number;
    name: string;
    musteri: string;
    ambalaj: string;
    stok: number;
    kalanAdet: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: number;
    recipeName: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [musteriEkleModalOpen, setMusteriEkleModalOpen] = useState(false);
  const [tedarikciEkleModalOpen, setTedarikciEkleModalOpen] = useState(false);
  const [satinAlmaSiparisiEkleModalOpen, setSatinAlmaSiparisiEkleModalOpen] =
    useState(false);
  const [stokKartiEkleModalOpen, setStokKartiEkleModalOpen] = useState(false);
  const [stokHareketModalOpen, setStokHareketModalOpen] = useState(false);
  const [uretimGirModalOpen, setUretimGirModalOpen] = useState(false);
  const [bulkSifirlamaModalOpen, setBulkSifirlamaModalOpen] = useState(false);
  const [uretimSilModalOpen, setUretimSilModalOpen] = useState(false);
  const [selectedUretimKuyrugu, setSelectedUretimKuyrugu] = useState<{
    id: number;
    receteAdi: string;
  } | null>(null);
  
  // Üretim Emri Modalı için state'ler
  const [isUretimEmriModalOpen, setIsUretimEmriModalOpen] = useState(false);
  const [selectedUretimEmri, setSelectedUretimEmri] = useState<{
    receteAdi: string;
    uretimMiktari: number;
    uretimTarihi: string;
  } | null>(null);
  
  const { user } = useAuth();

  // Kritik stok filtrelemeleri için state'ler
  const [showKritikStok, setShowKritikStok] = useState(false);
  const [kritikStokKategori, setKritikStokKategori] = useState<
    "hepsi" | "hammadde" | "ambalaj"
  >("hepsi");

  // Kullanıcının rol bilgilerini tutacak state
  const [userRolBilgileri, setUserRolBilgileri] = useState<any>(null);

  // Tablo şeması bulma
  const tableSchema = tables.find((table) => table.name === decodedTableName);

  // Üretim Kuyruğu güncellemelerini dinleme ve 5 saniye sonra yenileme yapma
  const [uretimKuyruguUpdateTimer, setUretimKuyruguUpdateTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Ses çalma için ref
  const alarmAudioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // Ses çalma fonksiyonu
  const playAlarm = useCallback(() => {
    try {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.currentTime = 0; // Sesi başa sar
        alarmAudioRef.current.play().catch(error => {
          console.error("Alarm sesi çalınamadı:", error);
        });
      }
    } catch (error) {
      console.error("Alarm sesi çalınırken hata oluştu:", error);
    }
  }, []);

  // Verileri yeniden yükleme fonksiyonu
  const refreshData = useCallback(
    async (forceRefresh = false) => {
      if (!tableSchema) return;

      setLoading(true);
      try {
        // Veri yükleme başladığında yükleme zamanını hatırlamak için timestamp oluştur
        const startTime = Date.now();

        const data = await fetchAllFromTable(decodedTableName, forceRefresh);

        // Minimum 500ms yükleme göstermek için, eğer yükleme çok hızlı olduysa biraz bekle
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500 - elapsedTime),
          );
        }

        setTableData(data);
        filterData(searchQuery, data);
        setError(null);
      } catch (err) {
        console.error(
          `Tablo verisi yüklenirken hata: ${decodedTableName}`,
          err,
        );
        setError(
          "Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        );
        setTableData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    },
    [tableSchema, decodedTableName, searchQuery],
  );

  // Manuel olarak sayfayı yenileme - önbelleği bypass et
  const handleRefresh = () => {
    console.log("Manuel yenileme yapılıyor, önbellek bypass ediliyor...");
    refreshData(true); // forceRefresh=true ile önbelleği bypass et
    setRefreshKey((prev) => prev + 1);
  };

  // Otomatik yenileme planlama fonksiyonu
  const scheduleAutoRefresh = useCallback(() => {
    // Eğer önceden bir zamanlayıcı varsa temizle
    if (autoRefreshTimer) {
      clearTimeout(autoRefreshTimer);
    }

    // 3 saniye sonra otomatik yenileme yapacak zamanlayıcı oluştur
    const timer = setTimeout(() => {
      console.log("Veri değişikliği sonrası otomatik yenileme yapılıyor...");
      refreshData(true); // Önbelleği bypass et
      setAutoRefreshTimer(null);
    }, 3000);

    setAutoRefreshTimer(timer);
  }, [refreshData, autoRefreshTimer]);

  // Üretim Kuyruğu güncellemelerini dinleme ve 5 saniye sonra yenileme yapma
  const handleUretimKuyruguUpdate = useCallback((isNewProduction: boolean) => {
    // Üretim Kuyruğu sayfasında değilsek işlem yapma
    if (decodedTableName !== "Üretim Kuyruğu") return;

    console.log(
      "Üretim Kuyruğu güncellemesi alındı, 5 saniye sonra yenilenecek...",
      isNewProduction ? "(Yeni Üretim)" : ""
    );
    
    // Eğer yeni üretim eklenmişse alarm çal
    if (isNewProduction) {
      playAlarm();
      // Bildirim göster
      toast.success('Yeni üretim emri eklendi!', { 
        duration: 5000,
        position: 'top-center',
        icon: '🔔'
      });
    }

    // Önceki zamanlayıcıyı temizle
    if (uretimKuyruguUpdateTimer) {
      clearTimeout(uretimKuyruguUpdateTimer);
    }

    // 5 saniye sonra sayfayı yenile
    const timer = setTimeout(() => {
      console.log("Otomatik yenileme yapılıyor (5 saniye sonra)...");
      refreshData(true); // Önbelleği bypass et
      setUretimKuyruguUpdateTimer(null);
    }, 5000);

    setUretimKuyruguUpdateTimer(timer);
  }, [decodedTableName, refreshData, uretimKuyruguUpdateTimer, playAlarm]);

  useEffect(() => {
    // İlk yüklemede verileri çek
    refreshData();

    // Realtime aboneliği oluştur
    const subscription = subscribeToTable(decodedTableName, () => {
      // Veri değişikliği olunca 3 saniye sonra yenileme planla
      scheduleAutoRefresh();
    });

    // Üretim Kuyruğu güncellemeleri için özel abonelik
    const uretimKuyruguSubscription = subscribeToUretimKuyruguUpdates(
      handleUretimKuyruguUpdate,
    );

    // Temizlik fonksiyonu - component unmount olduğunda aboneliği iptal et
    return () => {
      if (subscription) {
        unsubscribeFromChannel(subscription);
      }

      if (uretimKuyruguSubscription) {
        unsubscribeFromChannel(uretimKuyruguSubscription);
      }

      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }

      if (uretimKuyruguUpdateTimer) {
        clearTimeout(uretimKuyruguUpdateTimer);
      }
    };
  }, [
    decodedTableName,
    tableSchema,
    refreshKey,
    refreshData,
    scheduleAutoRefresh,
    handleUretimKuyruguUpdate,
  ]);

  // Arama fonksiyonu
  const filterData = (query: string, data = tableData) => {
    if (!query.trim() && !showKritikStok) {
      setFilteredData(data);
      return;
    }

    let filtered = data;

    // Arama sorgusu varsa filtrele
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase().trim();

      // Tablonun tüm sütunlarında arama yap
      filtered = filtered.filter((row) => {
        // Tüm sütunlarda ara
        return Object.keys(row).some((key) => {
          const value = row[key];
          // null veya undefined değerler için kontrol
          if (value === null || value === undefined) return false;

          // Değer türüne göre arama yap
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowercaseQuery);
          } else if (typeof value === "number" || typeof value === "boolean") {
            return value.toString().toLowerCase().includes(lowercaseQuery);
          } else if (value instanceof Date) {
            return value.toLocaleDateString("tr-TR").includes(lowercaseQuery);
          } else if (typeof value === "object") {
            // JSON veya nesne değerleri için
            try {
              return JSON.stringify(value)
                .toLowerCase()
                .includes(lowercaseQuery);
            } catch {
              return false;
            }
          }
          return false;
        });
      });
    }

    // Kritik stok filtresi aktifse uygula
    if (showKritikStok) {
      filtered = filtered.filter((item) => {
        const netStok =
          item["Net Stok"] ||
          item["Mevcut Stok"] - (item["Rezerve Edildi"] || 0);
        const isKritik = netStok < (item["Kritik Stok"] || 0);

        // Sadece kritik stok miktarının altındakileri göster
        if (!isKritik) return false;

        // Kategori filtreleme
        if (kritikStokKategori === "hepsi") {
          return true;
        } else if (kritikStokKategori === "hammadde") {
          return item["Stok Kategori"] === "Hammadde";
        } else if (kritikStokKategori === "ambalaj") {
          return item["Stok Kategori"] === "Ambalaj";
        }

        return true;
      });
    }

    setFilteredData(filtered);
  };

  // Kritik stok filtrelemesini aç/kapat
  const toggleKritikStok = useCallback(() => {
    setShowKritikStok((prev) => !prev);
    setKritikStokKategori("hepsi");
  }, []);

  // Kritik stok kategori filtrelemesi
  const handleKritikStokKategori = useCallback(
    (kategori: "hepsi" | "hammadde" | "ambalaj") => {
      setKritikStokKategori(kategori);
    },
    [],
  );

  // Arama ve filtreleme değişikliklerini izle
  useEffect(() => {
    filterData(searchQuery);
  }, [searchQuery, tableData, showKritikStok, kritikStokKategori]);

  // Reçete adına tıklandığında teslimat geçmişi modalını aç (Bitmiş Ürün Stoğu tablosu için)
  const handleReceteClick = (
    receteAdi: string,
    urunId: number,
    marka: string,
    row?: any,
  ) => {
    console.log("Reçete tıklandı:", receteAdi, urunId, marka, row);
    if (decodedTableName === "Reçeteler") {
      // Reçeteler tablosunda reçete adına tıklandığında, reçetenin içeriklerini bir modal'da göster
      setSelectedItem({
        id: urunId,
        recipeName: receteAdi,
      });
      setIsModalOpen(true);
    } else if (decodedTableName === "Üretim Kuyruğu") {
      // Üretim Kuyruğu tablosunda reçete adına tıklandığında, Üretim Emri modalını aç
      console.log("Üretim Kuyruğu - Reçete tıklandı, Üretim Emri modalı açılıyor, row:", row);
      if (row) {
        // Üretim Emri modalı için gerekli parametreleri ayarla
        const uretimMiktari = row['Bulk Üretim Emri(Kg)'] || 0;
        const uretimTarihi = row['Üretim Emir Tarihi'] || new Date().toISOString();
        
        // Üretim Emri modalını açmak için gerekli state'i ayarla
        setSelectedUretimEmri({
          receteAdi: receteAdi,
          uretimMiktari: uretimMiktari,
          uretimTarihi: uretimTarihi
        });
        setIsUretimEmriModalOpen(true);
      }
    } else if (decodedTableName === "Bitmiş Ürün Stoğu") {
      // Tıklanan ürünün tüm bilgilerini bul
      const urunBilgisi = tableData.find((item) => item.id === urunId);

      setSelectedUrun({
        id: urunId,
        name: receteAdi,
        musteri: urunBilgisi?.["Müşteri"] || "Belirtilmemiş",
        ambalaj: urunBilgisi?.["Ambalaj (ml)"] || "Belirtilmemiş",
        stok: urunBilgisi?.["STOK / ADET"] || 0,
        kalanAdet: urunBilgisi?.["Kalan Adet"] || 0,
      });
      setTeslimatModalOpen(true);
    }
  };

  // Teslimat Gir butonuna tıklanınca
  const handleTeslimatClick = (rowId: number, recipeName: string) => {
    setSelectedItem({ id: rowId, recipeName });
    setIsModalOpen(true);
  };

  // Teslimat modalında onay
  const handleTeslimatConfirm = async (
    teslimatMiktari: number,
    teslimEden: string,
    teslimatSekli: string,
  ) => {
    if (!selectedItem) return;

    setUpdating(true);
    try {
      // Seçilen ürünü bul
      const urun = tableData.find((row) => row.id === selectedItem.id);
      if (!urun) throw new Error("Ürün bulunamadı");

      // Mevcut teslim edilen miktarı al
      const mevcutTeslimat = urun["Teslim Edilen"] || 0;

      // Yeni teslim edilen miktarı hesapla
      const yeniTeslimat = Number(mevcutTeslimat) + Number(teslimatMiktari);

      // Ürünü güncelle
      await updateData(decodedTableName, selectedItem.id, {
        "Teslim Edilen": yeniTeslimat,
      });

      // TeslimatGecmisi tablosuna kayıt ekle
      await createTeslimatGecmisi(
        selectedItem.id,
        teslimatMiktari,
        teslimEden,
        teslimatSekli,
      );

      // Modalı kapat ve veriyi yenile
      setIsModalOpen(false);
      setSelectedItem(null);
      scheduleAutoRefresh();
    } catch (error) {
      console.error("Teslimat kaydedilirken hata oluştu:", error);
      alert("Teslimat kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setUpdating(false);
    }
  };

  // Teslimat modalında iptal
  const handleTeslimatCancel = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Component unmount olduğunda zamanlayıcıları temizle
  useEffect(() => {
    return () => {
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
    };
  }, [autoRefreshTimer]);

  // Kullanıcının rol bilgilerini veritabanından çek
  useEffect(() => {
    const fetchRolBilgileri = async () => {
      if (user?.rol_id) {
        try {
          const { data, error } = await supabase
            .from("roller")
            .select("*")
            .eq("id", user.rol_id)
            .single();

          if (!error && data) {
            console.log("Kullanıcı rol bilgileri:", data);
            setUserRolBilgileri(data);
          }
        } catch (err) {
          console.error("Rol bilgileri alınırken hata:", err);
        }
      }
    };

    fetchRolBilgileri();
  }, [user]);

  // Excel'e verileri aktar
  const handleExcelExport = () => {
    try {
      // Aktarılacak veriyi belirle
      const dataToExport = filteredData.length > 0 ? filteredData : tableData;

      if (dataToExport.length === 0) {
        toast.error("Aktarılacak veri bulunamadı!");
        return;
      }

      // Excel verisi için boş dizi oluştur
      let excelData: Record<string, any>[] = [];

      // Tüm tablolar için tek bir yaklaşım kullan - sadece tabloda görünen sütunları aktar
      excelData = dataToExport.map((item) => {
        const row: Record<string, any> = {};

        // Tablonun tüm sütunlarını al
        tableSchema?.columns.forEach((column) => {
          // Özel karakterlerden kaçınmak ve okunabilirliği artırmak için sütun adını düzenle
          const columnName = (column as any).header || column.name;
          row[columnName] =
            item[column.name] !== undefined ? item[column.name] : "";
        });

        return row;
      });

      // Excel çalışma kitabı oluştur
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Sütun genişliklerini ayarla
      const wscols = Array(Object.keys(excelData[0] || {}).length).fill({
        wch: 18,
      });
      worksheet["!cols"] = wscols;

      // Excel dosyasını oluştur
      XLSX.utils.book_append_sheet(workbook, worksheet, decodedTableName);

      // Excel dosyasını indir
      const excelFileName = `${decodedTableName}_${format(new Date(), "dd-MM-yyyy")}.xlsx`;
      XLSX.writeFile(workbook, excelFileName);

      toast.success("Excel dosyası başarıyla indirildi");
    } catch (error) {
      console.error("Excel dışa aktarımı sırasında hata:", error);
      toast.error("Excel aktarımı sırasında bir hata oluştu");
    }
  };

  if (!tableSchema) {
    return (
      <PageGuard sayfaYolu={`/tablo/${decodedTableName}`}>
        <DashboardLayout>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Hata
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Tablo bulunamadı: {decodedTableName}</p>
              </div>
              <div className="mt-5">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ana Sayfaya Dön
                </a>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </PageGuard>
    );
  }

  return (
    <PageGuard sayfaYolu={`/tablo/${decodedTableName}`}>
      <style dangerouslySetInnerHTML={{ __html: pulseAnimationStyle }} />

      <audio ref={alarmAudioRef} preload="auto">
        <source src="/sounds/alarm.mp3" type="audio/mpeg" />
      </audio>

      <DashboardLayout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900 whitespace-normal sm:whitespace-nowrap">
              {displayTableName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-md">
              {`${displayTableName} tablosundaki verileri görüntüleyin ve yönetin.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 w-full sm:w-auto">
            <div className="relative rounded-md shadow-sm w-full sm:w-64 md:w-80 mb-2 sm:mb-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 h-10 sm:text-sm border-gray-300 rounded-md"
                placeholder={`${displayTableName} tablosunda ara...`}
              />
              {searchQuery && (
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setSearchQuery("")}
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Yenile
              </button>

              {decodedTableName === "Stok" && (
                <>
                  <button
                    onClick={toggleKritikStok}
                    className={`flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${showKritikStok ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 3a1 1 0 01.117 1.993L12 5H8a1 1 0 01-.117-1.993L8 3h4zm-6 2a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V8a3 3 0 00-3-3H6zm2 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Kritik Stok Tablosu
                  </button>

                  <button
                    onClick={handleExcelExport}
                    className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414 1.414l-3 3a1 1 0 00-1.414 0l-3-3a1 1 0 000-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Excel'e Aktar
                  </button>
                </>
              )}

              {decodedTableName === "Müşteriler" && (
                <button
                  onClick={() => setMusteriEkleModalOpen(true)}
                  className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Yeni Müşteri Ekle
                </button>
              )}

              {decodedTableName === "suppliers" && (
                <button
                  onClick={() => setTedarikciEkleModalOpen(true)}
                  className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Yeni Tedarikçi Ekle
                </button>
              )}

              {decodedTableName === "SatınAlma siparişleri" && (
                <button
                  onClick={() => setSatinAlmaSiparisiEkleModalOpen(true)}
                  className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  SatınAlma Siparişi Gir
                </button>
              )}

              {decodedTableName === "Reçeteler" && (
                <a
                  href="/formlar/recete-kaydi"
                  className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Yeni Reçete Ekle
                </a>
              )}

              {decodedTableName === "Stok" && (
                <>
                  <button
                    onClick={() => setStokKartiEkleModalOpen(true)}
                    className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Stok Kartı Oluştur
                  </button>

                  <button
                    onClick={() => setStokHareketModalOpen(true)}
                    className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                    STOK GİRİŞ/ÇIKIŞ
                  </button>
                </>
              )}

              {decodedTableName === "Üretim Kuyruğu" && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {userRolBilgileri?.yeni_uretim_girebilir && (
                    <button
                      onClick={() => setUretimGirModalOpen(true)}
                      className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Yeni Üretim Gir
                    </button>
                  )}

                  {userRolBilgileri?.kalan_bulk_sifirla && (
                    <button
                      onClick={() => {
                        if (tableData.length > 0) {
                          const firstRow = tableData[0];
                          setSelectedUretimKuyrugu({
                            id: firstRow.id,
                            receteAdi: firstRow["Reçete Adı"] || "Seçili Kayıt",
                          });
                          setBulkSifirlamaModalOpen(true);
                        } else {
                          alert(
                            "Sıfırlanacak kayıt bulunamadı. Lütfen önce bir üretim kaydı ekleyin.",
                          );
                        }
                      }}
                      className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414 1.414l-3 3a1 1 0 00-1.414 0l-3-3a1 1 0 000-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Kalan Bulk Sıfırla
                    </button>
                  )}

                  {userRolBilgileri?.uretimi_sil && (
                    <button
                      onClick={() => setUretimSilModalOpen(true)}
                      className="flex items-center justify-center px-4 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Üretimi Sil
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {searchQuery && (
          <div className="mb-4 text-sm text-gray-500">
            Arama sonucu: {filteredData.length} kayıt bulundu
          </div>
        )}

        {decodedTableName === "Stok" && showKritikStok && (
          <div className="mb-4">
            <div className="mb-2 p-3 rounded bg-red-50 border border-red-300 animate-neon-pulse">
              <p className="text-sm font-semibold text-red-600 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 mr-2 text-red-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {kritikStokKategori === "hepsi"
                  ? "Net Stok miktarı kritik stok miktarının altına düşmüş olanları görüyorsunuz!"
                  : kritikStokKategori === "hammadde"
                    ? "Kritik Stoğun altında düşmüş HAMMADDELER!"
                    : "Kritik stoğun altına düşmüş AMBALAJLAR!"}
              </p>
            </div>
            <p className="text-sm text-gray-700 mb-2">Kategori Filtresi:</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleKritikStokKategori("hepsi")}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  kritikStokKategori === "hepsi"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Tümünü Göster
              </button>
              <button
                onClick={() => handleKritikStokKategori("hammadde")}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  kritikStokKategori === "hammadde"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Hammadde Göster
              </button>
              <button
                onClick={() => handleKritikStokKategori("ambalaj")}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  kritikStokKategori === "ambalaj"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Ambalaj Göster
              </button>
              <button
                onClick={() => setShowKritikStok(false)}
                className="px-3 py-1 text-xs font-medium rounded bg-gray-700 text-white hover:bg-gray-800"
              >
                Normal Tabloya Dön
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white shadow rounded-lg p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Veriler yükleniyor...</span>
          </div>
        ) : error ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        ) : (
          <DataTable
            columns={tableSchema.columns.filter(
              (column) =>
                decodedTableName !== "Bitmiş Ürün Stoğu" ||
                column.name !== "Üretim Kuyruğu Referans",
            )}
            data={filteredData.length > 0 ? filteredData : tableData}
            tableName={decodedTableName}
            onReceteClick={handleReceteClick}
            onTeslimatClick={
              decodedTableName === "Bitmiş Ürün Stoğu"
                ? handleTeslimatClick
                : undefined
            }
          />
        )}

        {decodedTableName === "Bitmiş Ürün Stoğu" && (
          <>
            <TeslimatGecmisiModal
              isOpen={teslimatModalOpen}
              urunId={selectedUrun?.id || 0}
              urunAdi={selectedUrun?.name || ""}
              onClose={() => setTeslimatModalOpen(false)}
              musteri={selectedUrun?.musteri}
              ambalaj={selectedUrun?.ambalaj}
              stok={selectedUrun?.stok}
              kalanAdet={selectedUrun?.kalanAdet}
            />

            <TeslimatModal
              isOpen={isModalOpen}
              urunAdi={selectedItem?.recipeName || ""}
              onConfirm={handleTeslimatConfirm}
              onCancel={handleTeslimatCancel}
              isUpdating={updating}
              kullaniciAdSoyad={user?.ad_soyad || ""}
            />
          </>
        )}

        {decodedTableName === "Müşteriler" && (
          <MusteriEkleModal
            isOpen={musteriEkleModalOpen}
            onClose={() => setMusteriEkleModalOpen(false)}
            onSuccess={() => {
              setMusteriEkleModalOpen(false);
              handleRefresh();
            }}
          />
        )}

        {decodedTableName === "suppliers" && (
          <TedarikciEkleModal
            isOpen={tedarikciEkleModalOpen}
            onClose={() => setTedarikciEkleModalOpen(false)}
            onSuccess={() => {
              setTedarikciEkleModalOpen(false);
              handleRefresh();
            }}
          />
        )}

        {decodedTableName === "SatınAlma siparişleri" && (
          <SatinAlmaSiparisiEkleModal
            isOpen={satinAlmaSiparisiEkleModalOpen}
            onClose={() => setSatinAlmaSiparisiEkleModalOpen(false)}
            onSuccess={() => {
              setSatinAlmaSiparisiEkleModalOpen(false);
              handleRefresh();
            }}
          />
        )}

        {decodedTableName === "Stok" && (
          <>
            <StokKartiEkleModal
              isOpen={stokKartiEkleModalOpen}
              onClose={() => setStokKartiEkleModalOpen(false)}
              onSuccess={() => {
                setStokKartiEkleModalOpen(false);
                handleRefresh();
              }}
            />

            {stokHareketModalOpen && (
              <StokHareketModal
                isOpen={stokHareketModalOpen}
                onClose={() => setStokHareketModalOpen(false)}
                onSuccess={() => {
                  setStokHareketModalOpen(false);
                  handleRefresh();
                }}
              />
            )}
          </>
        )}

        {decodedTableName === "Üretim Kuyruğu" && (
          <>
            <UretimGirModal
              isOpen={uretimGirModalOpen}
              onClose={() => setUretimGirModalOpen(false)}
              onSuccess={() => {
                setUretimGirModalOpen(false);
                handleRefresh();
              }}
            />

            <BulkSifirlamaModal
              isOpen={bulkSifirlamaModalOpen}
              onClose={() => setBulkSifirlamaModalOpen(false)}
              onSuccess={() => {
                setBulkSifirlamaModalOpen(false);
                handleRefresh();
                setSelectedUretimKuyrugu(null);
              }}
            />

            <UretimSilModal
              isOpen={uretimSilModalOpen}
              onClose={() => setUretimSilModalOpen(false)}
              onSuccess={() => {
                setUretimSilModalOpen(false);
                handleRefresh();
              }}
            />

            {selectedUretimEmri && (
              <UretimEmriModal
                isOpen={isUretimEmriModalOpen}
                onClose={() => {
                  setIsUretimEmriModalOpen(false);
                  setSelectedUretimEmri(null);
                }}
                receteAdi={selectedUretimEmri.receteAdi}
                uretimMiktari={selectedUretimEmri.uretimMiktari}
                uretimTarihi={selectedUretimEmri.uretimTarihi}
              />
            )}
          </>
        )}
      </DashboardLayout>
    </PageGuard>
  );
} 