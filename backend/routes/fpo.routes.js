/**
 * fpo.routes.js
 * Dedicated routes for Farmer Producer Organization (FPO) Module
 * HarvestMitra AI
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const fpoController = require('../controllers/fpo.controller');

const requireFpo = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'fpo_leader' && role !== 'fpo' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to certified FPO leaders and administrators.'
    });
  }
  next();
};

const requireMandiOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'mandi' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only registered APMC Mandi officials can submit quotations.'
    });
  }
  next();
};

// Public/Farmer Accessible FPO Directory & Membership
router.get('/all-organizations', authMiddleware, fpoController.listAllFPOs);
router.post('/membership-request', authMiddleware, fpoController.farmerRequestMembership);
router.get('/my-membership', authMiddleware, fpoController.getFarmerMembershipStatus);

// 1. Overview Statistics
router.get('/overview', authMiddleware, requireFpo, fpoController.getOverview);

// 2. Member Farmer Management & Membership Requests
router.get('/members', authMiddleware, requireFpo, fpoController.listMembers);
router.get('/membership-requests', authMiddleware, requireFpo, fpoController.getFpoMembershipRequests);
router.post('/members', authMiddleware, requireFpo, fpoController.inviteOrAddMember);
router.patch('/members/:id', authMiddleware, requireFpo, fpoController.updateMemberStatus);
router.patch('/members/:id/decision', authMiddleware, requireFpo, fpoController.decideMembershipRequest);
router.post('/members/:id/accept', authMiddleware, requireFpo, (req, res) => {
  req.body = req.body || {};
  req.body.decision = 'accept';
  return fpoController.decideMembershipRequest(req, res);
});
router.post('/members/:id/reject', authMiddleware, requireFpo, (req, res) => {
  req.body = req.body || {};
  req.body.decision = 'reject';
  return fpoController.decideMembershipRequest(req, res);
});
router.get('/available-farmers', authMiddleware, requireFpo, fpoController.getAvailableFarmers);

// 3. Crop Availability & Aggregation
router.get('/crop-availability', authMiddleware, requireFpo, fpoController.getMemberCropAvailability);
router.post('/aggregations', authMiddleware, requireFpo, fpoController.createAggregation);
router.get('/aggregations', authMiddleware, requireFpo, fpoController.listAggregations);
router.delete('/aggregations/:id', authMiddleware, requireFpo, fpoController.cancelAggregation);

// 4. Bulk Mandi Procurement
router.post('/offers', authMiddleware, requireFpo, fpoController.createBulkOffer);
router.get('/offers', authMiddleware, requireFpo, fpoController.listBulkOffers);
router.patch('/offers/:id/quote', authMiddleware, requireMandiOrAdmin, fpoController.mandiQuoteOffer);
router.patch('/offers/:id/decision', authMiddleware, requireFpo, fpoController.fpoDecideQuotation);

// 5. Collective Transport Integration
router.post('/transport', authMiddleware, requireFpo, fpoController.requestCollectiveTransport);

// 6. Orders History & Financial Transparency
router.get('/orders', authMiddleware, requireFpo, fpoController.getOrdersHistory);

module.exports = router;
