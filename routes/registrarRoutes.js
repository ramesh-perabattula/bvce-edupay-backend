const express = require('express');
const router = express.Router();
const { createStudent, resetPassword } = require('../controllers/registrarController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/students', protect, authorize('registrar', 'admin'), createStudent);
router.post('/reset-password', protect, authorize('registrar', 'admin'), resetPassword);

module.exports = router;
