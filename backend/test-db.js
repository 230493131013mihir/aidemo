const sequelize = require("./config/database");

async function testDatabase() {
    try {
        await sequelize.authenticate();

        console.log("✅ MySQL database connected successfully!");

    } catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error.message);
    }
}

testDatabase();