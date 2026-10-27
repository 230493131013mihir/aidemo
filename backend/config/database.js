const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const dialect = process.env.DB_DIALECT || (process.env.DB_PASSWORD ? "mysql" : "sqlite");

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const isCloudHost = Boolean(
    (process.env.DB_HOST && (
        process.env.DB_HOST.includes("aivencloud.com") ||
        process.env.DB_HOST.includes("render.com") ||
        process.env.DB_HOST.includes("aws") ||
        (process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1")
    )) ||
    (dbUrl && (
        dbUrl.includes("aivencloud.com") ||
        dbUrl.includes("render.com") ||
        dbUrl.includes("ssl-mode") ||
        dbUrl.includes("ssl=") ||
        (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1"))
    )) ||
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
        dialectOptions,
        pool: {
            max: parseInt(process.env.DB_POOL_MAX || "10", 10),
            min: parseInt(process.env.DB_POOL_MIN || "0", 10),
            acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
            idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10)
        }
    });
} else if (dialect === "sqlite") {
    const isTest = process.env.NODE_ENV === "test";
    const defaultStorage = isTest
        ? path.resolve(__dirname, "../harvestmitra_test.sqlite")
        : path.resolve(__dirname, "../harvestmitra.sqlite");
    const storagePath = process.env.DB_STORAGE || defaultStorage;
    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: storagePath,
        logging: false
    });
} else {
    const dbHost = process.env.DB_HOST || "localhost";
    const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "require" || isCloudHost;

    sequelize = new Sequelize(
        process.env.DB_NAME || "harvestmitra_db",
        process.env.DB_USER || "root",
        process.env.DB_PASSWORD || "",
        {
            host: dbHost,
            port: parseInt(process.env.DB_PORT || "3306", 10),
            dialect: "mysql",
            logging: false,
            pool: {
                max: parseInt(process.env.DB_POOL_MAX || "10", 10),
                min: parseInt(process.env.DB_POOL_MIN || "0", 10),
                acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
                idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10)
            },
            dialectOptions: {
                connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "15000", 10),
                ...(useSsl ? {
                    ssl: {
                        require: true,
                        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true"
                    }
                } : {})
            },
            retry: {
                max: 3,
                match: [
                    /ETIMEDOUT/,
                    /EHOSTUNREACH/,
                    /ECONNRESET/,
                    /ECONNREFUSED/,
                    /PROTOCOL_CONNECTION_LOST/
                ]
            }
        }
    );
}

// Attach diagnostic helper to format user-friendly, actionable database connection errors
sequelize.formatConnectionError = function (error) {
    if (!error) return "Unknown database error.";
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || (dialect === "mysql" ? "3306" : "N/A");
    const origCode = error.original?.code || error.code || "";
    const msg = error.message || "";

    if (origCode === "ENOTFOUND" || msg.includes("ENOTFOUND")) {
        return `Database Hostname Unresolvable (ENOTFOUND): Host '${host}' could not be resolved by DNS. If using cloud MySQL (such as Aiven), please check that the service is active/powered on and verify the hostname in your provider dashboard.`;
    }
    if (origCode === "ECONNREFUSED" || msg.includes("ECONNREFUSED")) {
        return `Database Connection Refused (ECONNREFUSED): Could not connect to MySQL server at '${host}:${port}'. Please verify that the database service is running and listening on port ${port}.`;
    }
    if (origCode === "ETIMEDOUT" || msg.includes("ETIMEDOUT")) {
        return `Database Connection Timed Out (ETIMEDOUT): The connection attempt to '${host}:${port}' timed out. Please check firewall rules, provider network access control, or VPN settings.`;
    }
    if (origCode === "ER_ACCESS_DENIED_ERROR" || msg.includes("Access denied")) {
        return `Database Authentication Denied: Invalid credentials for database user '${process.env.DB_USER || "root"}'. Please check DB_USER and DB_PASSWORD in backend/.env.`;
    }
    return `Database Error (${origCode || "UNKNOWN"}): ${msg}`;
};

module.exports = sequelize;