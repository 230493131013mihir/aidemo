require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("./config/database");
const { User, AdminUser, Crop, Market, MarketPrice } = require("./models");

async function seed() {
    await sequelize.authenticate();
    await sequelize.sync();

    const demoPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || "Demo@12345", 10);
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@12345", 10);
    const [demoUser] = await User.findOrCreate({
        where: { email: "demo@harvestmitra.local" },
        defaults: {
            name: "Ramesh Patel",
            email: "demo@harvestmitra.local",
            phone: "9999999991",
            password: demoPassword,
            role: "farmer"
        }
    });
    const [adminUser] = await User.findOrCreate({
        where: { email: "admin@harvestmitra.local" },
        defaults: {
            name: "HarvestMitra Admin",
            email: "admin@harvestmitra.local",
            phone: "9999999992",
            password: adminPassword,
            role: "admin"
        }
    });
    await AdminUser.findOrCreate({
        where: { userId: adminUser.id },
        defaults: { userId: adminUser.id, displayName: adminUser.name }
    });

    const cropsToSeed = [
        { nameEn: "Tomato", nameGu: "ટામેટા", nameHi: "टमाटर", category: "vegetable", shelfLifeDays: 5 },
        { nameEn: "Onion", nameGu: "ડુંગળી", nameHi: "प्याज", category: "vegetable", shelfLifeDays: 30 },
        { nameEn: "Wheat", nameGu: "ઘઉં", nameHi: "गेहूं", category: "grain", shelfLifeDays: 180 },
        { nameEn: "Groundnut", nameGu: "મગફળી", nameHi: "मूंगफली", category: "oilseed", shelfLifeDays: 120 }
    ];
    const crops = [];
    for (const cropData of cropsToSeed) {
        const [crop] = await Crop.findOrCreate({
            where: { nameEn: cropData.nameEn },
            defaults: cropData
        });
        crops.push(crop);
    }

    const marketsToSeed = [
        { name: "Surat APMC", district: "Surat", state: "Gujarat", distanceFromSuratKm: 0 },
        { name: "Ahmedabad APMC", district: "Ahmedabad", state: "Gujarat", distanceFromSuratKm: 265 },
        { name: "Rajkot APMC", district: "Rajkot", state: "Gujarat", distanceFromSuratKm: 220 }
    ];
    const markets = [];
    for (const marketData of marketsToSeed) {
        const [market] = await Market.findOrCreate({
            where: { name: marketData.name, district: marketData.district },
            defaults: marketData
        });
        markets.push(market);
    }

    const samplePrices = [
        [18.5, 1850], [20, 2000], [17.25, 1725],
        [24, 2400], [26.5, 2650], [23, 2300],
        [27, 2700], [28.5, 2850], [26, 2600],
        [62, 6200], [65, 6500], [61, 6100]
    ];
    const priceDate = new Date().toISOString().slice(0, 10);
    for (const [cropIndex, crop] of crops.entries()) {
        for (const [marketIndex, market] of markets.entries()) {
            const [pricePerKg, pricePerQuintal] = samplePrices[cropIndex * markets.length + marketIndex];
            await MarketPrice.findOrCreate({
                where: { cropId: crop.id, marketId: market.id, priceDate },
                defaults: {
                    cropId: crop.id,
                    marketId: market.id,
                    pricePerKg,
                    pricePerQuintal,
                    minPrice: pricePerKg * 0.9,
                    maxPrice: pricePerKg * 1.1,
                    dataType: "sample_demo",
                    priceDate
                }
            });
        }
    }

    console.log("Seed complete. Demo: demo@harvestmitra.local / Demo@12345");
    console.log("Admin: admin@harvestmitra.local / Admin@12345");
    console.log(`Created or verified demo user ${demoUser.id} and ${crops.length} crops across ${markets.length} markets.`);
}

seed()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });