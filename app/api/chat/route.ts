import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://alpleo.app.n8n.cloud/webhook/383253b9-6805-48ff-8e86-6247378cd5c9/chat';

// Timeout ile fetch işlemi
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Proxy API\'ye gelen istek:', body);
    
    if (!body.message) {
      return NextResponse.json(
        { error: 'Mesaj içeriği gereklidir' },
        { status: 400 }
      );
    }
    
    // İlk denemede standart JSON formatında gönderelim
    try {
      console.log('N8N\'e JSON istek gönderiliyor...');
      
      const response = await fetchWithTimeout(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AlpLeo-Dashboard/1.0'
        },
        body: JSON.stringify({
          message: body.message,
        }),
      }, 15000);
      
      console.log('N8N yanıt durumu (JSON):', response.status, response.statusText);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('N8N ham yanıtı (JSON):', responseText);
        
        if (!responseText || responseText.trim() === '') {
          return NextResponse.json(
            { reply: 'Maalesef şu anda servis yanıt vermiyor. Lütfen daha sonra tekrar deneyin.' },
            { status: 200 }
          );
        }
        
        try {
          const data = JSON.parse(responseText);
          return NextResponse.json(data);
        } catch (parseError) {
          // JSON parse edilemezse, ham metni bir yanıt olarak kabul et
          return NextResponse.json(
            { reply: responseText },
            { status: 200 }
          );
        }
      }
      // İlk denemede başarısız olduysa, diğer yöntemleri deneyelim
    } catch (jsonError) {
      console.error('JSON formatında istek başarısız oldu:', jsonError);
    }
    
    // İkinci deneme: Text formatında direkt mesajı gönder
    try {
      console.log('N8N\'e TEXT istek gönderiliyor...');
      
      const response = await fetchWithTimeout(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Accept': '*/*',
          'User-Agent': 'AlpLeo-Dashboard/1.0'
        },
        body: body.message,
      }, 15000);
      
      console.log('N8N yanıt durumu (TEXT):', response.status, response.statusText);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('N8N ham yanıtı (TEXT):', responseText);
        
        if (!responseText || responseText.trim() === '') {
          return NextResponse.json(
            { reply: 'Maalesef şu anda servis yanıt vermiyor. Lütfen daha sonra tekrar deneyin.' },
            { status: 200 }
          );
        }
        
        try {
          const data = JSON.parse(responseText);
          return NextResponse.json(data);
        } catch (parseError) {
          // JSON parse edilemezse, ham metni bir yanıt olarak kabul et
          return NextResponse.json(
            { reply: responseText },
            { status: 200 }
          );
        }
      }
      // İkinci deneme de başarısız olduysa, üçüncü yöntemi deneyelim
    } catch (textError) {
      console.error('TEXT formatında istek başarısız oldu:', textError);
    }
    
    // Üçüncü deneme: URL Encoded
    try {
      console.log('N8N\'e URL-ENCODED istek gönderiliyor...');
      
      const formData = new URLSearchParams();
      formData.append('message', body.message);
      
      const response = await fetchWithTimeout(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
          'User-Agent': 'AlpLeo-Dashboard/1.0'
        },
        body: formData.toString(),
      }, 15000);
      
      console.log('N8N yanıt durumu (FORM):', response.status, response.statusText);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('N8N ham yanıtı (FORM):', responseText);
        
        if (!responseText || responseText.trim() === '') {
          return NextResponse.json(
            { reply: 'Maalesef şu anda servis yanıt vermiyor. Lütfen daha sonra tekrar deneyin.' },
            { status: 200 }
          );
        }
        
        try {
          const data = JSON.parse(responseText);
          return NextResponse.json(data);
        } catch (parseError) {
          // JSON parse edilemezse, ham metni bir yanıt olarak kabul et
          return NextResponse.json(
            { reply: responseText },
            { status: 200 }
          );
        }
      }
    } catch (formError) {
      console.error('FORM formatında istek başarısız oldu:', formError);
    }
    
    // Tüm denemeler başarısız olduysa
    return NextResponse.json(
      { reply: 'N8N servisine bağlanılamadı. Lütfen sistem yöneticinize başvurun.' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Proxy API hatası:', error);
    
    // AbortError (timeout) kontrolü
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { reply: 'İstek zaman aşımına uğradı. Servis yanıt vermiyor.' },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { reply: `Bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` },
      { status: 200 }
    );
  }
} 