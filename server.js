const express = require('express');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware (hardcoded, never LLM-generated) ──
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check (always works, even if routes fail) ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'pharma-pil-poc' });
});

// ── Static files (for fullstack — serve frontend build) ──
// Check dist/ first (vite build output), then frontend/dist (monorepo), then public/
const path = require('path');
const fs = require('fs');
const distDir = path.join(__dirname, 'dist');
const frontendDist = path.join(__dirname, 'frontend', 'dist');
const publicDir = fs.existsSync(distDir) ? distDir : fs.existsSync(frontendDist) ? frontendDist : path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ── Route handlers (LLM-generated, loaded safely) ──
let route0 = null;
try { route0 = require('./src/routes/auth.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/auth.js:', e.message); }
let route1 = null;
try { route1 = require('./src/routes/documents.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/documents.js:', e.message); }
let route2 = null;
try { route2 = require('./src/routes/markets.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/markets.js:', e.message); }
let route3 = null;
try { route3 = require('./src/routes/library.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/library.js:', e.message); }
let route4 = null;
try { route4 = require('./src/routes/markets.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/markets.js:', e.message); }
let route5 = null;
try { route5 = require('./src/routes/library.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/library.js:', e.message); }
let route6 = null;
try { route6 = require('./src/routes/documents.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/documents.js:', e.message); }
let route7 = null;
try { route7 = require('./src/routes/markets.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/markets.js:', e.message); }
let route8 = null;
try { route8 = require('./src/routes/library.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/library.js:', e.message); }
let route9 = null;
try { route9 = require('./src/routes/documents.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/documents.js:', e.message); }
let route10 = null;
try { route10 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route11 = null;
try { route11 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route12 = null;
try { route12 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route13 = null;
try { route13 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route14 = null;
try { route14 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route15 = null;
try { route15 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route16 = null;
try { route16 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route17 = null;
try { route17 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route18 = null;
try { route18 = require('./src/routes/aw-review.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/aw-review.js:', e.message); }
let route19 = null;
try { route19 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route20 = null;
try { route20 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route21 = null;
try { route21 = require('./src/routes/aw-review.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/aw-review.js:', e.message); }
let route22 = null;
try { route22 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route23 = null;
try { route23 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route24 = null;
try { route24 = require('./src/routes/aw-review.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/aw-review.js:', e.message); }
let route25 = null;
try { route25 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route26 = null;
try { route26 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route27 = null;
try { route27 = require('./src/routes/aw-review.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/aw-review.js:', e.message); }
let route28 = null;
try { route28 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route29 = null;
try { route29 = require('./src/routes/extraction.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/extraction.js:', e.message); }
let route30 = null;
try { route30 = require('./src/routes/draft-creation.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/draft-creation.js:', e.message); }
let route31 = null;
try { route31 = require('./src/extraction/router.service.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/extraction/router.service.js:', e.message); }
let route32 = null;
try { route32 = require('./src/routes/variation.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/variation.js:', e.message); }
let route33 = null;
try { route33 = require('./src/routes/variation.js'); } catch(e) { console.warn('[Scaffold] Failed to load ./src/routes/variation.js:', e.message); }

if (route0) app.use('/api/auth', route0.default || route0.router || route0);
  if (route1) app.use('/api/documents', route1.default || route1.router || route1);
  if (route2) app.use('/api/markets', route2.default || route2.router || route2);
  if (route3) app.use('/api/library', route3.default || route3.router || route3);
  if (route4) app.use('/api/markets', route4.default || route4.router || route4);
  if (route5) app.use('/api/library', route5.default || route5.router || route5);
  if (route6) app.use('/api/documents', route6.default || route6.router || route6);
  if (route7) app.use('/api/markets', route7.default || route7.router || route7);
  if (route8) app.use('/api/library', route8.default || route8.router || route8);
  if (route9) app.use('/api/documents', route9.default || route9.router || route9);
  if (route10) app.use('/api/router.service', route10.default || route10.router || route10);
  if (route11) app.use('/api/extraction', route11.default || route11.router || route11);
  if (route12) app.use('/api/router.service', route12.default || route12.router || route12);
  if (route13) app.use('/api/extraction', route13.default || route13.router || route13);
  if (route14) app.use('/api/router.service', route14.default || route14.router || route14);
  if (route15) app.use('/api/extraction', route15.default || route15.router || route15);
  if (route16) app.use('/api/router.service', route16.default || route16.router || route16);
  if (route17) app.use('/api/extraction', route17.default || route17.router || route17);
  if (route18) app.use('/api/aw-review', route18.default || route18.router || route18);
  if (route19) app.use('/api/router.service', route19.default || route19.router || route19);
  if (route20) app.use('/api/extraction', route20.default || route20.router || route20);
  if (route21) app.use('/api/aw-review', route21.default || route21.router || route21);
  if (route22) app.use('/api/router.service', route22.default || route22.router || route22);
  if (route23) app.use('/api/extraction', route23.default || route23.router || route23);
  if (route24) app.use('/api/aw-review', route24.default || route24.router || route24);
  if (route25) app.use('/api/router.service', route25.default || route25.router || route25);
  if (route26) app.use('/api/extraction', route26.default || route26.router || route26);
  if (route27) app.use('/api/aw-review', route27.default || route27.router || route27);
  if (route28) app.use('/api/router.service', route28.default || route28.router || route28);
  if (route29) app.use('/api/extraction', route29.default || route29.router || route29);
  if (route30) app.use('/api/draft-creation', route30.default || route30.router || route30);
  if (route31) app.use('/api/router.service', route31.default || route31.router || route31);
  if (route32) app.use('/api/variation', route32.default || route32.router || route32);
  if (route33) app.use('/api/variation', route33.default || route33.router || route33);

// ── Catch-all for SPA (fullstack — serve index.html for client routes) ──
if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(publicDir, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'pharma-pil-poc',
      version: '1.0.0',
      endpoints: ['/health', '/api/auth', '/api/documents', '/api/markets', '/api/library', '/api/markets', '/api/library', '/api/documents', '/api/markets', '/api/library', '/api/documents', '/api/router.service', '/api/extraction', '/api/router.service', '/api/extraction', '/api/router.service', '/api/extraction', '/api/router.service', '/api/extraction', '/api/aw-review', '/api/router.service', '/api/extraction', '/api/aw-review', '/api/router.service', '/api/extraction', '/api/aw-review', '/api/router.service', '/api/extraction', '/api/aw-review', '/api/router.service', '/api/extraction', '/api/draft-creation', '/api/router.service', '/api/variation', '/api/variation'],
    });
  });
}

// ── Error handler (hardcoded — catches LLM code errors gracefully) ──
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

module.exports = app;
