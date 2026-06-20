const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateUser, forgotPassword, resetPassword, verifyEmail, googleAuth, githubAuth, linkedinAuth, updateCalendarSettings } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUser);
router.put('/calendar-settings', protect, updateCalendarSettings);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.get('/verifyemail/:token', verifyEmail);
router.post('/google', googleAuth);
router.post('/github', githubAuth);
router.post('/linkedin', linkedinAuth);

module.exports = router;
