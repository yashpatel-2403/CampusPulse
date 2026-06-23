const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect, adminOnly);
router.get('/complaints', ctrl.getAllComplaints);
router.get('/stats', ctrl.getStats);
router.get('/heatmap', ctrl.getHeatmapData);
router.get('/users', ctrl.getAllUsers);
router.get('/admins', ctrl.getAdmins);
router.put('/complaints/:id/status', validateObjectId(), ctrl.updateStatus);
router.put('/complaints/:id/priority', validateObjectId(), ctrl.updatePriority);
router.put('/complaints/:id/assign', validateObjectId(), ctrl.assignComplaint);
router.delete('/complaints/:id', validateObjectId(), ctrl.deleteComplaint);

module.exports = router;
