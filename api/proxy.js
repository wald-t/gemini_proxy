import fetch from 'node-fetch';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

export default async function handler(req, res) {
  try {
    // Полный URL для Gemini API
    const targetUrl = `${GEMINI_API_BASE}${req.url.replace(/^\/api\/proxy/, '')}`;

    // Подготавливаем заголовки
    const headers = {
      ...req.headers,
      host: 'generativelanguage.googleapis.com',
    };
    
    // Удаляем проблемные заголовки
    delete headers['content-length'];
    delete headers['accept-encoding'];
    delete headers['connection'];

    // Подготавливаем тело запроса
    let requestBody;
    if (req.method !== 'GET' && req.body) {
      // Если тело уже объект (разобранный JSON), преобразуем обратно в строку
      requestBody = typeof req.body === 'object' 
        ? JSON.stringify(req.body) 
        : req.body;
    }

    // Опции для fetch
    const fetchOptions = {
      method: req.method,
      headers: headers,
      body: requestBody,
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
      
      return fetchResponse.body.pipe(res);
    }

    // Для обычных JSON ответов
    const data = await fetchResponse.json();
    return res.status(fetchResponse.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      fullError: error 
    });
  }
}