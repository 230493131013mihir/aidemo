const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        // Support guest access if requested
        if (!authHeader) {
            if (req.headers['x-guest-mode'] === 'true' || req.query.guest === 'true') {
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
            req.user = {
                id: 999999,
                name: "Guest Farmer",
                email: "guest@harvestmitra.local",
                role: "farmer",
                isGuest: true
            };
            return next();
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon"
        );

        // Store decoded user information in request
        req.user = decoded;

        // Continue to next step
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

module.exports = authMiddleware;