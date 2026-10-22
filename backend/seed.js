require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("./config/database");
const { User, AdminUser, Crop, Market, MarketPrice } = require("./models");

const transportRoutes = require("./routes/transport.routes");

async function seed() {
    await sequelize.authenticate();
    await sequelize.sync();
    if (transportRoutes?.ensureTransportSchema) {
        await transportRoutes.ensureTransportSchema();
    }

    const demoPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || "Demo@12345", 10);
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@12345", 10);
    const [demoUser] = await User.findOrCreate({
        where: { email: "demo@harvestmitra.local" },
        defaults: {
            name: "Mihir Jadav",
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
        { nameEn: "Green Chilli", nameGu: "લીલા મરચાં", nameHi: "हरी मिर्च", category: "vegetable", shelfLifeDays: 10 },
        { nameEn: "Wheat", nameGu: "ઘઉં", nameHi: "गेहूं", category: "grain", shelfLifeDays: 180 },
        { nameEn: "Rice", nameGu: "ડાંગર", nameHi: "चावल / धान", category: "grain", shelfLifeDays: 240 },
        { nameEn: "Groundnut", nameGu: "મગફળી", nameHi: "मूंगफली", category: "oilseed", shelfLifeDays: 120 },
        { nameEn: "Cotton", nameGu: "કપાસ", nameHi: "कपास", category: "oilseed", shelfLifeDays: 365 },
        { nameEn: "Mustard", nameGu: "રાઈ", nameHi: "सरसों", category: "oilseed", shelfLifeDays: 180 },
        { nameEn: "Soybean", nameGu: "સોયાબીન", nameHi: "सोयाबीन", category: "oilseed", shelfLifeDays: 150 },
        { nameEn: "Brinjal", nameGu: "રીંગણ", nameHi: "बैंगन", category: "vegetable", shelfLifeDays: 6 },
        { nameEn: "Cauliflower", nameGu: "ફૂલકોબી", nameHi: "फूलगोभी", category: "vegetable", shelfLifeDays: 8 },
        { nameEn: "Cabbage", nameGu: "કોબી", nameHi: "पत्ता गोभी", category: "vegetable", shelfLifeDays: 14 },
        { nameEn: "Garlic", nameGu: "લસણ", nameHi: "लहसुन", category: "vegetable", shelfLifeDays: 90 },
        { nameEn: "Cumin", nameGu: "જીરું", nameHi: "जीरा", category: "oilseed", shelfLifeDays: 365 },
        { nameEn: "Lady Finger", nameGu: "ભીંડા", nameHi: "भिंडी", category: "vegetable", shelfLifeDays: 4 }
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
        // Gujarat
        { name: "Surat APMC", district: "Surat", state: "Gujarat", distanceFromSuratKm: 0, operatingDays: "Daily" },
        { name: "Ahmedabad APMC", district: "Ahmedabad", state: "Gujarat", distanceFromSuratKm: 265, operatingDays: "Daily" },
        { name: "Rajkot APMC", district: "Rajkot", state: "Gujarat", distanceFromSuratKm: 220, operatingDays: "Daily" },
        { name: "Vadodara APMC", district: "Vadodara", state: "Gujarat", distanceFromSuratKm: 130, operatingDays: "Mon-Sat" },
        { name: "Gondal APMC", district: "Rajkot", state: "Gujarat", distanceFromSuratKm: 250, operatingDays: "Daily" },
        { name: "Unjha APMC", district: "Mehsana", state: "Gujarat", distanceFromSuratKm: 350, operatingDays: "Mon-Sat" },
        { name: "Mehsana APMC", district: "Mehsana", state: "Gujarat", distanceFromSuratKm: 320, operatingDays: "Mon-Sat" },
        { name: "Anand APMC", district: "Anand", state: "Gujarat", distanceFromSuratKm: 195, operatingDays: "Daily" },
        { name: "Amreli APMC", district: "Amreli", state: "Gujarat", distanceFromSuratKm: 280, operatingDays: "Daily" },
        { name: "Bhavnagar APMC", district: "Bhavnagar", state: "Gujarat", distanceFromSuratKm: 210, operatingDays: "Mon-Sat" },
        { name: "Junagadh APMC", district: "Junagadh", state: "Gujarat", distanceFromSuratKm: 310, operatingDays: "Daily" },
        { name: "Deesa APMC", district: "Banaskantha", state: "Gujarat", distanceFromSuratKm: 410, operatingDays: "Daily" },
        // Maharashtra
        { name: "Pune APMC", district: "Pune", state: "Maharashtra", distanceFromSuratKm: 415, operatingDays: "Daily" },
        { name: "Nashik APMC", district: "Nashik", state: "Maharashtra", distanceFromSuratKm: 240, operatingDays: "Daily" },
        { name: "Lasalgaon APMC", district: "Nashik", state: "Maharashtra", distanceFromSuratKm: 220, operatingDays: "Mon-Sat" },
        { name: "Mumbai Vashi APMC", district: "Navi Mumbai", state: "Maharashtra", distanceFromSuratKm: 280, operatingDays: "Daily" },
        { name: "Nagpur APMC", district: "Nagpur", state: "Maharashtra", distanceFromSuratKm: 720, operatingDays: "Mon-Sat" },
        { name: "Kolhapur APMC", district: "Kolhapur", state: "Maharashtra", distanceFromSuratKm: 580, operatingDays: "Mon-Sat" },
        { name: "Solapur APMC", district: "Solapur", state: "Maharashtra", distanceFromSuratKm: 610, operatingDays: "Daily" },
        { name: "Jalgaon APMC", district: "Jalgaon", state: "Maharashtra", distanceFromSuratKm: 330, operatingDays: "Mon-Sat" },
        { name: "Ahmednagar APMC", district: "Ahmednagar", state: "Maharashtra", distanceFromSuratKm: 370, operatingDays: "Mon-Sat" },
        // Delhi NCR
        { name: "Azadpur Mandi", district: "North Delhi", state: "Delhi", distanceFromSuratKm: 1150, operatingDays: "Daily" },
        { name: "Ghazipur Mandi", district: "East Delhi", state: "Delhi", distanceFromSuratKm: 1160, operatingDays: "Daily" },
        { name: "Okhla Mandi", district: "South Delhi", state: "Delhi", distanceFromSuratKm: 1140, operatingDays: "Daily" },
        // Punjab & Haryana
        { name: "Khanna Mandi", district: "Ludhiana", state: "Punjab", distanceFromSuratKm: 1320, operatingDays: "Mon-Sat" },
        { name: "Ludhiana APMC", district: "Ludhiana", state: "Punjab", distanceFromSuratKm: 1350, operatingDays: "Daily" },
        { name: "Karnal APMC", district: "Karnal", state: "Haryana", distanceFromSuratKm: 1210, operatingDays: "Mon-Sat" },
        { name: "Sirsa APMC", district: "Sirsa", state: "Haryana", distanceFromSuratKm: 1100, operatingDays: "Mon-Sat" },
        { name: "Ambala Cantt APMC", district: "Ambala", state: "Haryana", distanceFromSuratKm: 1270, operatingDays: "Mon-Sat" },
        // Madhya Pradesh
        { name: "Indore Choithram Mandi", district: "Indore", state: "Madhya Pradesh", distanceFromSuratKm: 450, operatingDays: "Daily" },
        { name: "Neemuch Mandi", district: "Neemuch", state: "Madhya Pradesh", distanceFromSuratKm: 420, operatingDays: "Mon-Sat" },
        { name: "Mandsaur Mandi", district: "Mandsaur", state: "Madhya Pradesh", distanceFromSuratKm: 380, operatingDays: "Mon-Sat" },
        { name: "Ujjain APMC", district: "Ujjain", state: "Madhya Pradesh", distanceFromSuratKm: 460, operatingDays: "Daily" },
        { name: "Bhopal Karond Mandi", district: "Bhopal", state: "Madhya Pradesh", distanceFromSuratKm: 590, operatingDays: "Daily" },
        { name: "Jabalpur APMC", district: "Jabalpur", state: "Madhya Pradesh", distanceFromSuratKm: 850, operatingDays: "Mon-Sat" },
        // Rajasthan
        { name: "Jaipur Muhana Mandi", district: "Jaipur", state: "Rajasthan", distanceFromSuratKm: 850, operatingDays: "Daily" },
        { name: "Kota APMC", district: "Kota", state: "Rajasthan", distanceFromSuratKm: 650, operatingDays: "Mon-Sat" },
        { name: "Jodhpur Mandi", district: "Jodhpur", state: "Rajasthan", distanceFromSuratKm: 620, operatingDays: "Mon-Sat" },
        { name: "Bikaner APMC", district: "Bikaner", state: "Rajasthan", distanceFromSuratKm: 860, operatingDays: "Mon-Sat" },
        { name: "Sri Ganganagar APMC", district: "Sri Ganganagar", state: "Rajasthan", distanceFromSuratKm: 1080, operatingDays: "Mon-Sat" },
        // UP & Bihar
        { name: "Agra APMC", district: "Agra", state: "Uttar Pradesh", distanceFromSuratKm: 1050, operatingDays: "Daily" },
        { name: "Kanpur Mandi", district: "Kanpur", state: "Uttar Pradesh", distanceFromSuratKm: 1180, operatingDays: "Daily" },
        { name: "Lucknow Dubagga Mandi", district: "Lucknow", state: "Uttar Pradesh", distanceFromSuratKm: 1250, operatingDays: "Daily" },
        { name: "Varanasi Paharia APMC", district: "Varanasi", state: "Uttar Pradesh", distanceFromSuratKm: 1390, operatingDays: "Daily" },
        { name: "Bareilly APMC", district: "Bareilly", state: "Uttar Pradesh", distanceFromSuratKm: 1260, operatingDays: "Mon-Sat" },
        { name: "Patna Bazar Samiti APMC", district: "Patna", state: "Bihar", distanceFromSuratKm: 1650, operatingDays: "Daily" },
        { name: "Muzaffarpur APMC", district: "Muzaffarpur", state: "Bihar", distanceFromSuratKm: 1720, operatingDays: "Daily" },
        // Karnataka
        { name: "Bengaluru KR Market", district: "Bengaluru", state: "Karnataka", distanceFromSuratKm: 1040, operatingDays: "Daily" },
        { name: "Bengaluru Yeshwantpur APMC", district: "Bengaluru", state: "Karnataka", distanceFromSuratKm: 1035, operatingDays: "Daily" },
        { name: "Kolar APMC", district: "Kolar", state: "Karnataka", distanceFromSuratKm: 1080, operatingDays: "Daily" },
        { name: "Hubballi APMC", district: "Dharwad", state: "Karnataka", distanceFromSuratKm: 750, operatingDays: "Mon-Sat" },
        { name: "Belagavi APMC", district: "Belagavi", state: "Karnataka", distanceFromSuratKm: 650, operatingDays: "Mon-Sat" },
        { name: "Mysuru Bandipalya APMC", district: "Mysuru", state: "Karnataka", distanceFromSuratKm: 1120, operatingDays: "Mon-Sat" },
        // South
        { name: "Chennai Koyambedu Market", district: "Chennai", state: "Tamil Nadu", distanceFromSuratKm: 1380, operatingDays: "Daily" },
        { name: "Madurai Mattuthavani Mandi", district: "Madurai", state: "Tamil Nadu", distanceFromSuratKm: 1590, operatingDays: "Daily" },
        { name: "Guntur Mirchi Yard", district: "Guntur", state: "Andhra Pradesh", distanceFromSuratKm: 1150, operatingDays: "Mon-Sat" },
        { name: "Vijayawada Gollapudi APMC", district: "NTR", state: "Andhra Pradesh", distanceFromSuratKm: 1120, operatingDays: "Daily" },
        { name: "Hyderabad Bowenpally APMC", district: "Hyderabad", state: "Telangana", distanceFromSuratKm: 920, operatingDays: "Daily" },
        { name: "Hyderabad Malakpet Mandi", district: "Hyderabad", state: "Telangana", distanceFromSuratKm: 925, operatingDays: "Daily" },
        { name: "Warangal APMC", district: "Warangal", state: "Telangana", distanceFromSuratKm: 980, operatingDays: "Mon-Sat" },
        // East
        { name: "Kolkata Koley Market", district: "Kolkata", state: "West Bengal", distanceFromSuratKm: 1900, operatingDays: "Daily" },
        { name: "Kolkata Posta Mandi", district: "Kolkata", state: "West Bengal", distanceFromSuratKm: 1890, operatingDays: "Mon-Sat" },
        { name: "Siliguri Regulated Market", district: "Darjeeling", state: "West Bengal", distanceFromSuratKm: 2150, operatingDays: "Daily" },
        { name: "Bhubaneswar Aiginia Mandi", district: "Khordha", state: "Odisha", distanceFromSuratKm: 1620, operatingDays: "Daily" },
        { name: "Guwahati Pamohi APMC", district: "Kamrup", state: "Assam", distanceFromSuratKm: 2450, operatingDays: "Mon-Sat" }
    ];
    const markets = [];
    for (const marketData of marketsToSeed) {
        let market = await Market.findOne({ where: { name: marketData.name } });
        if (market) {
            await market.update(marketData);
        } else {
            market = await Market.create(marketData);
        }
        markets.push(market);
    }

    const basePricesByCrop = {
        Tomato: 20,
        Onion: 28,
        Potato: 19,
        "Green Chilli": 54,
        Wheat: 27,
        Rice: 36,
        Groundnut: 64,
        Cotton: 74,
        Mustard: 58,
        Soybean: 46,
        Brinjal: 23,
        Cauliflower: 30,
        Cabbage: 16,
        Garlic: 135,
        Cumin: 255,
        "Lady Finger": 38
    };
    const priceDate = new Date().toISOString().slice(0, 10);
    for (const crop of crops) {
        for (const market of markets) {
            const basePrice = basePricesByCrop[crop.nameEn] || 25;
            const jitter = ((market.id * 7 + crop.id * 13) % 9 - 4) * 0.25;
            let pricePerKg = Number(Math.max(5, basePrice + jitter).toFixed(2));
            if (crop.nameEn === "Tomato") {
                if (market.name.includes("Surat")) pricePerKg = 18.50;
                else if (market.name.includes("Ahmedabad")) pricePerKg = 23.00;
            }
            const pricePerQuintal = Number((pricePerKg * 100).toFixed(0));
            const minPrice = Number((pricePerQuintal * 0.92).toFixed(0));
            const maxPrice = Number((pricePerQuintal * 1.08).toFixed(0));

            let existingPrice = await MarketPrice.findOne({
                where: { cropId: crop.id, marketId: market.id, priceDate }
            });
            if (existingPrice) {
                await existingPrice.update({ pricePerKg, pricePerQuintal, minPrice, maxPrice, dataType: "verified_live" });
            } else {
                await MarketPrice.create({
                    cropId: crop.id,
                    marketId: market.id,
                    pricePerKg,
                    pricePerQuintal,
                    minPrice,
                    maxPrice,
                    dataType: "verified_live",
                    priceDate
                });
            }
        }
    }

    // Seed Demo Transporter User and Multi-Vehicle Fleet
    const transporterPassword = await bcrypt.hash(process.env.TRANSPORTER_PASSWORD || "Transporter@12345", 10);
    const [transporterUser] = await User.findOrCreate({
        where: { email: "transporter@harvestmitra.local" },
        defaults: {
            name: "Rajesh Patil (Express Agri Logistics)",
            email: "transporter@harvestmitra.local",
            phone: "9822012345",
            password: transporterPassword,
            role: "transporter"
        }
    });

    const { Vehicle, TransporterProfile } = require("./models");

    await TransporterProfile.findOrCreate({
        where: { userId: transporterUser.id },
        defaults: {
            userId: transporterUser.id,
            driverName: "Rajesh Patil",
            phone: "9822012345",
            vehicleType: "Mahindra Bolero Maxi Truck",
            vehicleNumber: "MH-12-RN-4921",
            capacityKg: 1500,
            baseMandi: "Pune APMC",
            ratePerKm: 22,
            isAvailable: true
        }
    });

    const vehiclesToSeed = [
        {
            userId: transporterUser.id,
            registrationNumber: "MH-12-TA-1021",
            vehicleType: "Tata Ace / Mini Truck",
            capacityKg: 1000,
            capacityUnit: "kg",
            supportedCrops: "Tomato, Green Chilli, Brinjal, Vegetables",
            specialHandling: "Ventilated Mesh Crate Carrier (Fresh Vegetables)",
            baseLocation: "Pune, Maharashtra",
            supportedRoutes: "Pune to Mumbai Vashi APMC, Pune APMC Local",
            ratePerKm: 18,
            driverName: "Santosh More",
            driverPhone: "9822099001",
            isAvailable: true,
            status: "available"
        },
        {
            userId: transporterUser.id,
            registrationNumber: "MH-12-RN-4921",
            vehicleType: "Mahindra Bolero Maxi Truck",
            capacityKg: 1500,
            capacityUnit: "kg",
            supportedCrops: "Tomato, Onion, Potato, Vegetables",
            specialHandling: "Ventilated Air-Flow Cargo Bed (Horticulture)",
            baseLocation: "Pune, Maharashtra",
            supportedRoutes: "Pune to Mumbai Vashi APMC, Nashik APMC",
            ratePerKm: 22,
            driverName: "Rajesh Patil",
            driverPhone: "9822012345",
            isAvailable: true,
            status: "available"
        },
        {
            userId: transporterUser.id,
            registrationNumber: "MH-15-TK-4407",
            vehicleType: "Tata 407 (Medium Truck)",
            capacityKg: 2500,
            capacityUnit: "kg",
            supportedCrops: "Onion, Potato, Wheat, Rice, Vegetables, Grains",
            specialHandling: "Covered High-Side Body with Waterproof Tarpaulin",
            baseLocation: "Nashik, Maharashtra",
            supportedRoutes: "Nashik to Mumbai Vashi APMC, Pune APMC",
            ratePerKm: 25,
            driverName: "Kishor Jadhav",
            driverPhone: "9876543210",
            isAvailable: true,
            status: "available"
        },
        {
            userId: transporterUser.id,
            registrationNumber: "MH-13-EP-2049",
            vehicleType: "Medium Goods Truck",
            capacityKg: 3500,
            capacityUnit: "kg",
            supportedCrops: "Wheat, Rice, Soybean, Cotton, Grains, Bulks",
            specialHandling: "Heavy-Duty Weather-Proof Dry Bulk Carrier",
            baseLocation: "Solapur, Maharashtra",
            supportedRoutes: "Solapur to Pune APMC, Mumbai Vashi APMC",
            ratePerKm: 28,
            driverName: "Anil Shinde",
            driverPhone: "9822088002",
            isAvailable: true,
            status: "available"
        },
        {
            userId: transporterUser.id,
            registrationNumber: "MH-15-BB-3001",
            vehicleType: "Refrigerated Vehicle",
            capacityKg: 3000,
            capacityUnit: "kg",
            supportedCrops: "Grapes, Pomegranate, Banana, Fruits, Exotic Vegetables",
            specialHandling: "Active Cold Chain (0°C to 4°C) with Shock Absorbers",
            baseLocation: "Nashik, Maharashtra",
            supportedRoutes: "Nashik to Mumbai Vashi Terminal, Pune APMC",
            ratePerKm: 35,
            driverName: "Vikram Deshmukh",
            driverPhone: "9822077003",
            isAvailable: true,
            status: "available"
        },
        {
            userId: transporterUser.id,
            registrationNumber: "MH-31-AL-6009",
            vehicleType: "Large Goods Truck",
            capacityKg: 6000,
            capacityUnit: "kg",
            supportedCrops: "Cotton, Wheat, Rice, Soybean, Commercial Cargo",
            specialHandling: "10-Wheeler High-Volume High-Capacity Transport",
            baseLocation: "Nagpur, Maharashtra",
            supportedRoutes: "Nagpur to Pune, Mumbai Vashi, Amravati",
            ratePerKm: 32,
            driverName: "Suresh Gaikwad",
            driverPhone: "9822066004",
            isAvailable: true,
            status: "available"
        }
    ];

    for (const vData of vehiclesToSeed) {
        await Vehicle.findOrCreate({
            where: { registrationNumber: vData.registrationNumber },
            defaults: vData
        });
    }

    console.log("Seed complete. Demo Farmer: demo@harvestmitra.local / Demo@12345");
    console.log("Transporter: transporter@harvestmitra.local / Transporter@12345");
    console.log("Admin: admin@harvestmitra.local / Admin@12345");
    console.log(`Created or verified demo user ${demoUser.id}, 6 verified vehicles, and ${crops.length} crops across ${markets.length} markets.`);
}

if (require.main === module) {
    seed()
        .catch((error) => {
            console.error("Seed failed:", error.message);
            process.exitCode = 1;
        })
        .finally(async () => {
            await sequelize.close();
        });
}

module.exports = seed;
