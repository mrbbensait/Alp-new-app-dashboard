'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, ChevronLeft, ChevronRight, Plus, X, Calendar, List, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

// Supabase client kurulumu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

const Notes: React.FC<NotesProps> = ({ maxNotes = 3 }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showDayNotesModal, setShowDayNotesModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { user } = useAuth();

  // Seçili haftanın tarihlerini hesapla
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Pazar, 1 = Pazartesi...
    
    // Bugünün bulunduğu haftanın pazartesi gününü bul
    const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay; // Pazar günü için özel hesaplama
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + mondayDiff);
    
    // Offset'e göre haftayı ayarla
    const targetMonday = new Date(currentMonday);
    targetMonday.setDate(currentMonday.getDate() + (weekOffset * 7));
    
    // Pazartesi-Pazar günlerinin tarihlerini oluştur (tüm hafta)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(targetMonday);
      day.setDate(targetMonday.getDate() + i);
      weekDays.push(day);
    }
    
    return weekDays;
  };

  const weekDays = getWeekDays();
  
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
  }, [weekOffset]); // weekOffset değiştiğinde notları tekrar yükle

  // Tüm notları getir
  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      // Haftanın başlangıç ve bitiş tarihlerini hesapla
      const weekStart = formatDateForQuery(weekDays[0]);
      const weekEnd = formatDateForQuery(weekDays[6]);
      
      // Bu haftanın notlarını getir (oluşturan kullanıcı bilgisiyle birlikte)
      const { data, error } = await supabase
        .from('personel_notlar')
        .select(`
          *,
          personel:created_by (
            ad_soyad
          )
        `)
        .gte('tarih', weekStart)
        .lte('tarih', weekEnd)
        .order('created_at', { ascending: false });

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
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
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

  // Yeni not ekle
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      // Etiketleri al (# ile başlayan kelimeler)
      const etiketler = newNote.match(/#(\w+)/g) || [];
      const formatlanmisEtiketler = etiketler.map(etiket => etiket.substring(1));

      // Bugünün tarihini kullan
      const bugununTarihi = new Date();
      
      // sessionStorage'dan kullanıcı bilgilerini al
      const userDataString = sessionStorage.getItem('user');
      let personelId = null;
      
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData.id) {
            personelId = userData.id;
            console.log('Kullanıcı ID:', personelId, 'Tip:', typeof personelId);
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
        .select();

      if (error) {
        console.error('Supabase hatası:', error);
        throw error;
      }

      // Not başarıyla eklendiyse, manuel olarak güncelleyelim
      if (data) {
        setNotes(prevNotes => [data[0], ...prevNotes]);
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
  
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
  };
  
  const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', { weekday: 'long' });
  };

  // Tarihe göre not filtreleme
  const getNotesForDay = (date: Date) => {
    const dateStr = formatDateForQuery(date);
    return notes.filter(note => note.tarih === dateStr);
  };

  // Günün notlarını göster
  const showNotesForDay = (day: Date) => {
    setSelectedDay(day);
    setShowDayNotesModal(true);
  };

  // Hafta değiştirme işlevleri
  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Bugünün haftasında mıyız kontrol et
  const isCurrentWeek = weekOffset === 0;
  
  // Bugünün tarihini kontrol et
  const today = new Date();
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden w-full">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">NOTLAR</h2>
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
        
        {/* Hafta gezinme kontrolleri */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={goToPreviousWeek}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded-md flex items-center"
          >
            <ChevronLeft size={20} />
            <span className="ml-1 text-sm">Önceki Hafta</span>
          </button>
          
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">
              {formatDateForDisplay(weekDays[0])} - {formatDateForDisplay(weekDays[6])}
            </h3>
            {!isCurrentWeek && (
              <button 
                onClick={goToCurrentWeek}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                Bu haftaya dön
              </button>
            )}
          </div>
          
          <button 
            onClick={goToNextWeek}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded-md flex items-center"
          >
            <span className="mr-1 text-sm">Sonraki Hafta</span>
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Günlük notlar kartları */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const dayNotes = getNotesForDay(day);
            const displayNotes = dayNotes.slice(0, maxNotes);
            const hasMoreNotes = dayNotes.length > maxNotes;
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden ${isToday(day) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} cursor-pointer hover:bg-gray-50 transition-colors`}
                onClick={() => showNotesForDay(day)}
              >
                <div className={`p-2 ${isToday(day) ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <div className="text-center">
                    <div className="font-medium">
                      {formatDayName(day)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'long' })}
                    </div>
                    {dayNotes.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {dayNotes.length} not {hasMoreNotes && `(${maxNotes} gösteriliyor)`}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-3 h-60 overflow-y-auto">
                  {dayNotes.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Not bulunmamaktadır
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {displayNotes.map((note) => (
                        <li key={note.id} className="p-2 bg-white rounded border border-gray-200 shadow-sm relative">
                          <p className="text-sm text-gray-800 pr-6 break-words line-clamp-2 overflow-hidden">
                            {note.metin}
                          </p>
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
                            onClick={(e) => confirmDeleteNote(note, e)}
                            className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                      
                      {hasMoreNotes && (
                        <li className="text-center text-xs text-blue-600 pt-1">
                          +{dayNotes.length - maxNotes} not daha...
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Not ekleme modalı */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">
                Yeni Not Ekle
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Bugün: {formatDayName(today)}, {formatDateForDisplay(today)})
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
      
      {/* Gün notları modalı */}
      {showDayNotesModal && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar size={18} className="mr-2 text-blue-600" />
                {formatDayName(selectedDay)}, {formatDateForDisplay(selectedDay)} Notları
              </h3>
              <button
                onClick={() => setShowDayNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {(() => {
                const dayNotes = getNotesForDay(selectedDay);
                
                return dayNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Bu gün için not bulunmamaktadır.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {dayNotes.map((note) => (
                      <li key={note.id} className="p-3 bg-white rounded border border-gray-200 shadow-sm relative group">
                        <p className="text-gray-800 pr-8 break-words">{note.metin}</p>
                        {note.etiketler && note.etiketler.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.etiketler.map((etiket, i) => (
                              <span key={i} className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">
                                #{etiket}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs font-medium text-blue-600">
                            {note.created_by_name || 'Bilinmeyen Kullanıcı'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteNote(note, e);
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDayNotesModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Kapat
              </button>
              {isToday(selectedDay) && (
                <button
                  onClick={() => {
                    setShowDayNotesModal(false);
                    setShowAddNoteModal(true);
                  }}
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Yeni Not Ekle
                </button>
              )}
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
    </div>
  );
};

export default Notes; 