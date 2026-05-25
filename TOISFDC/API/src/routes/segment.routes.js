const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/segment.controller');

router.use(auth);

router.get('/master-component', ctrl.displayMasterComponent);
router.get('/rwa', ctrl.displaySegmentsRWA);
router.post('/rwa', ctrl.createRWA);
router.put('/rwa/:id', ctrl.updateRWA);
router.get('/rwa/:id', ctrl.getRWAById);
router.get('/search-depots', ctrl.searchDepots);
router.get('/search-localities', ctrl.searchLocalities);
router.get('/ooh', ctrl.displaySegmentsOOH);
router.post('/ooh', ctrl.createOOH);
router.put('/ooh/:id', ctrl.updateOOH);
router.get('/ooh/:id', ctrl.getOOHById);
router.get('/csp', ctrl.displaySegmentsCSP);
router.post('/csp', ctrl.createCSP);
router.put('/csp/:id', ctrl.updateCSP);
router.get('/csp/:id', ctrl.getCSPById);
router.get('/depo', ctrl.displaySegmentsDEPO);
router.get('/contacts', ctrl.getSegmentContacts);
router.get('/vendors', ctrl.getSegmentContactVendor);
router.post('/contacts', ctrl.saveSegmentContacts);
router.post('/trans-detail', ctrl.saveTransDetail);
router.get('/picklist-values', ctrl.getTDPicklistValues);
router.get('/types', ctrl.getTypes);
router.get('/newspaper-picklist', ctrl.getNeswpaperPicklist);
router.get('/trans-details', ctrl.getTransDetails);
router.get('/transactions', ctrl.viewTransactionDetails);
router.get('/transactions-second', ctrl.viewTransactionDetailsSecondTime);

module.exports = router;
