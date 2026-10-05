/**
 * Fictional demonstration data for the HarvestMitra AI Farmer Dashboard
 * Clearly marked as demo/illustrative data for hackathon presentation.
 */

export const dashboardDemoData = {
  farmer: {
    name: "Ramesh Patel",
    location: "Surat district, Gujarat",
    crop: "Tomatoes",
    quantity: "500 kg",
    quantityKg: 500,
    language: "Gujarati",
    farmSize: "4.5 Acres",
    typicalHarvest: "1,200 kg / season",
  },

  stats: {
    crop: "Tomatoes",
    cropVariety: "Hybrid Red",
    quantity: "500 kg",
    quantitySub: "5 Quintals",
    marketPrice: "₹32 / kg",
    marketPriceSub: "Demo Mandi Price",
    estimatedRevenue: "₹16,000",
    estimatedRevenueSub: "Illustrative Estimate",
  },

  weather: {
    temperature: 28,
    condition: "Partly Cloudy",
    humidity: 65,
    rainProbability: 30,
    location: "Surat, Gujarat",
    planningReminder: "Weather conditions shown here are demonstration data. Check a reliable weather source before making harvest decisions.",
  },

  priceTrends: [
    { day: "Day 1", dayKey: "dashboard.day1", price: 28 },
    { day: "Day 2", dayKey: "dashboard.day2", price: 29 },
    { day: "Day 3", dayKey: "dashboard.day3", price: 31 },
    { day: "Day 4", dayKey: "dashboard.day4", price: 30 },
    { day: "Day 5", dayKey: "dashboard.day5", price: 33 },
    { day: "Day 6", dayKey: "dashboard.day6", price: 32 },
    { day: "Day 7", dayKey: "dashboard.day7", price: 34 },
  ],

  revenueComparison: [
    { 
      optionKey: "dashboard.optSellToday", 
      optionName: "Sell Today", 
      netRevenue: 14200, 
      gross: 16000, 
      color: "#1b5e20" 
    },
    { 
      optionKey: "dashboard.optWaitLater", 
      optionName: "Wait and Sell Later", 
      netRevenue: 15600, 
      gross: 17800, 
      color: "#f59e0b" 
    },
    { 
      optionKey: "dashboard.optAnotherMarket", 
      optionName: "Sell at Another Market", 
      netRevenue: 16800, 
      gross: 19500, 
      color: "#2563eb" 
    },
  ],

  planningHistory: [
    { period: "Week 1", periodKey: "dashboard.week1", estimatedNet: 13200 },
    { period: "Week 2", periodKey: "dashboard.week2", estimatedNet: 14800 },
    { period: "Week 3", periodKey: "dashboard.week3", estimatedNet: 15200 },
    { period: "Week 4", periodKey: "dashboard.week4", estimatedNet: 16800 },
  ],

  recentActivity: [
    {
      id: "act-1",
      actionKey: "dashboard.actSimulationViewed",
      timeKey: "dashboard.timeToday",
      iconType: "calculator",
    },
    {
      id: "act-2",
      actionKey: "dashboard.actMarketOpened",
      timeKey: "dashboard.timeYesterday",
      iconType: "trending",
    },
    {
      id: "act-3",
      actionKey: "dashboard.actTransportViewed",
      timeKey: "dashboard.time2DaysAgo",
      iconType: "truck",
    },
  ],

  transport: {
    matchingRequests: 2,
    destination: "Surat APMC Yard",
    pickupWindow: "Tomorrow 6:30 AM",
    vehicleType: "Tata Ace (Shared Pool)",
    savingsSummary: "Est. 45% freight savings with 2 nearby farmers",
  },
};
