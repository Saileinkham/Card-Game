const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

app.get('/api/cards/:game', async (req, res) => {
  const { game } = req.params;
  const { set } = req.query;
  let apiUrl = '';

  try {
    switch (game) {
      case 'pokemon':
        apiUrl = `https://api.pokemontcg.io/v2/cards?q=set.name:"${set}"&pageSize=12`;
        break;
      case 'yugioh':
        apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set)}`;
        break;
      case 'onepiece':
        // Using a more stable community API
        apiUrl = `https://api.onepiece-cardgame.dev/v1/cards/en?set_id=${set.split(' ')[0]}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid game' });
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      // If the API returns a non-OK status, forward the error
      const errorBody = await response.text();
      return res.status(response.status).send(errorBody);
    }
    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error(`Error fetching from ${game} API:`, error);
    res.status(500).json({ error: 'Failed to fetch data from external API' });
  }
});

app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL is required');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin
      }
    });

    if (!response.ok) {
      // Return a transparent 1x1 pixel if image not found to avoid ORB errors
      const transparentPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(transparentPixel);
    }

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    const transparentPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(transparentPixel);
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
