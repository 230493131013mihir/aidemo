/**
 * server.js
 * HarvestMitra AI Backend Server entry point
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🌾 HarvestMitra AI Backend running on port ${PORT}`);
  console.log(`🤖 Mitra Assistant AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
});

module.exports = server;
