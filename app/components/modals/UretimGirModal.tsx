import React, { useState, useEffect } from "react";
import {
  insertData,
  fetchAllFromTable,
  broadcastUretimKuyruguUpdate,
} from "../../lib/supabase";

interface UretimGirModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UretimGirModal: React.FC<UretimGirModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form alanları
  const [receteAdi, setReceteAdi] = useState("");
  const [marka, setMarka] = useState("");
  const [bulkUretimEmri, setBulkUretimEmri] = useState("");
  const [seciliRecete, setSeciliRecete] = useState<any>(null);

  // Dropdown için veriler
  const [receteler, setReceteler] = useState<any[]>([]);
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [filteredReceteler, setFilteredReceteler] = useState<any[]>([]);
  const [filteredMarkalar, setFilteredMarkalar] = useState<any[]>([]);

  // Arama için
  const [receteArama, setReceteArama] = useState("");
  const [markaArama, setMarkaArama] = useState("");

  // UI durumları
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReceteDropdown, setShowReceteDropdown] = useState(false);
  const [showMarkaDropdown, setShowMarkaDropdown] = useState(false);

  // Modal açıldığında verileri çek
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Verileri yükle
  const loadData = async () => {
    setDataLoading(true);
    try {
      // Reçeteleri ve markaları çek
      const receteData = await fetchAllFromTable("Reçeteler");
      const musteriData = await fetchAllFromTable("Müşteriler");

      // Reçeteler tablosundan "Reçete Adı" değerlerini çek
      setReceteler(receteData);
      setFilteredReceteler(receteData);

      // Müşteriler tablosundan benzersiz "Marka" değerlerini çek
      const uniqueMarkalar = Array.from(
        new Set(musteriData.map((musteri: any) => musteri["Marka"])),
      ).filter(Boolean);
      const markaObjeler = uniqueMarkalar.map((marka) => ({ Marka: marka }));

      setMarkalar(markaObjeler);
      setFilteredMarkalar(markaObjeler);
    } catch (err) {
      console.error("Veriler yüklenirken hata oluştu:", err);
      setError(
        "Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.",
      );
    } finally {
      setDataLoading(false);
    }
  };

  // Reçete araması
  useEffect(() => {
    if (receteArama.trim() === "") {
      setFilteredReceteler(receteler);
      return;
    }

    const search = receteArama.toLowerCase().trim();
    const filtered = receteler.filter((recete) =>
      recete["Reçete Adı"]?.toLowerCase().includes(search),
    );

    setFilteredReceteler(filtered);
  }, [receteArama, receteler]);

  // Marka araması
  useEffect(() => {
    if (markaArama.trim() === "") {
      setFilteredMarkalar(markalar);
      return;
    }

    const search = markaArama.toLowerCase().trim();
    const filtered = markalar.filter((item) =>
      item["Marka"]?.toLowerCase().includes(search),
    );

    setFilteredMarkalar(filtered);
  }, [markaArama, markalar]);

  // Reçete seçme
  const handleReceteSelect = (seciliReceteObj: any) => {
    setReceteAdi(seciliReceteObj["Reçete Adı"]);
    setSeciliRecete(seciliReceteObj);
    setReceteArama("");
    setShowReceteDropdown(false);
  };

  // Marka seçme
  const handleMarkaSelect = (seciliMarka: any) => {
    setMarka(seciliMarka["Marka"]);
    setMarkaArama("");
    setShowMarkaDropdown(false);
  };

  // Sayısal değerler için input değişikliği
  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const value = e.target.value;

    // Sadece sayılar kabul edilir (boş veya sayı)
    if (value === "" || /^[0-9]+$/.test(value)) {
      setter(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validasyonu
    if (!receteAdi.trim()) {
      setError("Reçete adı seçilmelidir");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Üretim Kuyruğu tablosuna yeni kayıt ekle
      await insertData("Üretim Kuyruğu", {
        "Reçete Adı": receteAdi,
        Marka: marka,
        "Bulk Üretim Emri(Kg)": bulkUretimEmri
          ? parseInt(bulkUretimEmri)
          : null,
        "Ambalaj Emri (ml)": seciliRecete?.ml_bilgisi || null,
      });

      // Yeni üretim eklendiğini tüm kullanıcılara bildir (isNewProduction=true)
      broadcastUretimKuyruguUpdate(true);

      // Başarılı durumda form alanlarını temizle ve başarı fonksiyonunu çağır
      setReceteAdi("");
      setMarka("");
      setBulkUretimEmri("");
      setSeciliRecete(null);
      onSuccess();
    } catch (err) {
      console.error("Üretim kaydı eklenirken hata oluştu:", err);
      setError(
        "Üretim kaydı eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Yeni Üretim Gir
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
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
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-200">
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

        {dataLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-700">Veriler yükleniyor...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reçete Adı - Reçeteler tablosundan */}
            <div className="relative">
              <label
                htmlFor="receteAdi"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reçete Adı <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="receteAdi"
                  value={receteAdi || receteArama}
                  onChange={(e) => {
                    setReceteArama(e.target.value);
                    setReceteAdi("");
                  }}
                  onFocus={() => setShowReceteDropdown(true)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Reçete adı seçin veya arayın"
                  required
                  autoComplete="off"
                />
                {showReceteDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                    {filteredReceteler.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Sonuç bulunamadı
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredReceteler.map((recete, index) => (
                          <li
                            key={index}
                            onClick={() => handleReceteSelect(recete)}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-800">
                              {recete["Reçete Adı"]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Marka - Müşteriler tablosundan */}
            <div className="relative">
              <label
                htmlFor="marka"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Marka
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="marka"
                  value={marka || markaArama}
                  onChange={(e) => {
                    setMarkaArama(e.target.value);
                    setMarka("");
                  }}
                  onFocus={() => setShowMarkaDropdown(true)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Marka seçin veya arayın"
                  autoComplete="off"
                />
                {showMarkaDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                    {filteredMarkalar.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Sonuç bulunamadı
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredMarkalar.map((item, index) => (
                          <li
                            key={index}
                            onClick={() => handleMarkaSelect(item)}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-800">
                              {item["Marka"]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Üretim Emri - Sadece sayısal */}
            <div>
              <label
                htmlFor="bulkUretimEmri"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bulk Üretim Emri (Kg)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="bulkUretimEmri"
                  value={bulkUretimEmri}
                  onChange={(e) =>
                    handleNumericInputChange(e, setBulkUretimEmri)
                  }
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Örn: 100"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Kg</span>
                </div>
              </div>
            </div>

            {/* Ambalaj Emri Bilgisi (Salt okunur) */}
            {seciliRecete && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ambalaj Emri (ml)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-100 p-2">
                    {seciliRecete.ml_bilgisi || "Belirtilmemiş"}
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">ml</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
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
                    Kaydediliyor...
                  </div>
                ) : (
                  "Kaydet"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UretimGirModal;
