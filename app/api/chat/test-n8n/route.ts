import { NextResponse } from 'next/server';

// URL'yi webhook'unuzla değiştirin
const N8N_WEBHOOK_URL = 'https://alpleo.app.n8n.cloud/webhook/383253b9-6805-48ff-8e86-6247378cd5c9/chat';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testMessage = searchParams.get('message') || 'Merhaba, bu bir test mesajıdır!';
  
  // Farklı test tipleri
  const testFormat = searchParams.get('format') || 'all'; // json, text, form veya all
  
  const results: any = {
    testMessage,
    testFormat,
    results: []
  };
  
  if (testFormat === 'json' || testFormat === 'all') {
    try {
      const jsonResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AlpLeo-Dashboard-Test/1.0'
        },
        body: JSON.stringify({
          message: testMessage,
        }),
      });
      
      const status = jsonResponse.status;
      const statusText = jsonResponse.statusText;
      const contentType = jsonResponse.headers.get('content-type');
      
      let responseBody;
      try {
        // Önce text olarak alıp sonra JSON parse etmeyi deneyelim
        const text = await jsonResponse.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      } catch (e) {
        responseBody = 'Yanıt okunamadı';
      }
      
      results.results.push({
        format: 'json',
        success: jsonResponse.ok,
        status,
        statusText,
        contentType,
        responseBody
      });
    } catch (error) {
      results.results.push({
        format: 'json',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  if (testFormat === 'text' || testFormat === 'all') {
    try {
      const textResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Accept': '*/*',
          'User-Agent': 'AlpLeo-Dashboard-Test/1.0'
        },
        body: testMessage,
      });
      
      const status = textResponse.status;
      const statusText = textResponse.statusText;
      const contentType = textResponse.headers.get('content-type');
      
      let responseBody;
      try {
        // Önce text olarak alıp sonra JSON parse etmeyi deneyelim
        const text = await textResponse.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      } catch (e) {
        responseBody = 'Yanıt okunamadı';
      }
      
      results.results.push({
        format: 'text',
        success: textResponse.ok,
        status,
        statusText,
        contentType,
        responseBody
      });
    } catch (error) {
      results.results.push({
        format: 'text',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  if (testFormat === 'form' || testFormat === 'all') {
    try {
      const formData = new URLSearchParams();
      formData.append('message', testMessage);
      
      const formResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
          'User-Agent': 'AlpLeo-Dashboard-Test/1.0'
        },
        body: formData.toString(),
      });
      
      const status = formResponse.status;
      const statusText = formResponse.statusText;
      const contentType = formResponse.headers.get('content-type');
      
      let responseBody;
      try {
        // Önce text olarak alıp sonra JSON parse etmeyi deneyelim
        const text = await formResponse.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      } catch (e) {
        responseBody = 'Yanıt okunamadı';
      }
      
      results.results.push({
        format: 'form',
        success: formResponse.ok,
        status,
        statusText,
        contentType,
        responseBody
      });
    } catch (error) {
      results.results.push({
        format: 'form',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return NextResponse.json(results);
} 