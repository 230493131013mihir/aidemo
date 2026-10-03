const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MarketPrice = sequelize.define(
    "MarketPrice",
    {
        marketId: { type: DataTypes.INTEGER, allowNull: false, field: "market_id" },
        cropId: { type: DataTypes.INTEGER, allowNull: false, field: "crop_id" },
        pricePerKg: { type: DataTypes.DECIMAL(8, 2), allowNull: false, field: "price_per_kg" },
        pricePerQuintal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "price_per_quintal" },
        minPrice: { type: DataTypes.DECIMAL(8, 2), field: "min_price" },
        maxPrice: { type: DataTypes.DECIMAL(8, 2), field: "max_price" },
        dataType: {
            type: DataTypes.ENUM("verified_live", "sample_demo"),
            defaultValue: "sample_demo",
            field: "data_type"
        },
        priceDate: { type: DataTypes.DATEONLY, allowNull: false, field: "price_date" }
    },
    {
        tableName: "market_prices",
        underscored: true,
        indexes: [{ unique: true, fields: ["market_id", "crop_id", "price_date"] }]
    }
);

module.exports = MarketPrice;