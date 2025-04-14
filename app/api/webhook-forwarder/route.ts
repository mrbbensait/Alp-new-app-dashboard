import { NextResponse } from 'next/server';

// Webhook isteklerini ileten API endpoint'i
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, data } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL eksik' }, { status: 400 });
    }

    // Webhook'a isteği ilet
    console.log('Webhook isteği iletiliyor:', url, data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Webhook yanıtını al
    const responseStatus = response.status;
    let responseData;
    
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }

    // Yanıtı istemciye ilet
    return NextResponse.json({
      success: response.ok,
      status: responseStatus,
      data: responseData
    }, { status: responseStatus });
    
  } catch (error) {
    console.error('Webhook forwarder hatası:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }, { status: 500 });
  }
} 