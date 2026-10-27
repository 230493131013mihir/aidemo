const schemeService = require("../services/schemeService");
const { Scheme, SavedScheme, SchemeChecklist, FarmerProfile } = require("../models");
const { recordAudit } = require("../services/auditService");
const jwt = require("jsonwebtoken");

/**
 * Public & Farmer Scheme Discovery Endpoints
 */
async function handleListSchemes(req, res) {
  try {
    const result = await schemeService.listSchemes(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[SchemeController] handleListSchemes error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve government schemes." });
  }
}

async function handleGetSchemeById(req, res) {
  try {
    const scheme = await schemeService.getSchemeById(req.params.id);
    return res.status(200).json({ success: true, data: scheme });
  } catch (err) {
    console.error("[SchemeController] handleGetSchemeById error:", err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to retrieve scheme details."
    });
  }
}

async function handleMatchSchemes(req, res) {
  try {
    // Farmer profile answers or request body
    const answers = { ...(req.body || {}) };

    // Auto-populate from logged-in farmer's Agristack profile if available
    let farmerProfile = req.user?.FarmerProfile || null;
    if (!farmerProfile && req.user?.id) {
      farmerProfile = await FarmerProfile.findOne({ where: { userId: req.user.id } });
    } else if (!farmerProfile && req.headers?.authorization?.startsWith("Bearer ")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        if (token && token !== "guest" && token !== "guest_token") {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon");
          if (decoded?.id) {
            farmerProfile = await FarmerProfile.findOne({ where: { userId: decoded.id } });
          }
        }
      } catch (e) {
        // Safe token parsing fallback
      }
    }

    if (farmerProfile) {
      if (answers.isGovtVerified === undefined) answers.isGovtVerified = Boolean(farmerProfile.isGovtVerified);
      if (!answers.agristackId) answers.agristackId = farmerProfile.agristackId;
      if (!answers.surveyNumber) answers.surveyNumber = farmerProfile.surveyNumber;
      if (answers.aadhaarLinked === undefined) answers.aadhaarLinked = Boolean(farmerProfile.aadhaarLinked);
      if (answers.dbtAccountLinked === undefined) answers.dbtAccountLinked = Boolean(farmerProfile.dbtAccountLinked);
      if (!answers.farmSizeAcres && farmerProfile.farmSizeAcres) answers.farmSizeAcres = farmerProfile.farmSizeAcres;
      if (!answers.district && farmerProfile.district) answers.district = farmerProfile.district;
      if (!answers.state && farmerProfile.state) answers.state = farmerProfile.state;
    }

    const results = await schemeService.matchSchemes(answers);
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error("[SchemeController] handleMatchSchemes error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Eligibility calculation error. Please try again."
    });
  }
}

/**
 * Saved Schemes (Farmer Authenticated)
 */
async function handleGetSavedSchemes(req, res) {
  try {
    const userId = req.user.id;
    const saved = await SavedScheme.findAll({
      where: { userId },
      include: [{ model: Scheme, required: true }]
    });

    const data = saved.map(item => ({
      savedId: item.id,
      notes: item.notes,
      savedAt: item.createdAt,
      scheme: schemeService.formatScheme(item.Scheme)
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[SchemeController] handleGetSavedSchemes error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to load saved schemes." });
  }
}

async function handleSaveScheme(req, res) {
  try {
    const userId = req.user.id;
    const { schemeId, notes } = req.body;

    if (!schemeId) {
      return res.status(400).json({ success: false, message: "Scheme ID is required." });
    }

    const scheme = await Scheme.findByPk(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found." });
    }

    const [saved, created] = await SavedScheme.findOrCreate({
      where: { userId, schemeId },
      defaults: { userId, schemeId, notes }
    });

    return res.status(200).json({
      success: true,
      message: created ? "Scheme saved to your profile successfully!" : "Scheme is already saved in your bookmarks.",
      data: saved
    });
  } catch (err) {
    console.error("[SchemeController] handleSaveScheme error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to save scheme." });
  }
}

async function handleRemoveSavedScheme(req, res) {
  try {
    const userId = req.user.id;
    const schemeId = req.params.id;

    const deleted = await SavedScheme.destroy({
      where: { userId, schemeId }
    });

    return res.status(200).json({
      success: true,
      message: deleted ? "Scheme removed from saved list." : "Scheme was not in your saved list."
    });
  } catch (err) {
    console.error("[SchemeController] handleRemoveSavedScheme error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to remove saved scheme." });
  }
}

/**
 * Farmer Document Checklist Progress
 */
async function handleGetChecklistProgress(req, res) {
  try {
    const userId = req.user.id;
    const schemeId = req.params.id;

    const checklist = await SchemeChecklist.findOne({
      where: { userId, schemeId }
    });

    let checkedDocumentIds = [];
    if (checklist && checklist.checkedDocumentIds) {
      try {
        checkedDocumentIds = JSON.parse(checklist.checkedDocumentIds);
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      data: {
        schemeId: Number(schemeId),
        checkedDocumentIds
      }
    });
  } catch (err) {
    console.error("[SchemeController] handleGetChecklistProgress error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to load checklist progress." });
  }
}

async function handleUpdateChecklistProgress(req, res) {
  try {
    const userId = req.user.id;
    const schemeId = req.params.id;
    const { checkedDocumentIds } = req.body;

    const serialized = Array.isArray(checkedDocumentIds)
      ? JSON.stringify(checkedDocumentIds)
      : "[]";

    const [checklist] = await SchemeChecklist.findOrCreate({
      where: { userId, schemeId },
      defaults: { userId, schemeId, checkedDocumentIds: serialized }
    });

    checklist.checkedDocumentIds = serialized;
    await checklist.save();

    return res.status(200).json({
      success: true,
      message: "Document checklist progress saved.",
      data: {
        schemeId: Number(schemeId),
        checkedDocumentIds: JSON.parse(serialized)
      }
    });
  } catch (err) {
    console.error("[SchemeController] handleUpdateChecklistProgress error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to save checklist progress." });
  }
}

/**
 * Admin Management Endpoints
 */
async function handleAdminCreateScheme(req, res) {
  try {
    const payload = req.body;
    if (!payload.nameEn || !payload.identifier || !payload.officialInfoUrl) {
      return res.status(400).json({
        success: false,
        message: "Identifier, English name, and official info URL are mandatory."
      });
    }

    const created = await Scheme.create({
      ...payload,
      applicationProcessSteps: Array.isArray(payload.applicationProcessSteps) ? JSON.stringify(payload.applicationProcessSteps) : payload.applicationProcessSteps,
      requiredDocuments: Array.isArray(payload.requiredDocuments) ? JSON.stringify(payload.requiredDocuments) : payload.requiredDocuments,
      eligibilityRules: typeof payload.eligibilityRules === "object" ? JSON.stringify(payload.eligibilityRules) : payload.eligibilityRules
    });

    await recordAudit(req, {
      action: "SCHEME_CREATE",
      targetType: "scheme",
      targetId: created.id,
      details: { identifier: created.identifier, name: created.nameEn, category: created.category }
    });

    return res.status(201).json({
      success: true,
      message: "Scheme created successfully.",
      data: schemeService.formatScheme(created)
    });
  } catch (err) {
    console.error("[SchemeController] handleAdminCreateScheme error:", err.message);
    return res.status(500).json({ success: false, message: err.message || "Unable to create scheme." });
  }
}

async function handleAdminUpdateScheme(req, res) {
  try {
    const schemeId = req.params.id;
    const scheme = await Scheme.findByPk(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found." });
    }

    const payload = req.body;
    if (payload.applicationProcessSteps && Array.isArray(payload.applicationProcessSteps)) {
      payload.applicationProcessSteps = JSON.stringify(payload.applicationProcessSteps);
    }
    if (payload.requiredDocuments && Array.isArray(payload.requiredDocuments)) {
      payload.requiredDocuments = JSON.stringify(payload.requiredDocuments);
    }
    if (payload.eligibilityRules && typeof payload.eligibilityRules === "object") {
      payload.eligibilityRules = JSON.stringify(payload.eligibilityRules);
    }

    await scheme.update(payload);

    await recordAudit(req, {
      action: "SCHEME_UPDATE",
      targetType: "scheme",
      targetId: scheme.id,
      details: { identifier: scheme.identifier, name: scheme.nameEn }
    });

    return res.status(200).json({
      success: true,
      message: "Scheme updated successfully.",
      data: schemeService.formatScheme(scheme)
    });
  } catch (err) {
    console.error("[SchemeController] handleAdminUpdateScheme error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to update scheme." });
  }
}

async function handleAdminToggleStatus(req, res) {
  try {
    const schemeId = req.params.id;
    const { status } = req.body;
    const scheme = await Scheme.findByPk(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found." });
    }

    const oldStatus = scheme.status;
    scheme.status = status || (scheme.status === "active" ? "inactive" : "active");
    await scheme.save();

    await recordAudit(req, {
      action: "SCHEME_STATUS_TOGGLE",
      targetType: "scheme",
      targetId: scheme.id,
      details: { identifier: scheme.identifier, name: scheme.nameEn, statusChange: `${oldStatus} -> ${scheme.status}` }
    });

    return res.status(200).json({
      success: true,
      message: `Scheme status updated to ${scheme.status}.`,
      data: schemeService.formatScheme(scheme)
    });
  } catch (err) {
    console.error("[SchemeController] handleAdminToggleStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Unable to toggle scheme status." });
  }
}

module.exports = {
  handleListSchemes,
  handleGetSchemeById,
  handleMatchSchemes,
  handleGetSavedSchemes,
  handleSaveScheme,
  handleRemoveSavedScheme,
  handleGetChecklistProgress,
  handleUpdateChecklistProgress,
  handleAdminCreateScheme,
  handleAdminUpdateScheme,
  handleAdminToggleStatus
};
