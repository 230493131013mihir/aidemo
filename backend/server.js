require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const app = require('./app');
const sequelize = require('./config/database');
const { User } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    try {
      const migrateIdentity = require('./scripts/migrate-identity');
      if (typeof migrateIdentity === 'function') await migrateIdentity();
    } catch (migErr) {
      console.warn('⚠️ Identity migration check skipped:', migErr.message);
    }
    console.log(`✅ Database (${sequelize.getDialect()}) connected & synced successfully!`);

    const userCount = await User.count().catch(() => 0);
    if (userCount === 0) {
      console.log('🌱 Database is empty, seeding initial demo data...');
      try {
        const seed = require('./seed');
        if (typeof seed === 'function') await seed();
      } catch (seedErr) {
        console.warn('⚠️ Seeding skipped:', seedErr.message);
      }
    }
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

