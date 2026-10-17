/**
 * report.routes.js
 * Farm Decision Summary & Printable Reports Router
 * HarvestMitra AI - ISSUE #78
 */

const express = require('express');
const router = express.Router();
const {
  handleGetFarmDecisionReport,
  handlePrintFarmDecisionReport,
  handleDownloadFarmDecisionReport
} = require('../controllers/reportController');

// JSON & Flexible Format Endpoints
router.get('/farm-decision', handleGetFarmDecisionReport);
router.post('/farm-decision', handleGetFarmDecisionReport);

// Direct Printable HTML Endpoints
router.get('/farm-decision/print', handlePrintFarmDecisionReport);
router.get('/farm-decision/download', handleDownloadFarmDecisionReport);

module.exports = router;
