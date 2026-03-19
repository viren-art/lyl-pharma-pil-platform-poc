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

if (route0) {
    const handler0 = route0.default || route0.router || route0;
    if (typeof handler0 === 'function' || (handler0 && typeof handler0.use === 'function')) {
      app.use('/api/auth', handler0);
    } else {
      console.warn('[Scaffold] Skipping /api/auth — module is not a valid Express middleware/router');
    }
  }
  if (route1) {
    const handler1 = route1.default || route1.router || route1;
    if (typeof handler1 === 'function' || (handler1 && typeof handler1.use === 'function')) {
      app.use('/api/documents', handler1);
    } else {
      console.warn('[Scaffold] Skipping /api/documents — module is not a valid Express middleware/router');
    }
  }
  if (route2) {
    const handler2 = route2.default || route2.router || route2;
    if (typeof handler2 === 'function' || (handler2 && typeof handler2.use === 'function')) {
      app.use('/api/markets', handler2);
    } else {
      console.warn('[Scaffold] Skipping /api/markets — module is not a valid Express middleware/router');
    }
  }
  if (route3) {
    const handler3 = route3.default || route3.router || route3;
    if (typeof handler3 === 'function' || (handler3 && typeof handler3.use === 'function')) {
      app.use('/api/library', handler3);
    } else {
      console.warn('[Scaffold] Skipping /api/library — module is not a valid Express middleware/router');
    }
  }
  if (route4) {
    const handler4 = route4.default || route4.router || route4;
    if (typeof handler4 === 'function' || (handler4 && typeof handler4.use === 'function')) {
      app.use('/api/markets', handler4);
    } else {
      console.warn('[Scaffold] Skipping /api/markets — module is not a valid Express middleware/router');
    }
  }
  if (route5) {
    const handler5 = route5.default || route5.router || route5;
    if (typeof handler5 === 'function' || (handler5 && typeof handler5.use === 'function')) {
      app.use('/api/library', handler5);
    } else {
      console.warn('[Scaffold] Skipping /api/library — module is not a valid Express middleware/router');
    }
  }
  if (route6) {
    const handler6 = route6.default || route6.router || route6;
    if (typeof handler6 === 'function' || (handler6 && typeof handler6.use === 'function')) {
      app.use('/api/documents', handler6);
    } else {
      console.warn('[Scaffold] Skipping /api/documents — module is not a valid Express middleware/router');
    }
  }
  if (route7) {
    const handler7 = route7.default || route7.router || route7;
    if (typeof handler7 === 'function' || (handler7 && typeof handler7.use === 'function')) {
      app.use('/api/markets', handler7);
    } else {
      console.warn('[Scaffold] Skipping /api/markets — module is not a valid Express middleware/router');
    }
  }
  if (route8) {
    const handler8 = route8.default || route8.router || route8;
    if (typeof handler8 === 'function' || (handler8 && typeof handler8.use === 'function')) {
      app.use('/api/library', handler8);
    } else {
      console.warn('[Scaffold] Skipping /api/library — module is not a valid Express middleware/router');
    }
  }
  if (route9) {
    const handler9 = route9.default || route9.router || route9;
    if (typeof handler9 === 'function' || (handler9 && typeof handler9.use === 'function')) {
      app.use('/api/documents', handler9);
    } else {
      console.warn('[Scaffold] Skipping /api/documents — module is not a valid Express middleware/router');
    }
  }
  if (route10) {
    const handler10 = route10.default || route10.router || route10;
    if (typeof handler10 === 'function' || (handler10 && typeof handler10.use === 'function')) {
      app.use('/api/router.service', handler10);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route11) {
    const handler11 = route11.default || route11.router || route11;
    if (typeof handler11 === 'function' || (handler11 && typeof handler11.use === 'function')) {
      app.use('/api/extraction', handler11);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route12) {
    const handler12 = route12.default || route12.router || route12;
    if (typeof handler12 === 'function' || (handler12 && typeof handler12.use === 'function')) {
      app.use('/api/router.service', handler12);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route13) {
    const handler13 = route13.default || route13.router || route13;
    if (typeof handler13 === 'function' || (handler13 && typeof handler13.use === 'function')) {
      app.use('/api/extraction', handler13);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route14) {
    const handler14 = route14.default || route14.router || route14;
    if (typeof handler14 === 'function' || (handler14 && typeof handler14.use === 'function')) {
      app.use('/api/router.service', handler14);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route15) {
    const handler15 = route15.default || route15.router || route15;
    if (typeof handler15 === 'function' || (handler15 && typeof handler15.use === 'function')) {
      app.use('/api/extraction', handler15);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route16) {
    const handler16 = route16.default || route16.router || route16;
    if (typeof handler16 === 'function' || (handler16 && typeof handler16.use === 'function')) {
      app.use('/api/router.service', handler16);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route17) {
    const handler17 = route17.default || route17.router || route17;
    if (typeof handler17 === 'function' || (handler17 && typeof handler17.use === 'function')) {
      app.use('/api/extraction', handler17);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route18) {
    const handler18 = route18.default || route18.router || route18;
    if (typeof handler18 === 'function' || (handler18 && typeof handler18.use === 'function')) {
      app.use('/api/aw-review', handler18);
    } else {
      console.warn('[Scaffold] Skipping /api/aw-review — module is not a valid Express middleware/router');
    }
  }
  if (route19) {
    const handler19 = route19.default || route19.router || route19;
    if (typeof handler19 === 'function' || (handler19 && typeof handler19.use === 'function')) {
      app.use('/api/router.service', handler19);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route20) {
    const handler20 = route20.default || route20.router || route20;
    if (typeof handler20 === 'function' || (handler20 && typeof handler20.use === 'function')) {
      app.use('/api/extraction', handler20);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route21) {
    const handler21 = route21.default || route21.router || route21;
    if (typeof handler21 === 'function' || (handler21 && typeof handler21.use === 'function')) {
      app.use('/api/aw-review', handler21);
    } else {
      console.warn('[Scaffold] Skipping /api/aw-review — module is not a valid Express middleware/router');
    }
  }
  if (route22) {
    const handler22 = route22.default || route22.router || route22;
    if (typeof handler22 === 'function' || (handler22 && typeof handler22.use === 'function')) {
      app.use('/api/router.service', handler22);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route23) {
    const handler23 = route23.default || route23.router || route23;
    if (typeof handler23 === 'function' || (handler23 && typeof handler23.use === 'function')) {
      app.use('/api/extraction', handler23);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route24) {
    const handler24 = route24.default || route24.router || route24;
    if (typeof handler24 === 'function' || (handler24 && typeof handler24.use === 'function')) {
      app.use('/api/aw-review', handler24);
    } else {
      console.warn('[Scaffold] Skipping /api/aw-review — module is not a valid Express middleware/router');
    }
  }
  if (route25) {
    const handler25 = route25.default || route25.router || route25;
    if (typeof handler25 === 'function' || (handler25 && typeof handler25.use === 'function')) {
      app.use('/api/router.service', handler25);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route26) {
    const handler26 = route26.default || route26.router || route26;
    if (typeof handler26 === 'function' || (handler26 && typeof handler26.use === 'function')) {
      app.use('/api/extraction', handler26);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route27) {
    const handler27 = route27.default || route27.router || route27;
    if (typeof handler27 === 'function' || (handler27 && typeof handler27.use === 'function')) {
      app.use('/api/aw-review', handler27);
    } else {
      console.warn('[Scaffold] Skipping /api/aw-review — module is not a valid Express middleware/router');
    }
  }
  if (route28) {
    const handler28 = route28.default || route28.router || route28;
    if (typeof handler28 === 'function' || (handler28 && typeof handler28.use === 'function')) {
      app.use('/api/router.service', handler28);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route29) {
    const handler29 = route29.default || route29.router || route29;
    if (typeof handler29 === 'function' || (handler29 && typeof handler29.use === 'function')) {
      app.use('/api/extraction', handler29);
    } else {
      console.warn('[Scaffold] Skipping /api/extraction — module is not a valid Express middleware/router');
    }
  }
  if (route30) {
    const handler30 = route30.default || route30.router || route30;
    if (typeof handler30 === 'function' || (handler30 && typeof handler30.use === 'function')) {
      app.use('/api/draft-creation', handler30);
    } else {
      console.warn('[Scaffold] Skipping /api/draft-creation — module is not a valid Express middleware/router');
    }
  }
  if (route31) {
    const handler31 = route31.default || route31.router || route31;
    if (typeof handler31 === 'function' || (handler31 && typeof handler31.use === 'function')) {
      app.use('/api/router.service', handler31);
    } else {
      console.warn('[Scaffold] Skipping /api/router.service — module is not a valid Express middleware/router');
    }
  }
  if (route32) {
    const handler32 = route32.default || route32.router || route32;
    if (typeof handler32 === 'function' || (handler32 && typeof handler32.use === 'function')) {
      app.use('/api/variation', handler32);
    } else {
      console.warn('[Scaffold] Skipping /api/variation — module is not a valid Express middleware/router');
    }
  }
  if (route33) {
    const handler33 = route33.default || route33.router || route33;
    if (typeof handler33 === 'function' || (handler33 && typeof handler33.use === 'function')) {
      app.use('/api/variation', handler33);
    } else {
      console.warn('[Scaffold] Skipping /api/variation — module is not a valid Express middleware/router');
    }
  }

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
