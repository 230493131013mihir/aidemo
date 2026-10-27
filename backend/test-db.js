const sequelize = require("./config/database");

async function testDatabase() {
    const dialect = sequelize.getDialect();
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || (dialect === "mysql" ? "3306" : "N/A");
    console.log(`🔍 Testing Database connection [Dialect: ${dialect}, Host: ${host}, Port: ${port}]...`);

    try {
        await sequelize.authenticate();
        console.log(`✅ Database (${dialect.toUpperCase()}) connected successfully!`);
    } catch (error) {
        console.error("❌ Database connection failed:");
        const formatted = sequelize.formatConnectionError ? sequelize.formatConnectionError(error) : error.message;
        console.error(formatted);
    }
}

testDatabase();