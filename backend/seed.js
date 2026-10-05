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
        { nameEn: "Potato", nameGu: "બટાકા", nameHi: "आलू", category: "vegetable", shelfLifeDays: 45 },
        { nameEn: "Brinjal", nameGu: "રીંગણ", nameHi: "बैंगन", category: "vegetable", shelfLifeDays: 6 },
        { nameEn: "Cauliflower", nameGu: "ફૂલકોબી", nameHi: "फूलगोभी", category: "vegetable", shelfLifeDays: 8 },
        { nameEn: "Cabbage", nameGu: "કોબી", nameHi: "पत्ता गोभी", category: "vegetable", shelfLifeDays: 14 },
        { nameEn: "Green Chilli", nameGu: "લીલા મરચાં", nameHi: "हरी मिर्च", category: "vegetable", shelfLifeDays: 10 },
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
        { name: "Rajkot APMC", district: "Rajkot", state: "Gujarat", distanceFromSuratKm: 220 },
        { name: "Pune APMC", district: "Pune", state: "Maharashtra", distanceFromSuratKm: 415 },
        { name: "Nashik APMC", district: "Nashik", state: "Maharashtra", distanceFromSuratKm: 240 },
        { name: "Azadpur Mandi", district: "Delhi", state: "Delhi", distanceFromSuratKm: 1150 },
        { name: "Bengaluru KR Market", district: "Bengaluru", state: "Karnataka", distanceFromSuratKm: 1040 },
        { name: "Kolkata Koley Market", district: "Kolkata", state: "West Bengal", distanceFromSuratKm: 1900 }
    ];
    const markets = [];
    for (const marketData of marketsToSeed) {
        const [market] = await Market.findOrCreate({
            where: { name: marketData.name, district: marketData.district },
            defaults: marketData
        });
        markets.push(market);
    }

    const basePricesByCrop = {
        Tomato: 20,
        Onion: 26,
        Potato: 18,
        Brinjal: 24,
        Cauliflower: 32,
        Cabbage: 16,
        "Green Chilli": 58,
        Wheat: 28,
        Groundnut: 64
    };
    const priceDate = new Date().toISOString().slice(0, 10);
    for (const [cropIndex, crop] of crops.entries()) {
        for (const [marketIndex, market] of markets.entries()) {
            const basePrice = basePricesByCrop[crop.nameEn] || 20;
            const pricePerKg = Number((basePrice + marketIndex * 1.4 - cropIndex * 0.25).toFixed(2));
            const pricePerQuintal = Number((pricePerKg * 100).toFixed(2));
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
