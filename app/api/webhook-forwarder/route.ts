import { NextResponse } from 'next/server';

// Timeout ile fetch işlemi
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000) {
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

// Webhook isteklerini ileten API endpoint'i
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, data } = body;

    if (!url) {
      console.error('Webhook forwarder hatası: URL eksik');
      return NextResponse.json({ error: 'URL eksik' }, { status: 400 });
    }

    // Webhook'a isteği ilet
    console.log('Webhook isteği iletiliyor:', url);
    console.log('Webhook veri özeti:', JSON.stringify(data).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''));
    
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AlpLeo-Dashboard/1.0'
        },
        body: JSON.stringify(data),
      }, 15000); // 15 saniye timeout
      
      console.log('Webhook yanıt durumu:', response.status, response.statusText);

      // Webhook yanıtını al
      const responseStatus = response.status;
      let responseData;
      
      try {
        // Önce text olarak alıp JSON parse etmeyi deneyelim
        const responseText = await response.text();
        console.log('Webhook ham yanıtı:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
        
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Webhook yanıtı JSON formatında değil');
          responseData = responseText;
        }
      } catch (e) {
        console.error('Webhook yanıtı okunamadı:', e);
        responseData = 'Yanıt okunamadı';
      }

      // Yanıtı istemciye ilet
      return NextResponse.json({
        success: response.ok,
        status: responseStatus,
        data: responseData
      }, { status: response.ok ? 200 : responseStatus });
      
    } catch (fetchError) {
      console.error('Webhook fetch hatası:', fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          error: 'Webhook isteği zaman aşımına uğradı (15 saniye)' 
        }, { status: 504 });  // Gateway Timeout
      }
      
      throw fetchError; // Dış catch bloğunda yakalanacak
    }
    
  } catch (error) {
    console.error('Webhook forwarder genel hatası:', error);
    
    const errorMessage = error instanceof Error ? 
      `${error.name}: ${error.message}` : 
      'Bilinmeyen hata';
      
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 });
  }
} 