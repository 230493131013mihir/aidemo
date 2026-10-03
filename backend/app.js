/**
 * app.js
 * Express Application configuration
 * HarvestMitra AI
 */

const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const marketRoutes = require('./routes/marketRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'HarvestMitra AI Backend' });
});

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
