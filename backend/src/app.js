import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import documentsRoutes from './routes/documents.js';
import marketsRoutes from './routes/markets.js';
import libraryRoutes from './routes/library.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/library', libraryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

export default app;