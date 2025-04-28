import React, { useState, useEffect, useRef } from "react";
import {
  updateData,
  fetchAllFromTable,
  broadcastUretimKuyruguUpdate,
} from "@/app/lib/supabase";

interface BulkSifirlamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedReceteInfo {
  id: number;
  receteAdi: string;
  kalanBulk: number;
  marka: string;
  uretimTarihi: string;
  musteri: string;
}

const BulkSifirlamaModal: React.FC<BulkSifirlamaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uretimKuyruguData, setUretimKuyruguData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecete, setSelectedRecete] =
    useState<SelectedReceteInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal açıldığında üretim kuyruğu verilerini yükle
  useEffect(() => {
    if (isOpen) {
      loadUretimKuyruguData();
    } else {
      // Modal kapandığında state'i sıfırla
      setSearchQuery("");
      setSelectedRecete(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Dropdown dışına tıklanınca kapatma işlemi
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    // Event listener'ı ekle
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Cleanup
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Üretim kuyruğu verilerini getir
  const loadUretimKuyruguData = async () => {
    setDataLoading(true);
    try {
      const data = await fetchAllFromTable("Üretim Kuyruğu", true);

      // Üretimi yapılmış ve kalan bulk değeri sıfırdan büyük olan kayıtları filtrele
      const filteredRecords = data.filter((item: any) => {
        const uretimYapildi = item["Üretim Yapıldı mı?"] === true;
        const kalanBulk = parseFloat(item["Kalan Bulk (Kg)"]) || 0;
        return uretimYapildi && kalanBulk > 0;
      });

      setUretimKuyruguData(filteredRecords);
      setFilteredData(filteredRecords);
    } catch (err) {
      console.error("Üretim kuyruğu verileri yüklenirken hata oluştu:", err);
      setError("Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setDataLoading(false);
    }
  };

  // Arama sonuçlarını filtrele
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(uretimKuyruguData);
      return;
    }

    const search = searchQuery.toLowerCase().trim();
    const filtered = uretimKuyruguData.filter((item) =>
      item["Reçete Adı"]?.toLowerCase().includes(search),
    );

    setFilteredData(filtered);
  }, [searchQuery, uretimKuyruguData]);

  // Tarihi formatlama yardımcı fonksiyonu
  const formatTarih = (tarih: string | null | undefined): string => {
    if (!tarih) return "Belirtilmemiş";

    try {
      const date = new Date(tarih);
      if (isNaN(date.getTime())) return "Geçersiz Tarih";
      return date.toLocaleDateString("tr-TR");
    } catch {
      return "Geçersiz Tarih";
    }
  };

  // Reçete seçme
  const handleReceteSelect = (item: any) => {
    setSelectedRecete({
      id: item.id,
      receteAdi: item["Reçete Adı"],
      kalanBulk: parseFloat(item["Kalan Bulk (Kg)"]) || 0,
      marka: item["Marka"] || "Belirtilmemiş",
      uretimTarihi: formatTarih(item["Üretim Emir Tarihi"]),
      musteri: item["Müşteri"] || "Belirtilmemiş",
    });
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // Dropdown açma
  const handleDropdownClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleConfirm = async () => {
    if (!selectedRecete) {
      setError("Lütfen bir reçete seçin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Kalan Bulk (Kg) sütununu 0 olarak güncelle
      await updateData("Üretim Kuyruğu", selectedRecete.id, {
        "Kalan Bulk (Kg)": 0,
      });
      
      // Değişikliği tüm kullanıcılara bildir (yeni üretim değil)
      broadcastUretimKuyruguUpdate(false);

      // Başarılı ise
      onSuccess();
    } catch (err) {
      console.error("Kalan Bulk sıfırlanırken hata oluştu:", err);
      setError("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl">
        {/* Dikkat çekici başlık alanı */}
        <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-200">
          <div className="text-red-500 mb-3">
            <svg
              className="h-20 w-20 animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-center text-gray-900">
            Kalan Bulk Miktarını Sıfırla
          </h3>
          <p className="mt-2 text-sm text-gray-600 text-center max-w-xs">
            Bu işlem sonucunda seçilen reçetenin kalan bulk değeri{" "}
            <strong>kalıcı olarak sıfırlanacaktır</strong> ve geri alınamaz!
          </p>
        </div>

        {/* Reçete seçme alanı */}
        <div className="mb-6">
          <label
            htmlFor="recete-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Reçete Seçin
          </label>
          <div className="relative" ref={dropdownRef}>
            {/* Seçim kutusu */}
            <div
              className="cursor-pointer w-full px-4 py-3 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500 flex justify-between items-center"
              onClick={handleDropdownClick}
            >
              <span className={selectedRecete ? "text-black" : "text-gray-400"}>
                {selectedRecete
                  ? selectedRecete.receteAdi
                  : "Reçete seçmek için tıklayın..."}
              </span>
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {dataLoading && (
                <div className="absolute right-10 top-3">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Dropdown seçim listesi */}
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                {/* Arama kutusu */}
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Reçete ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Reçete listesi */}
                {filteredData.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <li
                        key={item.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition duration-150"
                        onClick={() => handleReceteSelect(item)}
                      >
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {item["Reçete Adı"]}
                          </span>
                          <span className="text-xs text-gray-500">
                            Kalan: {item["Kalan Bulk (Kg)"]} kg
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            ID: {item.id}
                          </span>
                          <span className="text-xs text-gray-500">
                            Tarih: {formatTarih(item["Üretim Emir Tarihi"])}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            Marka: {item["Marka"] || "Belirtilmemiş"}
                          </span>
                          <span className="text-xs text-gray-500">
                            Müşteri: {item["Müşteri"] || "Belirtilmemiş"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500">
                    {uretimKuyruguData.length === 0
                      ? "Sıfırlanabilecek bulk değeri olan reçete bulunamadı."
                      : "Arama kriterine uygun reçete bulunamadı."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seçili reçete bilgisi */}
        {selectedRecete && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-yellow-600">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 w-full">
                <p className="text-sm font-bold text-yellow-800">
                  Seçili Reçete:
                </p>
                <p className="text-md font-medium text-yellow-700">
                  {selectedRecete.receteAdi}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="text-sm">
                    <span className="font-medium text-yellow-800">ID:</span>
                    <span className="text-yellow-700 ml-1">
                      {selectedRecete.id}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-yellow-800">
                      Kalan Bulk:
                    </span>
                    <span className="text-yellow-700 ml-1">
                      {selectedRecete.kalanBulk} kg
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-yellow-800">
                      Üretim Tarihi:
                    </span>
                    <span className="text-yellow-700 ml-1">
                      {selectedRecete.uretimTarihi}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-yellow-800">Marka:</span>
                    <span className="text-yellow-700 ml-1">
                      {selectedRecete.marka}
                    </span>
                  </div>
                  <div className="text-sm col-span-2">
                    <span className="font-medium text-yellow-800">
                      Müşteri:
                    </span>
                    <span className="text-yellow-700 ml-1">
                      {selectedRecete.musteri}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md border border-red-200">
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
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={loading || !selectedRecete}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                İşleniyor...
              </div>
            ) : (
              "Sıfırlamayı Onayla"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSifirlamaModal;
