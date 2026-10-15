const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const dialect = process.env.DB_DIALECT || (process.env.DB_PASSWORD ? "mysql" : "sqlite");

let sequelize;
if (dialect === "sqlite") {
    const storagePath = path.resolve(__dirname, "../harvestmitra.sqlite");
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
            logging: false
        }
    );
}

module.exports = sequelize;