const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/promotion_lead.controller');

router.use(auth);

// Static routes before /:id
router.get('/',          ctrl.searchPromotionLeads);
router.post('/',         ctrl.createPromotionLead);
router.post('/bulk',     ctrl.bulkInsert);
router.get('/sample-csv',ctrl.sampleCsv);

// Param routes last
router.get('/:id',       ctrl.getById);
router.put('/:id',       ctrl.updatePromotionLead);

module.exports = router;
