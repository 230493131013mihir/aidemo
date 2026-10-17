const assert = require('assert');
const authMiddleware = require('../middleware/auth.middleware');
const schemeService = require('../services/schemeService');

async function runTests() {
  console.log('======================================================');
  console.log('🌾 HarvestMitra AI — Universal Guest Mode Tests (Prashant Warule)');
  console.log('======================================================\n');

  // Test 1: authMiddleware accepts 'guest' token without 401
  let test1User = null;
  const mockReqGuest = {
    headers: { authorization: 'Bearer guest' }
  };
  const mockResGuest = {
    status: (code) => ({
      json: (body) => { throw new Error(`Unexpected status ${code}: ${JSON.stringify(body)}`); }
    })
  };
  authMiddleware(mockReqGuest, mockResGuest, () => {
    test1User = mockReqGuest.user;
  });
  assert.strictEqual(test1User?.role, 'farmer', 'Guest role should default to farmer');
  assert.strictEqual(test1User?.isGuest, true, 'isGuest flag should be true');
  console.log('  ✅ [PASS] Test 1: authMiddleware accepts Bearer guest token seamlessly');

  // Test 2: authMiddleware accepts x-guest-mode header
  let test2User = null;
  const mockReqHeader = {
    headers: { 'x-guest-mode': 'true' }
  };
  authMiddleware(mockReqHeader, mockResGuest, () => {
    test2User = mockReqHeader.user;
  });
  assert.strictEqual(test2User?.isGuest, true, 'x-guest-mode should establish guest session');
  console.log('  ✅ [PASS] Test 2: authMiddleware recognizes x-guest-mode header');

  // Test 3: Public scheme matching works for guest farmer
  const guestFarmerProfile = {
    state: 'Gujarat',
    district: 'Surat',
    farmSizeAcres: 3,
    crops: ['Tomatoes'],
    hasLandOwnership: true,
    farmerCategory: 'small_marginal'
  };
  const matchResults = await schemeService.matchSchemes(guestFarmerProfile);
  assert(Array.isArray(matchResults), 'Results should be an array');
  assert(matchResults.length > 0, 'Should return matched schemes for guest farmer');
  const pmKisan = matchResults.find(r => r.identifier === 'pm-kisan');
  assert.strictEqual(pmKisan?.eligibilityOutcome, 'potentially_eligible', 'PM-KISAN should be potentially eligible');
  console.log(`  ✅ [PASS] Test 3: Public scheme matching evaluates ${matchResults.length} schemes for guest farmer`);

  // Test 4: Rejects unauthorized garbage token
  let test4Rejected = false;
  const mockReqGarbage = {
    headers: { authorization: 'Bearer invalid_garbage_token_12345' }
  };
  const mockResGarbage = {
    status: (code) => {
      test4Rejected = (code === 401);
      return { json: () => {} };
    }
  };
  authMiddleware(mockReqGarbage, mockResGarbage, () => {});
  assert.strictEqual(test4Rejected, true, 'Garbage token must be rejected with 401');
  console.log('  ✅ [PASS] Test 4: Invalid non-guest token correctly rejected with 401');

  console.log('\n======================================================');
  console.log('🎉 All 4 Universal Guest Mode Tests Passed Successfully!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
