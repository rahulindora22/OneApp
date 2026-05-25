const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/geolocation.controller');

router.use(auth);

router.post('/error-log', ctrl.erroLogCreate);
router.get('/validate-depo-checkin', ctrl.validateDepoCheckInToday);
router.get('/validate-checkin', ctrl.validateCheckInToday);
router.post('/checkout-depo', ctrl.checkOutFromOneAppDepot);
router.post('/checkout', ctrl.checkOutFromOneApp);
router.post('/checkin-depo', ctrl.checkInFromOneAppForDepo);
router.post('/checkin', ctrl.checkInFromOneApp);
router.post('/checkin-second', ctrl.checkInSecondTime);
router.post('/add-newspaper', ctrl.addedNonMandatoryNewspaper);
router.post('/txn-visit-save', ctrl.txnVisitSave);
router.post('/insert-transactions', ctrl.insertTransactionDetails);

// Segment (RWA / OOH / CSP) check-in / check-out
router.get('/validate-segment-checkin',  ctrl.validateSegmentCheckIn);
router.post('/checkin-segment',          ctrl.checkInSegment);
router.post('/checkout-segment',         ctrl.checkOutSegment);

module.exports = router;
