/**
 * fpo.controller.js
 * Comprehensive Controller for Farmer Producer Organization (FPO) Module
 * - Overview Statistics
 * - Member Farmer Management
 * - Crop Availability & Collective Aggregation
 * - Bulk Mandi Procurement & Quotation Management
 * - Collective Transport Integration
 * - Orders History & Financial Transparency
 * HarvestMitra AI
 */

const {
  User,
  FarmerProfile,
  MandiProfile,
  CropAggregation,
  AggregationItem,
  FpoMembership,
  FpoProcurementOffer,
  TransportRequest,
  ContactRequest,
  MarketPrice
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Helper: standard unit to kg conversion
function toKg(qty, unit = "kg") {
  const num = Number(qty) || 0;
  const clean = String(unit || "kg").toLowerCase().trim();
  if (clean === "tonne" || clean === "ton" || clean === "mt") return num * 1000;
  if (clean === "quintal" || clean === "qtl") return num * 100;
  return num;
}

// Helper: Get FPO User & Profile
async function getFpoProfileData(fpoUserId) {
  const user = await User.findByPk(fpoUserId, {
    include: [{ model: FarmerProfile }]
  });
  const profile = user?.FarmerProfile || {};
  return {
    user,
    profile,
    fpoName: profile.fpoName || user?.name || "Kisan Samruddhi FPO",
    registrationNumber: profile.fpoRegistrationNumber || `FPO-MH-${fpoUserId + 2000}`,
    district: profile.district || "Pune",
    state: profile.state || "Maharashtra",
    collectiveAcres: Number(profile.farmSizeAcres) || 45.0,
    memberCount: profile.memberFarmerCount || 45
  };
}

// ==========================================
// 1. OVERVIEW STATISTICS
// ==========================================
async function getOverview(req, res) {
  try {
    const fpoId = req.user.id;
    const fpoData = await getFpoProfileData(fpoId);

    // Membership stats
    const totalMembers = await FpoMembership.count({ where: { fpoId } });
    const activeMembers = await FpoMembership.count({ where: { fpoId, status: "active" } });
    const pendingMembers = await FpoMembership.count({ where: { fpoId, status: "pending" } });

    // Active memberships for crop calculation
    const activeMemberRows = await FpoMembership.findAll({
      where: { fpoId, status: "active", consentShareCrops: true },
      include: [{
        model: User,
        as: "Farmer",
        include: [{ model: FarmerProfile }]
      }]
    });

    let totalAvailableCropKg = 0;
    let lotsReadyForAggregation = 0;

    // Committed quantities in non-completed/non-cancelled aggregations
    const committedItems = await AggregationItem.findAll({
      include: [{
        model: CropAggregation,
        as: "Aggregation",
        where: { fpoId, status: { [Op.notIn]: ["completed", "cancelled"] } }
      }]
    });

    const committedByFarmerCrop = {};
    committedItems.forEach(item => {
      const key = `${item.farmerId}_${item.cropName.toLowerCase()}`;
      committedByFarmerCrop[key] = (committedByFarmerCrop[key] || 0) + Number(item.committedQuantityKg);
    });

    activeMemberRows.forEach(mem => {
      const farmerProf = mem.Farmer?.FarmerProfile;
      if (!farmerProf) return;

      let quantities = {};
      if (typeof farmerProf.productQuantities === "string") {
        try { quantities = JSON.parse(farmerProf.productQuantities) || {}; } catch {}
      } else if (typeof farmerProf.productQuantities === "object" && farmerProf.productQuantities) {
        quantities = farmerProf.productQuantities;
      }

      const mainCrops = farmerProf.mainCrop
        ? farmerProf.mainCrop.split(",").map(c => c.trim()).filter(Boolean)
        : ["Produce"];

      mainCrops.forEach(cropName => {
        const val = quantities[cropName] || 500;
        let qty = 500;
        let unit = "kg";
        if (typeof val === "object" && val !== null) {
          qty = Number(val.qty || val.harvestQuantityKg || 500);
          unit = val.unit || "kg";
        } else if (!isNaN(Number(val))) {
          qty = Number(val);
        }

        const totalKg = toKg(qty, unit);
        const committedKg = committedByFarmerCrop[`${mem.farmerId}_${cropName.toLowerCase()}`] || 0;
        const availableKg = Math.max(0, totalKg - committedKg);

        if (availableKg > 0) {
          totalAvailableCropKg += availableKg;
          lotsReadyForAggregation++;
        }
      });
    });

    // Aggregations count
    const activeAggregationsCount = await CropAggregation.count({
      where: { fpoId, status: { [Op.in]: ["draft", "ready", "offered", "confirmed", "in_transit"] } }
    });

    // Bulk offers count
    const pendingMandiQuotations = await FpoProcurementOffer.count({
      where: { fpoId, status: { [Op.in]: ["awaiting_mandi_response", "quotation_received", "awaiting_fpo_confirmation"] } }
    });

    const confirmedBulkOrders = await FpoProcurementOffer.count({
      where: { fpoId, status: { [Op.in]: ["confirmed", "delivery_scheduled", "delivered", "completed"] } }
    });

    // Transport requests count
    const transportRequestsCount = await TransportRequest.count({
      where: { userId: fpoId, bookingType: "fpo_collective" }
    });

    const activeDeliveriesCount = await TransportRequest.count({
      where: { userId: fpoId, bookingType: "fpo_collective", status: "in_transit" }
    });

    return res.status(200).json({
      success: true,
      data: {
        fpo: {
          id: fpoId,
          name: fpoData.fpoName,
          registrationNumber: fpoData.registrationNumber,
          district: fpoData.district,
          state: fpoData.state,
          collectiveAcres: fpoData.collectiveAcres
        },
        stats: {
          totalMembers,
          activeMembers,
          pendingMembers,
          totalAvailableCropKg: Math.round(totalAvailableCropKg),
          lotsReadyForAggregation,
          activeAggregationsCount,
          pendingMandiQuotations,
          confirmedBulkOrders,
          transportRequestsCount,
          activeDeliveriesCount
        }
      }
    });
  } catch (err) {
    console.error("[FPO Controller] getOverview error:", err);
    return res.status(500).json({ success: false, message: "Unable to load FPO overview" });
  }
}

// ==========================================
// 2. MEMBER FARMER MANAGEMENT
// ==========================================
async function listMembers(req, res) {
  try {
    const fpoId = req.user.id;
    const { status = "all", search = "" } = req.query;

    const where = { fpoId };
    if (status !== "all") {
      where.status = status;
    }

    const memberships = await FpoMembership.findAll({
      where,
      include: [{
        model: User,
        as: "Farmer",
        attributes: ["id", "name", "phone", "email", "status"],
        include: [{
          model: FarmerProfile,
          attributes: ["district", "village", "farmSizeAcres", "mainCrop", "isGovtVerified", "productQuantities"]
        }]
      }],
      order: [["updatedAt", "DESC"]]
    });

    let formatted = memberships.map(m => {
      const u = m.Farmer || {};
      const fp = u.FarmerProfile || {};

      let cropList = [];
      if (fp.mainCrop) {
        cropList = fp.mainCrop.split(",").map(c => c.trim()).filter(Boolean);
      }

      // Privacy protection: if consentShareContact is false, mask phone/email
      const displayPhone = m.consentShareContact ? u.phone : (u.phone ? `+91 ${u.phone.slice(0, 2)}*** ***${u.phone.slice(-2)}` : "Protected");
      const displayEmail = m.consentShareContact ? u.email : "Protected (Consent Pending)";

      return {
        id: m.id,
        farmerId: m.farmerId,
        name: u.name || "Member Farmer",
        phone: displayPhone,
        email: displayEmail,
        district: fp.district || "Pune",
        village: fp.village || "—",
        farmSizeAcres: fp.farmSizeAcres || 0,
        mainCrop: fp.mainCrop || "Produce",
        crops: cropList,
        isGovtVerified: Boolean(fp.isGovtVerified),
        membershipStatus: m.status,
        invitedBy: m.invitedBy,
        consentShareCrops: m.consentShareCrops,
        consentShareContact: m.consentShareContact,
        notes: m.notes,
        joinedAt: m.joinedAt || m.createdAt,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      formatted = formatted.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.village.toLowerCase().includes(q) ||
        m.mainCrop.toLowerCase().includes(q) ||
        String(m.phone).includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error("[FPO Controller] listMembers error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve members" });
  }
}

async function inviteOrAddMember(req, res) {
  try {
    const fpoId = req.user.id;
    const { farmerId, phone, email, notes } = req.body;

    let targetFarmer = null;

    if (farmerId) {
      targetFarmer = await User.findByPk(Number(farmerId), {
        include: [{ model: FarmerProfile }]
      });
    } else if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
      targetFarmer = await User.findOne({
        where: { phone: cleanPhone, role: "farmer" },
        include: [{ model: FarmerProfile }]
      });
    } else if (email) {
      targetFarmer = await User.findOne({
        where: { email: String(email).trim().toLowerCase(), role: "farmer" },
        include: [{ model: FarmerProfile }]
      });
    }

    if (!targetFarmer) {
      return res.status(404).json({
        success: false,
        message: "No registered farmer found matching the provided identifier."
      });
    }

    if (targetFarmer.id === fpoId) {
      return res.status(400).json({
        success: false,
        message: "You cannot add your own FPO account as a member."
      });
    }

    // Check if membership already exists
    const existing = await FpoMembership.findOne({
      where: { fpoId, farmerId: targetFarmer.id }
    });

    if (existing) {
      if (existing.status === "active") {
        return res.status(409).json({
          success: false,
          message: `${targetFarmer.name} is already an active member of this FPO.`
        });
      } else if (existing.status === "pending") {
        return res.status(409).json({
          success: false,
          message: `A membership invitation for ${targetFarmer.name} is already pending.`
        });
      } else {
        // Reactivate membership
        existing.status = "active";
        existing.joinedAt = new Date();
        existing.notes = notes || existing.notes;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: `Reactivated membership for ${targetFarmer.name}.`,
          data: existing
        });
      }
    }

    const membership = await FpoMembership.create({
      fpoId,
      farmerId: targetFarmer.id,
      status: "active", // Direct onboarding by authorized FPO admin
      invitedBy: "fpo",
      consentShareCrops: true,
      consentShareContact: true,
      joinedAt: new Date(),
      notes: notes || "Directly enrolled by FPO administrator."
    });

    // Notify farmer via ContactRequest persistent log
    await ContactRequest.create({
      senderId: fpoId,
      senderName: req.user.name || "FPO Administration",
      senderRole: "fpo_leader",
      receiverId: targetFarmer.id,
      receiverName: targetFarmer.name,
      receiverRole: "farmer",
      cropName: targetFarmer.FarmerProfile?.mainCrop || "All Crops",
      quantityKg: 0,
      proposedPricePerKg: 0,
      message: `🤝 You have been enrolled as a member of ${req.user.name}. You can participate in collective bulk mandi bargaining!`,
      status: "accepted",
      contactType: "fpo_to_farmer"
    });

    return res.status(201).json({
      success: true,
      message: `Farmer ${targetFarmer.name} enrolled into FPO roster successfully!`,
      data: membership
    });
  } catch (err) {
    console.error("[FPO Controller] inviteOrAddMember error:", err);
    return res.status(500).json({ success: false, message: "Unable to enroll member" });
  }
}

async function updateMemberStatus(req, res) {
  try {
    const fpoId = req.user.id;
    const { id } = req.params;
    const { status, consentShareCrops, consentShareContact, notes } = req.body;

    const membership = await FpoMembership.findOne({
      where: { id: Number(id), fpoId },
      include: [{ model: User, as: "Farmer" }]
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership record not found or unauthorized." });
    }

    if (status) {
      if (!["active", "pending", "inactive", "rejected"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value." });
      }
      membership.status = status;
      if (status === "active" && !membership.joinedAt) {
        membership.joinedAt = new Date();
      }
    }

    if (consentShareCrops !== undefined) membership.consentShareCrops = Boolean(consentShareCrops);
    if (consentShareContact !== undefined) membership.consentShareContact = Boolean(consentShareContact);
    if (notes !== undefined) membership.notes = notes;

    await membership.save();

    return res.status(200).json({
      success: true,
      message: `Membership status updated to ${membership.status.toUpperCase()}. Farmer account preserved.`,
      data: membership
    });
  } catch (err) {
    console.error("[FPO Controller] updateMemberStatus error:", err);
    return res.status(500).json({ success: false, message: "Unable to update member status" });
  }
}

async function getAvailableFarmers(req, res) {
  try {
    const fpoId = req.user.id;
    const { search = "", district = "" } = req.query;

    // Get current member IDs
    const existing = await FpoMembership.findAll({
      where: { fpoId },
      attributes: ["farmerId"]
    });
    const excludedIds = existing.map(e => e.farmerId);
    excludedIds.push(fpoId);

    const where = {
      role: "farmer",
      id: { [Op.notIn]: excludedIds },
      status: { [Op.ne]: "suspended" }
    };

    if (search && search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ];
    }

    const profileWhere = {};
    if (district && district.trim()) {
      profileWhere.district = district.trim();
    }

    const farmers = await User.findAll({
      where,
      attributes: ["id", "name", "phone", "email"],
      include: [{
        model: FarmerProfile,
        where: profileWhere,
        attributes: ["district", "village", "farmSizeAcres", "mainCrop", "isGovtVerified"]
      }],
      limit: 20
    });

    const formatted = farmers.map(f => {
      const p = f.FarmerProfile || {};
      return {
        id: f.id,
        name: f.name,
        phone: f.phone ? `+91 ${f.phone.slice(0, 2)}*** ***${f.phone.slice(-2)}` : "—",
        district: p.district || "Pune",
        village: p.village || "—",
        farmSizeAcres: p.farmSizeAcres || 0,
        mainCrop: p.mainCrop || "Produce",
        isGovtVerified: Boolean(p.isGovtVerified)
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error("[FPO Controller] getAvailableFarmers error:", err);
    return res.status(500).json({ success: false, message: "Unable to search available farmers" });
  }
}

// ==========================================
// 3. CROP AVAILABILITY & AGGREGATION
// ==========================================
async function getMemberCropAvailability(req, res) {
  try {
    const fpoId = req.user.id;
    const { crop = "all" } = req.query;

    const memberships = await FpoMembership.findAll({
      where: { fpoId, status: "active", consentShareCrops: true },
      include: [{
        model: User,
        as: "Farmer",
        attributes: ["id", "name", "phone"],
        include: [{
          model: FarmerProfile,
          attributes: ["district", "village", "farmSizeAcres", "mainCrop", "productQuantities", "isGovtVerified"]
        }]
      }]
    });

    // Calculate committed quantities
    const committedItems = await AggregationItem.findAll({
      include: [{
        model: CropAggregation,
        as: "Aggregation",
        where: { fpoId, status: { [Op.notIn]: ["completed", "cancelled"] } }
      }]
    });

    const committedMap = {};
    committedItems.forEach(item => {
      const key = `${item.farmerId}_${item.cropName.toLowerCase()}`;
      committedMap[key] = (committedMap[key] || 0) + Number(item.committedQuantityKg);
    });

    const lots = [];

    memberships.forEach(m => {
      const u = m.Farmer;
      const fp = u?.FarmerProfile;
      if (!fp) return;

      let quantities = {};
      if (typeof fp.productQuantities === "string") {
        try { quantities = JSON.parse(fp.productQuantities) || {}; } catch {}
      } else if (typeof fp.productQuantities === "object" && fp.productQuantities) {
        quantities = fp.productQuantities;
      }

      const rawCrops = fp.mainCrop ? fp.mainCrop.split(",").map(c => c.trim()).filter(Boolean) : ["Produce"];

      rawCrops.forEach(cName => {
        if (crop !== "all" && cName.toLowerCase() !== crop.toLowerCase()) return;

        const val = quantities[cName] || 500;
        let qty = 500;
        let unit = "kg";
        if (typeof val === "object" && val !== null) {
          qty = Number(val.qty || val.harvestQuantityKg || 500);
          unit = val.unit || "kg";
        } else if (!isNaN(Number(val))) {
          qty = Number(val);
        }

        const totalKg = toKg(qty, unit);
        const committedKg = committedMap[`${u.id}_${cName.toLowerCase()}`] || 0;
        const availableKg = Math.max(0, totalKg - committedKg);

        lots.push({
          farmerId: u.id,
          farmerName: u.name,
          cropName: cName,
          village: fp.village || "Haveli",
          district: fp.district || "Pune",
          totalHarvestKg: totalKg,
          committedKg: Math.round(committedKg),
          availableQuantityKg: Math.round(availableKg),
          isGovtVerified: Boolean(fp.isGovtVerified),
          readyForAggregation: availableKg > 0
        });
      });
    });

    return res.status(200).json({
      success: true,
      data: lots
    });
  } catch (err) {
    console.error("[FPO Controller] getMemberCropAvailability error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve crop availability" });
  }
}

async function createAggregation(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const fpoId = req.user.id;
    const {
      cropName,
      variety,
      grade = "Grade A",
      expectedRatePerKg,
      pickupDistrict = "Pune",
      pickupHub,
      notes,
      items = []
    } = req.body;

    if (!cropName || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Crop name and at least one participating farmer lot are required."
      });
    }

    // Verify all farmers are active members of this FPO
    const farmerIds = items.map(i => Number(i.farmerId));
    const activeMembers = await FpoMembership.findAll({
      where: {
        fpoId,
        farmerId: { [Op.in]: farmerIds },
        status: "active",
        consentShareCrops: true
      },
      transaction
    });

    if (activeMembers.length !== farmerIds.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "One or more selected farmers are not active consented members of this FPO."
      });
    }

    // Check available quantities for each farmer to prevent over-allocation
    const committedItems = await AggregationItem.findAll({
      where: { farmerId: { [Op.in]: farmerIds }, cropName },
      include: [{
        model: CropAggregation,
        as: "Aggregation",
        where: { fpoId, status: { [Op.notIn]: ["completed", "cancelled"] } }
      }],
      transaction
    });

    const committedMap = {};
    committedItems.forEach(ci => {
      committedMap[ci.farmerId] = (committedMap[ci.farmerId] || 0) + Number(ci.committedQuantityKg);
    });

    let calculatedTotalKg = 0;

    for (const item of items) {
      const commitQty = Number(item.committedQuantityKg);
      if (isNaN(commitQty) || commitQty <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid committed quantity for farmer #${item.farmerId}.`
        });
      }

      // Check farmer total harvest
      const farmerProf = await FarmerProfile.findOne({
        where: { userId: item.farmerId },
        transaction
      });

      let totalHarvestKg = 500;
      if (farmerProf) {
        let quantities = {};
        try { quantities = typeof farmerProf.productQuantities === "string" ? JSON.parse(farmerProf.productQuantities) : (farmerProf.productQuantities || {}); } catch {}
        const val = quantities[cropName] || 500;
        const q = typeof val === "object" ? Number(val.qty || 500) : Number(val);
        const u = typeof val === "object" ? (val.unit || "kg") : "kg";
        totalHarvestKg = toKg(q, u);
      }

      const alreadyCommitted = committedMap[item.farmerId] || 0;
      const uncommitted = Math.max(0, totalHarvestKg - alreadyCommitted);

      if (commitQty > uncommitted) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Farmer #${item.farmerId} only has ${uncommitted} kg uncommitted ${cropName} (attempted to commit ${commitQty} kg).`
        });
      }

      calculatedTotalKg += commitQty;
    }

    const uniqueCode = `AGG-${new Date().getFullYear()}-${pickupDistrict.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const aggregation = await CropAggregation.create({
      aggregationCode: uniqueCode,
      fpoId,
      cropName: cropName.trim(),
      variety: variety ? variety.trim() : null,
      grade: grade || "Grade A",
      totalQuantityKg: calculatedTotalKg,
      availableQuantityKg: calculatedTotalKg,
      unit: "kg",
      expectedRatePerKg: expectedRatePerKg ? Number(expectedRatePerKg) : null,
      pickupDistrict: pickupDistrict.trim(),
      pickupHub: pickupHub ? pickupHub.trim() : `${pickupDistrict.trim()} FPO Central Aggregation Hub`,
      status: "ready",
      notes: notes ? notes.trim() : null,
      createdBy: fpoId
    }, { transaction });

    for (const item of items) {
      await AggregationItem.create({
        aggregationId: aggregation.id,
        farmerId: Number(item.farmerId),
        cropName: cropName.trim(),
        committedQuantityKg: Number(item.committedQuantityKg),
        farmerConsentStatus: "consented", // explicitly submitted with member consent
        consentedAt: new Date(),
        notes: item.notes || null
      }, { transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: `Collective crop lot ${uniqueCode} aggregated successfully (${calculatedTotalKg} kg ${cropName})!`,
      data: aggregation
    });
  } catch (err) {
    await transaction.rollback();
    console.error("[FPO Controller] createAggregation error:", err);
    return res.status(500).json({ success: false, message: "Unable to create aggregation" });
  }
}

async function listAggregations(req, res) {
  try {
    const fpoId = req.user.id;
    const { status = "all" } = req.query;

    const where = { fpoId };
    if (status !== "all") {
      where.status = status;
    }

    const aggregations = await CropAggregation.findAll({
      where,
      include: [
        {
          model: AggregationItem,
          as: "Items",
          include: [{
            model: User,
            as: "Farmer",
            attributes: ["id", "name", "phone"],
            include: [{ model: FarmerProfile, attributes: ["village", "district"] }]
          }]
        },
        {
          model: FpoProcurementOffer,
          as: "Offers"
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: aggregations
    });
  } catch (err) {
    console.error("[FPO Controller] listAggregations error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve aggregations" });
  }
}

async function cancelAggregation(req, res) {
  try {
    const fpoId = req.user.id;
    const { id } = req.params;

    const aggregation = await CropAggregation.findOne({
      where: { id: Number(id), fpoId }
    });

    if (!aggregation) {
      return res.status(404).json({ success: false, message: "Aggregation not found or unauthorized." });
    }

    if (["confirmed", "in_transit", "completed"].includes(aggregation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an aggregation that is already ${aggregation.status.toUpperCase()}. Please cancel linked procurement offer first.`
      });
    }

    aggregation.status = "cancelled";
    aggregation.availableQuantityKg = 0;
    await aggregation.save();

    return res.status(200).json({
      success: true,
      message: `Aggregation ${aggregation.aggregationCode} cancelled. Committed quantities returned to member farmers.`,
      data: aggregation
    });
  } catch (err) {
    console.error("[FPO Controller] cancelAggregation error:", err);
    return res.status(500).json({ success: false, message: "Unable to cancel aggregation" });
  }
}

// ==========================================
// 4. BULK MANDI PROCUREMENT
// ==========================================
async function createBulkOffer(req, res) {
  try {
    const fpoId = req.user.id;
    const {
      aggregationId,
      mandiName,
      mandiId,
      requestedRatePerKg,
      expectedDeliveryDate,
      notes
    } = req.body;

    if (!aggregationId || !mandiName || !requestedRatePerKg) {
      return res.status(400).json({
        success: false,
        message: "Aggregation ID, target Mandi name, and requested rate per kg are required."
      });
    }

    const aggregation = await CropAggregation.findOne({
      where: { id: Number(aggregationId), fpoId },
      include: [{ model: AggregationItem, as: "Items" }]
    });

    if (!aggregation) {
      return res.status(404).json({ success: false, message: "Aggregation not found or unauthorized." });
    }

    if (aggregation.status === "cancelled" || aggregation.status === "completed") {
      return res.status(400).json({ success: false, message: `Cannot submit offer for a ${aggregation.status} aggregation.` });
    }

    const offerCode = `FPO-OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const offer = await FpoProcurementOffer.create({
      offerCode,
      aggregationId: aggregation.id,
      fpoId,
      mandiId: mandiId ? Number(mandiId) : null,
      mandiName: mandiName.trim(),
      cropName: aggregation.cropName,
      totalQuantityKg: aggregation.totalQuantityKg,
      requestedRatePerKg: Number(requestedRatePerKg),
      expectedDeliveryDate: expectedDeliveryDate || null,
      status: "awaiting_mandi_response",
      fpoNotes: notes || null,
      history: JSON.stringify([{
        action: "OFFER_CREATED",
        timestamp: new Date(),
        by: req.user.name || "FPO Leader",
        details: `Submitted bulk offer of ${aggregation.totalQuantityKg} kg ${aggregation.cropName} at ₹${requestedRatePerKg}/kg to ${mandiName}`
      }])
    });

    // Mark aggregation as offered
    aggregation.status = "offered";
    await aggregation.save();

    // Create a persistent ContactRequest for Mandi so they see it in Mandi Portal
    let targetMandiUser = null;
    if (mandiId) {
      targetMandiUser = await User.findByPk(Number(mandiId));
    }
    if (!targetMandiUser) {
      targetMandiUser = await User.findOne({ where: { role: "mandi" } });
    }

    if (targetMandiUser) {
      await ContactRequest.create({
        senderId: fpoId,
        senderName: req.user.name || "Kisan Samruddhi FPO",
        senderRole: "fpo_leader",
        senderContact: req.user.phone || req.user.email,
        receiverId: targetMandiUser.id,
        receiverName: mandiName.trim(),
        receiverRole: "mandi",
        cropName: aggregation.cropName,
        quantityKg: aggregation.totalQuantityKg,
        proposedPricePerKg: Number(requestedRatePerKg),
        message: `🏢 [FPO Bulk Offer: ${offerCode}] Collective consignment of ${aggregation.totalQuantityKg} kg ${aggregation.cropName} (${aggregation.Items?.length || 1} member farmers). Expected rate: ₹${requestedRatePerKg}/kg.`,
        status: "pending",
        contactType: "farmer_to_mandi"
      });
    }

    return res.status(201).json({
      success: true,
      message: `Bulk offer ${offerCode} dispatched to ${mandiName} successfully!`,
      data: offer
    });
  } catch (err) {
    console.error("[FPO Controller] createBulkOffer error:", err);
    return res.status(500).json({ success: false, message: "Unable to create bulk offer" });
  }
}

async function listBulkOffers(req, res) {
  try {
    const fpoId = req.user.id;
    const { status = "all" } = req.query;

    const where = { fpoId };
    if (status !== "all") {
      where.status = status;
    }

    const offers = await FpoProcurementOffer.findAll({
      where,
      include: [
        {
          model: CropAggregation,
          as: "Aggregation",
          include: [{
            model: AggregationItem,
            as: "Items",
            include: [{ model: User, as: "Farmer", attributes: ["id", "name"] }]
          }]
        },
        {
          model: TransportRequest,
          as: "TransportRequest"
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: offers
    });
  } catch (err) {
    console.error("[FPO Controller] listBulkOffers error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve bulk offers" });
  }
}

// Mandi quotes rate on FPO bulk offer
async function mandiQuoteOffer(req, res) {
  try {
    const { id } = req.params;
    const { quotedRatePerKg, mandiNotes } = req.body;

    if (!quotedRatePerKg || Number(quotedRatePerKg) <= 0) {
      return res.status(400).json({ success: false, message: "Valid quoted rate per kg is required." });
    }

    const offer = await FpoProcurementOffer.findByPk(Number(id));
    if (!offer) {
      return res.status(404).json({ success: false, message: "Bulk offer not found." });
    }

    const rate = Number(quotedRatePerKg);
    let hist = [];
    try { hist = JSON.parse(offer.history || "[]"); } catch {}

    hist.push({
      action: "QUOTATION_SUBMITTED",
      timestamp: new Date(),
      by: req.user.name || "APMC Mandi Officer",
      details: `Mandi submitted counter-quotation of ₹${rate}/kg (requested was ₹${offer.requestedRatePerKg}/kg)`
    });

    offer.quotedRatePerKg = rate;
    offer.status = "quotation_received";
    offer.mandiNotes = mandiNotes || offer.mandiNotes;
    offer.history = JSON.stringify(hist);
    await offer.save();

    return res.status(200).json({
      success: true,
      message: `Quotation of ₹${rate}/kg submitted for FPO Offer ${offer.offerCode}.`,
      data: offer
    });
  } catch (err) {
    console.error("[FPO Controller] mandiQuoteOffer error:", err);
    return res.status(500).json({ success: false, message: "Unable to submit quotation" });
  }
}

// FPO decides on Mandi's quotation (Accept / Reject)
async function fpoDecideQuotation(req, res) {
  try {
    const fpoId = req.user.id;
    const { id } = req.params;
    const { action, notes } = req.body; // 'accept' or 'reject'

    const offer = await FpoProcurementOffer.findOne({
      where: { id: Number(id), fpoId },
      include: [{ model: CropAggregation, as: "Aggregation" }]
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found or unauthorized." });
    }

    let hist = [];
    try { hist = JSON.parse(offer.history || "[]"); } catch {}

    if (action === "accept") {
      const finalRate = offer.quotedRatePerKg || offer.requestedRatePerKg;
      const grossValue = finalRate * Number(offer.totalQuantityKg);

      offer.status = "confirmed";
      offer.agreedRatePerKg = finalRate;
      offer.settlementAmount = grossValue;
      offer.settlementStatus = "unsettled";

      hist.push({
        action: "OFFER_CONFIRMED",
        timestamp: new Date(),
        by: req.user.name || "FPO Leader",
        details: `Confirmed bulk contract with ${offer.mandiName} at ₹${finalRate}/kg. Total gross value: ₹${grossValue.toLocaleString("en-IN")}`
      });

      if (offer.Aggregation) {
        offer.Aggregation.status = "confirmed";
        await offer.Aggregation.save();
      }
    } else {
      offer.status = "rejected";
      hist.push({
        action: "OFFER_REJECTED",
        timestamp: new Date(),
        by: req.user.name || "FPO Leader",
        details: `FPO rejected mandi quotation: ${notes || "Rate expectation mismatch"}`
      });
    }

    offer.history = JSON.stringify(hist);
    await offer.save();

    return res.status(200).json({
      success: true,
      message: action === "accept"
        ? `Bulk deal ${offer.offerCode} confirmed at ₹${offer.agreedRatePerKg}/kg! Ready for collective transport scheduling.`
        : `Offer ${offer.offerCode} rejected.`,
      data: offer
    });
  } catch (err) {
    console.error("[FPO Controller] fpoDecideQuotation error:", err);
    return res.status(500).json({ success: false, message: "Unable to process decision" });
  }
}

// ==========================================
// 5. COLLECTIVE TRANSPORT INTEGRATION
// ==========================================
async function requestCollectiveTransport(req, res) {
  try {
    const fpoId = req.user.id;
    const { offerId, pickupDate, vehicleType = "Tata 407 Agri LCV", notes } = req.body;

    const offer = await FpoProcurementOffer.findOne({
      where: { id: Number(offerId), fpoId },
      include: [{ model: CropAggregation, as: "Aggregation" }]
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: "Procurement offer not found or unauthorized." });
    }

    if (offer.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Transport can only be scheduled for confirmed bulk procurement orders."
      });
    }

    const weightKg = Math.round(Number(offer.totalQuantityKg));
    const pickupLoc = offer.Aggregation?.pickupHub || `${offer.Aggregation?.pickupDistrict || "Pune"} FPO Central Hub`;
    const destMarket = offer.mandiName;

    // Check existing transport request to prevent duplicates
    if (offer.transportRequestId) {
      const existingReq = await TransportRequest.findByPk(offer.transportRequestId);
      if (existingReq) {
        return res.status(200).json({
          success: true,
          message: `Transport request already scheduled for this order.`,
          data: existingReq
        });
      }
    }

    const bookingId = `FPO-TR-${offer.offerCode}`;
    const estimatedCost = Math.round(weightKg * 1.75); // ₹1.75/kg pooled freight benchmark

    const transportReq = await TransportRequest.create({
      userId: fpoId,
      farmerName: req.user.name || "Kisan Samruddhi FPO",
      farmerPhone: req.user.phone || "9822012345",
      cropName: offer.cropName,
      cropCategory: "Vegetable",
      pickupLocation: pickupLoc,
      destinationMarket: destMarket,
      pickupDate: pickupDate || offer.expectedDeliveryDate || new Date().toISOString().slice(0, 10),
      weightKg,
      quantityUnit: "kg",
      originalQuantity: weightKg,
      bookingType: "fpo_collective",
      sharingFarmersCount: offer.Aggregation?.Items?.length || 5,
      vehicleType,
      status: "open",
      bookingId,
      estimatedSharedCost: estimatedCost,
      finalCost: estimatedCost,
      paymentStatus: "unpaid"
    });

    offer.transportRequestId = transportReq.id;
    offer.status = "delivery_scheduled";

    let hist = [];
    try { hist = JSON.parse(offer.history || "[]"); } catch {}
    hist.push({
      action: "TRANSPORT_REQUESTED",
      timestamp: new Date(),
      by: req.user.name || "FPO Leader",
      details: `Scheduled collective transport request #${transportReq.id} (${weightKg} kg) to ${destMarket}`
    });
    offer.history = JSON.stringify(hist);
    await offer.save();

    if (offer.Aggregation) {
      offer.Aggregation.status = "in_transit";
      await offer.Aggregation.save();
    }

    return res.status(201).json({
      success: true,
      message: `Collective transport request #${transportReq.id} (${bookingId}) dispatched to Transporter Network!`,
      data: {
        offer,
        transportRequest: transportReq
      }
    });
  } catch (err) {
    console.error("[FPO Controller] requestCollectiveTransport error:", err);
    return res.status(500).json({ success: false, message: "Unable to schedule collective transport" });
  }
}

// ==========================================
// 6. ORDERS HISTORY & FINANCIAL TRANSPARENCY
// ==========================================
async function getOrdersHistory(req, res) {
  try {
    const fpoId = req.user.id;

    const offers = await FpoProcurementOffer.findAll({
      where: { fpoId },
      include: [
        {
          model: CropAggregation,
          as: "Aggregation",
          include: [{
            model: AggregationItem,
            as: "Items",
            include: [{
              model: User,
              as: "Farmer",
              attributes: ["id", "name", "phone"],
              include: [{ model: FarmerProfile, attributes: ["village", "district"] }]
            }]
          }]
        },
        {
          model: TransportRequest,
          as: "TransportRequest"
        }
      ],
      order: [["updatedAt", "DESC"]]
    });

    const formatted = offers.map(o => {
      const agg = o.Aggregation || {};
      const tr = o.TransportRequest || {};
      const rate = o.agreedRatePerKg || o.quotedRatePerKg || o.requestedRatePerKg;
      const totalQty = Number(o.totalQuantityKg);
      const grossValue = rate ? Math.round(rate * totalQty) : 0;
      const transportCost = tr.finalCost || tr.estimatedSharedCost || 0;
      const netPayable = Math.max(0, grossValue - transportCost);

      // Calculate farmer payout breakdown
      const farmerBreakdown = (agg.Items || []).map(item => {
        const itemQty = Number(item.committedQuantityKg);
        const itemGross = rate ? Math.round(rate * itemQty) : 0;
        const itemTransportShare = totalQty > 0 ? Math.round(transportCost * (itemQty / totalQty)) : 0;
        const itemNet = Math.max(0, itemGross - itemTransportShare);

        return {
          farmerId: item.farmerId,
          farmerName: item.Farmer?.name || `Farmer #${item.farmerId}`,
          village: item.Farmer?.FarmerProfile?.village || "Haveli",
          committedQuantityKg: itemQty,
          sharePercentage: totalQty > 0 ? Number(((itemQty / totalQty) * 100).toFixed(1)) : 0,
          grossShare: itemGross,
          transportShare: itemTransportShare,
          netPayable: itemNet
        };
      });

      let historyTrace = [];
      try { historyTrace = JSON.parse(o.history || "[]"); } catch {}

      return {
        id: o.id,
        offerCode: o.offerCode,
        aggregationCode: agg.aggregationCode || `AGG-${o.aggregationId}`,
        mandiName: o.mandiName,
        cropName: o.cropName,
        totalQuantityKg: totalQty,
        requestedRatePerKg: o.requestedRatePerKg,
        quotedRatePerKg: o.quotedRatePerKg,
        agreedRatePerKg: o.agreedRatePerKg,
        status: o.status,
        expectedDeliveryDate: o.expectedDeliveryDate,
        financials: {
          grossValue,
          transportDeduction: transportCost,
          netOrderValue: netPayable,
          settlementStatus: o.settlementStatus,
          settlementAmount: o.settlementAmount
        },
        transport: tr.id ? {
          id: tr.id,
          bookingId: tr.bookingId,
          status: tr.status,
          vehicleType: tr.vehicleType,
          vehicleNumber: tr.vehicleNumber || "Assigned on Dispatch",
          driverName: tr.driverName || "Driver Assigned",
          driverPhone: tr.driverPhone || null,
          gatePassCode: tr.gatePassCode || null
        } : null,
        farmerBreakdown,
        historyTrace,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error("[FPO Controller] getOrdersHistory error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve orders history" });
  }
}

// List all registered FPOs for farmers to discover and apply
async function listAllFPOs(req, res) {
  try {
    const fpoUsers = await User.findAll({
      where: { role: { [Op.in]: ["fpo_leader", "fpo"] } },
      attributes: ["id", "name", "phone", "email"],
      include: [{ model: FarmerProfile }]
    });

    const result = fpoUsers.map(u => {
      const p = u.FarmerProfile || {};
      return {
        id: u.id,
        name: p.fpoName || u.name || "Kisan Samruddhi FPO",
        registrationNumber: p.fpoRegistrationNumber || `FPO-MH-${u.id + 2000}`,
        district: p.district || "Pune",
        state: p.state || "Maharashtra",
        totalAcres: Number(p.farmSizeAcres) || 45.0,
        memberCount: p.memberFarmerCount || 45,
        mainCrops: p.mainCrop || "Vegetables, Pulses, Grains"
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[FPO Controller] listAllFPOs error:", err);
    return res.status(500).json({ success: false, message: "Unable to load FPO directory" });
  }
}

// Farmer applies to join an FPO
async function farmerRequestMembership(req, res) {
  try {
    const farmerId = req.user.id;
    const { fpoId, notes } = req.body;

    if (!fpoId) {
      return res.status(400).json({ success: false, message: "fpoId is required" });
    }

    const fpo = await User.findOne({
      where: { id: Number(fpoId), role: { [Op.in]: ["fpo_leader", "fpo"] } }
    });

    if (!fpo) {
      return res.status(404).json({ success: false, message: "Selected FPO was not found." });
    }

    // Check existing membership or pending request
    const existing = await FpoMembership.findOne({
      where: { fpoId: fpo.id, farmerId }
    });

    if (existing) {
      if (existing.status === "active") {
        return res.status(409).json({ success: false, message: `You are already an active member of ${fpo.name}.` });
      }
      if (existing.status === "pending") {
        return res.status(409).json({ success: false, message: `Your membership application to ${fpo.name} is already under review.` });
      }
      // Re-apply if previously rejected
      existing.status = "pending";
      existing.invitedBy = "farmer";
      existing.notes = notes || "Re-applied for membership.";
      await existing.save();
      return res.status(200).json({
        success: true,
        message: `Membership application resubmitted to ${fpo.name}! Status: PENDING.`,
        data: existing
      });
    }

    const membership = await FpoMembership.create({
      fpoId: fpo.id,
      farmerId,
      status: "pending",
      invitedBy: "farmer",
      consentShareCrops: true,
      consentShareContact: true,
      notes: notes || "Farmer submitted online membership request."
    });

    // Notify FPO via ContactRequest persistent log
    await ContactRequest.create({
      senderId: farmerId,
      senderName: req.user.name || "Registered Farmer",
      senderRole: "farmer",
      receiverId: fpo.id,
      receiverName: fpo.name,
      receiverRole: "fpo_leader",
      cropName: req.user.FarmerProfile?.mainCrop || "All Crops",
      quantityKg: req.user.FarmerProfile?.currentHarvestKg || 500,
      proposedPricePerKg: 0,
      message: `📝 Farmer ${req.user.name} submitted a new membership request to join your FPO.`,
      status: "pending",
      contactType: "farmer_to_fpo"
    });

    return res.status(201).json({
      success: true,
      message: `Membership application sent to ${fpo.name}! Status: PENDING approval by FPO management.`,
      data: membership
    });
  } catch (err) {
    console.error("[FPO Controller] farmerRequestMembership error:", err);
    return res.status(500).json({ success: false, message: "Unable to submit membership application" });
  }
}

// Farmer gets their current FPO membership status
async function getFarmerMembershipStatus(req, res) {
  try {
    const farmerId = req.user.id;
    const memberships = await FpoMembership.findAll({
      where: { farmerId },
      include: [{
        model: User,
        as: "Fpo",
        attributes: ["id", "name", "phone", "email"],
        include: [{ model: FarmerProfile }]
      }],
      order: [["updatedAt", "DESC"]]
    });

    const formatted = memberships.map(m => {
      const f = m.Fpo || {};
      const fp = f.FarmerProfile || {};
      return {
        id: m.id,
        fpoId: m.fpoId,
        fpoName: fp.fpoName || f.name || "Kisan Samruddhi FPO",
        fpoPhone: f.phone,
        district: fp.district || "Pune",
        state: fp.state || "Maharashtra",
        status: m.status, // 'pending' | 'active' | 'rejected'
        invitedBy: m.invitedBy,
        notes: m.notes,
        joinedAt: m.joinedAt || m.createdAt,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      };
    });

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error("[FPO Controller] getFarmerMembershipStatus error:", err);
    return res.status(500).json({ success: false, message: "Unable to load membership status" });
  }
}

// FPO Leader: List membership requests submitted to their FPO
async function getFpoMembershipRequests(req, res) {
  try {
    const fpoId = req.user.id;
    const { status = "all", search = "" } = req.query;

    const where = { fpoId };
    if (status !== "all") {
      where.status = status;
    }

    const memberships = await FpoMembership.findAll({
      where,
      include: [{
        model: User,
        as: "Farmer",
        attributes: ["id", "name", "phone", "email", "status"],
        include: [{
          model: FarmerProfile,
          attributes: ["district", "village", "farmSizeAcres", "mainCrop", "isGovtVerified", "productQuantities"]
        }]
      }],
      order: [["createdAt", "DESC"]]
    });

    let formatted = memberships.map(m => {
      const u = m.Farmer || {};
      const fp = u.FarmerProfile || {};

      let cropList = [];
      if (fp.mainCrop) {
        cropList = fp.mainCrop.split(",").map(c => c.trim()).filter(Boolean);
      }

      return {
        id: m.id,
        farmerId: m.farmerId,
        farmerName: u.name || "Registered Farmer",
        name: u.name || "Registered Farmer",
        phone: u.phone || "—",
        email: u.email || "—",
        district: fp.district || "Pune",
        village: fp.village || "—",
        location: `${fp.village || 'Village'}, ${fp.district || 'Pune'}`,
        farmSizeAcres: Number(fp.farmSizeAcres) || 0,
        mainCrop: fp.mainCrop || "Produce",
        crops: cropList,
        isGovtVerified: Boolean(fp.isGovtVerified),
        status: m.status, // 'pending' | 'active' | 'rejected'
        membershipStatus: m.status,
        invitedBy: m.invitedBy,
        notes: m.notes,
        submittedAt: m.createdAt,
        createdAt: m.createdAt,
        joinedAt: m.joinedAt,
        updatedAt: m.updatedAt
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      formatted = formatted.filter(m =>
        m.farmerName.toLowerCase().includes(q) ||
        m.village.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q) ||
        m.mainCrop.toLowerCase().includes(q) ||
        String(m.phone).includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error("[FPO Controller] getFpoMembershipRequests error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve membership requests" });
  }
}

// FPO decides on incoming membership request (Accept or Reject)
async function decideMembershipRequest(req, res) {
  try {
    const fpoId = req.user.id;
    const { id } = req.params;
    const rawDecision = req.body.decision || req.body.action || req.body.status || "";
    const decision = String(rawDecision).toLowerCase();
    const reason = req.body.reason || req.body.notes || "";

    const isAccept = decision === "accept" || decision === "active" || decision === "approve";
    const isReject = decision === "reject" || decision === "rejected" || decision === "decline";

    if (!isAccept && !isReject) {
      return res.status(400).json({ success: false, message: "decision must be either 'accept' or 'reject'" });
    }

    const membership = await FpoMembership.findOne({
      where: { id: Number(id), fpoId },
      include: [{ model: User, as: "Farmer", attributes: ["id", "name", "phone", "email"] }]
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership request record not found or unauthorized." });
    }

    if (isAccept) {
      membership.status = "active";
      membership.joinedAt = new Date();
      if (reason) membership.notes = reason;
      await membership.save();

      // Update ContactRequest if any
      await ContactRequest.update(
        { status: "accepted" },
        { where: { senderId: membership.farmerId, receiverId: fpoId, contactType: "farmer_to_fpo" } }
      );

      return res.status(200).json({
        success: true,
        message: `Accepted membership for ${membership.Farmer?.name || 'Farmer'}! Member is now active in your roster.`,
        data: membership
      });
    } else {
      membership.status = "rejected";
      if (reason) membership.notes = `Rejected: ${reason}`;
      await membership.save();

      await ContactRequest.update(
        { status: "declined" },
        { where: { senderId: membership.farmerId, receiverId: fpoId, contactType: "farmer_to_fpo" } }
      );

      return res.status(200).json({
        success: true,
        message: `Membership application for ${membership.Farmer?.name || 'Farmer'} has been rejected.`,
        data: membership
      });
    }
  } catch (err) {
    console.error("[FPO Controller] decideMembershipRequest error:", err);
    return res.status(500).json({ success: false, message: "Unable to process membership decision" });
  }
}

module.exports = {
  getOverview,
  listMembers,
  inviteOrAddMember,
  updateMemberStatus,
  getAvailableFarmers,
  getMemberCropAvailability,
  createAggregation,
  listAggregations,
  cancelAggregation,
  createBulkOffer,
  listBulkOffers,
  mandiQuoteOffer,
  fpoDecideQuotation,
  requestCollectiveTransport,
  getOrdersHistory,
  listAllFPOs,
  farmerRequestMembership,
  getFarmerMembershipStatus,
  getFpoMembershipRequests,
  decideMembershipRequest
};
