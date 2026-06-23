const router = require('express').Router();
const { signup, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
