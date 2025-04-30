'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, X, AlertTriangle, Calendar, Filter, List } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '@/app/lib/supabase';

interface Note {
  id: number;
  metin: string;
  tarih: string;
  etiketler: string[];
  created_at: string;
  created_by?: number;
  created_by_name?: string;
}

interface NotesProps {
  maxNotes?: number;
}

const Notes: React.FC<NotesProps> = ({ maxNotes = 10 }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showThisWeekModal, setShowThisWeekModal] = useState(false);
  const [showLastWeekModal, setShowLastWeekModal] = useState(false);
  const [showAllNotesModal, setShowAllNotesModal] = useState(false);
  const [thisWeekNotes, setThisWeekNotes] = useState<Note[]>([]);
  const [lastWeekNotes, setLastWeekNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [visibleNotes, setVisibleNotes] = useState(0);
  const { user } = useAuth();

  // Notları yükle
  useEffect(() => {
    fetchNotes();

    // Gerçek zamanlı güncellemeler için abonelik
    const subscription = supabase
      .channel('personel-notlar-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'personel_notlar' 
      }, (payload) => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Bağımlılıkları kaldır, sadece bir kez yükle

  // Tüm notları getir
  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      // Son eklenen notları getir 
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .order('created_at', { ascending: false })
        .limit(maxNotes);

      if (error) {
        throw error;
      }

      if (data) {
        // Kullanıcı bilgisini düzenle
        const notesWithUserInfo = data.map(note => ({
          ...note,
          created_by_name: note.personel?.ad_soyad || 'Bilinmeyen Kullanıcı'
        }));
        
        setNotes(notesWithUserInfo);
        setVisibleNotes(notesWithUserInfo.length);
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bu haftanın başlangıç ve bitiş tarihlerini hesapla
  const getThisWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Pazar, 1 = Pazartesi...
    
    // Pazartesi gününü bul (Eğer bugün pazar ise, bir önceki pazartesi)
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff);
    monday.setHours(0, 0, 0, 0);
    
    // Pazar gününü bul
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
  };
  
  // Geçen haftanın başlangıç ve bitiş tarihlerini hesapla
  const getLastWeekDates = () => {
    const { monday } = getThisWeekDates();
    
    // Geçen haftanın pazartesi günü
    const lastMonday = new Date(monday);
    lastMonday.setDate(monday.getDate() - 7);
    
    // Geçen haftanın pazar günü
    const lastSunday = new Date(monday);
    lastSunday.setDate(monday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);
    
    return { lastMonday, lastSunday };
  };

  // Bu haftanın notlarını getir
  const fetchThisWeekNotes = async () => {
    try {
      setFilterLoading(true);
      
      const { monday, sunday } = getThisWeekDates();
      
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .gte('tarih', formatDateForQuery(monday))
        .lte('tarih', formatDateForQuery(sunday))
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const notesWithUserInfo = data.map(note => ({
          ...note,
          created_by_name: note.personel?.ad_soyad || 'Bilinmeyen Kullanıcı'
        }));
        
        setThisWeekNotes(notesWithUserInfo);
      }
    } catch (error) {
      console.error('Bu haftanın notları yüklenirken hata:', error);
    } finally {
      setFilterLoading(false);
    }
  };
  
  // Geçen haftanın notlarını getir
  const fetchLastWeekNotes = async () => {
    try {
      setFilterLoading(true);
      
      const { lastMonday, lastSunday } = getLastWeekDates();
      
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .gte('tarih', formatDateForQuery(lastMonday))
        .lte('tarih', formatDateForQuery(lastSunday))
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const notesWithUserInfo = data.map(note => ({
          ...note,
          created_by_name: note.personel?.ad_soyad || 'Bilinmeyen Kullanıcı'
        }));
        
        setLastWeekNotes(notesWithUserInfo);
      }
    } catch (error) {
      console.error('Geçen haftanın notları yüklenirken hata:', error);
    } finally {
      setFilterLoading(false);
    }
  };
  
  // Tüm notları getir
  const fetchAllNotes = async () => {
    try {
      setFilterLoading(true);
      
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const notesWithUserInfo = data.map(note => ({
          ...note,
          created_by_name: note.personel?.ad_soyad || 'Bilinmeyen Kullanıcı'
        }));
        
        setAllNotes(notesWithUserInfo);
      }
    } catch (error) {
      console.error('Tüm notlar yüklenirken hata:', error);
    } finally {
      setFilterLoading(false);
    }
  };

  // Not ara
  const searchNotes = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      setSearchPerformed(true);
      
      // Supabase'de metin araması yap (oluşturan kullanıcı bilgisiyle birlikte)
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .ilike('metin', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      if (data) {
        // Kullanıcı bilgisini düzenle
        const resultsWithUserInfo = data.map(note => ({
          ...note,
          created_by_name: note.personel?.ad_soyad || 'Bilinmeyen Kullanıcı'
        }));
        
        setSearchResults(resultsWithUserInfo);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Notlar aranırken hata:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Not ekleme işlevleri için bugünün tarihini tanımla
  const today = new Date();
  
  // Not ekle
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      // Etiketleri al (# ile başlayan kelimeler)
      const etiketler = newNote.match(/#(\w+)/g) || [];
      const formatlanmisEtiketler = etiketler.map(etiket => etiket.substring(1));

      // Bugünün tarihini kullan
      const bugununTarihi = today;
      
      // sessionStorage'dan kullanıcı bilgilerini al
      const userDataString = sessionStorage.getItem('user');
      let personelId = null;
      let personelAdSoyad = 'Bilinmeyen Kullanıcı';
      
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData.id) {
            personelId = userData.id;
            personelAdSoyad = userData.ad_soyad || personelAdSoyad;
            console.log('Kullanıcı ID:', personelId, 'Ad Soyad:', personelAdSoyad);
          }
        } catch (error) {
          console.error('Kullanıcı verisi ayrıştırılamadı:', error);
        }
      }
      
      // Hazırlanan veriyi oluşturma
      const noteData: {
        metin: string;
        etiketler: string[] | null;
        tarih: string;
        created_by?: string; // UUID formatında string olmalı
      } = { 
        metin: newNote,
        etiketler: formatlanmisEtiketler.length > 0 ? formatlanmisEtiketler : null,
        tarih: formatDateForQuery(bugununTarihi)
      };
      
      // Eğer kullanıcı ID'si varsa ekle
      if (personelId) {
        noteData.created_by = personelId;
      }
      
      console.log('Eklenecek not verisi:', noteData);
      
      const { data, error } = await supabase
        .from('personel_notlar')
        .insert([noteData])
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `);

      if (error) {
        console.error('Supabase hatası:', error);
        throw error;
      }

      // Not başarıyla eklendiyse, manuel olarak güncelleyelim
      if (data && data.length > 0) {
        // Kullanıcı bilgilerini ekle
        const newNote = {
          ...data[0],
          created_by_name: data[0].personel?.ad_soyad || personelAdSoyad
        };
        
        // Notları güncelle ve en üste ekle
        setNotes(prevNotes => [newNote, ...prevNotes]);
      }
      
      setNewNote('');
      setShowAddNoteModal(false);
    } catch (error) {
      console.error('Not eklenirken hata:', error);
      alert(`Not eklenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Not silme onayı iste
  const confirmDeleteNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToDelete(note);
    setShowDeleteConfirmModal(true);
  };

  // Not sil
  const deleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      const { error } = await supabase
        .from('personel_notlar')
        .delete()
        .eq('id', noteToDelete.id);

      if (error) {
        throw error;
      }

      // Elle notları güncelle (real-time çalışmasa bile)
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDelete.id));
      setSearchResults(prevResults => prevResults.filter(note => note.id !== noteToDelete.id));
      
      // Modal içindeki notları da güncelle
      setThisWeekNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDelete.id));
      setLastWeekNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDelete.id));
      setAllNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDelete.id));
      
      // Modalı kapat ve temizle
      setShowDeleteConfirmModal(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Not silinirken hata:', error);
    }
  };

  // Date formatları
  const formatDateForQuery = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Daha fazla not yükle
  const loadMoreNotes = async () => {
    try {
      setLoading(true);
      
      // Son notun ID'sini al (offset yerine)
      const lastNoteId = notes.length > 0 ? notes[notes.length - 1].id : 0;
      
      // ID'ye göre sorgulama yap (range yerine)
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .order('created_at', { ascending: false })
        .filter('id', 'lt', lastNoteId)  // Son nottan daha küçük ID'li notları getir
        .limit(maxNotes);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Kullanıcı bilgisini düzenle
        const notesWithUserInfo = data.map(note => ({
          ...note,
          created_by_name: note.personel?.ad_soyad || 'Bilinmeyen Kullanıcı'
        }));
        
        // Yeni notları ekle
        setNotes(prevNotes => [...prevNotes, ...notesWithUserInfo]);
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
      {/* Başlık alanı - Talepler bileşeniyle benzer tasarım */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-gray-800">NOTLAR</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  fetchThisWeekNotes();
                  setShowThisWeekModal(true);
                }}
                className="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 flex items-center"
              >
                <Calendar size={12} className="mr-1" />
                Bu Hafta
              </button>
              <button
                onClick={() => {
                  fetchLastWeekNotes();
                  setShowLastWeekModal(true);
                }}
                className="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 flex items-center"
              >
                <Calendar size={12} className="mr-1" />
                Geçen Hafta
              </button>
              <button
                onClick={() => {
                  fetchAllNotes();
                  setShowAllNotesModal(true);
                }}
                className="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 flex items-center"
              >
                <List size={12} className="mr-1" />
                Tüm Notlar
              </button>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowAddNoteModal(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={16} className="mr-1" />
              NOT EKLE
            </button>
            <button
              onClick={() => setShowSearchModal(true)} 
              className="px-3 py-1 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md flex items-center"
              title="Notlarda ara"
            >
              <Search size={16} className="mr-1" />
              ARAMA
            </button>
          </div>
        </div>
      </div>
      
      {/* Tablo içerik alanı */}
      <div className="flex-grow overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Tarih
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Not İçeriği
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Ekleyen
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Henüz not bulunmamaktadır
                    </td>
                  </tr>
                ) : (
                  notes.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(note.tarih).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 break-words">
                          {note.metin}
                        </div>
                        {note.etiketler && note.etiketler.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.etiketler.map((etiket, i) => (
                              <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                                #{etiket}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-blue-600">
                          {note.created_by_name || 'Bilinmeyen Kullanıcı'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => confirmDeleteNote(note, e)}
                          className="text-red-500 hover:text-red-700"
                          title="Notu Sil"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {notes.length > 0 && (
            <div className="mt-4 flex justify-end items-center">
              <span className="text-sm text-gray-500">
                Toplam {notes.length} not
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bu Hafta Notları Modalı */}
      {showThisWeekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar size={18} className="mr-2 text-blue-600" />
                Bu Haftanın Notları
              </h3>
              <button
                onClick={() => setShowThisWeekModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {filterLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">Notlar yükleniyor...</p>
                </div>
              ) : thisWeekNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Bu hafta için not bulunmamaktadır.
                </div>
              ) : (
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Tarih
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Not İçeriği
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Ekleyen
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {thisWeekNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(note.tarih).toLocaleDateString('tr-TR', {
                              weekday: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 break-words">
                            {note.metin}
                          </div>
                          {note.etiketler && note.etiketler.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.etiketler.map((etiket, i) => (
                                <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                                  #{etiket}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-blue-600">
                            {note.created_by_name || 'Bilinmeyen Kullanıcı'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => confirmDeleteNote(note, e)}
                            className="text-red-500 hover:text-red-700"
                            title="Notu Sil"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-500">
                Toplam {thisWeekNotes.length} not
              </div>
              <button
                onClick={() => setShowThisWeekModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Geçen Hafta Notları Modalı */}
      {showLastWeekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar size={18} className="mr-2 text-blue-600" />
                Geçen Haftanın Notları
              </h3>
              <button
                onClick={() => setShowLastWeekModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {filterLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">Notlar yükleniyor...</p>
                </div>
              ) : lastWeekNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Geçen hafta için not bulunmamaktadır.
                </div>
              ) : (
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Tarih
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Not İçeriği
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Ekleyen
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lastWeekNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(note.tarih).toLocaleDateString('tr-TR', {
                              weekday: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 break-words">
                            {note.metin}
                          </div>
                          {note.etiketler && note.etiketler.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.etiketler.map((etiket, i) => (
                                <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                                  #{etiket}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-blue-600">
                            {note.created_by_name || 'Bilinmeyen Kullanıcı'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => confirmDeleteNote(note, e)}
                            className="text-red-500 hover:text-red-700"
                            title="Notu Sil"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-500">
                Toplam {lastWeekNotes.length} not
              </div>
              <button
                onClick={() => setShowLastWeekModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tüm Notlar Modalı */}
      {showAllNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <List size={18} className="mr-2 text-blue-600" />
                Tüm Notlar
              </h3>
              <button
                onClick={() => setShowAllNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {filterLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">Notlar yükleniyor...</p>
                </div>
              ) : allNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz hiç not bulunmamaktadır.
                </div>
              ) : (
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Tarih
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Not İçeriği
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Ekleyen
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(note.tarih).toLocaleDateString('tr-TR', {
                              weekday: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 break-words">
                            {note.metin}
                          </div>
                          {note.etiketler && note.etiketler.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.etiketler.map((etiket, i) => (
                                <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                                  #{etiket}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-blue-600">
                            {note.created_by_name || 'Bilinmeyen Kullanıcı'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => confirmDeleteNote(note, e)}
                            className="text-red-500 hover:text-red-700"
                            title="Notu Sil"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-500">
                Toplam {allNotes.length} not
              </div>
              <button
                onClick={() => setShowAllNotesModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Not ekleme modalı */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">
                Yeni Not Ekle
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Bugün: {today.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })})
                </span>
              </h3>
            </div>
            
            <form onSubmit={addNote} className="p-4">
              <textarea
                placeholder="Notunuzu yazın... (#etiket kullanabilirsiniz)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
              />
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Arama modalı */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Notlarda Ara</h3>
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
                  onClick={searchNotes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Ara
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">Aranıyor...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-2">
                    {searchResults.map((note) => (
                      <li key={note.id} className="p-3 bg-white rounded border border-gray-200 shadow-sm relative group">
                        <p className="text-sm text-gray-800 mb-1 pr-6 break-words">{note.metin}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {new Date(note.tarih).toLocaleDateString('tr-TR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            {note.created_by_name || 'Bilinmeyen Kullanıcı'}
                          </p>
                        </div>
                        {note.etiketler && note.etiketler.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.etiketler.map((etiket, i) => (
                              <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                                #{etiket}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteNote(note, e);
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
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

      {/* Not silme onay modalı */}
      {showDeleteConfirmModal && noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <AlertTriangle size={20} className="text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-600">Not Silme Onayı</h3>
            </div>
            
            <div className="p-4">
              <p className="mb-4">Bu notu silmek istediğinize emin misiniz?</p>
              
              <div className="bg-gray-50 p-3 rounded-md mb-4 border border-gray-200">
                <p className="text-gray-800 break-words">{noteToDelete.metin}</p>
                {noteToDelete.etiketler && noteToDelete.etiketler.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {noteToDelete.etiketler.map((etiket, i) => (
                      <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">
                        #{etiket}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-blue-600 font-medium mt-2">
                  {noteToDelete.created_by_name || 'Bilinmeyen Kullanıcı'} tarafından oluşturuldu
                </p>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Bu işlem geri alınamaz. Not kalıcı olarak silinecektir.
              </p>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setNoteToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={deleteNote}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes; 