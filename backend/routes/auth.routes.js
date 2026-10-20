const express = require("express");

const {
    register,
    login,
    getMe,
    demoLogin,
    updateProfile,
    createContactRequest,
    getContactRequests,
    updateContactRequestStatus,
    getRelevantFarmers,
    getRelevantMandis,
    sendOtp,
    verifyOtp,
    whatsappLogin,
    linkAgristack,
    lookupAgristack
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Passwordless Farmer-First OTP & WhatsApp Authentication
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/whatsapp/login", whatsappLogin);

// National Agristack & PM-KISAN Verification
router.post("/agristack/link", authMiddleware, linkAgristack);
router.get("/agristack/lookup", lookupAgristack);

// Standard Register & Login
router.post("/register", register);
router.post("/login", login);
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