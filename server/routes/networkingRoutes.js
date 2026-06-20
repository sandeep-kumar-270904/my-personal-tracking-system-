const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getContacts,
  createContact,
  updateContact,
  getContactById,
  deleteContact,
  getStats,
  generateOutreach,
  sendOutreach,
  logResponse,
  getReferralPipeline,
  createReferralPipeline,
  updateReferralPipeline,
  getCompanyMap,
  getInsights,
  analyzeNetworking,
  getTemplates,
  createTemplate,
  getRecommendations,
  getGoals,
  updateGoals,
  importDeduplication,
  bulkCreateContacts,
  enrichContact,
  generateWeeklyBrief,
  getCurrentWeeklyBrief,
  dismissWeeklyBrief,
  batchGenerateOutreach,
  bulkSendOutreach,
  getAlumniSuggestions,
  generateIntroRequest
} = require('../controllers/networkingController');

router.post('/contacts/import', protect, importDeduplication);
router.post('/contacts/bulk-create', protect, bulkCreateContacts);
router.post('/contacts/:id/enrich', protect, enrichContact);

router.post('/outreach/batch-generate', protect, batchGenerateOutreach);
router.post('/outreach/bulk-send', protect, bulkSendOutreach);
router.get('/outreach/alumni-suggestions', protect, getAlumniSuggestions);
router.post('/outreach/intro-request', protect, generateIntroRequest);

router.post('/weekly-brief', protect, generateWeeklyBrief);
router.get('/weekly-brief/current', protect, getCurrentWeeklyBrief);
router.patch('/weekly-brief/:id/dismiss', protect, dismissWeeklyBrief);

router.route('/contacts').get(protect, getContacts).post(protect, createContact);
router.route('/contacts/:id').get(protect, getContactById).patch(protect, updateContact).delete(protect, deleteContact);

router.route('/stats').get(protect, getStats);

router.route('/outreach/generate').post(protect, generateOutreach);
router.route('/outreach/send').post(protect, sendOutreach);
router.route('/outreach/:messageId/response').post(protect, logResponse);

router.route('/referral-pipeline').get(protect, getReferralPipeline).post(protect, createReferralPipeline);
router.route('/referral-pipeline/:id').patch(protect, updateReferralPipeline);

router.route('/company-map').get(protect, getCompanyMap);
router.route('/insights').get(protect, getInsights);
router.route('/analyze').post(protect, analyzeNetworking);

router.route('/templates').get(protect, getTemplates).post(protect, createTemplate);
router.route('/recommendations').get(protect, getRecommendations);

router.route('/goals/current').get(protect, getGoals);
router.route('/goals').post(protect, updateGoals);

module.exports = router;
