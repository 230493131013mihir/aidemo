const { Scheme, SavedScheme, SchemeChecklist, User } = require("../models");
const { Op } = require("sequelize");

// Initial Seed Data with Verified Government Domains
const VERIFIED_SCHEMES_SEED = [
  {
    identifier: "pm-kisan",
    nameEn: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    nameHi: "प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
    nameGu: "પ્રધાનમંત્રી કિસાન સન્માન નિધિ (પીએમ-કિસાન)",
    shortDescriptionEn: "Direct income support of ₹6,000 per year in 3 equal installments of ₹2,000 directly into Aadhaar-seeded bank accounts for landholding farmer families.",
    shortDescriptionHi: "भूमिधारक किसान परिवारों को प्रत्यक्ष लाभ हस्तांतरण (डीबीटी) के माध्यम से प्रति वर्ष ₹6,000 की वित्तीय सहायता।",
    shortDescriptionGu: "જમીનધારક ખેડૂત પરિવારોને બેંક ખાતામાં વાર્ષિક ₹6,000 (3 હપ્તામાં ₹2,000) સીધી આર્થિક સહાય.",
    benefitsEn: "₹6,000 per financial year credited in 3 four-monthly installments of ₹2,000 each directly via DBT. 100% centrally funded.",
    benefitsHi: "प्रति वर्ष ₹6,000 तीन 4-मासिक किस्तों (प्रत्येक ₹2,000) में सीधे आधार लिंक बैंक खाते में जमा।",
    benefitsGu: "દર વર્ષે ₹6,000 સીધા આધાર લિન્ક્ડ બેંક ખાતામાં 3 હપ્તામાં (દરેક ₹2,000) જમા થાય છે.",
    category: "income_support",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "Department of Agriculture and Farmers Welfare (DA&FW)",
    officialDomain: "pmkisan.gov.in",
    officialInfoUrl: "https://pmkisan.gov.in/",
    officialApplicationUrl: "https://pmkisan.gov.in/",
    applicationWindowStatus: "Open throughout year",
    targetBeneficiaries: "All cultivable landholding farmer families across India",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      maxLandholdingAcres: null,
      minAge: 18,
      applicableStates: ["All India"],
      farmerCategories: ["all", "small_marginal", "general", "women", "sc_st"]
    }),
    exclusionCriteria: "Institutional landholders, current/former constitutional post holders, serving/retired government employees, professionals (doctors, engineers, lawyers, CAs), and income tax payees.",
    applicationProcessSteps: JSON.stringify([
      "Visit official portal pmkisan.gov.in and click on 'New Farmer Registration'.",
      "Enter 12-digit Aadhaar Number and select your State (e.g. Gujarat, Maharashtra).",
      "Enter Aadhaar-linked mobile number to receive and verify OTP.",
      "Enter Village, Tehsil, and Land Survey / Khatauni details as per 7/12 record.",
      "Submit application. State nodal officer will review and approve within 15-30 days."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Must be linked to mobile number and active bank account" },
      { id: "land_record", name: "7/12 or 8-A / Khatauni Land Record", optional: false, description: "Official proof of agricultural cultivable land ownership" },
      { id: "bank_passbook", name: "Bank Account Passbook / Statement", optional: false, description: "Showing Account number and IFSC code" },
      { id: "mobile_number", name: "Aadhaar Linked Mobile Number", optional: false, description: "For e-KYC authentication" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/pm-kisan",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "pmfby",
    nameEn: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    nameHi: "प्रधानमंत्री फसल बीमा योजना (पीएमएफबीवाई)",
    nameGu: "પ્રધાનમંત્રી ફસલ બીમા યોજના (પીએમએફબીવાય)",
    shortDescriptionEn: "Comprehensive financial protection against crop loss caused by natural calamities, pests, and unseasonal weather with nominal farmer premium.",
    shortDescriptionHi: "प्राकृतिक आपदाओं, कीटों और बेमौसम बारिश से फसल नुकसान के खिलाफ न्यूनतम प्रीमियम पर व्यापक बीमा सुरक्षा।",
    shortDescriptionGu: "કુદરતી આફતો, જીવાતો અને કમોસમી વરસાદ સામે પાક નુકસાનનું વ્યાપક વીમા કવચ.",
    benefitsEn: "Maximum premium payable by farmers is only 2% for Kharif food/oilseeds, 1.5% for Rabi, and 5% for commercial/horticultural crops. Balance subsidized by Govt.",
    benefitsHi: "खरीफ फसलों के लिए मात्र 2%, रबी फसलों के लिए 1.5% तथा बागवानी फसलों के लिए 5% प्रीमियम। शेष सरकार द्वारा वहन।",
    benefitsGu: "ખરીફ પાકો માટે માત્ર 2%, રવિ પાકો માટે 1.5% અને બાગાયતી પાક માટે 5% પ્રીમિયમ. બાકીની રકમ સરકાર ભરે છે.",
    category: "crop_insurance",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "Ministry of Agriculture and Farmers Welfare, Govt of India",
    officialDomain: "pmfby.gov.in",
    officialInfoUrl: "https://pmfby.gov.in/",
    officialApplicationUrl: "https://pmfby.gov.in/farmerRegistrationForm",
    applicationWindowStatus: "Seasonal (Kharif / Rabi cut-off dates apply)",
    targetBeneficiaries: "All farmers growing notified crops in notified areas (both loanee and non-loanee)",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: false,
      tenantFarmersAllowed: true,
      applicableStates: ["All India", "Gujarat", "Maharashtra"],
      farmerCategories: ["all"]
    }),
    exclusionCriteria: "War, nuclear risks, malicious damage, and preventable risks due to negligence are excluded from claim settlement.",
    applicationProcessSteps: JSON.stringify([
      "Visit pmfby.gov.in or visit local CSC / Bank Branch before season cut-off date.",
      "Register farmer profile with Aadhaar and bank details.",
      "Select notified crop and enter land survey number (Village/District).",
      "Pay nominal farmer share premium (1.5% - 2%) online or at bank.",
      "Receive automated policy receipt and SMS confirmation."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Identity proof" },
      { id: "sowing_certificate", name: "Sowing Certificate / Girdawari", optional: false, description: "Issued by Patwari / Talati / Village Accountant" },
      { id: "land_record", name: "Land Possession Document (7/12 or Tenancy Agreement)", optional: false, description: "Proof of cultivation rights" },
      { id: "bank_passbook", name: "Bank Account Details", optional: false, description: "For direct claim settlement via DBT" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/pmfby",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "ikhedut-drip-irrigation",
    nameEn: "Gujarat i-Khedut Micro-Irrigation & Drip Subsidy (GGRC)",
    nameHi: "गुजरात आई-खेड़ूत ड्रिप एवं सूक्ष्म सिंचाई सब्सिडी",
    nameGu: "ગુજરાત આઈ-ખેડૂત ટપક અને ફુવારા પદ્ધતિ સબસિડી (GGRC)",
    shortDescriptionEn: "Government of Gujarat subsidy of up to 70% to 85% for installation of drip and sprinkler irrigation systems on agricultural land.",
    shortDescriptionHi: "गुजरात के किसानों के लिए ड्रिप एवं स्प्रिंकलर सिंचाई प्रणाली लगाने पर 70% से 85% तक की राज्य सब्सिडी।",
    shortDescriptionGu: "ખેતીની જમીન પર ટપક અને ફુવારા પદ્ધતિ વસાવવા માટે 70% થી 85% સુધીની રાજ્ય સરકાર સબસિડી.",
    benefitsEn: "70% financial assistance for general farmers, and up to 85% for SC/ST and small/marginal farmers in Gujarat, implemented through GGRC.",
    benefitsHi: "सामान्य किसानों के लिए 70% तथा लघु/सीमांत एवं अनुसूचित जाति/जनजाति के लिए 85% तक की वित्तीय सहायता।",
    benefitsGu: "સામાન્ય ખેડૂતો માટે 70% અને નાના/સીમાંત તથા SC/ST ખેડૂતો માટે 85% સુધી આર્થિક સહાય.",
    category: "irrigation_water",
    scope: "state",
    stateApplicability: "Gujarat",
    districtApplicability: "All Gujarat Districts (Surat, Ahmedabad, Rajkot, Vadodara, etc.)",
    department: "Department of Agriculture, Farmers Welfare & Co-operation, Govt of Gujarat",
    officialDomain: "ikhedut.gujarat.gov.in",
    officialInfoUrl: "https://ikhedut.gujarat.gov.in/",
    officialApplicationUrl: "https://ikhedut.gujarat.gov.in/Scheme/frm_SchemeApplication.aspx",
    applicationWindowStatus: "Open as per annual i-Khedut portal calendar",
    targetBeneficiaries: "All landholding farmers of Gujarat state with an active water source",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["Gujarat"],
      requiresWaterSource: true,
      farmerCategories: ["all", "small_marginal", "sc_st", "women"]
    }),
    exclusionCriteria: "Farmers who have already availed micro-irrigation subsidy for the same survey number within the last 7 years.",
    applicationProcessSteps: JSON.stringify([
      "Visit ikhedut.gujarat.gov.in and click on 'ખેતીવાડીની યોજનાઓ' (Agricultural Schemes).",
      "Select 'Micro Irrigation / Drip Scheme' and enter 8-A Khata number or Aadhaar.",
      "Choose authorized micro-irrigation manufacturer/vendor from Gujarat Green Revolution Company (GGRC) list.",
      "Submit application and print acknowledgement copy.",
      "Vendor conducts field survey and installs system; GGRC inspects and releases subsidy."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "7_12_8a", name: "7/12 and 8-A Land Record Copy", optional: false, description: "Recent copy from AnyRoR Gujarat" },
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Farmer identity verification" },
      { id: "bank_passbook", name: "Bank Passbook Copy (Cancel Cheque)", optional: false, description: "Account where subsidy will be processed" },
      { id: "water_source_proof", name: "Water Source Proof", optional: false, description: "Borewell / Well electricity bill or NOC agreement" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://ikhedut.gujarat.gov.in/",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "ikhedut-tractor-machinery",
    nameEn: "Gujarat i-Khedut Farm Mechanization & Tractor Subsidy",
    nameHi: "गुजरात आई-खेड़ूत कृषि यंत्रीकरण एवं ट्रैक्टर सहायता योजना",
    nameGu: "ગુજરાત આઈ-ખેડૂત ટ્રેક્ટર અને કૃષિ ઓજાર સહાય યોજના",
    shortDescriptionEn: "Capital subsidy of ₹45,000 to ₹1,00,000 for purchasing tractors, rotavators, power tillers, and modern agricultural equipment in Gujarat.",
    shortDescriptionHi: "ट्रैक्टर, रोटावेटर एवं आधुनिक कृषि यंत्रों की खरीद पर गुजरात सरकार द्वारा ₹45,000 से ₹1,00,000 तक की पूंजीगत सब्सिडी।",
    shortDescriptionGu: "ગુજરાતમાં ટ્રેક્ટર, રોટાવેટર અને આધુનિક કૃષિ ઓજારોની ખરીદી પર ₹45,000 થી ₹1,00,000 સુધીની સહાય.",
    benefitsEn: "Up to 50% of machine cost or ceiling limit (e.g. ₹60,000 for mini tractor, ₹1,00,000 for general tractor) for small/marginal/women farmers.",
    benefitsHi: "छोटे, सीमांत एवं महिला किसानों के लिए यंत्र लागत का 40% से 50% तक अनुदान।",
    benefitsGu: "નાના, સીમાંત અને મહિલા ખેડૂતો માટે સાધનના ખર્ચના 40% થી 50% સુધી સહાય.",
    category: "machinery_equipment",
    scope: "state",
    stateApplicability: "Gujarat",
    districtApplicability: "All Gujarat Districts",
    department: "Directorate of Agriculture, Government of Gujarat",
    officialDomain: "ikhedut.gujarat.gov.in",
    officialInfoUrl: "https://ikhedut.gujarat.gov.in/",
    officialApplicationUrl: "https://ikhedut.gujarat.gov.in/Scheme/frm_SchemeApplication.aspx",
    applicationWindowStatus: "Seasonal portal window",
    targetBeneficiaries: "Registered farmers of Gujarat state possessing valid land records",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["Gujarat"],
      farmerCategories: ["all", "small_marginal", "women", "sc_st"]
    }),
    exclusionCriteria: "Farmers who have received a tractor subsidy in the past 10 years are not eligible to re-apply for tractor category.",
    applicationProcessSteps: JSON.stringify([
      "Apply online on ikhedut.gujarat.gov.in during the announced scheme window.",
      "Submit application printout with quotation from authorized dealer to District Agriculture Officer.",
      "Upon lottery selection and sanction letter issue, purchase equipment within specified days.",
      "Physical verification conducted by Gram Sevak, and subsidy directly disbursed to bank."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "7_12_8a", name: "7/12 & 8-A Land Record", optional: false, description: "Land ownership evidence" },
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Beneficiary identification" },
      { id: "dealer_quotation", name: "Authorized Dealer Quotation", optional: false, description: "Itemized quote for machinery" },
      { id: "bank_passbook", name: "Bank Passbook Copy", optional: false, description: "Showing IFSC and Account number" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://ikhedut.gujarat.gov.in/",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "maha-magel-tyala-shettale",
    nameEn: "Magel Tyala Shettale (Maharashtra Farm Pond Scheme)",
    nameHi: "मागेल त्याला शेततळे (महाराष्ट्र शेततळे योजना)",
    nameGu: "માગેલ ત્યાલા શેતતળે (મહારાષ્ટ્ર ફાર્મ પોન્ડ યોજના)",
    shortDescriptionEn: "Government of Maharashtra provides 100% subsidy for construction of farm ponds (shettale) on agricultural land to conserve rainwater for irrigation and drought resilience.",
    shortDescriptionHi: "महाराष्ट्र सरकार कृषि भूमि पर शेततळे (फार्म पौंड) निर्माण के लिए 100% तक अनुदान प्रदान करती है।",
    shortDescriptionGu: "મહારાષ્ટ્ર સરકાર ખેતીની જમીન પર ફાર્મ પોન્ડ બનાવવા 100% સુધીની સબસિડી આપે છે.",
    benefitsEn: "Up to ₹50,000 for plastic-lined farm ponds and ₹1,00,000 for cement-lined ponds. 100% financial assistance for SC/ST and small/marginal farmers.",
    benefitsHi: "प्लास्टिक-लाइन्ड शेततळे के लिए ₹50,000 तक और सीमेंट-लाइन्ड के लिए ₹1,00,000 तक का अनुदान।",
    benefitsGu: "પ્લાસ્ટિક-લાઇન ફાર્મ પોન્ડ માટે ₹50,000 અને સિમેન્ટ-લાઇન માટે ₹1,00,000 સુધીની સહાય.",
    category: "irrigation_water",
    scope: "state",
    stateApplicability: "Maharashtra",
    districtApplicability: "All Maharashtra Districts (Pune, Nashik, Kolhapur, Solapur, Ahmednagar, etc.)",
    department: "Department of Agriculture, Government of Maharashtra",
    officialDomain: "krishi.maharashtra.gov.in",
    officialInfoUrl: "https://krishi.maharashtra.gov.in/",
    officialApplicationUrl: "https://mahadbt.maharashtra.gov.in/",
    applicationWindowStatus: "Open as per annual MahaDBT calendar",
    targetBeneficiaries: "All landholding farmers of Maharashtra state",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["Maharashtra"],
      requiresWaterSource: false,
      farmerCategories: ["all", "small_marginal", "sc_st", "women"]
    }),
    exclusionCriteria: "Farmers who have already availed farm pond subsidy on the same survey number.",
    applicationProcessSteps: JSON.stringify([
      "Apply online through MahaDBT portal (mahadbt.maharashtra.gov.in) under Agriculture Department schemes.",
      "Select 'Magel Tyala Shettale' scheme and enter 7/12 extract details.",
      "Submit application with required documents; Taluka Agriculture Officer verifies eligibility.",
      "Upon approval, construct the farm pond as per prescribed dimensions; subsidy released after physical inspection."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "7_12", name: "7/12 Utara (Land Record)", optional: false, description: "Recent land extract from Mahabhulekh" },
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Farmer identity verification" },
      { id: "bank_passbook", name: "Bank Passbook Copy", optional: false, description: "Account for subsidy disbursement" },
      { id: "caste_cert", name: "Caste Certificate (if SC/ST)", optional: true, description: "For priority subsidy eligibility" }
    ]),
    lastVerifiedDate: "2026-10-22",
    sourceUrl: "https://krishi.maharashtra.gov.in/",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "smam-machinery",
    nameEn: "Sub-Mission on Agricultural Mechanization (SMAM)",
    nameHi: "कृषि यंत्रीकरण पर उप-मिशन (एसएमएएम)",
    nameGu: "કૃષિ યાંત્રિકીકરણ ઉપ-મિશન (એસએમએએમ)",
    shortDescriptionEn: "Central scheme providing 40% to 50% subsidy for individual farmers to purchase farm implements and 80% for Custom Hiring Centers.",
    shortDescriptionHi: "कृषि उपकरणों की खरीद पर 40% से 50% तक तथा कस्टम हायरिंग सेंटरों के लिए 80% तक केंद्रीय वित्तीय सहायता।",
    shortDescriptionGu: "ખેતીના સાધનોની ખરીદી પર 40% થી 50% અને કસ્ટમ હાયરિંગ સેન્ટર માટે 80% સુધી કેન્દ્રીય સહાય.",
    benefitsEn: "40% to 50% subsidy for individual farmers; up to 80% subsidy for setting up village-level Custom Hiring Centers (CHCs) to help small farmers access equipment.",
    benefitsHi: "व्यक्तिगत किसानों के लिए 40-50% सब्सिडी तथा कस्टम हायरिंग सेंटर स्थापित करने हेतु 80% तक अनुदान।",
    benefitsGu: "ખેડૂતોને વ્યક્તિગત સાધન ખરીદી પર 40-50% અને ગ્રામ્ય સ્તરે હાયરિંગ સેન્ટર માટે 80% સહાય.",
    category: "machinery_equipment",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "Ministry of Agriculture & Farmers Welfare",
    officialDomain: "agrimachinery.nic.in",
    officialInfoUrl: "https://agrimachinery.nic.in/",
    officialApplicationUrl: "https://agrimachinery.nic.in/Index/FarmerRegistration",
    applicationWindowStatus: "Open as per annual state allocation",
    targetBeneficiaries: "Individual farmers, FPOs, and village entrepreneurs across India",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["All India"],
      farmerCategories: ["all", "small_marginal", "sc_st", "women"]
    }),
    exclusionCriteria: "Duplicate machinery applications within the lock-in period.",
    applicationProcessSteps: JSON.stringify([
      "Visit agrimachinery.nic.in and register under 'Farmer' section.",
      "Upload land record and identity documents.",
      "Select machinery type and manufacturer from certified empanelled list.",
      "District level committee approves; purchase equipment and upload invoice for DBT release."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Identity proof" },
      { id: "land_record", name: "Land Records (RoR / 7/12)", optional: false, description: "Land holding proof" },
      { id: "bank_passbook", name: "Bank Passbook Copy", optional: false, description: "For DBT subsidy credit" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/smam",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "soil-health-card",
    nameEn: "Soil Health Card Scheme (SHC)",
    nameHi: "मृदा स्वास्थ्य कार्ड योजना (एसएचसी)",
    nameGu: "સોઇલ હેલ્થ કાર્ડ યોજના (જમીન આરોગ્ય કાર્ડ)",
    shortDescriptionEn: "Free soil testing across 12 parameters every 3 years with customized fertilizer recommendations to optimize crop yields and lower input costs.",
    shortDescriptionHi: "12 मापदंडों पर निःशुल्क मिट्टी परीक्षण तथा कम लागत में अधिक उपज के लिए पोषक तत्वों की संतुलित सिफारिशें।",
    shortDescriptionGu: "12 પોષક તત્વોની મફત ચકાસણી અને ખાતરના બિનજરૂરી ખર્ચ ઘટાડવા માટે વૈજ્ઞાનિક ભલામણો.",
    benefitsEn: "100% free government soil analysis covering N, P, K, pH, EC, Organic Carbon, and Micronutrients with personalized crop-wise advisory.",
    benefitsHi: "नाइट्रोजन, फास्फोरस, पोटाश सहित 12 मापदंडों की निःशुल्क जांच एवं फसलवार उर्वरक परामर्श।",
    benefitsGu: "100% મફત જમીન ચકાસણી અને પાક અનુસાર સંતુલિત ખાતર વાપરવા માટેનું માર્ગદર્શન.",
    category: "fertilizer_soil",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "Department of Agriculture & Farmers Welfare, Ministry of Agriculture",
    officialDomain: "soilhealth.dac.gov.in",
    officialInfoUrl: "https://soilhealth.dac.gov.in/",
    officialApplicationUrl: null,
    applicationWindowStatus: "Open through local Agriculture Office & Gram Panchayat",
    targetBeneficiaries: "All agricultural landholders in India",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["All India"],
      farmerCategories: ["all"]
    }),
    exclusionCriteria: "None. Available to all agricultural landholders.",
    applicationProcessSteps: JSON.stringify([
      "Soil sample is collected by Agriculture extension worker / Gram Sevak from your field.",
      "Sample is tested at certified State Soil Testing Laboratory.",
      "Card is issued with detailed ratings and printed recommendations.",
      "Can also be downloaded directly from soilhealth.dac.gov.in using village and survey number."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "land_survey_no", name: "Survey / Khasra Number", optional: false, description: "Identifies the field location" },
      { id: "farmer_id", name: "Farmer Name & Mobile", optional: false, description: "Contact details for notification" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/shcs",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "kcc-credit",
    nameEn: "Kisan Credit Card (KCC) Concessional Loan Scheme",
    nameHi: "किसान क्रेडिट कार्ड (केसीसी) रियायती ऋण योजना",
    nameGu: "કિસાન ક્રેડિટ કાર્ડ (KCC) રાહતદરે ધિરાણ યોજના",
    shortDescriptionEn: "Concessional agricultural credit at 4% effective interest rate up to ₹3,00,000 to meet crop production and post-harvest maintenance expenses.",
    shortDescriptionHi: "फसल उत्पादन, बीज-खाद एवं कटाई के खर्चों के लिए मात्र 4% प्रभावी ब्याज दर पर ₹3 लाख तक का सस्ता कृषि ऋण।",
    shortDescriptionGu: "બિયારણ, ખાતર અને પાક ઉત્પાદન માટે માત્ર 4% ના રાહતદરે ₹3 લાખ સુધીનું સસ્તું ધિરાણ.",
    benefitsEn: "Concessional interest rate of 7%, further reduced to 4% upon timely repayment with 3% prompt repayment incentive. Collateral-free loan up to ₹1.60 Lakh.",
    benefitsHi: "समय पर पुनर्भुगतान पर 3% अतिरिक्त छूट के साथ मात्र 4% ब्याज। ₹1.60 लाख तक बिना किसी बंधक (कोलैटरल) के ऋण।",
    benefitsGu: "સમયસર ચૂકવણી પર માત્ર 4% વ્યાજદર. ₹1.60 લાખ સુધી કોઈ ગિરવે (કોલેટરલ) વગર લોન.",
    category: "credit_interest",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "Department of Agriculture and Farmers Welfare with RBI & NABARD",
    officialDomain: "myscheme.gov.in",
    officialInfoUrl: "https://www.myscheme.gov.in/schemes/kcc",
    officialApplicationUrl: null,
    applicationWindowStatus: "Open through all Commercial, Regional Rural & Cooperative Banks",
    targetBeneficiaries: "All farmers, tenant farmers, oral lessees, sharecroppers, and SHG farmer groups",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: false,
      tenantFarmersAllowed: true,
      minAge: 18,
      maxAge: 75,
      applicableStates: ["All India"],
      farmerCategories: ["all"]
    }),
    exclusionCriteria: "Willful defaulters and applicants with unresolved bank debts.",
    applicationProcessSteps: JSON.stringify([
      "Collect 1-page simplified KCC form from local Bank branch or download from bank portal.",
      "Attach 7/12 land record, Aadhaar card, and current cropping pattern declaration.",
      "Bank assesses credit limit based on scale of finance and crop acreage.",
      "KCC RuPay debit card issued within 14 working days."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "aadhaar", name: "Aadhaar Card / PAN Card", optional: false, description: "KYC verification" },
      { id: "land_record", name: "Land Record (7/12, 8-A / Lease Deed)", optional: false, description: "Cultivation area proof" },
      { id: "crop_declaration", name: "Cropping Declaration Form", optional: false, description: "Crops cultivated in Kharif/Rabi" },
      { id: "passport_photo", name: "2 Passport Size Photographs", optional: false, description: "For bank application" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/kcc",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "pkvy-organic-farming",
    nameEn: "Paramparagat Krishi Vikas Yojana (PKVY) - Organic Farming",
    nameHi: "परम्परागत कृषि विकास योजना (पीकेवीवाई) - जैविक खेती",
    nameGu: "પરંપરાગત કૃષિ વિકાસ યોજના (PKVY) - પ્રાકૃતિક/સજીવ ખેતી",
    shortDescriptionEn: "Financial support of ₹50,000 per hectare for 3 years to adopt organic and natural farming through farmer cluster groups.",
    shortDescriptionHi: "किसान समूहों के माध्यम से जैविक और प्राकृतिक खेती अपनाने के लिए 3 वर्षों में ₹50,000 प्रति हेक्टेयर की वित्तीय सहायता।",
    shortDescriptionGu: "ખેડૂત જૂથો દ્વારા પ્રાકૃતિક અને ઓર્ગેનિક ખેતી અપનાવવા માટે 3 વર્ષમાં ₹50,000 પ્રતિ હેક્ટર સહાય.",
    benefitsEn: "₹31,000/ha provided directly for organic inputs (seeds, bio-fertilizers, bio-pesticides, vermicompost) plus support for PGS certification and value addition.",
    benefitsHi: "जैविक खाद, बीज, कीटनाशक और पीजीएस जैविक प्रमाणीकरण के लिए सीधे डीबीटी सहायता।",
    benefitsGu: "ઓર્ગેનિક ખાતર, દેશી બિયારણ અને પ્રમાણીકરણ માટે સીધી ડીબીટી આર્થિક સહાય.",
    category: "organic_farming",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "National Centre for Organic and Natural Farming (NCONF)",
    officialDomain: "pgsindia-ncof.gov.in",
    officialInfoUrl: "https://pgsindia-ncof.gov.in/",
    officialApplicationUrl: null,
    applicationWindowStatus: "Open through District Agriculture Officer and Regional Councils",
    targetBeneficiaries: "Farmer groups/clusters committing to chemical-free farming on at least 20 hectares",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["All India", "Gujarat", "Maharashtra"],
      farmingType: "organic_or_converting",
      farmerCategories: ["all"]
    }),
    exclusionCriteria: "Farms using synthetic chemical pesticides or fertilizers without transitioning.",
    applicationProcessSteps: JSON.stringify([
      "Form a local cluster of 20-50 farmers with contiguous land area.",
      "Register group with District Agriculture Officer / Regional Council under PGS-India.",
      "Undergo orientation on organic liquid formulations (Jeevamrut, Beejamrut, compost).",
      "Receive tranche payments directly via DBT upon seasonal inspection."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "aadhaar", name: "Aadhaar Card", optional: false, description: "Farmer identity" },
      { id: "land_record", name: "7/12 Land Ownership Record", optional: false, description: "Land parcel details" },
      { id: "bank_passbook", name: "Bank Passbook Copy", optional: false, description: "For DBT funds" },
      { id: "group_pledge", name: "Organic Pledge Declaration", optional: false, description: "Commitment to zero chemical farming" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/pkvy",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "midh-horticulture",
    nameEn: "Mission for Integrated Development of Horticulture (MIDH)",
    nameHi: "एकीकृत बागवानी विकास मिशन (एमआईडीएच)",
    nameGu: "ઇન્ટીગ્રેટેડ ડેવલપમેન્ટ ઓફ હોર્ટીકલ્ચર મિશન (MIDH - બાગાયત સહાય)",
    shortDescriptionEn: "Subsidies of 40% to 50% for greenhouse/polyhouse setup, shade net houses, post-harvest packhouses, and fruit/vegetable nurseries.",
    shortDescriptionHi: "ग्रीनहाउस, शेडनेट हाउस, पैकहाउस एवं उच्च मूल्य फल-सब्जी नर्सरी की स्थापना पर 40% से 50% तक की भारी सब्सिडी।",
    shortDescriptionGu: "ગ્રીનહાઉસ, નેટહાઉસ, પેકહાઉસ અને ફળ-શાકભાજી નર્સરી બનાવવા માટે 40% થી 50% સુધી સહાય.",
    benefitsEn: "Financial grant of 50% of cost ceiling for establishing protected cultivation structures (polyhouses, shade nets) and high-density orchards.",
    benefitsHi: "पॉलीहाउस, शेडनेट और कोल्ड रूम जैसी संरचनाओं के निर्माण पर 50% तक सरकारी अनुदान।",
    benefitsGu: "પોલીહાઉસ, શેડનેટ અને કોલ્ડ રૂમ બનાવવા માટે ખર્ચના 50% સુધી સરકારી ગ્રાન્ટ.",
    category: "horticulture",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "Horticulture Division, Ministry of Agriculture & Farmers Welfare",
    officialDomain: "midh.gov.in",
    officialInfoUrl: "https://midh.gov.in/",
    officialApplicationUrl: null,
    applicationWindowStatus: "Open through State Horticulture Mission Directorates",
    targetBeneficiaries: "Individual farmers and Farmer Producer Companies cultivating horticultural crops",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      minLandholdingAcres: 0.5,
      applicableStates: ["All India", "Gujarat", "Maharashtra"],
      applicableCrops: ["Vegetables", "Fruits", "Flowers", "Spices", "Tomato", "Pomegranate", "Grapes"],
      farmerCategories: ["all"]
    }),
    exclusionCriteria: "Unregistered leased land without long-term registered lease deed (minimum 10 years).",
    applicationProcessSteps: JSON.stringify([
      "Submit Detailed Project Report (DPR) to District Horticulture Officer.",
      "Horticulture officer reviews land documents, water availability, and viability.",
      "Work order issued; construct structure through empanelled technical agency.",
      "Joint technical committee inspects and releases subsidy directly to farmer's account."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "land_record", name: "7/12 & 8-A Land Record", optional: false, description: "Proving minimum 0.5 acre clear land" },
      { id: "project_report", name: "Detailed Project Report (DPR)", optional: false, description: "Technical plan and vendor estimate" },
      { id: "soil_water_test", name: "Soil & Water Quality Test Report", optional: false, description: "Confirms suitability for protected farming" },
      { id: "bank_passbook", name: "Bank Account Details", optional: false, description: "For subsidy disbursement" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/midh",
    verificationStatus: "verified",
    status: "active"
  },
  {
    identifier: "aif-infrastructure",
    nameEn: "Agriculture Infrastructure Fund (AIF)",
    nameHi: "कृषि अवसंरचना कोष (एआईएफ)",
    nameGu: "એગ્રીકલ્ચર ઇન્ફ્રાસ્ટ્રક્ચર ફંડ (AIF - સંગ્રહ અને પ્રોસેસિંગ લોન સહાય)",
    shortDescriptionEn: "3% interest subvention and credit guarantee on bank loans up to ₹2 Crores for building warehouses, cold storage, and primary processing units.",
    shortDescriptionHi: "गोदाम, कोल्ड स्टोरेज, ग्रेडिंग-सॉर्टिंग यूनिट के लिए ₹2 करोड़ तक के बैंक ऋण पर 3% वार्षिक ब्याज छूट।",
    shortDescriptionGu: "ગોડાઉન, કોલ્ડ સ્ટોરેજ અને ગ્રેડિંગ યુનિટ માટે ₹2 કરોડ સુધીની બેંક લોન પર 3% વ્યાજ સબસિડી.",
    benefitsEn: "3% per annum interest subvention up to a loan limit of ₹2 Crores for a maximum tenure of 7 years, with CGTMSE credit guarantee coverage.",
    benefitsHi: "₹2 करोड़ तक के ऋण पर 7 वर्षों के लिए 3% ब्याज छूट एवं क्रेडिट गारंटी सुरक्षा।",
    benefitsGu: "₹2 કરોડ સુધીની લોન પર 7 વર્ષ સુધી 3% વ્યાજ સહાય અને ક્રેડિટ ગેરંટી કવચ.",
    category: "storage_logistics",
    scope: "central",
    stateApplicability: "All India",
    districtApplicability: "All Districts",
    department: "National Infrastructure Division, Ministry of Agriculture & Farmers Welfare",
    officialDomain: "agriinfra.dac.gov.in",
    officialInfoUrl: "https://agriinfra.dac.gov.in/",
    officialApplicationUrl: "https://agriinfra.dac.gov.in/",
    applicationWindowStatus: "Open till 2032-33",
    targetBeneficiaries: "Farmers, Agri-entrepreneurs, FPOs, Cooperatives, and Primary Agricultural Credit Societies",
    eligibilityRules: JSON.stringify({
      requiresLandOwnership: true,
      applicableStates: ["All India"],
      farmerCategories: ["all"]
    }),
    exclusionCriteria: "Non-agricultural projects and activities outside the post-harvest management list.",
    applicationProcessSteps: JSON.stringify([
      "Register on agriinfra.dac.gov.in as Beneficiary.",
      "Fill online project proposal (Storage Warehouse, Cold Chain, Sorting/Grading).",
      "Select preferred lending commercial or cooperative bank.",
      "Ministry grants in-principle approval; bank sanctions loan with automatic 3% subvention."
    ]),
    requiredDocuments: JSON.stringify([
      { id: "aadhaar_pan", name: "Aadhaar and PAN Card", optional: false, description: "KYC credentials" },
      { id: "land_proof", name: "Land Ownership / Registered Lease Agreement", optional: false, description: "Project site title" },
      { id: "project_dpr", name: "Detailed Project Report (DPR)", optional: false, description: "Technical and financial viability report" },
      { id: "bank_account", name: "Bank Statement of Last 6 Months", optional: false, description: "Financial evaluation" }
    ]),
    lastVerifiedDate: "2026-10-17",
    sourceUrl: "https://www.myscheme.gov.in/schemes/aif",
    verificationStatus: "verified",
    status: "active"
  }
];

class SchemeService {
  /**
   * Seed initial verified schemes if database table is empty
   */
  async ensureSeeded() {
    try {
      const count = await Scheme.count();
      if (count === 0) {
        console.log(`[SchemeService] Seeding ${VERIFIED_SCHEMES_SEED.length} verified government schemes...`);
        for (const item of VERIFIED_SCHEMES_SEED) {
          await Scheme.findOrCreate({
            where: { identifier: item.identifier },
            defaults: item
          });
        }
        console.log("[SchemeService] Verified schemes seeded successfully.");
      }
    } catch (err) {
      console.warn("[SchemeService] ensureSeeded notice:", err.message);
    }
  }

  /**
   * List schemes with search, category, state filters and pagination
   */
  async listSchemes(query = {}) {
    await this.ensureSeeded();

    const limit = Math.min(Number(query.limit) || 20, 50);
    const page = Math.max(Number(query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const where = { status: "active" };

    if (query.category && query.category !== "all") {
      where.category = query.category;
    }

    if (query.scope && query.scope !== "all") {
      where.scope = query.scope;
    }

    if (query.state && query.state !== "all" && query.state !== "All India") {
      where[Op.or] = [
        { stateApplicability: "All India" },
        { stateApplicability: { [Op.like]: `%${query.state}%` } }
      ];
    }

    if (query.search) {
      const s = query.search.trim();
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { nameEn: { [Op.like]: `%${s}%` } },
            { nameHi: { [Op.like]: `%${s}%` } },
            { nameGu: { [Op.like]: `%${s}%` } },
            { shortDescriptionEn: { [Op.like]: `%${s}%` } },
            { department: { [Op.like]: `%${s}%` } }
          ]
        }
      ];
    }

    const { count, rows } = await Scheme.findAndCountAll({
      where,
      limit,
      offset,
      order: [["lastVerifiedDate", "DESC"], ["id", "ASC"]]
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows.map(r => this.formatScheme(r))
    };
  }

  /**
   * Get single scheme details by ID or identifier
   */
  async getSchemeById(idOrSlug) {
    await this.ensureSeeded();

    let scheme;
    if (!isNaN(Number(idOrSlug))) {
      scheme = await Scheme.findByPk(Number(idOrSlug));
    }
    if (!scheme) {
      scheme = await Scheme.findOne({ where: { identifier: String(idOrSlug) } });
    }

    if (!scheme) {
      const err = new Error("Government scheme not found.");
      err.statusCode = 404;
      throw err;
    }

    return this.formatScheme(scheme);
  }

  /**
   * Rule-Based Matching Engine
   * Deterministically evaluates farmer answers against verified scheme eligibility rules
   */
  async matchSchemes(farmerAnswers = {}) {
    await this.ensureSeeded();

    const {
      state = "Gujarat",
      district = "",
      farmSizeAcres = null,
      crops = [],
      irrigationMethod = "none",
      beneficiaryCategory = "general",
      age = null,
      hasLandOwnership = true
    } = farmerAnswers;

    const farmSize = farmSizeAcres !== null && farmSizeAcres !== "" ? Number(farmSizeAcres) : null;
    const farmerAge = age !== null && age !== "" ? Number(age) : null;

    // Fetch all active verified schemes
    const allSchemes = await Scheme.findAll({
      where: { status: "active" },
      order: [["id", "ASC"]]
    });

    const results = [];

    for (const rawScheme of allSchemes) {
      const scheme = this.formatScheme(rawScheme);
      let rules = {};
      try {
        rules = typeof scheme.eligibilityRules === "string"
          ? JSON.parse(scheme.eligibilityRules)
          : (scheme.eligibilityRules || {});
      } catch (e) {
        rules = {};
      }

      let score = 0;
      const matchedReasons = [];
      const unverifiedConditions = [];
      const disqualifiedReasons = [];

      // 1. Geography Matching (State applicability)
      const isAllIndia = scheme.stateApplicability.toLowerCase().includes("all india");
      const isStateMatched = state && scheme.stateApplicability.toLowerCase().includes(state.toLowerCase());

      if (isAllIndia || isStateMatched) {
        score += 30;
        matchedReasons.push(
          isAllIndia
            ? `Centrally applicable across all Indian states and Union Territories.`
            : `Specifically designed for farmers located in ${scheme.stateApplicability}.`
        );
      } else {
        disqualifiedReasons.push(
          `Scheme applies specifically to ${scheme.stateApplicability}, while your farm is in ${state}.`
        );
      }

      // 2. Land Ownership Check
      if (rules.requiresLandOwnership) {
        if (hasLandOwnership) {
          score += 25;
          matchedReasons.push("You possess registered agricultural cultivable land title.");
        } else {
          disqualifiedReasons.push("Scheme officially mandates registered agricultural land ownership (7/12 or RoR).");
        }
      } else if (rules.tenantFarmersAllowed) {
        score += 20;
        matchedReasons.push("Tenant farmers, oral lessees, and sharecroppers are also officially eligible.");
      }

      // 3. Farm Size Limits (Small / Marginal vs Large)
      if (rules.maxLandholdingAcres !== null && rules.maxLandholdingAcres !== undefined) {
        if (farmSize !== null) {
          if (farmSize <= rules.maxLandholdingAcres) {
            score += 25;
            matchedReasons.push(
              `Your farm size (${farmSize} acres) satisfies the maximum ceiling of ${rules.maxLandholdingAcres} acres.`
            );
          } else {
            disqualifiedReasons.push(
              `Your declared farm size (${farmSize} acres) exceeds the ceiling of ${rules.maxLandholdingAcres} acres.`
            );
          }
        } else {
          unverifiedConditions.push(`Verification needed: Landholding must be under ${rules.maxLandholdingAcres} acres.`);
        }
      }

      // 4. Irrigation Needs (Drip / Sprinkler schemes)
      if (scheme.category === "irrigation_water") {
        if (irrigationMethod === "drip" || irrigationMethod === "sprinkler" || irrigationMethod === "none") {
          score += 15;
          matchedReasons.push("Directly relevant to your micro-irrigation and water conservation setup.");
        }
      }

      // 5. Age Limits (e.g. pension schemes)
      if (rules.minAge || rules.maxAge) {
        if (farmerAge !== null) {
          if (rules.minAge && farmerAge < rules.minAge) {
            disqualifiedReasons.push(`Applicant must be at least ${rules.minAge} years old (entered age: ${farmerAge}).`);
          } else if (rules.maxAge && farmerAge > rules.maxAge) {
            disqualifiedReasons.push(`Applicant must be under ${rules.maxAge} years old (entered age: ${farmerAge}).`);
          } else {
            score += 10;
            matchedReasons.push(`Age eligibility requirement met (${farmerAge} years).`);
          }
        } else {
          unverifiedConditions.push(`Age range verification required (${rules.minAge || 18} to ${rules.maxAge || 60} years).`);
        }
      }

      // Determine Outcome: 'potentially_eligible' | 'more_info_required' | 'ineligible'
      let eligibilityOutcome;
      if (disqualifiedReasons.length > 0) {
        eligibilityOutcome = "ineligible";
      } else if (unverifiedConditions.length > 0 && score < 50) {
        eligibilityOutcome = "more_info_required";
      } else {
        eligibilityOutcome = "potentially_eligible";
      }

      results.push({
        ...scheme,
        matchingScore: score,
        eligibilityOutcome, // 'potentially_eligible' | 'more_info_required' | 'ineligible'
        matchedReasons,
        unverifiedConditions,
        disqualifiedReasons,
        nextSteps: eligibilityOutcome === "potentially_eligible"
          ? "Prepare your 7/12 record and Aadhaar card, then proceed to the verified official portal below."
          : eligibilityOutcome === "more_info_required"
          ? "Review the unverified criteria with your local Talati or District Agriculture Officer."
          : "Explore alternative schemes that match your specific district and land profile."
      });
    }

    // Sort: potentially_eligible first, then more_info_required, then ineligible; then by score
    const priority = { potentially_eligible: 1, more_info_required: 2, ineligible: 3 };
    results.sort((a, b) => {
      if (priority[a.eligibilityOutcome] !== priority[b.eligibilityOutcome]) {
        return priority[a.eligibilityOutcome] - priority[b.eligibilityOutcome];
      }
      return b.matchingScore - a.matchingScore;
    });

    return results;
  }

  /**
   * Helper to format parsed JSON properties
   */
  formatScheme(schemeInstance) {
    const raw = schemeInstance.toJSON ? schemeInstance.toJSON() : schemeInstance;
    let applicationProcessSteps = [];
    let requiredDocuments = [];
    let eligibilityRules = {};

    try {
      applicationProcessSteps = typeof raw.applicationProcessSteps === "string"
        ? JSON.parse(raw.applicationProcessSteps)
        : (raw.applicationProcessSteps || []);
    } catch (e) {}

    try {
      requiredDocuments = typeof raw.requiredDocuments === "string"
        ? JSON.parse(raw.requiredDocuments)
        : (raw.requiredDocuments || []);
    } catch (e) {}

    try {
      eligibilityRules = typeof raw.eligibilityRules === "string"
        ? JSON.parse(raw.eligibilityRules)
        : (raw.eligibilityRules || {});
    } catch (e) {}

    return {
      ...raw,
      applicationProcessSteps,
      requiredDocuments,
      eligibilityRules
    };
  }
}

module.exports = new SchemeService();
