const router = require('express').Router();
const { getMyNotifications, markAllRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/notifications', getMyNotifications);
router.put('/notifications/read', markAllRead);

module.exports = router;
