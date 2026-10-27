/**
 * saleController.js
 * Controller for Farmer Sale History, Realized Proceeds & Profit Reports
 * HarvestMitra AI
 */

const { SaleRecord, FarmerProfile } = require("../models");
const { Op } = require("sequelize");

function normalizeQuantity(quantity, unit = "kg") {
  const num = Number(quantity);
  if (Number.isNaN(num) || num <= 0) return 0;
  const cleanUnit = String(unit || "kg").toLowerCase().trim();
  if (cleanUnit === "tonne" || cleanUnit === "ton" || cleanUnit === "mt") {
    return Math.round(num * 1000 * 100) / 100;
  }
  if (cleanUnit === "quintal" || cleanUnit === "qtl") {
    return Math.round(num * 100 * 100) / 100;
  }
  return Math.round(num * 100) / 100;
}

// 1. GET /api/farmer/sales
exports.getSaleRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { crop, startDate, endDate, market, paymentStatus } = req.query;

    const where = { userId };
    if (crop && crop !== "all") {
      where.cropName = { [Op.like]: `%${crop.trim()}%` };
    }
    if (market && market !== "all") {
      where.marketName = { [Op.like]: `%${market.trim()}%` };
    }
    if (paymentStatus && paymentStatus !== "all") {
      where.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate[Op.gte] = startDate;
      if (endDate) where.saleDate[Op.lte] = endDate;
    }

    const sales = await SaleRecord.findAll({
      where,
      order: [["saleDate", "DESC"], ["createdAt", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
  } catch (error) {
    console.error("[SaleController.getSaleRecords] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sale records: " + error.message
    });
  }
};

// 2. POST /api/farmer/sales
exports.createSaleRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      cropName,
      quantity,
      unit = "kg",
      marketName,
      ratePerQuintal,
      transportCost = 0,
      inputCost = 0,
      mandiCess = 0,
      saleDate,
      buyerName,
      paymentStatus = "completed",
      notes
    } = req.body;

    if (!cropName || !marketName || !ratePerQuintal || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Crop name, market name, rate per quintal, and quantity are required."
      });
    }

    const quantityKg = normalizeQuantity(quantity, unit);
    if (quantityKg <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid positive quantity is required."
      });
    }

    const parsedRate = Number(ratePerQuintal);
    if (Number.isNaN(parsedRate) || parsedRate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid positive rate per quintal is required."
      });
    }

    const quantityInQuintals = quantityKg / 100;
    const grossProceeds = Math.round(quantityInQuintals * parsedRate * 100) / 100;
    const parsedTransport = Math.max(0, Number(transportCost) || 0);
    const parsedInputCost = Math.max(0, Number(inputCost) || 0);
    const parsedCess = Math.max(0, Number(mandiCess) || 0);
    const netProfit = Math.round((grossProceeds - parsedTransport - parsedInputCost - parsedCess) * 100) / 100;

    const saleRecord = await SaleRecord.create({
      userId,
      cropName: cropName.trim(),
      quantityKg,
      unit,
      marketName: marketName.trim(),
      ratePerQuintal: parsedRate,
      grossProceeds,
      transportCost: parsedTransport,
      inputCost: parsedInputCost,
      mandiCess: parsedCess,
      netProfit,
      saleDate: saleDate || new Date().toISOString().split("T")[0],
      buyerName: buyerName ? buyerName.trim() : null,
      paymentStatus,
      notes: notes ? notes.trim() : null
    });

    return res.status(201).json({
      success: true,
      message: "Sale record saved successfully!",
      sale: saleRecord
    });
  } catch (error) {
    console.error("[SaleController.createSaleRecord] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record sale: " + error.message
    });
  }
};

// 3. PUT /api/farmer/sales/:id
exports.updateSaleRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sale = await SaleRecord.findOne({ where: { id, userId } });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found or unauthorized."
      });
    }

    const {
      cropName,
      quantity,
      unit,
      marketName,
      ratePerQuintal,
      transportCost,
      inputCost,
      mandiCess,
      saleDate,
      buyerName,
      paymentStatus,
      notes
    } = req.body;

    const updatedCrop = cropName !== undefined ? cropName.trim() : sale.cropName;
    const updatedUnit = unit !== undefined ? unit : sale.unit;
    const quantityKg = quantity !== undefined ? normalizeQuantity(quantity, updatedUnit) : sale.quantityKg;
    const updatedRate = ratePerQuintal !== undefined ? Number(ratePerQuintal) : sale.ratePerQuintal;
    const updatedTransport = transportCost !== undefined ? Math.max(0, Number(transportCost)) : sale.transportCost;
    const updatedInputCost = inputCost !== undefined ? Math.max(0, Number(inputCost)) : sale.inputCost;
    const updatedCess = mandiCess !== undefined ? Math.max(0, Number(mandiCess)) : sale.mandiCess;

    const quantityInQuintals = quantityKg / 100;
    const grossProceeds = Math.round(quantityInQuintals * updatedRate * 100) / 100;
    const netProfit = Math.round((grossProceeds - updatedTransport - updatedInputCost - updatedCess) * 100) / 100;

    await sale.update({
      cropName: updatedCrop,
      quantityKg,
      unit: updatedUnit,
      marketName: marketName !== undefined ? marketName.trim() : sale.marketName,
      ratePerQuintal: updatedRate,
      grossProceeds,
      transportCost: updatedTransport,
      inputCost: updatedInputCost,
      mandiCess: updatedCess,
      netProfit,
      saleDate: saleDate !== undefined ? saleDate : sale.saleDate,
      buyerName: buyerName !== undefined ? (buyerName ? buyerName.trim() : null) : sale.buyerName,
      paymentStatus: paymentStatus !== undefined ? paymentStatus : sale.paymentStatus,
      notes: notes !== undefined ? (notes ? notes.trim() : null) : sale.notes
    });

    return res.status(200).json({
      success: true,
      message: "Sale record updated successfully!",
      sale
    });
  } catch (error) {
    console.error("[SaleController.updateSaleRecord] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update sale record: " + error.message
    });
  }
};

// 4. DELETE /api/farmer/sales/:id
exports.deleteSaleRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sale = await SaleRecord.findOne({ where: { id, userId } });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale record not found or unauthorized."
      });
    }

    await sale.destroy();

    return res.status(200).json({
      success: true,
      message: "Sale record deleted successfully."
    });
  } catch (error) {
    console.error("[SaleController.deleteSaleRecord] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete sale record: " + error.message
    });
  }
};

// 5. GET /api/farmer/sales/summary
exports.getProfitSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const sales = await SaleRecord.findAll({
      where: { userId },
      order: [["saleDate", "ASC"]]
    });

    const totalSalesCount = sales.length;
    const totalQuantityKg = sales.reduce((sum, s) => sum + s.quantityKg, 0);
    const totalGrossProceeds = sales.reduce((sum, s) => sum + s.grossProceeds, 0);
    const totalTransportCost = sales.reduce((sum, s) => sum + s.transportCost, 0);
    const totalInputCost = sales.reduce((sum, s) => sum + s.inputCost, 0);
    const totalMandiCess = sales.reduce((sum, s) => sum + s.mandiCess, 0);
    const totalNetProfit = sales.reduce((sum, s) => sum + s.netProfit, 0);

    const overallProfitMarginPercent = totalGrossProceeds > 0
      ? Math.round((totalNetProfit / totalGrossProceeds) * 1000) / 10
      : 0;

    const totalQuintals = totalQuantityKg / 100;
    const averageRealizedRatePerQuintal = totalQuintals > 0
      ? Math.round((totalGrossProceeds / totalQuintals) * 100) / 100
      : 0;

    // Crop breakdown
    const cropGroups = {};
    for (const s of sales) {
      if (!cropGroups[s.cropName]) {
        cropGroups[s.cropName] = {
          cropName: s.cropName,
          salesCount: 0,
          totalQuantityKg: 0,
          grossProceeds: 0,
          transportCost: 0,
          inputCost: 0,
          netProfit: 0,
          rates: []
        };
      }
      const g = cropGroups[s.cropName];
      g.salesCount += 1;
      g.totalQuantityKg += s.quantityKg;
      g.grossProceeds += s.grossProceeds;
      g.transportCost += s.transportCost;
      g.inputCost += s.inputCost;
      g.netProfit += s.netProfit;
      g.rates.push(s.ratePerQuintal);
    }

    const cropBreakdown = Object.values(cropGroups).map(g => {
      const qtl = g.totalQuantityKg / 100;
      return {
        ...g,
        avgRatePerQuintal: qtl > 0 ? Math.round((g.grossProceeds / qtl) * 100) / 100 : 0,
        profitMarginPercent: g.grossProceeds > 0 ? Math.round((g.netProfit / g.grossProceeds) * 1000) / 10 : 0
      };
    });

    // Monthly breakdown
    const monthGroups = {};
    for (const s of sales) {
      const month = String(s.saleDate).substring(0, 7); // YYYY-MM
      if (!monthGroups[month]) {
        monthGroups[month] = {
          month,
          salesCount: 0,
          quantityKg: 0,
          grossProceeds: 0,
          transportCost: 0,
          netProfit: 0
        };
      }
      monthGroups[month].salesCount += 1;
      monthGroups[month].quantityKg += s.quantityKg;
      monthGroups[month].grossProceeds += s.grossProceeds;
      monthGroups[month].transportCost += s.transportCost;
      monthGroups[month].netProfit += s.netProfit;
    }

    const monthlyTrend = Object.values(monthGroups).sort((a, b) => a.month.localeCompare(b.month));

    // Get current harvest projection from profile for comparison
    const profile = await FarmerProfile.findOne({ where: { userId } });
    let estimatedRevenue = 0;
    if (profile && profile.currentHarvestKg) {
      estimatedRevenue = Math.round(Number(profile.currentHarvestKg) * 28); // benchmark ~28/kg
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalSalesCount,
        totalQuantityKg: Math.round(totalQuantityKg * 100) / 100,
        totalGrossProceeds: Math.round(totalGrossProceeds),
        totalTransportCost: Math.round(totalTransportCost),
        totalInputCost: Math.round(totalInputCost),
        totalMandiCess: Math.round(totalMandiCess),
        totalNetProfit: Math.round(totalNetProfit),
        overallProfitMarginPercent,
        averageRealizedRatePerQuintal,
        estimatedRevenueComparison: {
          realizedProceeds: Math.round(totalGrossProceeds),
          simulatedProjection: estimatedRevenue,
          varianceAmount: Math.round(totalGrossProceeds - estimatedRevenue),
          variancePercent: estimatedRevenue > 0
            ? Math.round(((totalGrossProceeds - estimatedRevenue) / estimatedRevenue) * 1000) / 10
            : 0
        }
      },
      cropBreakdown,
      monthlyTrend
    });
  } catch (error) {
    console.error("[SaleController.getProfitSummary] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate profit summary: " + error.message
    });
  }
};

// 6. POST /api/farmer/sales/seed-demo
exports.seedDemoSales = async (req, res) => {
  try {
    const userId = req.user.id;
    const existingCount = await SaleRecord.count({ where: { userId } });
    if (existingCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Sales already exist for this account.",
        count: existingCount
      });
    }

    const demoSales = [
      {
        userId,
        cropName: "Tomato",
        quantityKg: 1200,
        unit: "kg",
        marketName: "Pune APMC (Gultekdi)",
        ratePerQuintal: 2850,
        grossProceeds: 34200,
        transportCost: 2400,
        inputCost: 6500,
        mandiCess: 342,
        netProfit: 24958,
        saleDate: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
        buyerName: "Kailash Agro Commission Agent",
        paymentStatus: "completed",
        notes: "Grade-A round tomatoes, direct auction"
      },
      {
        userId,
        cropName: "Onion",
        quantityKg: 2000,
        unit: "kg",
        marketName: "Lasalgaon Mandi (Nashik)",
        ratePerQuintal: 2400,
        grossProceeds: 48000,
        transportCost: 3200,
        inputCost: 9000,
        mandiCess: 480,
        netProfit: 35320,
        saleDate: new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0],
        buyerName: "Shree Ganesh Trading Co.",
        paymentStatus: "completed",
        notes: "Red onion batch, moisture 12%"
      },
      {
        userId,
        cropName: "Soybean",
        quantityKg: 1500,
        unit: "kg",
        marketName: "Latur APMC",
        ratePerQuintal: 4600,
        grossProceeds: 69000,
        transportCost: 3800,
        inputCost: 14000,
        mandiCess: 690,
        netProfit: 50510,
        saleDate: new Date(Date.now() - 45 * 86400000).toISOString().split("T")[0],
        buyerName: "Latur Oil Mill Federation",
        paymentStatus: "completed",
        notes: "High oil content variety JS 335"
      }
    ];

    await SaleRecord.bulkCreate(demoSales);

    return res.status(201).json({
      success: true,
      message: "Sample sales history generated for Maharashtra Mandis.",
      count: demoSales.length
    });
  } catch (error) {
    console.error("[SaleController.seedDemoSales] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to seed demo sales: " + error.message
    });
  }
};
