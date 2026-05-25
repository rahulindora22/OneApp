const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/user_roles.controller');

router.use(auth);

router.get('/types',               ctrl.getTypes);
router.get('/search-users',        ctrl.searchUsers);
router.get('/search-territories',  ctrl.searchTerritories);
router.get('/',                    ctrl.list);
router.get('/:id',                 ctrl.getById);
router.post('/',                   ctrl.create);
router.put('/:id',                 ctrl.update);

module.exports = router;
