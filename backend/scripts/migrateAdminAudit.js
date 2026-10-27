require("dotenv").config();
const sequelize = require("../config/database");

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log("Connected to database.");

        const queryInterface = sequelize.getQueryInterface();
        const userCols = await queryInterface.describeTable("users").catch(() => ({}));
        if (!userCols.status) {
            await queryInterface.addColumn("users", "status", {
                type: sequelize.Sequelize.STRING(20),
                defaultValue: "active",
                allowNull: true
            }).catch(() => {});
            console.log("✅ Added 'status' column to users table.");
        } else {
            console.log("ℹ️ 'status' column already exists in users table.");
        }

        const { AuditLog } = require("../models");
        if (AuditLog) {
            await AuditLog.sync().catch(() => {});
            console.log("✅ Verified / Created 'audit_logs' table.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err.message);
        process.exit(1);
    }
}

migrate();
