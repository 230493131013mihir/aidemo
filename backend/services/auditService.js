const { AuditLog, User } = require("../models");

/**
 * Record an audit log for sensitive administrative operations.
 * Protects privacy: strictly omits passwords, tokens, and secret keys.
 * 
 * @param {Object} req Express request object containing authenticated actor
 * @param {Object} options Audit details
 * @param {string} options.action Action code (e.g. 'PRICE_CREATE', 'PRICE_UPDATE', 'USER_STATUS_UPDATE', 'SCHEME_CREATE')
 * @param {string} options.targetType Entity type ('market_price', 'user', 'scheme')
 * @param {string|number} options.targetId ID of affected entity
 * @param {Object|string} options.details Non-sensitive change summary
 */
async function recordAudit(req, { action, targetType, targetId, details }) {
    try {
        const actorId = req.user?.id || null;
        let actorName = req.user?.name;
        let actorEmail = req.user?.email;

        // If actor name/email not on req.user, resolve from User model
        if (actorId && (!actorName || !actorEmail)) {
            const user = await User.findByPk(actorId, { attributes: ["name", "email"] });
            if (user) {
                actorName = user.name;
                actorEmail = user.email;
            }
        }

        const sanitizedDetails = typeof details === "object" ? JSON.stringify(details) : String(details || "");
        const ip = req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || "127.0.0.1";

        return await AuditLog.create({
            actorId,
            actorName: actorName || "Administrator",
            actorEmail: actorEmail || "admin@harvestmitra.local",
            action,
            targetType,
            targetId: String(targetId || ""),
            details: sanitizedDetails,
            ipAddress: String(ip).slice(0, 50)
        });
    } catch (err) {
        console.warn("[AuditService] Failed to record audit log:", err.message);
        return null;
    }
}

module.exports = {
    recordAudit
};
