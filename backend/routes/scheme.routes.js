const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const {
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
} = require("../controllers/schemeController");

// Public & Farmer Read & Match Routes
router.get("/", handleListSchemes);
router.post("/match", handleMatchSchemes);
router.get("/saved", authMiddleware, handleGetSavedSchemes);
router.post("/saved", authMiddleware, handleSaveScheme);
router.delete("/saved/:id", authMiddleware, handleRemoveSavedScheme);
router.get("/:id", handleGetSchemeById);
router.get("/:id/checklist", authMiddleware, handleGetChecklistProgress);
router.post("/:id/checklist", authMiddleware, handleUpdateChecklistProgress);

// Admin-Only Management Routes
router.post("/admin/create", authMiddleware, adminMiddleware, handleAdminCreateScheme);
router.put("/admin/:id", authMiddleware, adminMiddleware, handleAdminUpdateScheme);
router.patch("/admin/:id/status", authMiddleware, adminMiddleware, handleAdminToggleStatus);

module.exports = router;
