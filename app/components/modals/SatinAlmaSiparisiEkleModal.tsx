'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { fetchAllFromTable } from '@/app/lib/supabase';

interface SatinAlmaSiparisiEkleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SatinAlmaSiparisiEkleModal: React.FC<SatinAlmaSiparisiEkleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [alinanUrun, setAlinanUrun] = useState('');
  const [tedarikciID, setTedarikciID] = useState('');
  const [siparisMiktari, setSiparisMiktari] = useState('');
  const [birim, setBirim] = useState('');
  const [teslimDurumu, setTeslimDurumu] = useState(false);
  const [notlar, setNotlar] = useState('');
  const [hammaddeID, setHammaddeID] = useState('');
  
  const [tedarikciListesi, setTedarikciListesi] = useState<any[]>([]);
  const [hammaddeListesi, setHammaddeListesi] = useState<any[]>([]);
  
  // Arama combobox için ek state'ler
  const [searchTerm, setSearchTerm] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [filteredHammaddeListesi, setFilteredHammaddeListesi] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Tedarikçi ve hammadde listelerini yükle
  useEffect(() => {
    if (isOpen) {
      fetchTedarikciListesi();
      fetchHammaddeListesi();
      setSearchTerm('');
      setIsComboboxOpen(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen]);
  
  // Arama terimine göre hammadde listesini filtrele
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHammaddeListesi(hammaddeListesi);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = hammaddeListesi.filter(hammadde => 
        hammadde['Hammadde Adı'].toLowerCase().includes(lowercasedSearch)
      );
      setFilteredHammaddeListesi(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchTerm, hammaddeListesi]);
  
  // Dışarı tıklandığında combobox'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTedarikciListesi = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('Tedarikçi Adı', { ascending: true });

      if (error) throw error;
      setTedarikciListesi(data || []);
    } catch (error) {
      console.error('Tedarikçiler yüklenirken hata oluştu:', error);
      setError('Tedarikçiler yüklenemedi. Lütfen sayfayı yenileyin.');
    }
  };

  const fetchHammaddeListesi = async () => {
    try {
      const data = await fetchAllFromTable('Stok', true);
      setHammaddeListesi(data || []);
    } catch (error) {
      console.error('Hammadde listesi yüklenirken hata oluştu:', error);
      setError('Hammadde listesi yüklenemedi. Lütfen sayfayı yenileyin.');
    }
  };

  const resetForm = () => {
    setAlinanUrun('');
    setTedarikciID('');
    setSiparisMiktari('');
    setBirim('');
    setTeslimDurumu(false);
    setNotlar('');
    setHammaddeID('');
    setSearchTerm('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  // Hammadde seçildiğinde
  const handleHammaddeSelect = (hammadde: any) => {
    setHammaddeID(hammadde['Hammadde ID']);
    setAlinanUrun(hammadde['Hammadde Adı']);
    setBirim(hammadde['Birim'] || '');
    setSearchTerm(hammadde['Hammadde Adı']);
    setIsComboboxOpen(false);
  };
  
  // Klavye navigasyonu için
  const handleComboboxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredHammaddeListesi.length === 0) return;
    
    // Down arrow
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredHammaddeListesi.length - 1 ? prev + 1 : prev
      );
    }
    // Up arrow
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Enter
    else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleHammaddeSelect(filteredHammaddeListesi[highlightedIndex]);
    }
    // Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      setIsComboboxOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Sipariş miktarını sayıya çevir
      const miktar = parseFloat(siparisMiktari);
      if (isNaN(miktar)) {
        throw new Error('Geçerli bir sipariş miktarı giriniz');
      }

      // Tedarikçi bilgisini al
      const secilenTedarikci = tedarikciListesi.find(t => t['Tedarikçi ID'] === tedarikciID);
      const tedarikciAdi = secilenTedarikci ? secilenTedarikci['Tedarikçi Adı'] : '';

      // Satın alma siparişi ekle
      const { data, error } = await supabase
        .from('SatınAlma siparişleri')
        .insert([
          {
            'Alınan Ürün': alinanUrun,
            'Tedarikçi ID': tedarikciID,
            'Tedarikçi': tedarikciAdi,
            'Sipariş Miktarı': miktar,
            'Birim': birim,
            'TeslimDurumu': false,
            'Notlar': notlar,
            'Hammadde ID': hammaddeID
          }
        ]);

      if (error) throw error;

      setSuccess(true);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Satın alma siparişi kaydedilirken hata oluştu:', error);
      setError(error.message || 'Sipariş eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Maximum sayıda gösterilecek sonuç
  const MAX_DISPLAY_RESULTS = 7;
  const displayResults = filteredHammaddeListesi.slice(0, MAX_DISPLAY_RESULTS);
  const hasMoreResults = filteredHammaddeListesi.length > MAX_DISPLAY_RESULTS;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-medium">Yeni Satın Alma Siparişi Ekle</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Satın alma siparişi başarıyla kaydedildi!</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Hammadde (Stok) Seçimi - Alınan Ürün olarak değiştirildi - Arama Özellikli */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label htmlFor="hammaddeSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Alınan Ürün
              </label>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                <p className="text-xs italic text-gray-500 flex-grow">
                  Eğer listede sipariş vereceğiniz ürün yoksa lütfen öncelikle stok tablosuna girip yeni stok kartı oluşturun
                </p>
                <Link 
                  href="/tablo/Stok"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Stok Tablosu
                </Link>
              </div>
              
              {/* Arama özellikli Combobox */}
              <div ref={comboboxRef} className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    id="hammaddeSearch"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsComboboxOpen(true);
                    }}
                    onFocus={() => setIsComboboxOpen(true)}
                    onKeyDown={handleComboboxKeyDown}
                    placeholder="Ürün adı ile arama yapın..."
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required={hammaddeID === ''}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                      className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {isComboboxOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
                
                {isComboboxOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {displayResults.length === 0 ? (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        Sonuç bulunamadı
                      </div>
                    ) : (
                      <>
                        {displayResults.map((hammadde, index) => (
                          <div
                            key={hammadde['Hammadde ID']}
                            onClick={() => handleHammaddeSelect(hammadde)}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                              highlightedIndex === index ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="block truncate font-medium">
                                {hammadde['Hammadde Adı']}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {hammadde['Birim'] || ''}
                              </span>
                            </div>
                            {hammadde['Hammadde ID'] === hammaddeID && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                </svg>
                              </span>
                            )}
                          </div>
                        ))}
                        {hasMoreResults && (
                          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                            {filteredHammaddeListesi.length - MAX_DISPLAY_RESULTS} daha fazla sonuç var. Aramanızı daraltın...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Seçili hammadde bilgisi */}
                {hammaddeID && (
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="font-semibold">Seçili ürün:</span> {alinanUrun} ({birim})
                  </div>
                )}
              </div>
            </div>

            {/* Alınan Ürün - Otomatik doldurulan ve değiştirilemez */}
            <div>
              <label htmlFor="alinanUrun" className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı
              </label>
              <input
                type="text"
                id="alinanUrun"
                value={alinanUrun}
                onChange={(e) => setAlinanUrun(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 bg-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Bu alan seçilen hammaddeye göre otomatik doldurulur</p>
            </div>

            {/* Tedarikçi Seçimi */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label htmlFor="tedarikciID" className="block text-sm font-medium text-gray-700 mb-2">
                Tedarikçi
              </label>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                <p className="text-xs italic text-gray-500 flex-grow">
                  Eğer listede tedarikçiniz yoksa lütfen öncelikle tedarikçi tablosuna gidip yeni tedarikçi oluşturun
                </p>
                <Link 
                  href="/tablo/suppliers"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Tedarikçi Tablosu
                </Link>
              </div>
              
              <select
                id="tedarikciID"
                value={tedarikciID}
                onChange={(e) => setTedarikciID(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value="">-- Tedarikçi Seçin --</option>
                {tedarikciListesi.map((tedarikci) => (
                  <option key={tedarikci['Tedarikçi ID']} value={tedarikci['Tedarikçi ID']}>
                    {tedarikci['Tedarikçi Adı']}
                  </option>
                ))}
              </select>
            </div>

            {/* Sipariş Miktarı ve Birim yan yana */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="siparisMiktari" className="block text-sm font-medium text-gray-700 mb-1">
                  Sipariş Miktarı
                </label>
                <input
                  type="number"
                  id="siparisMiktari"
                  value={siparisMiktari}
                  onChange={(e) => setSiparisMiktari(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="birim" className="block text-sm font-medium text-gray-700 mb-1">
                  Birim
                </label>
                <select
                  id="birim"
                  value={birim}
                  onChange={(e) => setBirim(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="Kg">Kg</option>
                  <option value="Lt">Lt</option>
                  <option value="Adet">Adet</option>
                </select>
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label htmlFor="notlar" className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                id="notlar"
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                rows={3}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Sipariş ile ilgili ek notları buraya yazabilirsiniz..."
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SatinAlmaSiparisiEkleModal; 