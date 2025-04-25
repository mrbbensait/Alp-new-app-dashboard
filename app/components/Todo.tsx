'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TodoItem {
  id: number;
  task: string;
  completed: boolean;
  created_at: string;
}

const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // Görevleri yükle
  useEffect(() => {
    fetchTodos();

    // Gerçek zamanlı güncellemeler için abonelik
    const subscription = supabase
      .channel('todos-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'todos' 
      }, (payload) => {
        console.log('Değişiklik algılandı:', payload);
        fetchTodos();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Görevleri getir
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setTodos(data);
      }
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Yeni görev ekle
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          { task: newTask, completed: false }
        ])
        .select();

      if (error) {
        throw error;
      }

      setNewTask('');
      // Gerçek zamanlı abonelik yeni görevi getirecek
    } catch (error) {
      console.error('Görev eklenirken hata:', error);
    }
  };

  // Görev durumunu güncelle
  const toggleComplete = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      // Gerçek zamanlı abonelik güncellenmiş görevi getirecek
    } catch (error) {
      console.error('Görev güncellenirken hata:', error);
    }
  };

  // Görev sil
  const deleteTodo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Gerçek zamanlı abonelik silinen görevi kaldıracak
    } catch (error) {
      console.error('Görev silinirken hata:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Yapılacaklar Listesi</h2>
      
      <form onSubmit={addTodo} className="mb-6 flex">
        <input
          type="text"
          placeholder="Yeni görev ekle..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Ekle
        </button>
      </form>

      {loading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : todos.length === 0 ? (
        <div className="text-center py-4 text-gray-500">Henüz görev bulunmamaktadır.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {todos.map((todo) => (
            <li key={todo.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id, todo.completed)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                />
                <span className={`text-gray-800 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                  {todo.task}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Todo; 