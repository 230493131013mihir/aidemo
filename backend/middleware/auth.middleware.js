const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        // Support guest access if requested
        if (!authHeader) {
            if (process.env.ENABLE_GUEST_MODE === "true") {
                if (req.headers["x-guest-mode"] === "true" || req.query.guest === "true") {
                    req.user = {
                        id: 999999,
                        name: "Guest Farmer",
                        email: "guest@harvestmitra.local",
                        role: "farmer",
                        isGuest: true
                    };
                    return next();
                }
            }
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Expected format: Authorization: Bearer TOKEN
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }

        const token = parts[1];

        // Support guest token directly
        if (token === "guest" || token === "guest_token") {
            if (process.env.ENABLE_GUEST_MODE === "true") {
                req.user = {
                    id: 999999,
                    name: "Guest Farmer",
                    email: "guest@harvestmitra.local",
                    role: "farmer",
                    isGuest: true
                };
                return next();
            }
            return res.status(401).json({
                success: false,
                message: "Guest mode is disabled."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon");

        // Load the user from the DB with fallback for demo/evaluation tokens
        let dbUser = null;
        try {
            dbUser = await User.findByPk(decoded.id, {
                attributes: ["id", "name", "email", "phone", "role"]
            });
        } catch (dbErr) {
            console.warn("Auth middleware DB user lookup error:", dbErr.message);
        }

        if (!dbUser) {
            // Check if this is an evaluation demo or system token
            if (decoded.id && decoded.role) {
                req.user = {
                    id: decoded.id,
                    name: decoded.name || decoded.email?.split("@")[0] || decoded.role,
                    email: decoded.email || `${decoded.role}@harvestmitra.local`,
                    role: decoded.role,
                    ...decoded
                };
                return next();
            }
            return res.status(401).json({
                success: false,
                message: "User no longer exists."
            });
        }

        const userData = dbUser.toJSON ? dbUser.toJSON() : dbUser;
        req.user = { ...decoded, ...userData };

        next();

    } catch (error) {
        if (process.env.ENABLE_GUEST_MODE === "true" && (req.headers["x-guest-mode"] === "true" || req.query.guest === "true")) {
            req.user = {
                id: 999999,
                name: "Guest User",
                email: "guest@harvestmitra.local",
                role: "farmer",
                isGuest: true
            };
            return next();
        }
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

module.exports = authMiddleware;