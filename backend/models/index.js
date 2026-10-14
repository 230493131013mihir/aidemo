const User = require("./user");
const FarmerProfile = require("./farmerProfile");
const TransporterProfile = require("./transporterProfile");
const AdminUser = require("./adminUser");
const Crop = require("./crop");
const Market = require("./market");
const MarketPrice = require("./marketPrice");
const TransportRequest = require("./transportRequest");
const Report = require("./report");

User.hasOne(FarmerProfile, { foreignKey: "userId", onDelete: "CASCADE" });
FarmerProfile.belongsTo(User, { foreignKey: "userId" });
User.hasOne(TransporterProfile, { foreignKey: "userId", onDelete: "CASCADE" });
TransporterProfile.belongsTo(User, { foreignKey: "userId" });
User.hasOne(AdminUser, { foreignKey: "userId", onDelete: "CASCADE" });
AdminUser.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Report, { foreignKey: "userId" });
Report.belongsTo(User, { foreignKey: "userId" });
User.hasMany(TransportRequest, { foreignKey: "userId" });
TransportRequest.belongsTo(User, { foreignKey: "userId" });
Market.hasMany(MarketPrice, { foreignKey: "marketId", onDelete: "CASCADE" });
MarketPrice.belongsTo(Market, { foreignKey: "marketId" });
Crop.hasMany(MarketPrice, { foreignKey: "cropId", onDelete: "CASCADE" });
MarketPrice.belongsTo(Crop, { foreignKey: "cropId" });

module.exports = { User, FarmerProfile, TransporterProfile, AdminUser, Crop, Market, MarketPrice, TransportRequest, Report };

