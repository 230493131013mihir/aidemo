const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const dialect = process.env.DB_DIALECT || (process.env.DB_PASSWORD ? "mysql" : "sqlite");

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const isCloudHost = process.env.DB_HOST && (
    process.env.DB_HOST.includes("aivencloud.com") ||
    process.env.DB_HOST.includes("render.com") ||
    process.env.DB_HOST.includes("aws") ||
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL === "REQUIRED"
);

const dialectOptions = isCloudHost ? {
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
} : {};

let sequelize;

if (dbUrl) {
    sequelize = new Sequelize(dbUrl, {
        dialect: "mysql",
        logging: false,
        dialectOptions: dbUrl.includes("ssl-mode=REQUIRED") || dbUrl.includes("aiven") || process.env.DB_SSL === "true" ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : dialectOptions
    });
} else if (dialect === "sqlite") {
    const storagePath = process.env.DB_STORAGE || path.resolve(__dirname, "../harvestmitra.sqlite");
    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: storagePath,
        logging: false
    });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME || "harvestmitra_db",
        process.env.DB_USER || "root",
        process.env.DB_PASSWORD || "",
        {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 3306,
            dialect: "mysql",
            logging: false,
            dialectOptions
        }
    );
}

module.exports = sequelize;