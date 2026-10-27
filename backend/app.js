/**
 * app.js
 * Express Application configuration
 * HarvestMitra AI - Unified API Gateway
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chatRoutes');
const marketRoutes = require('./routes/marketRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

// Security: Hide server technology disclosure
app.disable('x-powered-by');

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

app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  let dialect = 'unknown';
  try {
    const sequelize = require('./config/database');
    dialect = sequelize.getDialect();
    await sequelize.authenticate();
  } catch (err) {
    dbStatus = 'degraded: ' + err.message;
  }
  res.json({ status: 'ok', service: 'HarvestMitra AI Backend', db: dbStatus, dialect });
});

// Mounted API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', require('./routes/assistant.routes'));
app.use('/api/chat', chatRoutes);
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/markets', require('./routes/marketRoutes'));
app.use('/api/weather', weatherRoutes);
app.use('/api/transport', require('./routes/transport.routes'));
app.use('/api/schemes', require('./routes/scheme.routes'));
app.use('/api/farmer/schemes', require('./routes/scheme.routes'));
app.use('/api/farmer', require('./routes/farmer.routes'));
app.use('/api/admin/schemes', require('./routes/scheme.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/report', require('./routes/report.routes'));
app.use('/api/alerts', require('./routes/alert.routes'));
app.use('/api/fpo', require('./routes/fpo.routes'));

// Dedicated API 404 handler: guarantees unmatched /api requests ALWAYS return JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Serve frontend static assets if built (for unified Express or single-service deployments)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    // Only serve index.html for GET requests that accept html
    if (req.method === 'GET' && req.accepts('html')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

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
