import fetch from 'node-fetch';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

export default async function handler(req, res) {
  const targetUrl = `${GEMINI_API_BASE}${req.url.replace(/^\/api\/proxy/, '')}`;

  try {
    const headers = { ...req.headers };
    delete headers.host; // Убираем host, чтобы не было ошибок

    let body;
    try {
      body = JSON.parse(req.body); // Пробуем распарсить JSON
    } catch (error) {
      res.status(400).json({ error: "Invalid JSON payload", details: error.message });
      return;
    }

    // Пробуем выполнить запрос
    const fetchResponse = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method === 'GET' ? undefined : JSON.stringify(body) // Отправляем JSON
    });

    if (!fetchResponse.ok) {
      const responseText = await fetchResponse.text();
      res.status(fetchResponse.status).json({
        error: `Error fetching from Gemini: ${responseText}`,
        status: fetchResponse.status
      });
      return;
    }

    const contentType = fetchResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.status(fetchResponse.status);
    fetchResponse.body.pipe(res); // Потоковое передавание ответа
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
