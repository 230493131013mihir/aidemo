const User = require("./user");
const FarmerProfile = require("./farmerProfile");
const TransporterProfile = require("./transporterProfile");
const MandiProfile = require("./mandiProfile");
const AdminUser = require("./adminUser");
const Crop = require("./crop");
const Market = require("./market");
const MarketPrice = require("./marketPrice");
const TransportRequest = require("./transportRequest");
const ContactRequest = require("./contactRequest");
const Report = require("./report");
const Scheme = require("./scheme");
const SavedScheme = require("./savedScheme");
const SchemeChecklist = require("./schemeChecklist");
const Vehicle = require("./vehicle");
const SharedTrip = require("./sharedTrip");

User.hasOne(FarmerProfile, { foreignKey: "userId", onDelete: "CASCADE" });
FarmerProfile.belongsTo(User, { foreignKey: "userId" });

User.hasOne(TransporterProfile, { foreignKey: "userId", onDelete: "CASCADE" });
TransporterProfile.belongsTo(User, { foreignKey: "userId" });

User.hasOne(MandiProfile, { foreignKey: "userId", onDelete: "CASCADE" });
MandiProfile.belongsTo(User, { foreignKey: "userId" });

User.hasOne(AdminUser, { foreignKey: "userId", onDelete: "CASCADE" });
AdminUser.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Report, { foreignKey: "userId" });
Report.belongsTo(User, { foreignKey: "userId" });

User.hasMany(TransportRequest, { foreignKey: "userId" });
TransportRequest.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Vehicle, { foreignKey: "userId", as: "Vehicles" });
Vehicle.belongsTo(User, { foreignKey: "userId" });

Vehicle.hasMany(TransportRequest, { foreignKey: "vehicleId" });
TransportRequest.belongsTo(Vehicle, { foreignKey: "vehicleId" });

User.hasMany(SharedTrip, { foreignKey: "transporterId", as: "SharedTrips" });
SharedTrip.belongsTo(User, { foreignKey: "transporterId" });

Vehicle.hasMany(SharedTrip, { foreignKey: "vehicleId" });
SharedTrip.belongsTo(Vehicle, { foreignKey: "vehicleId" });

SharedTrip.hasMany(TransportRequest, { foreignKey: "sharedTripId", as: "Bookings" });
TransportRequest.belongsTo(SharedTrip, { foreignKey: "sharedTripId" });

User.hasMany(ContactRequest, { foreignKey: "senderId", as: "SentContactRequests" });
User.hasMany(ContactRequest, { foreignKey: "receiverId", as: "ReceivedContactRequests" });

Market.hasMany(MarketPrice, { foreignKey: "marketId", onDelete: "CASCADE" });
MarketPrice.belongsTo(Market, { foreignKey: "marketId" });

Crop.hasMany(MarketPrice, { foreignKey: "cropId", onDelete: "CASCADE" });
MarketPrice.belongsTo(Crop, { foreignKey: "cropId" });

// Government Schemes Associations
User.hasMany(SavedScheme, { foreignKey: "userId", onDelete: "CASCADE" });
SavedScheme.belongsTo(User, { foreignKey: "userId" });
Scheme.hasMany(SavedScheme, { foreignKey: "schemeId", onDelete: "CASCADE" });
SavedScheme.belongsTo(Scheme, { foreignKey: "schemeId" });

User.hasMany(SchemeChecklist, { foreignKey: "userId", onDelete: "CASCADE" });
SchemeChecklist.belongsTo(User, { foreignKey: "userId" });
Scheme.hasMany(SchemeChecklist, { foreignKey: "schemeId", onDelete: "CASCADE" });
SchemeChecklist.belongsTo(Scheme, { foreignKey: "schemeId" });

module.exports = {
  User,
  FarmerProfile,
  TransporterProfile,
  MandiProfile,
  AdminUser,
  Crop,
  Market,
  MarketPrice,
  TransportRequest,
  ContactRequest,
  Report,
  Scheme,
  SavedScheme,
  SchemeChecklist,
  Vehicle,
  SharedTrip
};
