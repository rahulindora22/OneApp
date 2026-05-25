const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/telecaller_assignment.controller');

router.use(auth);

// Static routes before /:id
router.get('/',         ctrl.searchAssignments);
router.post('/',        ctrl.createAssignment);
router.get('/users',    ctrl.searchUsers);

// Param routes last
router.get('/:id',      ctrl.getById);
router.put('/:id',      ctrl.updateAssignment);

module.exports = router;
