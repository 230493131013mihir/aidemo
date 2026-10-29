/**
 * cropDoctorRoutes.js
 * Express routes for AI Kisan Crop Doctor photo diagnosis
 * HarvestMitra AI
 */

const express = require('express');
const router = express.Router();
const cropDoctorController = require('../controllers/cropDoctorController');

// Status & capabilities
router.get('/status', cropDoctorController.getStatus);

// Photo diagnosis
router.post('/diagnose', cropDoctorController.diagnosePhoto);

module.exports = router;
