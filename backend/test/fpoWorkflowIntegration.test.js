const { sequelize } = require('../config/database');
const { User, FarmerProfile, FpoMembership } = require('../models');
const jwt = require('jsonwebtoken');
const http = require('http');

// Helper to make API requests to the running backend on port 5000
function apiRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone
    },
    process.env.JWT_SECRET || 'harvestmitra_super_secret_jwt_token_key_2026_hackathon',
    { expiresIn: '7d' }
  );
}

async function runTest() {
  console.log('--- Starting FPO Membership Request & Approval End-to-End Test ---');

  // Find or create test FPO leader
  let fpoLeader = await User.findOne({ where: { email: 'fpo_test_leader@harvestmitra.local' } });
  if (!fpoLeader) {
    fpoLeader = await User.create({
      name: 'Sahyadri FPO Leader',
      email: 'fpo_test_leader@harvestmitra.local',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'fpo_leader',
      phone: '9822001122'
    });
    await FarmerProfile.create({
      userId: fpoLeader.id,
      fpoName: 'Sahyadri Farmers Producer Co.',
      fpoRegistrationNumber: 'FPO-MH-2026-99',
      district: 'Nashik',
      state: 'Maharashtra',
      mainCrop: 'Onion, Tomato, Pomegranate',
      farmSizeAcres: 120.0,
      memberFarmerCount: 52
    });
  }

  // Find or create test Farmer 1
  let farmer1 = await User.findOne({ where: { email: 'farmer1_test@harvestmitra.local' } });
  if (!farmer1) {
    farmer1 = await User.create({
      name: 'Ramesh Patil',
      email: 'farmer1_test@harvestmitra.local',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'farmer',
      phone: '9850112233',
      location: 'Dindori, Nashik'
    });
    await FarmerProfile.create({
      userId: farmer1.id,
      district: 'Nashik',
      state: 'Maharashtra',
      mainCrop: 'Onion',
      farmSizeAcres: 4.5
    });
  }

  // Find or create test Farmer 2
  let farmer2 = await User.findOne({ where: { email: 'farmer2_test@harvestmitra.local' } });
  if (!farmer2) {
    farmer2 = await User.create({
      name: 'Suresh Shinde',
      email: 'farmer2_test@harvestmitra.local',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'farmer',
      phone: '9850445566',
      location: 'Niphad, Nashik'
    });
    await FarmerProfile.create({
      userId: farmer2.id,
      district: 'Nashik',
      state: 'Maharashtra',
      mainCrop: 'Tomato',
      farmSizeAcres: 2.0
    });
  }

  // Clean up any previous test memberships for these two farmers and fpoLeader
  await FpoMembership.destroy({
    where: {
      fpoId: fpoLeader.id,
      farmerId: [farmer1.id, farmer2.id]
    }
  });

  const farmer1Token = makeToken(farmer1);
  const farmer2Token = makeToken(farmer2);
  const fpoLeaderToken = makeToken(fpoLeader);

  // 1. Farmer 1 lists available FPO organizations
  console.log('\nStep 1: Farmer 1 queries available FPOs');
  const orgsRes = await apiRequest('GET', '/api/fpo/all-organizations', farmer1Token);
  console.log(`HTTP ${orgsRes.status}, organizations returned: ${orgsRes.body.data?.length || 0}`);
  if (orgsRes.status !== 200 || !orgsRes.body.success) {
    throw new Error('Failed to fetch available organizations: ' + JSON.stringify(orgsRes.body));
  }

  // 2. Farmer 1 submits a membership request to fpoLeader
  console.log('\nStep 2: Farmer 1 submits membership request to FPO', fpoLeader.id);
  const reqRes1 = await apiRequest('POST', '/api/fpo/membership-request', farmer1Token, {
    fpoId: fpoLeader.id,
    notes: 'I have 4.5 acres of onion and would like to sell collectively.'
  });
  console.log(`HTTP ${reqRes1.status}, response:`, reqRes1.body);
  if (reqRes1.status !== 201 || reqRes1.body.data?.status !== 'pending') {
    throw new Error('Farmer 1 membership request submission failed');
  }

  // 3. Duplicate request prevention: Farmer 1 submits again
  console.log('\nStep 3: Test duplicate request prevention for Farmer 1');
  const dupRes = await apiRequest('POST', '/api/fpo/membership-request', farmer1Token, {
    fpoId: fpoLeader.id,
    notes: 'Attempting duplicate submission'
  });
  console.log(`HTTP ${dupRes.status}, message:`, dupRes.body.message || dupRes.body.error);
  if (dupRes.status !== 409 && dupRes.status !== 400) {
    throw new Error('Duplicate membership request should have been rejected');
  }

  // 4. Farmer 1 checks membership status
  console.log('\nStep 4: Farmer 1 checks membership status');
  const statusRes1 = await apiRequest('GET', '/api/fpo/my-membership', farmer1Token);
  console.log(`HTTP ${statusRes1.status}, data length: ${statusRes1.body.data?.length}, first status: ${statusRes1.body.data?.[0]?.status}`);
  if (statusRes1.body.data?.[0]?.status !== 'pending') {
    throw new Error('Farmer 1 status should be pending');
  }

  // 5. FPO Leader views incoming membership requests
  console.log('\nStep 5: FPO Leader fetches incoming requests');
  const fpoRequestsRes = await apiRequest('GET', '/api/fpo/membership-requests', fpoLeaderToken);
  const requestsList = fpoRequestsRes.body.data || [];
  console.log(`HTTP ${fpoRequestsRes.status}, total requests: ${requestsList.length}`);
  const f1Request = requestsList.find(r => r.farmerId === farmer1.id);
  if (!f1Request) {
    throw new Error('Farmer 1 request not found in FPO Leader request queue');
  }
  console.log('Found request for applicant:', f1Request.farmerName, 'with status:', f1Request.status);

  // 6. FPO Leader ACCEPTS Farmer 1 request
  console.log('\nStep 6: FPO Leader accepts Farmer 1 request (ID:', f1Request.id, ')');
  const acceptRes = await apiRequest('POST', `/api/fpo/members/${f1Request.id}/accept`, fpoLeaderToken, {});
  console.log(`HTTP ${acceptRes.status}, response:`, acceptRes.body);
  if (acceptRes.status !== 200 || !acceptRes.body.success) {
    throw new Error('Failed to accept membership request');
  }

  // 7. Verify Farmer 1 status is now 'active'
  console.log('\nStep 7: Verify Farmer 1 sees Accepted / active status');
  const statusRes1Updated = await apiRequest('GET', '/api/fpo/my-membership', farmer1Token);
  const updatedFarmer1Status = statusRes1Updated.body.data?.find(m => m.fpoId === fpoLeader.id)?.status;
  console.log(`Farmer 1 current status: ${updatedFarmer1Status}`);
  if (updatedFarmer1Status !== 'active') {
    throw new Error('Farmer 1 status did not transition to active');
  }

  // 8. Verify Member Roster has Farmer 1
  console.log('\nStep 8: Verify Farmer 1 appears in FPO Member Roster');
  const rosterRes = await apiRequest('GET', '/api/fpo/members', fpoLeaderToken);
  const enrolledMember = (rosterRes.body.data || []).find(m => m.farmerId === farmer1.id);
  if (!enrolledMember) {
    throw new Error('Farmer 1 is not in the FPO Member Roster');
  }
  console.log(`Member found in roster: ${enrolledMember.name}, status: ${enrolledMember.status}`);

  // 9. REJECT WORKFLOW: Farmer 2 submits a request
  console.log('\nStep 9: Farmer 2 submits request to FPO');
  const reqRes2 = await apiRequest('POST', '/api/fpo/membership-request', farmer2Token, {
    fpoId: fpoLeader.id,
    notes: 'I am outside the district but want to join.'
  });
  if (reqRes2.status !== 201) {
    throw new Error('Farmer 2 request submission failed');
  }

  const f2RequestId = reqRes2.body.data.id;

  // 10. FPO Leader REJECTS Farmer 2 request
  console.log('\nStep 10: FPO Leader rejects Farmer 2 request (ID:', f2RequestId, ')');
  const rejectRes = await apiRequest('POST', `/api/fpo/members/${f2RequestId}/reject`, fpoLeaderToken, {
    rejectionReason: 'Outside operating cluster / district'
  });
  console.log(`HTTP ${rejectRes.status}, response:`, rejectRes.body);
  if (rejectRes.status !== 200 || !rejectRes.body.success) {
    throw new Error('Failed to reject membership request');
  }

  // 11. Verify Farmer 2 sees Rejected status
  console.log('\nStep 11: Verify Farmer 2 status is rejected');
  const statusRes2Updated = await apiRequest('GET', '/api/fpo/my-membership', farmer2Token);
  const f2Membership = statusRes2Updated.body.data?.find(m => m.fpoId === fpoLeader.id);
  console.log(`Farmer 2 status for FPO: ${f2Membership?.status}, rejection note: ${f2Membership?.notes}`);
  if (f2Membership?.status !== 'rejected') {
    throw new Error('Farmer 2 status is not rejected');
  }

  // 12. Verify Farmer 2 is NOT in the active member roster
  console.log('\nStep 12: Verify Farmer 2 is NOT in the active member roster');
  const rosterResAfter = await apiRequest('GET', '/api/fpo/members', fpoLeaderToken);
  const rejectedInRoster = (rosterResAfter.body.data || []).find(m => m.farmerId === farmer2.id && m.status === 'active');
  if (rejectedInRoster) {
    throw new Error('Rejected Farmer 2 must NOT appear as active in Member Roster');
  }
  console.log('Confirmed: Farmer 2 is not in the active member roster.');

  // 13. Test security / cross-FPO authorization: Another user tries to decide fpoLeader requests
  console.log('\nStep 13: Test cross-FPO authorization protection');
  const unauthorizedRes = await apiRequest('POST', `/api/fpo/members/${f1Request.id}/accept`, farmer2Token, {});
  console.log(`Unauthorized request returned HTTP: ${unauthorizedRes.status}`);
  if (unauthorizedRes.status !== 403) {
    throw new Error('Non-FPO leader was able to access decision endpoint');
  }

  console.log('\n🎉 ALL FPO MEMBERSHIP WORKFLOW INTEGRATION TESTS PASSED PERFECTLY! 🎉\n');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
