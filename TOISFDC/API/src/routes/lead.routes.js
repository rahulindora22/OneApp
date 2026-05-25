const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/lead.controller');

router.use(auth);

router.get('/',       ctrl.searchLeads);
router.post('/',      ctrl.createLead);
router.get('/:id',    ctrl.getLeadById);
router.put('/:id',    ctrl.updateLead);

module.exports = router;
