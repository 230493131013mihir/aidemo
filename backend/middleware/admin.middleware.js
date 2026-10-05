const User = require("../models/user");

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ["id", "role"]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        req.user.role = user.role;
        return next();
    } catch (error) {
        console.error("Admin authorization error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to verify admin access"
        });
    }
};

module.exports = adminMiddleware;