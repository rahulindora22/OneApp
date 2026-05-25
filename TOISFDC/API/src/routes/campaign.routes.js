const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const ctrl     = require('../controllers/campaign.controller');
const syncCtrl = require('../controllers/sync_campaign.controller');

router.use(auth);

// Static routes first — before any /:id param route
router.get('/',                   ctrl.searchCampaigns);
router.post('/',                  ctrl.createCampaign);
router.get('/names',              ctrl.listCampaignNames);
router.post('/members',           ctrl.addCampaignMember);
router.post('/members-with-lead', ctrl.addMemberWithLead);
router.post('/members-bulk',      ctrl.bulkAddCampaignMembers);

// Param routes
router.get('/:id',                ctrl.getCampaignById);
router.put('/:id',                ctrl.updateCampaign);

// ── CTI Sync (three-step flow, separate controller) ───────────────────
router.post('/:id/sync',             syncCtrl.syncCampaign);          // Step 1: create lead table
router.post('/:id/sync-telecallers', syncCtrl.syncTelecallers);       // Step 2: map agent IDs
router.post('/:id/sync-members',     syncCtrl.syncCampaignMembers);   // Step 3: push members
router.get('/:id/cti-status',        syncCtrl.getCTIStatus);          // poll status

// ── Call Batch ────────────────────────────────────────────────────────
router.post('/:id/call-batch',           ctrl.callBatch);
router.get('/:id/batch/:batchId',        ctrl.getBatchStatus);

module.exports = router;
