'use client';

import React, { useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PageGuard from '@/app/components/PageGuard';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export default function StokUretimMuduruBeyniPage() {
  const chatInitializedRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // N8N webhook URL'si
  const N8N_WEBHOOK_URL = 'https://alpleo.app.n8n.cloud/webhook/383253b9-6805-48ff-8e86-6247378cd5c9/chat';

  useEffect(() => {
    // createChat fonksiyonu sadece bir kez çağrılmalı
    if (chatContainerRef.current && !chatInitializedRef.current) {
      try {
        createChat({
          webhookUrl: N8N_WEBHOOK_URL,
          target: '#n8n-chat-container',
          mode: 'fullscreen',
          showWelcomeScreen: false,
          initialMessages: [
            'Merhaba! Ben AlpLeo yapay zekası. Size stok ve üretim konularında nasıl yardımcı olabilirim?'
          ],
          i18n: {
            en: {
              title: 'AlpLeo Yapay Zeka',
              subtitle: 'Stok ve üretim konularında yardım alın.',
              footer: 'AlpLeo Yapay Zeka',
              getStarted: 'Yeni Konuşma',
              inputPlaceholder: 'Sorunuzu yazın...',
              closeButtonTooltip: 'Kapat',
            },
          },
        });
        chatInitializedRef.current = true;
        console.log('N8N Chat başarıyla oluşturuldu!');
      } catch (error) {
        console.error('N8N Chat oluşturulurken hata:', error);
      }
    }
  }, []);

  return (
    <PageGuard sayfaYolu="/stok-uretim-muduru-beyni">
      <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Stok ve Üretim Müdürü</h1>
          <p className="mt-1 text-sm text-gray-600">
            AlpLeo yapay zekası ile stok ve üretim konularında sohbet edin.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-2xl h-[calc(100vh-250px)]" id="n8n-chat-container" ref={chatContainerRef}></div>
        </div>
        
        {/* Özel CSS Değişkenleri */}
        <style jsx global>{`
          :root {
            --chat--color-primary: #3b82f6;
            --chat--color-primary-shade-50: #2563eb;
            --chat--color-primary-shade-100: #1d4ed8;
            --chat--color-secondary: #10b981;
            --chat--message--user--background: #3b82f6;
            --chat--window--width: 600px;
            --chat--window--height: 500px;
            
            /* Font boyutlarını küçültme */
            --chat--message--font-size: 0.75rem;
            --chat--heading--font-size: 1.1em;
            --chat--subtitle--font-size: 0.75em;
            --chat--message-line-height: 1.4;
            
            /* Mesaj aralıklarını daraltma */
            --chat--spacing: 0.7rem;
            --chat--message--padding: 0.7rem;
            --chat--header--padding: 0.7rem;
          }
        `}</style>
      </DashboardLayout>
    </PageGuard>
  );
} 