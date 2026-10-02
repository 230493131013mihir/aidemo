#!/usr/bin/env node
/**
 * Script to create GitHub Issues using GitHub REST API
 * Usage: node scripts/create_github_issues.js <GITHUB_PERSONAL_ACCESS_TOKEN>
 */

const https = require('https');

const GITHUB_TOKEN = process.argv[2] || process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Error: Please provide a GitHub Personal Access Token.');
  console.error('Usage: node scripts/create_github_issues.js <YOUR_GITHUB_TOKEN>');
  process.exit(1);
}

const REPO_OWNER = '230493131013mihir';
const REPO_NAME = 'aidemo';

const issues = [
  // --- MIHIR ---
  {
    title: '[MIHIR] Setup Project Workspace Architecture & Full-Stack Boilerplate',
    body: `### Assignee: Mihir (@230493131013mihir)\n**Role**: Team Lead & Integration\n\n### Tasks:\n- [ ] Set up \`frontend/\` Vite React + Tailwind CSS project workspace.\n- [ ] Set up \`backend/\` Node.js + Express.js server boilerplate.\n- [ ] Configure \`.env\` management and backend CORS middleware.\n- [ ] Ensure application builds and runs cleanly locally.`,
    labels: ['setup', 'enhancement']
  },
  {
    title: '[MIHIR] Implement JWT Authentication Flow & Protected Routes',
    body: `### Assignee: Mihir\n**Role**: Team Lead & Integration\n\n### Tasks:\n- [ ] Build \`POST /api/auth/register\` and \`POST /api/auth/login\` endpoints.\n- [ ] Implement password hashing with \`bcryptjs\` and token signing with \`jsonwebtoken\`.\n- [ ] Build Auth Context (\`AuthContext.jsx\`) & protected route wrapper in React Router.`,
    labels: ['backend', 'frontend', 'security']
  },
  {
    title: '[MIHIR] Build Landing Page & Hackathon Demo Mode Switcher',
    body: `### Assignee: Mihir\n**Role**: Team Lead & Integration\n\n### Tasks:\n- [ ] Create hero section with tagline: *"Smart Decisions. Better Harvests. Stronger Farmers."*\n- [ ] Add feature cards, problem overview, and visual preview sections.\n- [ ] Implement **"Explore Demo"** button allowing instant access as demo persona **Ramesh Patel (Surat, Gujarat)** without manual registration.`,
    labels: ['frontend', 'ui']
  },
  {
    title: '[MIHIR] Code Review, Pull Request Merging & Hackathon Demo Lead',
    body: `### Assignee: Mihir\n**Role**: Team Lead & Integration\n\n### Tasks:\n- [ ] Review and merge Pull Requests from Sayali, Prashant, and Varun into \`main\`.\n- [ ] Validate end-to-end integration of simulator, transport, AI chatbot, and market explorer.\n- [ ] Lead final hackathon presentation using [DEMO_GUIDE.md](file:///c:/Users/MIHIR%20JADAV/Desktop/aidemo/DEMO_GUIDE.md).`,
    labels: ['documentation', 'management']
  },

  // --- SAYALI ---
  {
    title: '[SAYALI] Design MySQL Database Schemas & Sequelize ORM Models',
    body: `### Assignee: Sayali\n**Role**: Backend & Database Architect\n\n### Tasks:\n- [ ] Configure Sequelize database connection in \`backend/config/database.js\`.\n- [ ] Define ORM models for \`users\`, \`farmer_profiles\`, \`crops\`, \`markets\`, \`market_prices\`, \`harvest_simulations\`, \`transport_requests\`, \`transport_matches\`, \`weather_alerts\`, and \`chat_sessions\`.\n- [ ] Set up foreign key associations and database indexes as specified in \`DATABASE_SCHEMA.md\`.`,
    labels: ['database', 'backend']
  },
  {
    title: '[SAYALI] Write Database Seeder Script for Sample Mandi Prices & Demo Data',
    body: `### Assignee: Sayali\n**Role**: Backend & Database Architect\n\n### Tasks:\n- [ ] Create \`backend/seeders/demoSeed.js\` script.\n- [ ] Seed initial data for Surat APMC Mandi and Ahmedabad APMC Mandi.\n- [ ] Seed crop catalog (Tomatoes, Onions, Wheat, Soybeans, Cotton).\n- [ ] Seed realistic sample market prices and weather advisories for Gujarat.`,
    labels: ['database', 'seed']
  },
  {
    title: '[SAYALI] Develop Market Explorer & Farmer Profile REST APIs',
    body: `### Assignee: Sayali\n**Role**: Backend & Database Architect\n\n### Tasks:\n- [ ] Build \`GET /api/markets\` and \`GET /api/markets/prices\` endpoints with crop/district filtering.\n- [ ] Build \`GET /api/markets/prices/trends\` for historical chart data.\n- [ ] Build Farmer Profile endpoints (\`GET /api/profile\`, \`PUT /api/profile\`).`,
    labels: ['backend', 'api']
  },
  {
    title: '[SAYALI] Implement Admin Dashboard Endpoints & Content Management',
    body: `### Assignee: Sayali\n**Role**: Backend & Database Architect\n\n### Tasks:\n- [ ] Build \`GET /api/admin/overview\` for system metrics.\n- [ ] Implement Mandi market price creation and update APIs (\`POST /api/admin/market-prices\`, \`PUT /api/admin/market-prices/:id\`).\n- [ ] Add role-based authorization check middleware (\`admin\` role requirement).`,
    labels: ['backend', 'admin']
  },

  // --- PRASHANT ---
  {
    title: '[PRASHANT] Implement Tailwind CSS Agricultural Design System & Layouts',
    body: `### Assignee: Prashant\n**Role**: Frontend UI/UX Developer\n\n### Tasks:\n- [ ] Configure Tailwind CSS color tokens: Deep agricultural green, warm cream, natural earth tones.\n- [ ] Create reusable UI components: Navbar, Footer, LoadingSpinner, AlertBanner, LanguageSelector.\n- [ ] Ensure mobile, tablet, and desktop responsive layouts.`,
    labels: ['frontend', 'ui/ux']
  },
  {
    title: '[PRASHANT] Build Farmer Dashboard & Summary Widgets',
    body: `### Assignee: Prashant\n**Role**: Frontend UI/UX Developer\n\n### Tasks:\n- [ ] Create personalized welcome card for farmer profile.\n- [ ] Implement Quick Stats widgets (Current Crop, Yield, Local Mandi Price, Weather Alert Banner).\n- [ ] Build recent harvest simulation history summary component.`,
    labels: ['frontend', 'dashboard']
  },
  {
    title: '[PRASHANT] Build Smart Harvest Decision Simulator UI & Financial Comparison',
    body: `### Assignee: Prashant\n**Role**: Frontend UI/UX Developer\n\n### Tasks:\n- [ ] Build simulation input form (Crop, Quantity, Current Mandi, Alt Mandi, Transport & Packaging costs).\n- [ ] Build 3-scenario side-by-side comparison cards (Option 1: Sell Today, Option 2: Hold & Sell Later, Option 3: Regional Mandi).\n- [ ] Highlight Gross Revenue vs. Net Revenue and perishability risk badges.`,
    labels: ['frontend', 'simulator']
  },
  {
    title: '[PRASHANT] Implement Financial Breakdown & Market Price Trend Charts (Recharts)',
    body: `### Assignee: Prashant\n**Role**: Frontend UI/UX Developer\n\n### Tasks:\n- [ ] Implement Recharts bar charts comparing Net Revenue across the 3 selling scenarios.\n- [ ] Implement line charts showing 7-day and 30-day Mandi price trends in Market Explorer.\n- [ ] Add visual tooltips, currency formatting (₹), and legend controls.`,
    labels: ['frontend', 'charts']
  },

  // --- VARUN ---
  {
    title: '[VARUN] Develop Shared Transport Matching Engine & UI Module',
    body: `### Assignee: Varun\n**Role**: AI Engineer & Integrations Lead\n\n### Tasks:\n- [ ] Build \`GET /api/transport/requests\` and \`POST /api/transport/requests\` endpoints.\n- [ ] Implement smart matching algorithm comparing destination market, pickup date, and vehicle capacity.\n- [ ] Build Shared Transport Page (\`TransportPage.jsx\`) with request form and matching partner cards.\n- [ ] Calculate individual transport cost savings (up to 50-70% savings).`,
    labels: ['backend', 'frontend', 'transport']
  },
  {
    title: '[VARUN] Implement Provider-Independent AI Service Layer & Fallback Engine',
    body: `### Assignee: Varun\n**Role**: AI Engineer & Integrations Lead\n\n### Tasks:\n- [ ] Create unified AI Service module (\`backend/services/aiService.js\`) supporting Gemini / OpenAI APIs.\n- [ ] Build **Deterministic Fallback Engine** (\`backend/services/fallbackAiEngine.js\`) using pre-calculated math and rules.\n- [ ] Ensure AI answers queries in Gujarati, Hindi, and English without hallucinating numbers or prices.`,
    labels: ['ai', 'backend']
  },
  {
    title: '[VARUN] Integrate Multilingual Voice Interaction (Web Speech STT & TTS)',
    body: `### Assignee: Varun\n**Role**: AI Engineer & Integrations Lead\n\n### Tasks:\n- [ ] Add microphone button to Mitra Assistant chatbot window.\n- [ ] Integrate browser Speech-to-Text API for natural Gujarati/Hindi voice speech input.\n- [ ] Integrate browser Text-to-Speech API to read AI responses aloud in selected language.\n- [ ] Provide clear error handling and browser permission messaging.`,
    labels: ['ai', 'voice', 'frontend']
  },
  {
    title: '[VARUN] Develop Weather Alert Advisories & Location Forecast Integration',
    body: `### Assignee: Varun\n**Role**: AI Engineer & Integrations Lead\n\n### Tasks:\n- [ ] Build Weather service layer (\`backend/services/weatherService.js\`) with OpenWeather fallback.\n- [ ] Generate actionable harvest alerts (e.g. rain warning triggering harvest acceleration recommendation).\n- [ ] Build Weather page UI (\`WeatherPage.jsx\`) with rain probability indicators.`,
    labels: ['integrations', 'weather']
  }
];

function createIssue(issueData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(issueData);

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'User-Agent': 'HarvestMitra-Setup-Script',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const parsed = JSON.parse(data);
          console.log(`✅ Created Issue #${parsed.number}: ${parsed.title}`);
          resolve(parsed);
        } else {
          console.error(`❌ Failed to create issue "${issueData.title}". Status: ${res.statusCode}`);
          console.error(`Response: ${data}`);
          reject(new Error(data));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log(`🚀 Creating ${issues.length} GitHub Issues for repository ${REPO_OWNER}/${REPO_NAME}...\n`);
  for (const issue of issues) {
    try {
      await createIssue(issue);
      // Brief delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error('Error creating issue:', err.message);
    }
  }
  console.log('\n🎉 Finished creating all GitHub issues!');
}

run();
