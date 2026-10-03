const User = require("./user");
const FarmerProfile = require("./farmerProfile");
const AdminUser = require("./adminUser");
const Crop = require("./crop");
const Market = require("./market");
const MarketPrice = require("./marketPrice");
const Report = require("./report");

User.hasOne(FarmerProfile, { foreignKey: "userId", onDelete: "CASCADE" });
FarmerProfile.belongsTo(User, { foreignKey: "userId" });
User.hasOne(AdminUser, { foreignKey: "userId", onDelete: "CASCADE" });
AdminUser.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Report, { foreignKey: "userId" });
Report.belongsTo(User, { foreignKey: "userId" });
Market.hasMany(MarketPrice, { foreignKey: "marketId", onDelete: "CASCADE" });
MarketPrice.belongsTo(Market, { foreignKey: "marketId" });
Crop.hasMany(MarketPrice, { foreignKey: "cropId", onDelete: "CASCADE" });
MarketPrice.belongsTo(Crop, { foreignKey: "cropId" });

module.exports = { User, FarmerProfile, AdminUser, Crop, Market, MarketPrice, Report };