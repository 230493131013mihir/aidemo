const sequelize = require("../config/database");

async function migrateIdentity() {
    try {
        console.log("Checking and updating schema for Farmer-First Identity & Access...");
        const dialect = sequelize.getDialect();

        if (dialect === "sqlite") {
            const [results] = await sequelize.query("PRAGMA table_info(farmer_profiles)");
            const existingCols = results.map(r => r.name);

            const columnsToAdd = [
                { name: "agristack_id", def: "TEXT" },
                { name: "is_govt_verified", def: "INTEGER DEFAULT 0" },
                { name: "govt_verified_land_acres", def: "NUMERIC" },
                { name: "survey_number", def: "TEXT" },
                { name: "aadhaar_linked", def: "INTEGER DEFAULT 0" },
                { name: "dbt_account_linked", def: "INTEGER DEFAULT 0" },
                { name: "fpo_name", def: "TEXT" },
                { name: "fpo_registration_number", def: "TEXT" },
                { name: "member_farmer_count", def: "INTEGER" },
                { name: "role_subtype", def: "TEXT" }
            ];

            for (const col of columnsToAdd) {
                if (!existingCols.includes(col.name)) {
                    await sequelize.query(`ALTER TABLE farmer_profiles ADD COLUMN ${col.name} ${col.def}`);
                    console.log(`✅ [SQLite] Added column: ${col.name}`);
                }
            }
        } else {
            // MySQL
            const [cols] = await sequelize.query("DESCRIBE farmer_profiles");
            const existingCols = cols.map(c => c.Field);

            const columnsToAdd = [
                { name: "agristack_id", def: "VARCHAR(100) NULL" },
                { name: "is_govt_verified", def: "TINYINT(1) NOT NULL DEFAULT 0" },
                { name: "govt_verified_land_acres", def: "DECIMAL(5,2) NULL" },
                { name: "survey_number", def: "VARCHAR(100) NULL" },
                { name: "aadhaar_linked", def: "TINYINT(1) NOT NULL DEFAULT 0" },
                { name: "dbt_account_linked", def: "TINYINT(1) NOT NULL DEFAULT 0" },
                { name: "fpo_name", def: "VARCHAR(200) NULL" },
                { name: "fpo_registration_number", def: "VARCHAR(100) NULL" },
                { name: "member_farmer_count", def: "INT NULL" },
                { name: "role_subtype", def: "VARCHAR(50) NULL" }
            ];

            for (const col of columnsToAdd) {
                if (!existingCols.includes(col.name)) {
                    await sequelize.query(`ALTER TABLE farmer_profiles ADD COLUMN ${col.name} ${col.def}`);
                    console.log(`✅ [MySQL] Added column: ${col.name}`);
                }
            }
        }

        console.log("🎉 Identity migration complete!");
        if (require.main === module) {
            process.exit(0);
        }
        return true;
    } catch (err) {
        console.error("❌ Identity migration error:", err.message);
        if (require.main === module) {
            process.exit(1);
        }
        return false;
    }
}

if (require.main === module) {
    migrateIdentity();
}

module.exports = migrateIdentity;
