import fetch from 'node-fetch';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

export default async function handler(req, res) {
  try {
    // Полный URL для Gemini API (сохраняем оригинальный путь и query-параметры)
    const targetUrl = `${GEMINI_API_BASE}${req.url.replace(/^\/api\/proxy/, '')}`;

    // Подготавливаем заголовки
    const headers = {
      ...req.headers,
      host: 'generativelanguage.googleapis.com', // Устанавливаем правильный host
    };
    
    // Удаляем заголовки, которые могут мешать
    delete headers['content-length'];
    delete headers['accept-encoding'];
    delete headers['connection'];

    // Опции для fetch
    const fetchOptions = {
      method: req.method,
      headers: headers,
      body: req.method === 'GET' ? undefined : req.body,
    };

    // Делаем запрос к Gemini API
    const fetchResponse = await fetch(targetUrl, fetchOptions);

    // Если ответ - stream (SSE)
    if (fetchResponse.headers.get('content-type')?.includes('text/event-stream')) {
      res.writeHead(fetchResponse.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      
      fetchResponse.body.pipe(res);
      return;
    }

    // Для обычных JSON ответов
    const data = await fetchResponse.json();
    res.status(fetchResponse.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
