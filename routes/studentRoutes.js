const express = require('express');
const router = express.Router();
const { getStudentProfile, checkEligibility } = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/profile', protect, authorize('student'), getStudentProfile);
router.get('/eligibility', protect, authorize('student'), checkEligibility);

module.exports = router;
