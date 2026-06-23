const router = require('express').Router();
const ctrl = require('../controllers/config.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/boundary', ctrl.getBoundary);
router.put('/boundary', protect, adminOnly, ctrl.updateBoundary);

module.exports = router;

