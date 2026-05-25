const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/templates.controller');

router.use(auth);

// SMS Templates
router.get('/sms',        ctrl.listSmsTemplates);
router.post('/sms',       ctrl.createSmsTemplate);
router.get('/sms/:id',    ctrl.getSmsTemplate);
router.put('/sms/:id',    ctrl.updateSmsTemplate);

// Email Templates
router.get('/email',      ctrl.listEmailTemplates);
router.post('/email',     ctrl.createEmailTemplate);
router.get('/email/:id',  ctrl.getEmailTemplate);
router.put('/email/:id',  ctrl.updateEmailTemplate);

// Batch Logs
router.get('/batch-logs',      ctrl.getBatchLogs);
router.get('/batch-logs/:id',  ctrl.getBatchLog);

module.exports = router;
