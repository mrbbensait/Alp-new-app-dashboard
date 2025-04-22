'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, X, AlertCircle, CheckCircle, XCircle, Clock, Search, ChevronRight, Filter } from 'lucide-react';

// Supabase client kurulumu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Talep {
  id: number;
  baslik: string;
  aciklama: string;
  aciliyet: 'yüksek' | 'orta' | 'düşük';
  durum: 'beklemede' | 'işlemde' | 'tamamlandı' | 'iptal';
  created_at: string;
  created_by?: string;
  created_by_name?: string;
}

interface TalepFormuProps {
  maxTalepler?: number;
}

const TalepFormu: React.FC<TalepFormuProps> = ({ maxTalepler = 5 }) => {
  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [tumTalepler, setTumTalepler] = useState<Talep[]>([]);
  const [beklemedeTalepSayisi, setBeklemedeTalepSayisi] = useState(0);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [aciliyet, setAciliyet] = useState<'yüksek' | 'orta' | 'düşük'>('orta');
  const [loading, setLoading] = useState(true);
  const [showAddTalepModal, setShowAddTalepModal] = useState(false);
  const [detayTalep, setDetayTalep] = useState<Talep | null>(null);
  const [showTumTaleplerModal, setShowTumTaleplerModal] = useState(false);
  const [seciliDurumFiltresi, setSeciliDurumFiltresi] = useState<string>('beklemede');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Talep[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [seciliAciliyetFiltresi, setSeciliAciliyetFiltresi] = useState<string | null>(null);

  // Talepleri yükle
  useEffect(() => {
    fetchTalepler();
    fetchTumTalepler();

    // Gerçek zamanlı güncellemeler için abonelik
    const subscription = supabase
      .channel('personel-talepler-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'personel_talepler' 
      }, () => {
        fetchTalepler();
        fetchTumTalepler();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Talepleri getir
  const fetchTalepler = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('personel_talepler')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxTalepler);

      if (error) {
        throw error;
      }

      if (data) {
        setTalepler(data);
      }
    } catch (error) {
      console.error('Talepler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tüm talepleri getir
  const fetchTumTalepler = async () => {
    try {
      const { data, error } = await supabase
        .from('personel_talepler')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setTumTalepler(data);
        const beklemedekiTalepler = data.filter(t => t.durum === 'beklemede');
        setBeklemedeTalepSayisi(beklemedekiTalepler.length);
      }
    } catch (error) {
      console.error('Tüm talepler yüklenirken hata:', error);
    }
  };

  // Filtrelenmiş talepleri getir
  const getFiltrelenmisVeSayfaninTalepleri = () => {
    let filtrelenmis = seciliDurumFiltresi === 'tümü' 
      ? tumTalepler 
      : tumTalepler.filter(talep => talep.durum === seciliDurumFiltresi);
    
    // Aciliyet filtrelemesi uygula
    if (seciliAciliyetFiltresi) {
      filtrelenmis = filtrelenmis.filter(talep => {
        if (seciliAciliyetFiltresi === 'acil') return talep.aciliyet === 'yüksek';
        if (seciliAciliyetFiltresi === 'normal') return talep.aciliyet === 'orta';
        if (seciliAciliyetFiltresi === 'düşük') return talep.aciliyet === 'düşük';
        return true; // 'tümü' durumunda
      });
    }
    
    // Sayfalama için başlangıç ve bitiş indeksleri
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      talepler: filtrelenmis.slice(startIndex, endIndex),
      toplamTalep: filtrelenmis.length,
      toplamSayfa: Math.ceil(filtrelenmis.length / itemsPerPage)
    };
  };

  // Sayfalama kontrolü için önceki ve sonraki sayfalara geçiş
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Yeni talep ekle
  const addTalep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baslik.trim()) return;

    try {
      // sessionStorage'dan kullanıcı bilgilerini al
      const userDataString = sessionStorage.getItem('user');
      let personelId = null;
      let personelName = null;
      
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData.id) {
            personelId = userData.id;
            personelName = userData.ad_soyad || userData.name || userData.email || 'Bilinmeyen Kullanıcı';
          }
        } catch (error) {
          console.error('Kullanıcı verisi ayrıştırılamadı:', error);
        }
      }
      
      // Talep verisi oluştur
      const talepData = {
        baslik,
        aciklama: aciklama.trim() || null,
        aciliyet,
        durum: 'beklemede',
        created_by: personelId,
        created_by_name: personelName,
      };
      
      const { data, error } = await supabase
        .from('personel_talepler')
        .insert([talepData])
        .select();

      if (error) {
        throw error;
      }

      // Başarılı ekleme
      setBaslik('');
      setAciklama('');
      setAciliyet('orta');
      setShowAddTalepModal(false);
      
      // Talepleri yeniden yükle
      fetchTalepler();
    } catch (error) {
      console.error('Talep eklenirken hata:', error);
    }
  };

  // Talep durumunu güncelle
  const updateTalepDurumu = async (talepId: number, yeniDurum: 'beklemede' | 'işlemde' | 'tamamlandı' | 'iptal') => {
    try {
      const { error } = await supabase
        .from('personel_talepler')
        .update({ durum: yeniDurum })
        .eq('id', talepId);

      if (error) {
        throw error;
      }

      // Talepleri yeniden yükle
      fetchTalepler();
    } catch (error) {
      console.error('Talep durumu güncellenirken hata:', error);
    }
  };

  // Aciliyet rengini belirle
  const getAciliyetRenk = (aciliyet: string) => {
    switch (aciliyet) {
      case 'yüksek': return 'text-red-500 bg-red-50 border-red-200';
      case 'orta': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'düşük': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  // Durum simgesi ve rengini belirle
  const getDurumDetay = (durum: string) => {
    switch (durum) {
      case 'beklemede': 
        return { 
          icon: <Clock className="w-4 h-4" />, 
          renk: 'text-blue-500 bg-blue-50 border-blue-200' 
        };
      case 'işlemde': 
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          renk: 'text-purple-500 bg-purple-50 border-purple-200' 
        };
      case 'tamamlandı': 
        return { 
          icon: <CheckCircle className="w-4 h-4" />, 
          renk: 'text-green-500 bg-green-50 border-green-200' 
        };
      case 'iptal': 
        return { 
          icon: <XCircle className="w-4 h-4" />, 
          renk: 'text-gray-500 bg-gray-50 border-gray-200' 
        };
      default: 
        return { 
          icon: <Clock className="w-4 h-4" />, 
          renk: 'text-gray-500 bg-gray-50 border-gray-200' 
        };
    }
  };

  // Tarihi formatla
  const formatTarih = (tarihStr: string) => {
    const tarih = new Date(tarihStr);
    return new Intl.DateTimeFormat('tr-TR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(tarih);
  };

  // Not ara
  const searchTalepler = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      setSearchPerformed(true);
      
      // Supabase'de metin araması yap
      const { data, error } = await supabase
        .from('personel_talepler')
        .select('*')
        .or(`baslik.ilike.%${searchTerm}%,aciklama.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Talepler aranırken hata:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Başlık alanı - Notlar bileşeniyle benzer tasarım */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h3 className="text-xl font-semibold text-gray-800">TALEPLER</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowAddTalepModal(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={16} className="mr-1" />
              YENİ TALEP
            </button>
            <button
              onClick={() => setShowSearchModal(true)} 
              className="px-3 py-1 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md flex items-center"
              title="Taleplerde ara"
            >
              <Search size={16} className="mr-1" />
              ARAMA
            </button>
          </div>
        </div>
      </div>

      {/* İçerik Alanı - Yüksekliği Notlar ile eşitlemek için min-h eklendi */}
      <div className="p-0 flex-grow min-h-[340px] max-h-[340px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Talepler yükleniyor...</p>
          </div>
        ) : talepler.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-blue-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">Henüz talep bulunmuyor</h4>
            <p className="text-gray-500 mb-6 max-w-md">
              Yeni bir talep oluşturarak personel taleplerini takip etmeye başlayabilirsiniz.
            </p>
            <button
              onClick={() => setShowAddTalepModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              İlk Talebi Oluştur
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-y-auto h-full">
            {talepler.map((talep) => (
              <li 
                key={talep.id} 
                className="px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setDetayTalep(talep)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${ 
                        talep.aciliyet === 'yüksek' ? 'bg-red-500' : 
                        talep.aciliyet === 'orta' ? 'bg-amber-500' : 'bg-green-500'
                      }`}></span>
                      <p className="font-medium text-gray-800 truncate">{talep.baslik}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getAciliyetRenk(talep.aciliyet)}`}>
                        {talep.aciliyet === 'yüksek' ? 'Acil' : talep.aciliyet === 'orta' ? 'Normal' : 'Düşük'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center whitespace-nowrap ${getDurumDetay(talep.durum).renk}`}>
                        {getDurumDetay(talep.durum).icon}
                        <span className="ml-1">
                          {talep.durum === 'beklemede' ? 'Beklemede' : 
                           talep.durum === 'işlemde' ? 'İşlemde' : 
                           talep.durum === 'tamamlandı' ? 'Tamamlandı' : 'İptal'}
                        </span>
                      </span>
                    </div>
                    {talep.aciklama && (
                      <p className="text-sm text-gray-500 mb-1 line-clamp-1 pl-4">{talep.aciklama}</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end flex-shrink-0">
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTarih(talep.created_at)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {talep.created_by_name ? talep.created_by_name.split(' ')[0] : ''}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alt Bilgi Alanı - Tüm talepleri görüntüleme butonu */}
      <div className="p-3 border-t border-gray-200 flex justify-between items-center bg-gray-50 text-sm">
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-1 text-blue-500" />
          <span>Beklemede olan talep: <b>{beklemedeTalepSayisi}</b></span>
        </div>
        <button 
          onClick={() => {
            setShowTumTaleplerModal(true);
            setSeciliDurumFiltresi('beklemede');
            setSeciliAciliyetFiltresi('acil');
            setCurrentPage(1);
          }}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="mr-1">Diğer talepleri gör</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Yeni Talep Ekleme Modal */}
      {showAddTalepModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Yeni Talep Oluştur</h3>
              <button 
                onClick={() => setShowAddTalepModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X />
              </button>
            </div>

            <form onSubmit={addTalep} className="p-4">
              <div className="mb-4">
                <label htmlFor="baslik" className="block text-sm font-medium text-gray-700 mb-1">
                  Talep Başlığı*
                </label>
                <input
                  type="text"
                  id="baslik"
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Talep başlığını girin"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="aciklama" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="aciklama"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Talep detaylarını yazabilirsiniz"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aciliyet Durumu
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAciliyet('düşük')}
                    className={`flex-1 py-2 rounded-md border ${
                      aciliyet === 'düşük' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Düşük
                  </button>
                  <button
                    type="button"
                    onClick={() => setAciliyet('orta')}
                    className={`flex-1 py-2 rounded-md border ${
                      aciliyet === 'orta' 
                        ? 'bg-amber-50 border-amber-500 text-amber-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAciliyet('yüksek')}
                    className={`flex-1 py-2 rounded-md border ${
                      aciliyet === 'yüksek' 
                        ? 'bg-red-50 border-red-500 text-red-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Acil
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddTalepModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md mr-2 hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Talep Detay Modal */}
      {detayTalep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Talep Detayı</h3>
              <button 
                onClick={() => setDetayTalep(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X />
              </button>
            </div>

            <div className="p-4">
              <h4 className="text-xl font-medium text-gray-800 mb-2">{detayTalep.baslik}</h4>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full border ${getAciliyetRenk(detayTalep.aciliyet)}`}>
                  {detayTalep.aciliyet === 'yüksek' ? 'Acil' : detayTalep.aciliyet === 'orta' ? 'Normal' : 'Düşük'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border flex items-center ${getDurumDetay(detayTalep.durum).renk}`}>
                  {getDurumDetay(detayTalep.durum).icon}
                  <span className="ml-1">
                    {detayTalep.durum === 'beklemede' ? 'Beklemede' : 
                     detayTalep.durum === 'işlemde' ? 'İşlemde' : 
                     detayTalep.durum === 'tamamlandı' ? 'Tamamlandı' : 'İptal'}
                  </span>
                </span>
              </div>

              {detayTalep.aciklama && (
                <div className="mb-4">
                  <p className="text-gray-600 whitespace-pre-line">{detayTalep.aciklama}</p>
                </div>
              )}

              <div className="text-sm text-gray-500 mb-4">
                <p>Oluşturan: {detayTalep.created_by_name || 'Bilinmeyen Kullanıcı'}</p>
                <p>Tarih: {formatTarih(detayTalep.created_at)}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium mb-2">Durumu Güncelle:</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      updateTalepDurumu(detayTalep.id, 'beklemede');
                      setDetayTalep(null);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border flex items-center ${
                      detayTalep.durum === 'beklemede' 
                        ? 'bg-blue-100 border-blue-500 text-blue-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Beklemede
                  </button>
                  <button 
                    onClick={() => {
                      updateTalepDurumu(detayTalep.id, 'işlemde');
                      setDetayTalep(null);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border flex items-center ${
                      detayTalep.durum === 'işlemde' 
                        ? 'bg-purple-100 border-purple-500 text-purple-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    İşlemde
                  </button>
                  <button 
                    onClick={() => {
                      updateTalepDurumu(detayTalep.id, 'tamamlandı');
                      setDetayTalep(null);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border flex items-center ${
                      detayTalep.durum === 'tamamlandı' 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Tamamlandı
                  </button>
                  <button 
                    onClick={() => {
                      updateTalepDurumu(detayTalep.id, 'iptal');
                      setDetayTalep(null);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border flex items-center ${
                      detayTalep.durum === 'iptal' 
                        ? 'bg-gray-100 border-gray-500 text-gray-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tüm Talepler Modal */}
      {showTumTaleplerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Tüm Talepler</h3>
              <button 
                onClick={() => setShowTumTaleplerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X />
              </button>
            </div>

            {/* Filtreleme Seçenekleri */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              {/* Durum Filtreleri */}
              <div className="flex items-center mb-3">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium mr-3">Durum:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSeciliDurumFiltresi('tümü');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      seciliDurumFiltresi === 'tümü' 
                        ? 'bg-gray-200 border-gray-400 text-gray-800' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => {
                      setSeciliDurumFiltresi('beklemede');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border flex items-center ${
                      seciliDurumFiltresi === 'beklemede' 
                        ? 'bg-blue-100 border-blue-500 text-blue-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Beklemede
                  </button>
                  <button
                    onClick={() => {
                      setSeciliDurumFiltresi('işlemde');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border flex items-center ${
                      seciliDurumFiltresi === 'işlemde' 
                        ? 'bg-purple-100 border-purple-500 text-purple-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    İşlemde
                  </button>
                  <button
                    onClick={() => {
                      setSeciliDurumFiltresi('tamamlandı');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border flex items-center ${
                      seciliDurumFiltresi === 'tamamlandı' 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Tamamlandı
                  </button>
                  <button
                    onClick={() => {
                      setSeciliDurumFiltresi('iptal');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border flex items-center ${
                      seciliDurumFiltresi === 'iptal' 
                        ? 'bg-gray-100 border-gray-500 text-gray-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    İptal
                  </button>
                </div>
              </div>
              
              {/* Aciliyet Filtreleri */}
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium mr-3">Aciliyet:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSeciliAciliyetFiltresi(null);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      seciliAciliyetFiltresi === null 
                        ? 'bg-gray-200 border-gray-400 text-gray-800' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => {
                      setSeciliAciliyetFiltresi('acil');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      seciliAciliyetFiltresi === 'acil' 
                        ? 'bg-red-100 border-red-500 text-red-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Acil
                  </button>
                  <button
                    onClick={() => {
                      setSeciliAciliyetFiltresi('normal');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      seciliAciliyetFiltresi === 'normal' 
                        ? 'bg-amber-100 border-amber-500 text-amber-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => {
                      setSeciliAciliyetFiltresi('düşük');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      seciliAciliyetFiltresi === 'düşük' 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Düşük
                  </button>
                </div>
              </div>
            </div>

            {/* Talep Listesi */}
            <div className="overflow-y-auto flex-grow">
              {tumTalepler.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">Henüz talep bulunmuyor</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Talep
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aciliyet
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFiltrelenmisVeSayfaninTalepleri().talepler.map((talep) => (
                      <tr 
                        key={talep.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setDetayTalep(talep);
                          setShowTumTaleplerModal(false);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              talep.aciliyet === 'yüksek' ? 'bg-red-500' : 
                              talep.aciliyet === 'orta' ? 'bg-amber-500' : 'bg-green-500'
                            }`}></span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{talep.baslik}</div>
                              {talep.aciklama && (
                                <div className="text-sm text-gray-500 line-clamp-1">{talep.aciklama}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            talep.aciliyet === 'yüksek' ? 'bg-red-100 text-red-800' : 
                            talep.aciliyet === 'orta' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {talep.aciliyet === 'yüksek' ? 'Acil' : talep.aciliyet === 'orta' ? 'Normal' : 'Düşük'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                            talep.durum === 'beklemede' ? 'bg-blue-100 text-blue-800' : 
                            talep.durum === 'işlemde' ? 'bg-purple-100 text-purple-800' :
                            talep.durum === 'tamamlandı' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getDurumDetay(talep.durum).icon}
                            <span className="ml-1">
                              {talep.durum === 'beklemede' ? 'Beklemede' : 
                               talep.durum === 'işlemde' ? 'İşlemde' : 
                               talep.durum === 'tamamlandı' ? 'Tamamlandı' : 'İptal'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTarih(talep.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {talep.created_by_name || 'Bilinmeyen Kullanıcı'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Sayfalama */}
            {getFiltrelenmisVeSayfaninTalepleri().toplamSayfa > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Toplam <span className="font-medium">{getFiltrelenmisVeSayfaninTalepleri().toplamTalep}</span> talep
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: getFiltrelenmisVeSayfaninTalepleri().toplamSayfa }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 border text-sm rounded ${
                        currentPage === i + 1
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arama modalı */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Taleplerde Ara</h3>
            </div>
            
            <div className="p-4">
              <div className="flex mb-4">
                <input
                  type="text"
                  placeholder="Anahtar kelime..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchPerformed(false); // Arama terimi değiştiyse, arama durumunu sıfırla
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={searchTalepler}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Ara
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {loading && searchPerformed ? (
                  <div className="text-center py-4">Aranıyor...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-2">
                    {searchResults.map((talep) => (
                      <li 
                        key={talep.id} 
                        className="p-3 bg-white rounded border border-gray-200 shadow-sm relative group cursor-pointer"
                        onClick={() => {
                          setShowSearchModal(false);
                          setDetayTalep(talep);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${ 
                            talep.aciliyet === 'yüksek' ? 'bg-red-500' : 
                            talep.aciliyet === 'orta' ? 'bg-amber-500' : 'bg-green-500'
                          }`}></span>
                          <p className="text-sm font-medium text-gray-800">{talep.baslik}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getAciliyetRenk(talep.aciliyet)}`}>
                            {talep.aciliyet === 'yüksek' ? 'Acil' : talep.aciliyet === 'orta' ? 'Normal' : 'Düşük'}
                          </span>
                        </div>
                        {talep.aciklama && (
                          <p className="text-sm text-gray-500 mb-1 pl-4">{talep.aciklama}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center whitespace-nowrap ${getDurumDetay(talep.durum).renk}`}>
                            {getDurumDetay(talep.durum).icon}
                            <span className="ml-1">
                              {talep.durum === 'beklemede' ? 'Beklemede' : 
                               talep.durum === 'işlemde' ? 'İşlemde' : 
                               talep.durum === 'tamamlandı' ? 'Tamamlandı' : 'İptal'}
                            </span>
                          </span>
                          <p className="text-xs text-gray-500">
                            {new Date(talep.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : searchPerformed ? (
                  <div className="text-center py-4 text-gray-500">
                    Arama sonucu bulunamadı.
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {searchTerm ? "Aramak için 'Ara' butonuna tıklayın." : "Arama yapmak için bir anahtar kelime girin."}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchTerm('');
                    setSearchResults([]);
                    setSearchPerformed(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalepFormu; 