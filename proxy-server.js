// crown-proxy-server.js
import express from 'express';
import fetch from 'node-fetch';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(express.text({type: '*/*'}));

// Proxies GET requests
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url query param');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000
    });
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();
      // Rewrite links to go through proxy
      html = html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => `href="/proxy?url=${encodeURIComponent(url)}"`);
      html = html.replace(/src="(https?:\/\/[^"]+)"/g, (match, url) => `src="/proxy?url=${encodeURIComponent(url)}"`);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } else {
      // For non-HTML, just forward
      const buffer = await response.buffer();
      res.set('Content-Type', contentType);
      res.send(buffer);
    }
  } catch (err) {
    res.status(500).send(`Proxy error: ${err.message}`);
  }
});

app.listen(process.env.PORT || 3000);
console.log('Crown Nexus Proxy Server running on port', process.env.PORT || 3000);