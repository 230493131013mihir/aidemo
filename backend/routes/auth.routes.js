const express = require("express");

const {
    register,
    login,
    getMe,
    demoLogin
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);
router.post("/demo", demoLogin);

// Get currently logged-in user
router.get("/me", authMiddleware, getMe);

module.exports = router;