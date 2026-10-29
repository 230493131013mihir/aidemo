/**
 * cropDoctorController.js
 * Controller for AI Kisan Crop Doctor photo diagnosis endpoints
 * HarvestMitra AI
 */

const cropDoctorDiagnosisService = require('../services/cropDoctorDiagnosisService');

/**
 * POST /api/crop-doctor/diagnose
 * Analyzes uploaded crop photo(s) with user-provided context
 */
async function diagnosePhoto(req, res) {
  try {
    const { images, image, context = {}, language = 'en', options = {} } = req.body;

    // Normalise images array
    const imagePayload = images || (image ? [image] : []);

    const result = await cropDoctorDiagnosisService.diagnose({
      images: imagePayload,
      context,
      language,
      options
    });

    return res.json(result);
  } catch (error) {
    console.error('❌ Crop Doctor diagnosis error:', error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Error processing crop photo diagnosis',
      code: error.code || 'DIAGNOSIS_FAILED'
    });
  }
}

/**
 * GET /api/crop-doctor/status
 * Reports service capability and supported regional coverage
 */
function getStatus(req, res) {
  const isAiConfigured = cropDoctorDiagnosisService.gemini.isConfigured();
  return res.json({
    success: true,
    service: 'AI Kisan Crop Doctor Visual Diagnostics',
    provider: isAiConfigured ? 'gemini-1.5-flash (Live Vision)' : 'botanical_rule_engine (Calibrated Regional Heuristics)',
    isLiveVisionAvailable: isAiConfigured,
    standards: 'ICAR / CIB&RC Verified Agronomic Models',
    supportedStates: ['Maharashtra', 'Gujarat'],
    coverage: 'Field crops, vegetables, fruits, pulses, oilseeds',
    multiImageSupport: true,
    maxImages: 3
  });
}

module.exports = {
  diagnosePhoto,
  getStatus
};
