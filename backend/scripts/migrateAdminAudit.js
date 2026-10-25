require("dotenv").config();
const sequelize = require("../config/database");

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log("Connected to MySQL database.");

        const [results] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'status';");
        if (results.length === 0) {
            await sequelize.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';");
            console.log("✅ Added 'status' column to users table.");
        } else {
            console.log("ℹ️ 'status' column already exists in users table.");
        }

        // Create audit_logs table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                actor_id INT NULL,
                actor_name VARCHAR(150) NOT NULL,
                actor_email VARCHAR(150) NOT NULL,
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50) NOT NULL,
                target_id VARCHAR(100) NULL,
                details TEXT NULL,
                ip_address VARCHAR(50) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_action (action),
                INDEX idx_target (target_type, target_id),
                INDEX idx_actor (actor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ Verified / Created 'audit_logs' table in MySQL.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err.message);
        process.exit(1);
    }
}

migrate();
