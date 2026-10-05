const express = require("express");
const { askAssistant } = require("../services/assistantService");

const router = express.Router();

router.post("/ask", async (req, res) => {
    try {
        const result = await askAssistant({ message: req.body.message });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("Assistant error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Assistant could not answer right now"
        });
    }
});

module.exports = router;
