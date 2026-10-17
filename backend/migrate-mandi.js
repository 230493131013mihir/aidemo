require("dotenv").config();
const sequelize = require("./config/database");
const { User, FarmerProfile, MandiProfile, ContactRequest } = require("./models");

async function migrate() {
  console.log("Starting Mandi & ContactRequest migration...");
  await sequelize.authenticate();
  console.log("Database connected.");

  // Sync MandiProfile and ContactRequest tables
  await MandiProfile.sync({ alter: true });
  console.log("MandiProfile table synced.");

  await ContactRequest.sync({ alter: true });
  console.log("ContactRequest table synced.");

  await FarmerProfile.sync({ alter: true });
  console.log("FarmerProfile table synced with new columns (customCrop, productQuantities).");

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
