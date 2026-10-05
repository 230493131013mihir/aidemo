/**
 * server.js
 * HarvestMitra AI Backend Server entry point
 */

require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ MySQL Database connected & synced successfully!');
  } catch (error) {
    console.warn('⚠️  Database connection skipped or failed:', error.message);
    console.warn('ℹ️  Running in demo/fallback mode for AI, simulator, and mock endpoints.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🌾 HarvestMitra AI Backend running on port ${PORT}`);
    console.log(`🤖 Mitra Assistant AI Provider: ${process.env.AI_PROVIDER || 'fallback'}`);
  });

  return server;
}

const serverPromise = startServer();

module.exports = serverPromise;
