/**
 * aiService.test.js
 * Comprehensive automated test suite for Mitra Assistant AI Service Layer & Fallback Engine
 * HarvestMitra AI - ISSUE-09
 */

const assert = require('assert');
const aiService = require('../services/ai/aiService');
const { AIService } = require('../services/ai/aiService');
const fallbackEngine = require('../services/ai/fallbackEngine');
const { buildContext, formatContextForPrompt } = require('../services/ai/contextBuilder');
const { buildSystemPrompt } = require('../services/ai/promptBuilder');
const { detectIntent, detectLanguage } = require('../services/ai/intentDetector');
const mathEngine = require('../services/mathEngine');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🌾 HarvestMitra AI - ISSUE-09 Test Suite');
  console.log('Mitra Assistant AI Service Layer & Fallback Engine');
  console.log('======================================================\n');

  // Preserve initial env
  const origEnv = { ...process.env };

  try {
    // -------------------------------------------------------------
    // Test 1: Fallback with no credentials
    // -------------------------------------------------------------
    await runAsyncTest('Test 1: Fallback with no credentials', async () => {
      process.env.AI_PROVIDER = 'gemini';
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.AI_API_KEY;

      const testService = new AIService();
      const res = await testService.generateResponse({
        message: 'What is the market price?',
        context: {}
      });

      assert.strictEqual(res.success, true, 'Should succeed via fallback');
      assert.strictEqual(res.provider, 'fallback', 'Provider should be fallback');
      assert.strictEqual(res.mode, 'fallback', 'Mode should be fallback');
      assert.ok(typeof res.message === 'string' && res.message.length > 0, 'Message should not be empty');
    });

    // -------------------------------------------------------------
    // Test 2: Market question with no market data
    // -------------------------------------------------------------
    runTest('Test 2: Market question with no market data', () => {
      const res = fallbackEngine.generateResponse({
        intent: 'market_price',
        language: 'en',
        context: {
          marketData: { available: false, currentMarket: null }
        }
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.provider, 'fallback');
      // Must not invent price
      assert.doesNotMatch(res.message, /₹\s*\d+/, 'Must not invent numeric price when data is unavailable');
      // Must direct user to Market Explorer
      assert.match(res.message, /Market Explorer/i, 'Must suggest checking Market Explorer');
    });

    // -------------------------------------------------------------
    // Test 3: Revenue explanation with known backend calculations
    // -------------------------------------------------------------
    runTest('Test 3: Revenue explanation uses exact backend math calculations', () => {
      // Inputs: quantity = 500 kg, price = ₹28/kg, expenses = ₹1000
      const quantity = 500;
      const price = 28;
      const expenses = 1000;

      // Verify mathEngine deterministic outputs
      const gross = mathEngine.calculateGrossRevenue(quantity, price);
      const net = mathEngine.calculateNetRevenue(gross, expenses);
      assert.strictEqual(gross, 14000, 'Gross revenue must be 14,000');
      assert.strictEqual(net, 13000, 'Net revenue must be 13,000');

      // Test context builder integration
      const context = buildContext({
        crop: { name: 'Tomato', quantityKg: quantity },
        marketData: {
          currentMarket: { name: 'Surat APMC', pricePerKg: price, unit: 'kg', sourceType: 'DEMO' }
        },
        calculations: {
          today: { grossRevenue: gross, totalCost: expenses, netRevenue: net }
        }
      });

      const res = fallbackEngine.generateResponse({
        intent: 'revenue_calculation',
        language: 'en',
        context
      });

      assert.strictEqual(res.success, true);
      // Explanation must quote exact backend numbers: 14,000 and 13,000 and 1,000
      assert.match(res.message, /14,000/, 'Response must contain calculated gross revenue ₹14,000');
      assert.match(res.message, /13,000/, 'Response must contain calculated net revenue ₹13,000');
      assert.match(res.message, /1,000/, 'Response must contain expense ₹1,000');
    });

    // -------------------------------------------------------------
    // Test 4: Missing quantity results in clarification instead of guessing
    // -------------------------------------------------------------
    runTest('Test 4: Missing quantity prompts clarification without guessing', () => {
      const context = buildContext({
        crop: { name: 'Tomato', quantityKg: null }, // missing quantity
        marketData: {
          currentMarket: { name: 'Surat APMC', pricePerKg: 28, unit: 'kg' }
        },
        calculations: null // no calculation
      });

      const res = fallbackEngine.generateResponse({
        intent: 'revenue_calculation',
        language: 'en',
        context
      });

      assert.strictEqual(res.success, true);
      assert.doesNotMatch(res.message, /gross revenue is ₹\d+/, 'Must not invent gross revenue');
      assert.match(res.message, /provide the quantity/i, 'Must ask user for quantity');
    });

    // -------------------------------------------------------------
    // Test 5: Provider failure automatically falls back
    // -------------------------------------------------------------
    await runAsyncTest('Test 5: Provider failure gracefully falls back to deterministic engine', async () => {
      const testService = new AIService();

      // Register a failing mock provider
      testService.registerProvider('failing_mock', {
        isConfigured: () => true,
        generateResponse: async () => {
          const err = new Error('Upstream provider rate limit or network timeout');
          err.code = 'RATE_LIMIT_EXCEEDED';
          throw err;
        }
      });

      process.env.AI_PROVIDER = 'failing_mock';

      const res = await testService.generateResponse({
        message: 'What is the tomato price?',
        context: {
          crop: { name: 'Tomato' },
          marketData: {
            currentMarket: { name: 'Surat APMC', pricePerKg: 28, unit: 'kg', sourceType: 'DEMO' }
          }
        }
      });

      assert.strictEqual(res.success, true, 'Must return success: true even when provider fails');
      assert.strictEqual(res.provider, 'fallback', 'Must fall back to fallback provider');
      assert.strictEqual(res.mode, 'fallback', 'Mode must be fallback');
      assert.strictEqual(res.fallbackReason, 'RATE_LIMIT_EXCEEDED', 'Must note fallback reason safely');
      assert.match(res.message, /28/, 'Fallback response must supply known market price');
    });

    // -------------------------------------------------------------
    // Test 6: Invalid provider configuration handled safely
    // -------------------------------------------------------------
    await runAsyncTest('Test 6: Invalid AI_PROVIDER configuration falls back without crashing', async () => {
      process.env.AI_PROVIDER = 'unknown_exotic_provider_xyz';

      const testService = new AIService();
      const res = await testService.generateResponse({
        message: 'How can I save on transport costs?',
        context: {
          transport: { matches: [] }
        }
      });

      assert.strictEqual(res.success, true, 'Must succeed gracefully');
      assert.strictEqual(res.provider, 'fallback', 'Must use fallback');
      assert.match(res.message, /Transport/i, 'Must direct to Transport section');
    });

    // -------------------------------------------------------------
    // Test 7: Language Support (English, Hindi, Gujarati)
    // -------------------------------------------------------------
    runTest('Test 7: Multilingual fallback responses in English, Hindi, and Gujarati', () => {
      const marketContext = {
        crop: { name: 'Tomato' },
        marketData: {
          currentMarket: { name: 'Surat APMC', pricePerKg: 28, unit: 'kg', sourceType: 'DEMO' }
        }
      };

      // English
      const enRes = fallbackEngine.generateResponse({
        intent: 'market_price',
        language: 'en',
        context: marketContext
      });
      assert.strictEqual(enRes.metadata.language, 'en');
      assert.match(enRes.message, /Tomato price at Surat APMC is ₹28\/kg/);

      // Hindi
      const hiRes = fallbackEngine.generateResponse({
        intent: 'market_price',
        language: 'hi',
        context: marketContext
      });
      assert.strictEqual(hiRes.metadata.language, 'hi');
      assert.match(hiRes.message, /Surat APMC में Tomato का भाव ₹28\/kg है/);

      // Gujarati
      const guRes = fallbackEngine.generateResponse({
        intent: 'market_price',
        language: 'gu',
        context: marketContext
      });
      assert.strictEqual(guRes.metadata.language, 'gu');
      assert.match(guRes.message, /Surat APMC માં Tomato નો ભાવ ₹28\/kg છે/);

      // Marathi
      const mrRes = fallbackEngine.generateResponse({
        intent: 'market_price',
        language: 'mr',
        context: marketContext
      });
      assert.strictEqual(mrRes.metadata.language, 'mr');
      assert.match(mrRes.message, /Surat APMC मध्ये Tomato चा भाव ₹28\/kg आहे/);

      // Test Hindi, Gujarati, Marathi & English script detection
      assert.strictEqual(detectLanguage('ટામેટા નો ભાવ શું છે?'), 'gu', 'Gujarati script detection');
      assert.strictEqual(detectLanguage('टमाटर का भाव क्या है?'), 'hi', 'Hindi script detection');
      assert.strictEqual(detectLanguage('टोमॅटोचा भाव काय आहे?'), 'mr', 'Marathi script detection');
      assert.strictEqual(detectLanguage('माझ्याकडे 500 किलो टोमॅटो आहेत. आज विकावे का?'), 'mr', 'Marathi sentence detection');
      assert.strictEqual(detectLanguage('What is the price?'), 'en', 'English script detection');
    });

    // -------------------------------------------------------------
    // Test 8: Prompt and Context Safety Rules
    // -------------------------------------------------------------
    runTest('Test 8: System prompt includes strict context trust rules and prohibits hallucination', () => {
      const context = buildContext({
        farmer: { name: 'Ramesh Patel', location: 'Surat', preferredLanguage: 'gu' },
        crop: { name: 'Tomato', quantityKg: 500 },
        marketData: {
          currentMarket: { name: 'Surat APMC', pricePerKg: 28, unit: 'kg', sourceType: 'DEMO' }
        },
        calculations: {
          today: { grossRevenue: 14000, totalCost: 1000, netRevenue: 13000 }
        }
      });

      const prompt = buildSystemPrompt({
        language: 'gu',
        intent: 'harvest_decision',
        context
      });

      // Strict trust checks
      assert.match(prompt, /NEVER INVENT OR HALLUCINATE/i, 'Must instruct against hallucinations');
      assert.match(prompt, /NEVER CALCULATE OR ESTIMATE FINANCIAL NUMBERS INDEPENDENTLY/i, 'Must forbid LLM math');
      assert.match(prompt, /\[DEMO\]/, 'Must flag demo data status');
      assert.match(prompt, /14000/, 'Must inject backend gross revenue');
      assert.match(prompt, /13000/, 'Must inject backend net revenue');
      assert.match(prompt, /Ramesh Patel/, 'Must inject farmer name');
      assert.match(prompt, /Gujarati/, 'Must instruct response in Gujarati');
    });

    // -------------------------------------------------------------
    // Test 9: OpenAI & Gemini Provider Registration and Configuration
    // -------------------------------------------------------------
    runTest('Test 9: Providers can be instantiated and report configuration status accurately', () => {
      const testService = new AIService();

      assert.strictEqual(testService.providers.has('gemini'), true, 'Gemini provider registered');
      assert.strictEqual(testService.providers.has('openai'), true, 'OpenAI provider registered');

      const gemini = testService.providers.get('gemini');
      const openai = testService.providers.get('openai');

      assert.strictEqual(gemini.name, 'gemini');
      assert.strictEqual(openai.name, 'openai');

      // Check registration of third-party custom provider
      testService.registerProvider('custom_mock', {
        isConfigured: () => true,
        generateResponse: async () => ({ success: true, provider: 'custom_mock', mode: 'ai', message: 'ok' })
      });
      assert.strictEqual(testService.providers.has('custom_mock'), true, 'Custom provider registered successfully');
    });

  } finally {
    // Restore environment
    process.env = origEnv;
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Test Results: ${passedTests}/${totalTests} Tests Passed successfully!`);
  console.log(`======================================================\n`);
}

// Run tests if invoked directly
if (require.main === module) {
  runAllTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
