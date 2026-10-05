const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const assistantRoutes = require("./routes/assistant.routes");
const marketRoutes = require("./routes/market.routes");
const weatherRoutes = require("./routes/weather.routes");
const sequelize = require("./config/database");
require("./models");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/weather", weatherRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HarvestMitra API is running"
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error.message);
        process.exitCode = 1;
    }
}

startServer();
