const sequelize = require("./config/database");

async function migrate() {
    try {
        console.log("Checking and updating database schema for Transport & Multi-role features...");

        // 1. Alter users.role to VARCHAR(50)
        await sequelize.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'farmer'");
        console.log("✅ users.role column updated to VARCHAR(50)");

        // 2. Create transporter_profiles table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS transporter_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                driver_name VARCHAR(120) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                vehicle_type VARCHAR(100) NOT NULL DEFAULT 'Mahindra Bolero Maxi',
                vehicle_number VARCHAR(50) NOT NULL,
                capacity_kg INT NOT NULL DEFAULT 2000,
                base_mandi VARCHAR(160) NOT NULL DEFAULT 'Surat APMC',
                rate_per_km INT NOT NULL DEFAULT 25,
                is_available BOOLEAN NOT NULL DEFAULT true,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (user_id),
                CONSTRAINT fk_transporter_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ transporter_profiles table verified/created");

        // 3. Add gate_pass_code to transport_requests if not exists
        const [cols] = await sequelize.query("DESCRIBE transport_requests");
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes("gate_pass_code")) {
            await sequelize.query("ALTER TABLE transport_requests ADD COLUMN gate_pass_code VARCHAR(64) NULL AFTER estimated_shared_cost");
            console.log("✅ Added gate_pass_code to transport_requests");
        }

        if (!colNames.includes("driver_name")) {
            await sequelize.query("ALTER TABLE transport_requests ADD COLUMN driver_name VARCHAR(120) NULL AFTER farmer_name");
            console.log("✅ Added driver_name to transport_requests");
        }

        if (!colNames.includes("vehicle_number")) {
            await sequelize.query("ALTER TABLE transport_requests ADD COLUMN vehicle_number VARCHAR(64) NULL AFTER vehicle_type");
            console.log("✅ Added vehicle_number to transport_requests");
        }

        console.log("🎉 Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration error:", err.message);
        process.exit(1);
    }
}

migrate();
