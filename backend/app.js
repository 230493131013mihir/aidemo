/**
 * app.js
 * Express Application configuration
 * HarvestMitra AI - Unified API Gateway
 */

const express = require('express');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chatRoutes');
const marketRoutes = require('./routes/marketRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Root welcome & health check endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HarvestMitra API is running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'HarvestMitra AI Backend' });
});

// Mounted API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/weather', weatherRoutes);

// Central 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

module.exports = app;
