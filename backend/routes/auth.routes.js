const express = require("express");

const {
    register,
    login,
    logout,
    getMe,
    demoLogin,
    updateProfile,
    createContactRequest,
    getContactRequests,
    updateContactRequestStatus,
    getRelevantFarmers,
    getRelevantMandis
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login & Logout
router.post("/login", login);
router.post("/logout", logout);
router.post("/demo", demoLogin);

// Get currently logged-in user
router.get("/me", authMiddleware, getMe);

// Update user & role profile
router.put("/profile", authMiddleware, updateProfile);

// Mandi-to-Farmer & Farmer-to-Mandi Contact System (Req 8)
router.post("/contact-request", authMiddleware, createContactRequest);
router.get("/contact-requests", authMiddleware, getContactRequests);
router.put("/contact-requests/:id", authMiddleware, updateContactRequestStatus);

// Discovery endpoints for contact
router.get("/farmers", authMiddleware, getRelevantFarmers);
router.get("/mandis", authMiddleware, getRelevantMandis);

module.exports = router;