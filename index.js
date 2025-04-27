// Файл /app/route.js (для App Router) или /api/route.js (для Pages Router)

export const runtime = 'edge';

export async function POST(req) {
  try {
    // Получаем оригинальный URL и путь
    const originalUrl = new URL(req.url);
    const path = originalUrl.pathname;
    
    // Формируем URL для Gemini API
    const geminiUrl = new URL(`https://generativelanguage.googleapis.com${path}`);
    
    // Копируем все query-параметры
    originalUrl.searchParams.forEach((value, key) => {
      geminiUrl.searchParams.append(key, value);
    });

    // Проксируем заголовки (исключая некоторые системные)
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        headers.append(key, value);
      }
    }

    // Отправляем запрос к Gemini API
    const response = await fetch(geminiUrl.toString(), {
      method: 'POST',
      headers,
      body: req.body,
    });

    // Возвращаем ответ как есть
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Обработка OPTIONS для CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
  });
}