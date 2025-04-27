import fetch from 'node-fetch';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

export default async function handler(req, res) {
  const targetUrl = `${GEMINI_API_BASE}${req.url.replace(/^\/api\/proxy/, '')}`;

  try {
    const headers = { ...req.headers };
    delete headers.host; // host надо убрать, иначе могут быть ошибки

    // Проверим, что тело запроса — это валидный JSON
    let body = req.body;
    try {
      body = JSON.parse(req.body);
    } catch (error) {
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }

    const fetchResponse = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method === 'GET' ? undefined : JSON.stringify(body)
    });

    const contentType = fetchResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.status(fetchResponse.status);

    // Потоково передаём тело ответа
    fetchResponse.body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
