const sequelize = require("./config/database");
const User = require("./models/User");

async function testModel() {
    try {
        await sequelize.authenticate();

        await sequelize.sync();

        console.log("✅ Database connected!");
        console.log("✅ Users table created successfully!");
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testModel();